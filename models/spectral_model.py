# models/spectral_model.py

from sklearn.cluster import SpectralClustering
from utils.evaluation import evaluate_model
from tqdm import tqdm
import numpy as np


def tune_spectral(
    X,
    cluster_range=(3, 10),
    sample_size=6000,  # smaller sample for faster tuning
    random_state=42,
    affinity_methods=None,
    n_neighbors_list=None,
    gamma_list=None,
    assign_labels_list=None
):
    """
    Optimized Grid Search for Spectral Clustering (faster version).

    Parameters:
        X : ndarray
            Data matrix (PCA-reduced recommended)
        cluster_range : tuple
            (min_clusters, max_clusters)
        sample_size : int
            Subset size to speed up clustering
        random_state : int
        affinity_methods : list
            Default: ["nearest_neighbors", "rbf"]
        n_neighbors_list : list
            Default: [10, 15] for nearest_neighbors
        gamma_list : list
            Default: [0.5, 1.0] for rbf
        assign_labels_list : list
            Default: ["kmeans"]
    """
    if affinity_methods is None:
        affinity_methods = ["nearest_neighbors", "rbf"]
    if n_neighbors_list is None:
        n_neighbors_list = [10, 15]
    if gamma_list is None:
        gamma_list = [0.5, 1.0]
    if assign_labels_list is None:
        assign_labels_list = ["kmeans"]

    # =============================
    # Sample data for faster tuning
    # =============================
    if len(X) > sample_size:
        rng = np.random.RandomState(random_state)
        idx = rng.choice(len(X), size=sample_size, replace=False)
        X_used = X[idx]
    else:
        X_used = X

    results = []

    # =============================
    # Grid Search
    # =============================
    for k in tqdm(range(cluster_range[0], cluster_range[1] + 1), desc="Spectral Tuning"):
        for affinity in affinity_methods:
            try:
                if affinity == "nearest_neighbors":
                    for n_neighbors in n_neighbors_list:
                        for assign_labels in assign_labels_list:
                            model = SpectralClustering(
                                n_clusters=k,
                                affinity=affinity,
                                n_neighbors=n_neighbors,
                                assign_labels=assign_labels,
                                random_state=random_state,
                                n_init=10
                            )
                            labels = model.fit_predict(X_used)
                            metrics = evaluate_model(X_used, labels)
                            metrics["params"] = {
                                "n_clusters": k,
                                "affinity": affinity,
                                "n_neighbors": n_neighbors,
                                "assign_labels": assign_labels
                            }
                            results.append(metrics)
                elif affinity == "rbf":
                    for gamma in gamma_list:
                        for assign_labels in assign_labels_list:
                            model = SpectralClustering(
                                n_clusters=k,
                                affinity=affinity,
                                gamma=gamma,
                                assign_labels=assign_labels,
                                random_state=random_state,
                                n_init=10
                            )
                            labels = model.fit_predict(X_used)
                            metrics = evaluate_model(X_used, labels)
                            metrics["params"] = {
                                "n_clusters": k,
                                "affinity": affinity,
                                "gamma": gamma,
                                "assign_labels": assign_labels
                            }
                            results.append(metrics)
            except Exception as e:
                results.append({
                    "silhouette": None,
                    "davies_bouldin": None,
                    "calinski_harabasz": None,
                    "params": {
                        "n_clusters": k,
                        "affinity": affinity
                    },
                    "note": f"Failed with error: {str(e)}"
                })

    return results
