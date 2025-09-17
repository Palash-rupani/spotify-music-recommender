from sklearn.cluster import KMeans, MiniBatchKMeans
from tqdm import tqdm
import numpy as np
from utils.evaluation import evaluate_model


def tune_kmeans(X, cluster_range=(2, 10), sample_size=10000, random_state=42):
    """
    Tune standard KMeans over a range of cluster numbers.
    Use this for smaller datasets (≤ 50,000 samples).
    """
    # Downsample if dataset too large
    if len(X) > sample_size:
        rng = np.random.RandomState(random_state)
        idx = rng.choice(len(X), size=sample_size, replace=False)
        X_used = X[idx]
    else:
        X_used = X

    results = []
    for k in tqdm(range(cluster_range[0], cluster_range[1] + 1), desc="KMeans Tuning"):
        try:
            model = KMeans(
                n_clusters=k,
                n_init=10,
                max_iter=300,
                random_state=random_state
            )
            labels = model.fit_predict(X_used)
            metrics = evaluate_model(X_used, labels)
            metrics["params"] = {"n_clusters": k}
            results.append(metrics)
        except Exception as e:
            results.append({
                "silhouette": None,
                "davies_bouldin": None,
                "calinski_harabasz": None,
                "params": {"n_clusters": k},
                "note": f"Failed with error: {str(e)}"
            })

    return results


def tune_minibatch_kmeans(X, cluster_range=(2, 10), sample_size=10000, random_state=42):
    """
    Tune MiniBatchKMeans over a range of cluster numbers.
    Recommended for large datasets (50,000+ samples).
    """
    # Downsample if dataset too large
    if len(X) > sample_size:
        rng = np.random.RandomState(random_state)
        idx = rng.choice(len(X), size=sample_size, replace=False)
        X_used = X[idx]
    else:
        X_used = X

    results = []
    for k in tqdm(range(cluster_range[0], cluster_range[1] + 1), desc="MiniBatchKMeans Tuning"):
        try:
            model = MiniBatchKMeans(
                n_clusters=k,
                batch_size=1024,
                n_init=5,
                max_iter=200,
                random_state=random_state
            )
            labels = model.fit_predict(X_used)
            metrics = evaluate_model(X_used, labels)
            metrics["params"] = {"n_clusters": k, "batch_size": 1024}
            results.append(metrics)
        except Exception as e:
            results.append({
                "silhouette": None,
                "davies_bouldin": None,
                "calinski_harabasz": None,
                "params": {"n_clusters": k},
                "note": f"Failed with error: {str(e)}"
            })

    return results
