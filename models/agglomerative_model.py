from sklearn.cluster import AgglomerativeClustering
from sklearn.model_selection import ParameterGrid
from utils.evaluation import evaluate_model

def tune_agglomerative(X, cluster_range=(3, 20), sample_size=10000):
    results = []
    param_grid = {
        "n_clusters": range(cluster_range[0], cluster_range[1] + 1),
        "linkage": ["ward", "average", "complete"]
    }

    for params in ParameterGrid(param_grid):
        try:
            model = AgglomerativeClustering(**params)
            labels = model.fit_predict(X)
            metrics = evaluate_model(X, labels, sample_size=sample_size)
            results.append({
                "algorithm": "Agglomerative",
                "params": params,
                **metrics
            })
        except Exception as e:
            print(f"Skipped params {params} due to error: {e}")
    return results
