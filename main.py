import os
import pandas as pd
import joblib
import numpy as np
from sklearn.cluster import KMeans, AgglomerativeClustering

from utils.preprocessing import load_data, preprocess_data
from models.kmeans_model import tune_kmeans
from models.agglomerative_model import tune_agglomerative

# =============================
# Setup project folders
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
# Step 1: Load Data
# =============================
df = load_data("data/spotify_tracks_clean.csv")

# Step 2: Preprocess with PCA
features = [
    "danceability","energy","loudness","speechiness","acousticness",
    "instrumentalness","liveness","valence","tempo","duration_ms"
]
X, scaler, pca = preprocess_data(df, features, use_pca=True, variance_threshold=0.9)
print("X shape after PCA:", X.shape)

# =============================
# Step 3: Run KMeans
# =============================
print("\n=== Running KMeans Tuning ===")
results_kmeans = tune_kmeans(X, cluster_range=(3, 20))
df_kmeans = pd.DataFrame(results_kmeans)
df_kmeans.to_csv("results/kmeans/results_kmeans.csv", index=False)

# Pick best model (highest silhouette)
best_kmeans = df_kmeans.loc[df_kmeans["silhouette"].idxmax()]
best_k = best_kmeans["params"]["n_clusters"]
print(f"Best KMeans model: k={best_k}, silhouette={best_kmeans['silhouette']}")

# Train final model
final_kmeans = KMeans(n_clusters=best_k, init="k-means++", random_state=42)
final_kmeans.fit(X)

# Save model, scaler, PCA
joblib.dump(final_kmeans, "saved_models/kmeans/kmeans_best_model.joblib")
joblib.dump(scaler, "saved_models/kmeans/scaler.joblib")
joblib.dump(pca, "saved_models/kmeans/pca.joblib")
print("Saved best KMeans model\n")

# =============================
# Step 4: Run Agglomerative Clustering
# =============================
print("\n=== Running Agglomerative Clustering Tuning ===")
results_agglom = tune_agglomerative(X, cluster_range=(3, 20), sample_size=10000)
df_agglom = pd.DataFrame(results_agglom)
df_agglom.to_csv("results/agglomerative/results_agglomerative.csv", index=False)

# Pick best model (highest silhouette)
best_agglom = df_agglom.loc[df_agglom["silhouette"].idxmax()]
best_params = best_agglom["params"]
print(f"Best Agglomerative model: params={best_params}, silhouette={best_agglom['silhouette']}")

# Train final model on a sample (Agglomerative does not scale to full dataset)
sample_size = 10000
if len(X) > sample_size:
    rng = np.random.RandomState(42)
    idx = rng.choice(len(X), size=sample_size, replace=False)
    X_agglom = X[idx]
else:
    X_agglom = X

final_agglom = AgglomerativeClustering(**best_params)
final_agglom.fit(X_agglom)

# Save model
joblib.dump(final_agglom, "saved_models/agglomerative/agglomerative_best_model.joblib")
print("Saved best Agglomerative model (on sample)\n")

print("✅ All models trained and saved successfully!")
