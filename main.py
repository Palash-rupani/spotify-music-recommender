# main.py
import os
import pandas as pd
import joblib
import json
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering, SpectralClustering
from sklearn.mixture import GaussianMixture
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import silhouette_score

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
        "saved_models/spectral_classifier",
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
        "clustered_datasets_old",
        "clustered_datasets_new"
    ]
    for f in folders:
        os.makedirs(f, exist_ok=True)

    # =============================
    # Load Data
    # =============================
    df = load_data("data/spotify_tracks_clean.csv")

    # =============================
    # Define all candidate features
    # =============================
    features = [
        "danceability","energy","loudness","speechiness","acousticness",
        "instrumentalness","liveness","valence","tempo","duration_ms"
    ]

    sample_size_full = 10000
    sample_size_tune = 8000

    # =============================
    # Step 0: KMeans Feature Subset Selection
    # =============================
    best_features, best_score, best_scaler, best_pca, best_X_sample, best_kmeans_model_params, subset_results = search_feature_subsets(
        df, features, preprocess_data, sample_size=sample_size_full, n_subsets=30, cluster_range=(5, 10)
    )
    print(f"\n✅ Best Feature Subset: {best_features}")
    print(f"Silhouette Score on sample: {best_score:.4f}")

    # Save best_features for recommendation pipeline
    # Save best_features for recommendation pipeline
    best_features_list = best_features.tolist()  # convert ndarray -> list
    with open("saved_models/kmeans/best_features.json", "w") as f:
        json.dump(best_features_list, f)

    # =============================
    # Step 1: KMeans
    # =============================
    print("\n=== Training KMeans on sample ===")
    final_kmeans = KMeans(
        n_clusters=best_kmeans_model_params['n_clusters'],
        n_init=10,
        max_iter=300,
        random_state=42,
        init='k-means++'
    )
    final_kmeans.fit(best_X_sample)
    sil_kmeans = silhouette_score(best_X_sample, final_kmeans.labels_)
    print(f"KMeans silhouette score: {sil_kmeans:.4f}")

    joblib.dump(final_kmeans, "saved_models/kmeans/kmeans_best_model_sample_features.joblib")
    joblib.dump(best_scaler, "saved_models/kmeans/scaler_sample_features.joblib")
    joblib.dump(best_pca, "saved_models/kmeans/pca_sample_features.joblib")

    # Save clustered dataset
    df_sample_kmeans = df.sample(n=len(best_X_sample), random_state=42).copy()
    df_sample_kmeans["cluster_kmeans"] = final_kmeans.labels_
    df_sample_kmeans.to_csv("clustered_datasets_old/spotify_kmeans_sample.csv", index=False)

    # =============================
    # Step 2: DBSCAN
    # =============================
    print("\n=== Running Smart DBSCAN Tuning on sample ===")
    results_dbscan = smart_tune_dbscan(best_X_sample, n_trials=50, sample_size=sample_size_full)
    df_dbscan = pd.DataFrame(results_dbscan)
    df_dbscan.to_csv("results/dbscan/results_dbscan_smart.csv", index=False)

    df_valid = df_dbscan.dropna(subset=["silhouette"])
    if not df_valid.empty:
        best_dbscan = df_valid.loc[df_valid["silhouette"].idxmax()]
        final_dbscan = DBSCAN(**best_dbscan['params'])
        final_dbscan.fit(best_X_sample)
        sil_dbscan = silhouette_score(best_X_sample, final_dbscan.labels_)
        print(f"DBSCAN silhouette score: {sil_dbscan:.4f}")

        joblib.dump(final_dbscan, "saved_models/dbscan/dbscan_best_model_sample.joblib")
        df_sample_dbscan = df.sample(n=len(best_X_sample), random_state=42).copy()
        df_sample_dbscan["cluster_dbscan"] = final_dbscan.labels_
        df_sample_dbscan.to_csv("clustered_datasets_old/spotify_dbscan_sample.csv", index=False)
    else:
        print("⚠️ No valid DBSCAN clustering found (all noise or single cluster).")

    # =============================
    # Step 3: Agglomerative
    # =============================
    print("\n=== Running Agglomerative Clustering ===")
    results_agglom_grid = tune_agglomerative(best_X_sample, cluster_range=(3, 10), sample_size=sample_size_full)
    df_agglom_grid = pd.DataFrame(results_agglom_grid)
    df_agglom_grid.to_csv("results/agglomerative/results_agglomerative_grid.csv", index=False)

    best_agglom = df_agglom_grid.loc[df_agglom_grid["silhouette"].idxmax()]
    final_agglom = AgglomerativeClustering(**best_agglom["params"])
    labels_agglom = final_agglom.fit_predict(best_X_sample)
    sil_agglom = silhouette_score(best_X_sample, labels_agglom)
    print(f"Agglomerative silhouette score: {sil_agglom:.4f}")
    joblib.dump(final_agglom, "saved_models/agglomerative/agglomerative_best_model_sample.joblib")

    df_sample_agglom = df.sample(n=len(best_X_sample), random_state=42).copy()
    df_sample_agglom["cluster_agglomerative"] = labels_agglom
    df_sample_agglom.to_csv("clustered_datasets_old/spotify_agglomerative_sample.csv", index=False)

    # =============================
    # Step 4: GMM
    # =============================
    print("\n=== Running GMM ===")
    results_gmm = tune_gmm(best_X_sample, cluster_range=(3, 10), sample_size=sample_size_full)
    df_gmm = pd.DataFrame(results_gmm)
    df_gmm.to_csv("results/gmm/results_gmm_grid.csv", index=False)

    best_gmm = df_gmm.loc[df_gmm["silhouette"].idxmax()]
    final_gmm = GaussianMixture(**best_gmm["params"])
    final_gmm.fit(best_X_sample)
    sil_gmm = silhouette_score(best_X_sample, final_gmm.predict(best_X_sample))
    print(f"GMM silhouette score: {sil_gmm:.4f}")
    joblib.dump(final_gmm, "saved_models/gmm/gmm_best_model_sample.joblib")

    df_sample_gmm = df.sample(n=len(best_X_sample), random_state=42).copy()
    df_sample_gmm["cluster_gmm"] = final_gmm.predict(best_X_sample)
    df_sample_gmm.to_csv("clustered_datasets_old/spotify_gmm_sample.csv", index=False)

    # =============================
    # Step 5: Spectral Clustering (sample-only)
    # =============================
    print("\n=== Running Spectral Clustering ===")
    results_spectral = tune_spectral(
        best_X_sample,
        cluster_range=(3, 3),
        sample_size=sample_size_tune,
        affinity_methods=["rbf"],
        gamma_list=[0.45, 0.5, 0.55],
        assign_labels_list=["kmeans"]
    )
    df_spectral = pd.DataFrame(results_spectral)
    df_spectral.to_csv("results/spectral/results_spectral_focused_wide.csv", index=False)

    df_valid_spectral = df_spectral.dropna(subset=["silhouette"])
    if not df_valid_spectral.empty:
        best_spectral = df_valid_spectral.loc[df_valid_spectral["silhouette"].idxmax()]
        final_spectral = SpectralClustering(
            n_clusters=best_spectral['params']['n_clusters'],
            affinity=best_spectral['params']['affinity'],
            gamma=best_spectral['params'].get('gamma', 0.5),
            assign_labels=best_spectral['params'].get('assign_labels', 'kmeans'),
            random_state=42,
            n_init=10
        )
        final_spectral.fit(best_X_sample)
        sil_spectral = silhouette_score(best_X_sample, final_spectral.labels_)
        print(f"Spectral silhouette score: {sil_spectral:.4f}")
        joblib.dump(final_spectral, "saved_models/spectral/spectral_best_model_sample.joblib")

        # Train classifier to mimic Spectral
        clf_spectral = RandomForestClassifier(n_estimators=200, random_state=42)
        clf_spectral.fit(best_X_sample, final_spectral.labels_)
        joblib.dump(clf_spectral, "saved_models/spectral_classifier/spectral_classifier.joblib")
        joblib.dump(best_scaler, "saved_models/spectral_classifier/scaler_sample_features.joblib")
        joblib.dump(best_pca, "saved_models/spectral_classifier/pca_sample_features.joblib")

        # Save dataset with Spectral clusters
        df_sample_spectral = df.sample(n=len(best_X_sample), random_state=42).copy()
        df_sample_spectral["cluster_spectral"] = final_spectral.labels_
        df_sample_spectral.to_csv("clustered_datasets_new/spotify_spectral_sample.csv", index=False)

        print("✅ Spectral clustering + classifier ready for prediction")
    else:
        print("⚠️ No valid Spectral clustering found on sample.")

    print("\n🎉 All clustering done! Old pipeline saved in clustered_datasets_old/, new Spectral classifier in clustered_datasets_new/")
