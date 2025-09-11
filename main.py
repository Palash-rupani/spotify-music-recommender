from utils.preprocessing import load_data, preprocess_data
from models.kmeans_model import tune_kmeans
import pandas as pd
import joblib
from sklearn.cluster import KMeans
#adi was here
# Step 1: Load data 
df = load_data("data/spotify_tracks_clean.csv")

# Step 2: Preprocess with PCA
features = [
    "danceability","energy","loudness","speechiness","acousticness",
    "instrumentalness","liveness","valence","tempo","duration_ms"
]
X, scaler, pca = preprocess_data(df, features, use_pca=True, variance_threshold=0.9)
print("X shape after PCA:", X.shape)

# Step 3: Tune KMeans
results = tune_kmeans(X, cluster_range=(3, 20))
df_results = pd.DataFrame(results)
df_results.to_csv("results_kmeans.csv", index=False)
print(df_results)

# Step 4: Pick best model (highest silhouette)
best_row = df_results.loc[df_results["silhouette"].idxmax()]
best_k = best_row["params"]["n_clusters"]
print(f"Best KMeans model: k={best_k}, silhouette={best_row['silhouette']}")

# Step 5: Train final model with best k
final_model = KMeans(n_clusters=best_k, init="k-means++", random_state=42)
final_model.fit(X)

# Step 6: Save model, scaler, PCA
joblib.dump(final_model, "kmeans_best_model.joblib")
joblib.dump(scaler, "scaler.joblib")
joblib.dump(pca, "pca.joblib")
#abhi ....
