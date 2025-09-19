import os
import pandas as pd
import joblib
from sklearn.cluster import KMeans, DBSCAN

# =============================
# Imports from utils & models
# =============================
from utils.preprocessing import load_data, preprocess_data
from models.kmeans_model import search_feature_subsets
from models.dbscan_model import smart_tune_dbscan
from models.agglomerative_model import tune_agglomerative


if __name__ == "__main__":
    # =============================
    # Setup folders
    # =============================
    folders = [
        "saved_models/kmeans",
        "saved_models/dbscan",
        "saved_models/agglomerative",
        "results/kmeans",
        "results/dbscan",
        "results/agglomerative",
        "reports/kmeans",
        "reports/dbscan",
        "reports/agglomerative",
    ]
    for f in folders:
        os.makedirs(f, exist_ok=True)

    # =============================
    # Load Data
    # =============================
    df = load_data("data/spotify_tracks_clean.csv")

    # =============================
    # Define features
    # =============================
    features = [
        "danceability","energy","loudness","speechiness","acousticness",
        "instrumentalness","liveness","valence","tempo","duration_ms"
    ]

    sample_size = 10000

    # =============================
    # Step 0: Feature Subset Selection for KMeans
    # =============================
    best_features, best_score, best_scaler, best_pca, best_X_sample, best_kmeans_model_params, subset_results = search_feature_subsets(
        df, features, preprocess_data, sample_size=sample_size, n_subsets=30, cluster_range=(5, 10)
    )

    print(f"\n✅ Best Feature Subset: {best_features}")
    print(f"Silhouette Score on sample: {best_score:.4f}")

    # =============================
    # Step 1: KMeans training on sample
    # =============================
    print("\n=== Training KMeans on sample with best features ===")
    final_kmeans = KMeans(
        n_clusters=best_kmeans_model_params['n_clusters'],
        n_init=10,
        max_iter=300,
        random_state=42,
        init='k-means++'
    )
    final_kmeans.fit(best_X_sample)

    # Save KMeans model, scaler, PCA
    joblib.dump(final_kmeans, "saved_models/kmeans/kmeans_best_model_sample_features.joblib")
    joblib.dump(best_scaler, "saved_models/kmeans/scaler_sample_features.joblib")
    joblib.dump(best_pca, "saved_models/kmeans/pca_sample_features.joblib")
    print("✅ Saved best KMeans model (sample-only, best features)\n")

    # =============================
    # Step 2: Smart DBSCAN tuning & training
    # =============================
    print("\n=== Running Smart DBSCAN Tuning on sample ===")
    results_dbscan = smart_tune_dbscan(best_X_sample, n_trials=50, sample_size=sample_size)
    df_dbscan = pd.DataFrame(results_dbscan)
    df_dbscan.to_csv("results/dbscan/results_dbscan_smart.csv", index=False)

    df_valid = df_dbscan.dropna(subset=["silhouette"])
    if not df_valid.empty:
        best_dbscan = df_valid.loc[df_valid["silhouette"].idxmax()]
        print(f"\nBest DBSCAN model (sample): {best_dbscan['params']}, silhouette={best_dbscan['silhouette']:.4f}")

        final_dbscan = DBSCAN(**best_dbscan['params'])
        final_dbscan.fit(best_X_sample)

        joblib.dump(final_dbscan, "saved_models/dbscan/dbscan_best_model_sample.joblib")
        joblib.dump(best_scaler, "saved_models/dbscan/scaler_sample_features.joblib")
        joblib.dump(best_pca, "saved_models/dbscan/pca_sample_features.joblib")
        print("✅ Saved best DBSCAN model (sample-only, best features)\n")
    else:
        print("⚠️ No valid DBSCAN clustering found (all noise or single cluster).")

    # =============================
    # Step 3: Agglomerative Clustering (Grid Search ONLY)
    # =============================
    print("\n=== Running Agglomerative Clustering (Grid Search) on sample ===")
    results_agglom_grid = tune_agglomerative(best_X_sample, cluster_range=(3, 10), sample_size=sample_size)
    df_agglom_grid = pd.DataFrame(results_agglom_grid)
    df_agglom_grid.to_csv("results/agglomerative/results_agglomerative_grid.csv", index=False)

    best_agglom_grid = df_agglom_grid.loc[df_agglom_grid["silhouette"].idxmax()]
    print(f"\nBest Agglomerative Grid model: {best_agglom_grid['params']}, silhouette={best_agglom_grid['silhouette']:.4f}")

    print("🎉 All clustering done on sample-only dataset with feature optimization!")
