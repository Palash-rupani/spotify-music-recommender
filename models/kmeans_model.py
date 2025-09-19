import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import (
    silhouette_score,
    davies_bouldin_score,
    calinski_harabasz_score,
)
from joblib import Parallel, delayed
from tqdm import tqdm


# ======================================================
# Fast evaluation function (sampled silhouette)
# ======================================================
def evaluate_model_fast(X, labels, sample_size=2000, random_state=42):
    try:
        sil = silhouette_score(X, labels, sample_size=sample_size, random_state=random_state)
    except Exception:
        sil = None
    try:
        db = davies_bouldin_score(X, labels)
    except Exception:
        db = None
    try:
        ch = calinski_harabasz_score(X, labels)
    except Exception:
        ch = None
    return {"silhouette": sil, "davies_bouldin": db, "calinski_harabasz": ch}


# ======================================================
# Parallelized KMeans tuning (with progress bar)
# ======================================================
def tune_kmeans_fast(X, cluster_range=(5, 10), random_state=42, n_jobs=-1):
    def run_kmeans(k):
        try:
            model = KMeans(
                n_clusters=k,
                n_init=10,
                max_iter=300,
                init="k-means++",
                random_state=random_state,
            )
            labels = model.fit_predict(X)
            metrics = evaluate_model_fast(X, labels)
            metrics["params"] = {"n_clusters": k}
            return metrics
        except Exception as e:
            return {
                "silhouette": None,
                "davies_bouldin": None,
                "calinski_harabasz": None,
                "params": {"n_clusters": k},
                "note": f"Failed with error: {str(e)}",
            }

    results = Parallel(n_jobs=n_jobs)(
        delayed(run_kmeans)(k)
        for k in tqdm(range(cluster_range[0], cluster_range[1] + 1), desc="KMeans tuning")
    )
    return results


# ======================================================
# Feature subset search (random sampling instead of exhaustive)
# ======================================================
def search_feature_subsets(
    df,
    features,
    preprocess_data,
    sample_size=10000,
    n_subsets=30,
    cluster_range=(5, 10),
    random_state=42,
):
    rng = np.random.RandomState(random_state)
    best_score = -1
    best_features = features
    subset_results = []

    print(f"\n=== Searching {n_subsets} random feature subsets for KMeans ===")

    for _ in tqdm(range(n_subsets), desc="Feature subset search"):
        k = rng.randint(5, len(features) + 1)  # subset size
        subset = rng.choice(features, size=k, replace=False)

        # Preprocess with PCA
        X_sub, scaler_sub, pca_sub = preprocess_data(
            df, list(subset), use_pca=True, variance_threshold=0.8
        )

        # Downsample if too large
        if len(X_sub) > sample_size:
            idx = rng.choice(len(X_sub), size=sample_size, replace=False)
            X_sample = X_sub[idx]
        else:
            X_sample = X_sub

        # Tune KMeans
        res = tune_kmeans_fast(X_sample, cluster_range=cluster_range, random_state=random_state, n_jobs=-1)
        df_res = pd.DataFrame(res)
        top_model = df_res.loc[df_res["silhouette"].idxmax()]

        subset_results.append({"features": subset, "best_silhouette": top_model["silhouette"]})

        if top_model["silhouette"] and top_model["silhouette"] > best_score:
            best_score = top_model["silhouette"]
            best_features = subset
            best_scaler, best_pca, best_X_sample, best_params = (
                scaler_sub,
                pca_sub,
                X_sample,
                top_model["params"],
            )

    return best_features, best_score, best_scaler, best_pca, best_X_sample, best_params, subset_results
