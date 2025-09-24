import pandas as pd
import joblib
import json
from sklearn.metrics.pairwise import cosine_similarity
import logging

# =============================
# Setup logging
# =============================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================
# Load best features automatically
# =============================
try:
    with open("saved_models/kmeans/best_features.json", "r") as f:
        FEATURES = json.load(f)
except Exception as e:
    logger.error(f"Failed to load best_features.json: {str(e)}")
    raise

# =============================
# Clustered datasets per algorithm
# =============================
CLUSTERED_PATHS = {
    "kmeans": "clustered_datasets_old/spotify_kmeans_sample.csv",
    "gmm": "clustered_datasets_old/spotify_gmm_sample.csv",
    "agglomerative": "clustered_datasets_old/spotify_agglomerative_sample.csv",
    "dbscan": "clustered_datasets_old/spotify_dbscan_sample.csv",
    "spectral": "clustered_datasets_new/spotify_spectral_sample.csv"
}

# =============================
# Load scaler + PCA
# =============================
try:
    scaler = joblib.load("saved_models/kmeans/scaler_sample_features.joblib")
except Exception as e:
    logger.error(f"Failed to load scaler: {str(e)}")
    raise

try:
    pca = joblib.load("saved_models/kmeans/pca_sample_features.joblib")
except:
    pca = None
    logger.warning("No PCA model found, proceeding without PCA")

# =============================
# Preprocess features
# =============================
def preprocess_features(row, features=FEATURES):
    """Scale + reduce features for a single song row."""
    # Ensure row is a DataFrame with feature names
    x = pd.DataFrame([row[features]], columns=features)
    if x.isna().any().any():
        logger.warning(f"Missing features for song {row.get('id', 'unknown')}, filling with 0")
        x = x.fillna(0)
    x_scaled = scaler.transform(x)
    if pca:
        x_scaled = pca.transform(x_scaled)
    return x_scaled

# =============================
# Recommendation function
# =============================
def get_recommendations(song_id, algo="kmeans", n=5, mode="cluster_knn"):
    """
    mode options:
        - "knn": full dataset KNN
        - "cluster": cluster-only
        - "cluster_knn": cluster + similarity
    """
    try:
        df = pd.read_csv(CLUSTERED_PATHS[algo])
    except Exception as e:
        logger.error(f"Failed to load dataset {CLUSTERED_PATHS[algo]}: {str(e)}")
        raise

    if song_id not in df["id"].values:
        logger.error(f"Song ID {song_id} not found")
        raise ValueError(f"Song ID {song_id} not found")

    song_row = df.loc[df["id"] == song_id].iloc[0]
    if song_row[FEATURES].isna().any():
        logger.warning(f"Song ID {song_id} has missing features")
        return pd.DataFrame(columns=["id", "name", "artists", "similarity"])

    song_features = preprocess_features(song_row)

    if mode == "knn":
        cand_features = pd.DataFrame(df[FEATURES], columns=FEATURES).fillna(0)
        cand_features_scaled = scaler.transform(cand_features)
        if pca:
            cand_features_scaled = pca.transform(cand_features_scaled)
        sim_scores = cosine_similarity(song_features, cand_features_scaled).flatten()
        df["similarity"] = sim_scores
        recs = df[df["id"] != song_id].sort_values("similarity", ascending=False)
        return recs.head(n)[["id", "name", "artists", "similarity"]]

    elif mode == "cluster":
        cluster_col = [c for c in df.columns if c.startswith("cluster_")][0]
        cluster_id = song_row[cluster_col]
        candidates = df[df[cluster_col] == cluster_id].copy()
        candidates = candidates[candidates["id"] != song_id]
        if len(candidates) == 0:
            logger.warning(f"No candidates in cluster {cluster_id} for song {song_id}")
            return pd.DataFrame(columns=["id", "name", "artists", "similarity"])
        recs = candidates.sample(n=min(n, len(candidates)), random_state=42)
        recs["similarity"] = 1.0  # Default for cluster mode
        return recs[["id", "name", "artists", "similarity"]]

    elif mode == "cluster_knn":
        cluster_col = [c for c in df.columns if c.startswith("cluster_")][0]
        cluster_id = song_row[cluster_col]
        candidates = df[df[cluster_col] == cluster_id].copy()
        if len(candidates) <= 1:
            logger.warning(f"Cluster {cluster_id} has too few songs, falling back to KNN")
            return get_recommendations(song_id, algo, n, "knn")
        cand_features = pd.DataFrame(candidates[FEATURES], columns=FEATURES).fillna(0)
        cand_features_scaled = scaler.transform(cand_features)
        if pca:
            cand_features_scaled = pca.transform(cand_features_scaled)
        sim_scores = cosine_similarity(song_features, cand_features_scaled).flatten()
        candidates["similarity"] = sim_scores
        recs = candidates[candidates["id"] != song_id].sort_values("similarity", ascending=False)
        if len(recs) == 0:
            logger.warning(f"No valid candidates in cluster {cluster_id} for song {song_id}")
            return pd.DataFrame(columns=["id", "name", "artists", "similarity"])
        return recs.head(n)[["id", "name", "artists", "similarity"]]

    else:
        raise ValueError(f"Unsupported mode: {mode}")