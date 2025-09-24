# app.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import os
from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from utils.recommend import get_recommendations
import math

# =============================
# Load environment variables
# =============================
load_dotenv()
CLIENT_ID = os.getenv("SPOTIPY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIPY_CLIENT_SECRET")

sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET
))

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
df = pd.read_csv(CLUSTERED_PATHS[ALGO])

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

def fetch_spotify_metadata(track_id: str):
    """Fetch metadata for a single track (used in /recommend)"""
    try:
        track = sp.track(track_id)
        features = sp.audio_features([track_id])[0]
        return {
            "name": track["name"],
            "artists": [a["name"] for a in track["artists"]],
            "album_art": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
            "preview_url": track["preview_url"],
            "features": features
        }
    except Exception:
        return {
            "name": None,
            "artists": None,
            "album_art": None,
            "preview_url": None,
            "features": None
        }

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
    """Return top N recommendations for a track"""
    try:
        recs_df = get_recommendations(
            song_id=request.track_id,
            algo=ALGO,
            n=request.n,
            mode="cluster_knn"
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error fetching recommendations: {str(e)}")

    recommendations = []
    for _, row in recs_df.iterrows():
        spotify_info = fetch_spotify_metadata(row["id"])
        recommendations.append({
            "id": row["id"],
            "name": row["name"] if spotify_info["name"] is None else spotify_info["name"],
            "artists": row["artists"] if spotify_info["artists"] is None else spotify_info["artists"],
            "similarity": row.get("similarity", None),
            "preview_url": spotify_info["preview_url"],
            "album_art": spotify_info["album_art"],
            "features": spotify_info["features"]
        })

    # Sanitize before returning
    return {"recommendations": sanitize_json(recommendations)}
