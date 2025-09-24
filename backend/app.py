from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import os
from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from spotipy.client import SpotifyException
from utils.recommend import get_recommendations
import math
import logging
from time import sleep

# =============================
# Setup logging
# =============================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================
# Load environment variables
# =============================
load_dotenv()
CLIENT_ID = os.getenv("SPOTIPY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIPY_CLIENT_SECRET")

# Validate credentials
if not CLIENT_ID or not CLIENT_SECRET:
    logger.error("Missing SPOTIPY_CLIENT_ID or SPOTIPY_CLIENT_SECRET in .env file")
    raise ValueError("Spotify API credentials not found in environment variables")

# Initialize Spotify client
try:
    sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET
    ))
except Exception as e:
    logger.error(f"Failed to initialize Spotify client: {str(e)}")
    raise

# =============================
# Load recommender models/data
# =============================
ALGO = "spectral"
CLUSTERED_PATHS = {
    "kmeans": "clustered_datasets_old/spotify_kmeans_sample.csv",
    "gmm": "clustered_datasets_old/spotify_gmm_sample.csv",
    "agglomerative": "clustered_datasets_old/spotify_agglomerative_sample.csv",
    "dbscan": "clustered_datasets_old/spotify_dbscan_sample.csv",
    "spectral": "clustered_datasets_new/spotify_spectral_with_preview.csv"  # cached preview URLs
}

# Load CSV with cached preview URLs
try:
    df = pd.read_csv(CLUSTERED_PATHS[ALGO])
except Exception as e:
    logger.error(f"Failed to load dataset {CLUSTERED_PATHS[ALGO]}: {str(e)}")
    raise

# Ensure cluster column exists
if "cluster_spectral" not in df.columns:
    df["cluster_spectral"] = None

# =============================
# FastAPI app
# =============================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================
# Models
# =============================
class RecommendationRequest(BaseModel):
    track_id: str
    n: int = 10  # top N recommendations
    mode: str = "cluster_knn"  # recommendation mode

