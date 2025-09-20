# models/gmm_model.py

from sklearn.mixture import GaussianMixture
from utils.evaluation import evaluate_model
from tqdm import tqdm
import numpy as np


def tune_gmm(X, cluster_range=(2, 10), sample_size=10000, random_state=42, cov_types=None):
    """
    Grid search for Gaussian Mixture Models (GMM).
    Parameters:
        X : ndarray
            Data matrix.
        cluster_range : tuple
            (min_clusters, max_clusters).
        sample_size : int
            Subset size to speed up training (kept fixed at 10000).
        random_state : int
            Random seed for reproducibility.
        cov_types : list
            List of covariance types to test. Default: ["full", "tied", "diag", "spherical"].
    """
    if cov_types is None:
        cov_types = ["full", "tied", "diag", "spherical"]

    # Sampling
    if len(X) > sample_size:
        rng = np.random.RandomState(random_state)
        idx = rng.choice(len(X), size=sample_size, replace=False)
        X_used = X[idx]
    else:
        X_used = X

    results = []
    total = (cluster_range[1] - cluster_range[0] + 1) * len(cov_types)

    for k in tqdm(range(cluster_range[0], cluster_range[1] + 1), desc="GMM Tuning"):
        for cov in cov_types:
            try:
                model = GaussianMixture(
                    n_components=k,
                    covariance_type=cov,
                    random_state=random_state,
                    n_init=2
                )
                labels = model.fit_predict(X_used)
                metrics = evaluate_model(X_used, labels)
                metrics["params"] = {"n_components": k, "covariance_type": cov}
                results.append(metrics)
            except Exception as e:
                results.append({
                    "silhouette": None,
                    "davies_bouldin": None,
                    "calinski_harabasz": None,
                    "params": {"n_components": k, "covariance_type": cov},
                    "note": f"Failed with error: {str(e)}"
                })

    return results
