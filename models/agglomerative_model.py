from sklearn.cluster import AgglomerativeClustering
from utils.evaluation import evaluate_model
from tqdm import tqdm
import numpy as np

def tune_agglomerative(X, cluster_range=(2, 10), sample_size=10000, random_state=42):
    """
    Tune Agglomerative Clustering over a range of cluster numbers and linkage methods, with progress bar.
    """
    # Downsample if dataset too large
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
                # ward only works with Euclidean
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