# =============================
# Utility function
# =============================
def sanitize_json(data):
    """Recursively replace NaN/Inf with None (JSON-compliant)"""
    if isinstance(data, dict):
        return {k: sanitize_json(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_json(v) for v in data]
    elif isinstance(data, float):
        if math.isnan(data) or math.isinf(data):
            return None
        return data
    else:
        return data

def fetch_spotify_metadata(track_ids: list[str]):
    """Fetch metadata for multiple tracks in a batch"""
    metadata = {}
    valid_track_ids = [tid for tid in track_ids if tid in df["id"].values]
    if not valid_track_ids:
        logger.error("No valid track IDs provided")
        return {tid: {"name": None, "artists": None, "album_art": None, "preview_url": None, "features": None} for tid in track_ids}

    try:
        # Batch fetch tracks (up to 50 per request)
        track_chunks = [valid_track_ids[i:i + 50] for i in range(0, len(valid_track_ids), 50)]
        for chunk in track_chunks:
            for attempt in range(3):
                try:
                    tracks = sp.tracks(chunk)["tracks"]
                    for track in tracks:
                        if track:
                            metadata[track["id"]] = {
                                "name": track["name"],
                                "artists": [a["name"] for a in track["artists"]],
                                "album_art": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
                                "preview_url": track["preview_url"],
                                "features": None
                            }
                    break
                except SpotifyException as e:
                    if e.http_status == 429:
                        retry_after = int(e.headers.get("Retry-After", 1))
                        logger.warning(f"Rate limit hit. Retrying after {retry_after} seconds")
                        sleep(retry_after)
                        continue
                    elif e.http_status == 403:
                        logger.warning(f"403 Forbidden for tracks {chunk}: {str(e)}")
                        break
                    logger.error(f"Failed to fetch tracks {chunk}: {str(e)}")
                    break

        # Batch fetch audio features (up to 100 per request)
        feature_chunks = [valid_track_ids[i:i + 100] for i in range(0, len(valid_track_ids), 100)]
        for chunk in feature_chunks:
            for attempt in range(3):
                try:
                    features = sp.audio_features(chunk)
                    for feature in features:
                        if feature:
                            metadata[feature["id"]]["features"] = feature
                        else:
                            logger.warning(f"No audio features for track {feature['id'] if feature else 'unknown'}")
                    break
                except SpotifyException as e:
                    if e.http_status == 429:
                        retry_after = int(e.headers.get("Retry-After", 1))
                        logger.warning(f"Rate limit hit. Retrying after {retry_after} seconds")
                        sleep(retry_after)
                        continue
                    elif e.http_status == 403:
                        logger.warning(f"403 Forbidden for audio features of tracks {chunk}: {str(e)}")
                        # Try with market="IN" as fallback
                        try:
                            features = sp.audio_features(chunk, market="IN")
                            for feature in features:
                                if feature:
                                    metadata[feature["id"]]["features"] = feature
                                else:
                                    logger.warning(f"No audio features for track {feature['id'] if feature else 'unknown'}")
                            break
                        except SpotifyException as e2:
                            logger.warning(f"403 Forbidden with market=IN for tracks {chunk}: {str(e2)}")
                            break
                    logger.error(f"Failed to fetch audio features for tracks {chunk}: {str(e)}")
                    break
    except Exception as e:
        logger.error(f"Failed to fetch metadata for tracks {valid_track_ids}: {str(e)}")

    # Fallback to DataFrame for missing tracks or features
    feature_cols = ["danceability", "energy", "valence", "speechiness", "instrumentalness", "acousticness", "liveness", "tempo"]
    for track_id in track_ids:
        if track_id not in metadata or metadata[track_id]["features"] is None:
            track_row = df[df["id"] == track_id]
            if not track_row.empty:
                row = track_row.iloc[0]
                metadata[track_id] = metadata.get(track_id, {
                    "name": None,
                    "artists": None,
                    "album_art": None,
                    "preview_url": None,
                    "features": None
                })
                metadata[track_id].update({
                    "name": row.get("name", metadata[track_id]["name"]),
                    "artists": row.get("artists", metadata[track_id]["artists"]),
                    "album_art": row.get("album_art", metadata[track_id]["album_art"]),
                    "preview_url": row.get("preview_url", metadata[track_id]["preview_url"]),
                    "features": {
                        col: row.get(col, 0) for col in feature_cols
                    } if all(col in row and pd.notna(row[col]) for col in feature_cols) else None
                })
            elif track_id not in metadata:
                metadata[track_id] = {
                    "name": None,
                    "artists": None,
                    "album_art": None,
                    "preview_url": None,
                    "features": None
                }
    return metadata

# =============================
# Routes
# =============================
@app.get("/")
def root():
    return {"message": "Spotify recommender API running"}

@app.get("/clusters")
def get_clusters():
    """Return all songs from the clustered dataset with cached preview URLs"""
    try:
        # Replace NaN with None for JSON
        data = df.where(pd.notnull(df), None).to_dict(orient="records")
        return {"songs": sanitize_json(data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend")
def recommend(request: RecommendationRequest):
    """Return top N recommendations for a track, supporting mode selection"""
    supported_modes = ["knn", "cluster", "cluster_knn"]
    if request.mode not in supported_modes:
        raise HTTPException(status_code=400, detail=f"Unsupported mode '{request.mode}'. Choose from {supported_modes}")

    try:
        recs_df = get_recommendations(
            song_id=request.track_id,
            algo=ALGO,
            n=request.n + 10,  # Fetch extra to account for skips
            mode=request.mode
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error fetching recommendations: {str(e)}")

    # Get unique track IDs
    track_ids = recs_df["id"].tolist()
    metadata = fetch_spotify_metadata(track_ids)

    recommendations = []
    for _, row in recs_df.iterrows():
        track_id = row["id"]
        spotify_info = metadata.get(track_id, {
            "name": None,
            "artists": None,
            "album_art": None,
            "preview_url": None,
            "features": None
        })
        # Skip tracks with no valid features for knn or cluster_knn modes
        if request.mode in ["knn", "cluster_knn"] and spotify_info["features"] is None:
            logger.warning(f"Skipping track {track_id} due to missing audio features")
            continue
        similarity = row.get("similarity", 1.0 if request.mode == "cluster" else 0.0)
        recommendations.append({
            "id": track_id,
            "name": row["name"] if spotify_info["name"] is None else spotify_info["name"],
            "artist": row["artists"] if spotify_info["artists"] is None else spotify_info["artists"],
            "similarity": similarity,
            "preview_url": spotify_info["preview_url"],
            "album_art": spotify_info["album_art"],
            "features": spotify_info["features"]
        })
        if len(recommendations) >= request.n:
            break

    if not recommendations:
        raise HTTPException(status_code=404, detail="No valid recommendations found due to missing audio features")
    return {"recommendations": sanitize_json(recommendations)}