import os
import pandas as pd
import joblib
import numpy as np
from sklearn.cluster import KMeans, AgglomerativeClustering
from utils.preprocessing import load_data, preprocess_data
from models.kmeans_model import tune_kmeans
from models.agglomerative_model import tune_agglomerative

# =============================
# Setup folders
# =============================
folders = [
    "saved_models/kmeans",
    "saved_models/agglomerative",
    "results/kmeans",
    "results/agglomerative",
    "reports/kmeans",
    "reports/agglomerative",
]
for f in folders:
    os.makedirs(f, exist_ok=True)

# =============================
# Load Data
# =============================
df = load_data("data/spotify_tracks_clean.csv")

# =============================
# Preprocess with PCA
# =============================
features = [
    "danceability","energy","loudness","speechiness","acousticness",
    "instrumentalness","liveness","valence","tempo","duration_ms"
]
X, scaler, pca = preprocess_data(df, features, use_pca=True, variance_threshold=0.9)
print("X shape after PCA:", X.shape)

# =============================
# Step 1: Tune KMeans on a sample
# =============================
sample_size = 10000  # representative subset
print("\n=== Running KMeans Tuning on sample ===")
results_kmeans = tune_kmeans(X, cluster_range=(3, 20), sample_size=sample_size)
df_kmeans = pd.DataFrame(results_kmeans)
df_kmeans.to_csv("results/kmeans/results_kmeans.csv", index=False)

# Show top 5 models
print("\n--- Top 5 KMeans Models ---")
print(df_kmeans.sort_values("silhouette", ascending=False).head(5))

# Pick best model
best_kmeans = df_kmeans.loc[df_kmeans["silhouette"].idxmax()]
best_params = best_kmeans["params"]
print(f"\nBest KMeans model (sample): {best_params}, silhouette={best_kmeans['silhouette']:.4f}")

# =============================
# Step 2: Train final KMeans on full dataset
# =============================
final_kmeans = KMeans(
    n_clusters=best_params["n_clusters"],
    n_init=10,
    max_iter=300,
    random_state=42,
    init='k-means++'
)
final_kmeans.fit(X)

# Save model, scaler, PCA
joblib.dump(final_kmeans, "saved_models/kmeans/kmeans_best_model.joblib")
joblib.dump(scaler, "saved_models/kmeans/scaler.joblib")
joblib.dump(pca, "saved_models/kmeans/pca.joblib")
print("✅ Saved best KMeans model on full dataset\n")

# =============================
# Step 3: Agglomerative Clustering on sample (scalable)
# =============================
print("\n=== Running Agglomerative Clustering Tuning on sample ===")
results_agglom = tune_agglomerative(X, cluster_range=(3, 20), sample_size=sample_size)
df_agglom = pd.DataFrame(results_agglom)
df_agglom.to_csv("results/agglomerative/results_agglomerative.csv", index=False)

# Pick best Agglomerative model
best_agglom = df_agglom.loc[df_agglom["silhouette"].idxmax()]
best_params = best_agglom["params"]
print(f"\nBest Agglomerative model (sample): {best_params}, silhouette={best_agglom['silhouette']:.4f}")

# Train Agglomerative on sample
X_agglom = X[np.random.RandomState(42).choice(len(X), sample_size, replace=False)] \
    if len(X) > sample_size else X

final_agglom = AgglomerativeClustering(**best_params)
final_agglom.fit(X_agglom)
joblib.dump(final_agglom, "saved_models/agglomerative/agglomerative_best_model.joblib")
print("✅ Saved best Agglomerative model (on sample)\n")

print("🎉 All models trained and saved successfully!")
