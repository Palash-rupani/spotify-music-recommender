from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import math
import logging
from utils.recommend import get_recommendations  # your custom recommender

# =============================
# Logging
# =============================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================
# Load CSV
# =============================
DATA_PATH = "clustered_datasets_new/spotify_spectral_with_preview.csv"
try:
    df = pd.read_csv(DATA_PATH)
except Exception as e:
    logger.error(f"Failed to load dataset: {e}")
    raise

# Ensure required columns exist
for col in ["preview_url", "album_art"]:
    if col not in df.columns:
        df[col] = None

# =============================
# FastAPI app
# =============================
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================
# Pydantic Models
# =============================
class RecommendationRequest(BaseModel):
    track_id: str
    n: int = 10
    mode: str = "cluster_knn"  # cluster | knn | cluster_knn

# =============================
# Helpers
# =============================
def sanitize_json(data):
    """Replace NaN/Inf with None for JSON"""
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

def fetch_metadata(track_ids: list[str]):
    """Fetch metadata from df"""
    metadata = {}
    feature_cols = [
        "danceability", "energy", "valence", "speechiness",
        "instrumentalness", "acousticness", "liveness", "tempo"
    ]
    for tid in track_ids:
        row = df[df["id"] == tid]
        if not row.empty:
            row = row.iloc[0]
            metadata[tid] = {
                "name": row.get("name"),
                "artist": row.get("artists"),
                "album_art": row.get("album_art"),
                "preview_url": row.get("preview_url"),
                "features": {col: row.get(col, 0) for col in feature_cols} if all(col in row for col in feature_cols) else None
            }
        else:
            metadata[tid] = {
                "name": None,
                "artist": None,
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
    """Return all songs"""
    try:
        data = df.where(pd.notnull(df), None).to_dict(orient="records")
        return {"songs": sanitize_json(data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend")
def recommend(request: RecommendationRequest):
    """Return top N recommendations using your recommender"""
    if request.track_id not in df["id"].values:
        raise HTTPException(status_code=404, detail="Track not found")

    try:
        recs_df = get_recommendations(
            song_id=request.track_id,
            algo="spectral",
            n=request.n,
            mode=request.mode
        )
    except ValueError:
        raise HTTPException(status_code=404, detail="Track not found")
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    track_ids = recs_df["id"].tolist()
    metadata = fetch_metadata(track_ids)

    recommendations = []
    for _, row in recs_df.iterrows():
        tid = row["id"]
        m = metadata.get(tid, {})
        recommendations.append({
            "id": tid,
            "name": row.get("name") or m.get("name"),
            "artist": row.get("artists") or m.get("artist"),
            "album_art": m.get("album_art"),
            "preview_url": m.get("preview_url"),
            "similarity": row.get("similarity")
        })

    return {"recommendations": sanitize_json(recommendations)}
@app.get("/song/{track_id}")
def get_song(track_id: str):
    """Fetch metadata + features for a single song by track_id"""
    row = df[df["id"] == track_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Track not found")

    row = row.iloc[0]

    feature_cols = [
        "danceability", "energy", "valence", "speechiness",
        "instrumentalness", "acousticness", "liveness", "tempo"
    ]

    song = {
        "id": row.get("id"),
        "name": row.get("name"),
        "artist": row.get("artists"),
        "album_art": row.get("album_art"),
        "preview_url": row.get("preview_url"),
        "features": {col: row.get(col, 0) for col in feature_cols if col in row}
    }

    return sanitize_json(song)

