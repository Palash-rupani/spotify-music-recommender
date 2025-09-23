# recommend.py
import pandas as pd
import joblib
import json
from sklearn.metrics.pairwise import cosine_similarity

# =============================
# Load best features automatically
# =============================
with open("saved_models/kmeans/best_features.json", "r") as f:
    FEATURES = json.load(f)

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
scaler = joblib.load("saved_models/kmeans/scaler_sample_features.joblib")
try:
    pca = joblib.load("saved_models/kmeans/pca_sample_features.joblib")
except:
    pca = None

# =============================
# Preprocess features
# =============================
def preprocess_features(row):
    """Scale + reduce features for a single song row."""
    x = row[FEATURES].values.reshape(1, -1)
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
        - "cluster_knn": cluster + similarity (current method)
    """
    df = pd.read_csv(CLUSTERED_PATHS[algo])
    if song_id not in df["id"].values:
        raise ValueError(f"Song ID {song_id} not found")

    song_row = df.loc[df["id"] == song_id].iloc[0]
    song_features = preprocess_features(song_row)

    if mode == "knn":
        cand_features = scaler.transform(df[FEATURES])
        if pca:
            cand_features = pca.transform(cand_features)
        sim_scores = cosine_similarity(song_features, cand_features).flatten()
        df["similarity"] = sim_scores
        recs = df[df["id"] != song_id].sort_values("similarity", ascending=False)
        return recs.head(n)[["id","name","artists","similarity"]]

    elif mode == "cluster":
        cluster_col = [c for c in df.columns if c.startswith("cluster_")][0]
        cluster_id = song_row[cluster_col]
        candidates = df[df[cluster_col] == cluster_id].copy()
        candidates = candidates[candidates["id"] != song_id]
        return candidates.sample(n=min(n, len(candidates)))[["id","name","artists"]]

    elif mode == "cluster_knn":
        cluster_col = [c for c in df.columns if c.startswith("cluster_")][0]
        cluster_id = song_row[cluster_col]
        candidates = df[df[cluster_col] == cluster_id].copy()
        cand_features = scaler.transform(candidates[FEATURES])
        if pca:
            cand_features = pca.transform(cand_features)
        sim_scores = cosine_similarity(song_features, cand_features).flatten()
        candidates["similarity"] = sim_scores
        recs = candidates[candidates["id"] != song_id].sort_values("similarity", ascending=False)
        return recs.head(n)[["id","name","artists","similarity"]]
