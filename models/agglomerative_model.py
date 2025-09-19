# models/agglomerative_model.py

from sklearn.cluster import AgglomerativeClustering
from utils.evaluation import evaluate_model
from tqdm import tqdm
import numpy as np

def tune_agglomerative(X, cluster_range=(2, 10), sample_size=10000, random_state=42):
    """
    Grid search for Agglomerative Clustering.
    """
    if len(X) > sample_size:
        rng = np.random.RandomState(random_state)
        idx = rng.choice(len(X), size=sample_size, replace=False)
        X_used = X[idx]
    else:
        X_used = X

    results = []
    linkages = ["ward", "complete", "average", "single"]
    total = (cluster_range[1] - cluster_range[0] + 1) * len(linkages)

    for k in tqdm(range(cluster_range[0], cluster_range[1] + 1), desc="Agglomerative Tuning"):
        for link in linkages:
            try:
                if link == "ward":
                    model = AgglomerativeClustering(n_clusters=k, linkage=link)
                else:
                    model = AgglomerativeClustering(
                        n_clusters=k, linkage=link, metric="euclidean"
                    )
                labels = model.fit_predict(X_used)
                metrics = evaluate_model(X_used, labels)
                metrics["params"] = {"n_clusters": k, "linkage": link}
                results.append(metrics)
            except Exception as e:
                results.append({
                    "silhouette": None,
                    "davies_bouldin": None,
                    "calinski_harabasz": None,
                    "params": {"n_clusters": k, "linkage": link},
                    "note": f"Failed with error: {str(e)}"
                })

    return results


def smart_tune_agglomerative(X, cluster_range=(2, 20), n_trials=30, sample_size=10000, random_state=42):
    """
    Randomized search for Agglomerative Clustering hyperparameters.
    """
    if len(X) > sample_size:
        rng = np.random.RandomState(random_state)
        idx = rng.choice(len(X), size=sample_size, replace=False)
        X_used = X[idx]
    else:
        X_used = X

    linkages = ["ward", "complete", "average", "single"]
    metrics = ["euclidean", "manhattan", "cosine"]
    results = []
    rng = np.random.RandomState(random_state)

    for _ in tqdm(range(n_trials), desc="Agglomerative SMART Tuning"):
        k = rng.randint(cluster_range[0], cluster_range[1] + 1)
        link = rng.choice(linkages)
        metric = rng.choice(metrics)

        if link == "ward" and metric != "euclidean":
            continue

        try:
            model = AgglomerativeClustering(
                n_clusters=k,
                linkage=link,
                metric=metric,
                compute_full_tree=True if rng.rand() > 0.5 else False,
                compute_distances=True
            )
            labels = model.fit_predict(X_used)
            scores = evaluate_model(X_used, labels)
            scores["params"] = {"n_clusters": k, "linkage": link, "metric": metric}
            results.append(scores)

        except Exception as e:
            results.append({
                "silhouette": None,
                "davies_bouldin": None,
                "calinski_harabasz": None,
                "params": {"n_clusters": k, "linkage": link, "metric": metric},
                "note": f"Failed: {str(e)}"
            })

    return results
