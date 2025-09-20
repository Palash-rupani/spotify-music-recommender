# main.py

import os
import pandas as pd
import joblib
from sklearn.cluster import KMeans, DBSCAN, SpectralClustering
from sklearn.mixture import GaussianMixture

# =============================
# Imports from utils & models
# =============================
from utils.preprocessing import load_data, preprocess_data
from models.kmeans_model import search_feature_subsets
from models.dbscan_model import smart_tune_dbscan
from models.agglomerative_model import tune_agglomerative
from models.gmm_model import tune_gmm
from models.spectral_model import tune_spectral


if __name__ == "__main__":
    # =============================
    # Setup folders
    # =============================
    folders = [
        "saved_models/kmeans",
        "saved_models/dbscan",
        "saved_models/agglomerative",
        "saved_models/gmm",
        "saved_models/spectral",
        "results/kmeans",
        "results/dbscan",
        "results/agglomerative",
        "results/gmm",
        "results/spectral",
        "reports/kmeans",
        "reports/dbscan",
        "reports/agglomerative",
        "reports/gmm",
        "reports/spectral",
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

    sample_size_full = 10000
    sample_size_tune = 8000  # slightly larger tuning sample for better silhouette

    # =============================
    # Step 0: Feature Subset Selection for KMeans
    # =============================
    best_features, best_score, best_scaler, best_pca, best_X_sample, best_kmeans_model_params, subset_results = search_feature_subsets(
        df, features, preprocess_data, sample_size=sample_size_full, n_subsets=30, cluster_range=(5, 10)
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

    joblib.dump(final_kmeans, "saved_models/kmeans/kmeans_best_model_sample_features.joblib")
    joblib.dump(best_scaler, "saved_models/kmeans/scaler_sample_features.joblib")
    joblib.dump(best_pca, "saved_models/kmeans/pca_sample_features.joblib")
    print("✅ Saved best KMeans model (sample-only, best features)\n")

    # =============================
    # Step 2: Smart DBSCAN tuning & training
    # =============================
    print("\n=== Running Smart DBSCAN Tuning on sample ===")
    results_dbscan = smart_tune_dbscan(best_X_sample, n_trials=50, sample_size=sample_size_full)
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
    results_agglom_grid = tune_agglomerative(best_X_sample, cluster_range=(3, 10), sample_size=sample_size_full)
    df_agglom_grid = pd.DataFrame(results_agglom_grid)
    df_agglom_grid.to_csv("results/agglomerative/results_agglomerative_grid.csv", index=False)

    best_agglom_grid = df_agglom_grid.loc[df_agglom_grid["silhouette"].idxmax()]
    print(f"\nBest Agglomerative Grid model: {best_agglom_grid['params']}, silhouette={best_agglom_grid['silhouette']:.4f}")

    # =============================
    # Step 4: Gaussian Mixture Models (Grid Search)
    # =============================
    print("\n=== Running Gaussian Mixture Model (GMM) Grid Search on sample ===")
    results_gmm = tune_gmm(best_X_sample, cluster_range=(3, 10), sample_size=sample_size_full)
    df_gmm = pd.DataFrame(results_gmm)
    df_gmm.to_csv("results/gmm/results_gmm_grid.csv", index=False)

    best_gmm = df_gmm.loc[df_gmm["silhouette"].idxmax()]
    print(f"\nBest GMM model: {best_gmm['params']}, silhouette={best_gmm['silhouette']:.4f}")

    joblib.dump(best_scaler, "saved_models/gmm/scaler_sample_features.joblib")
    joblib.dump(best_pca, "saved_models/gmm/pca_sample_features.joblib")
    print("✅ Saved best GMM model (sample-only, best features)\n")

    # =============================
    # Step 5: Spectral Clustering (Focused Fast Tuning with Wider Gamma)
    # =============================
    print("\n=== Running Spectral Clustering (Focused Fast Grid Search) on sample ===")
    # Focused around previously best params
    results_spectral = tune_spectral(
        best_X_sample,
        cluster_range=(3, 3),          # fixed clusters
        sample_size=sample_size_tune,  # slightly larger tuning sample
        affinity_methods=["rbf"],
        gamma_list=[0.45, 0.5, 0.55],  # slightly wider gamma grid
        assign_labels_list=["kmeans"]
    )

    df_spectral = pd.DataFrame(results_spectral)
    df_spectral.to_csv("results/spectral/results_spectral_focused_wide.csv", index=False)

    df_valid_spectral = df_spectral.dropna(subset=["silhouette"])
    if not df_valid_spectral.empty:
        best_spectral = df_valid_spectral.loc[df_valid_spectral["silhouette"].idxmax()]
        print(f"\nBest Spectral model params: {best_spectral['params']}, silhouette={best_spectral['silhouette']:.4f}")

        # Fit final Spectral model on full sample
        final_spectral = SpectralClustering(
            n_clusters=best_spectral['params']['n_clusters'],
            affinity=best_spectral['params']['affinity'],
            gamma=best_spectral['params'].get('gamma', 0.5),
            assign_labels=best_spectral['params'].get('assign_labels', 'kmeans'),
            random_state=42,
            n_init=10
        )
        final_spectral.fit(best_X_sample)  # full 10k sample

        joblib.dump(final_spectral, "saved_models/spectral/spectral_best_model_full_sample.joblib")
        joblib.dump(best_scaler, "saved_models/spectral/scaler_sample_features.joblib")
        joblib.dump(best_pca, "saved_models/spectral/pca_sample_features.joblib")
        print("✅ Saved final Spectral model (full sample)\n")
    else:
        print("⚠️ No valid Spectral clustering found.")

    print("🎉 All clustering done on sample-only dataset with feature optimization!")
