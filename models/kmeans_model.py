from sklearn.cluster import KMeans
from utils.evaluation import evaluate_model
from sklearn.model_selection import ParameterGrid

def tune_kmeans(X, cluster_range=(3, 20), sample_size=10000):
    results = []
    param_grid = {"n_clusters": range(cluster_range[0], cluster_range[1]+1)}

    for params in ParameterGrid(param_grid):
        model = KMeans(**params, init="k-means++", random_state=42)
        labels = model.fit_predict(X)
        metrics = evaluate_model(X, labels, sample_size=sample_size)
        results.append({
            "algorithm": "KMeans",
            "params": params,
            **metrics
        })
    return results
