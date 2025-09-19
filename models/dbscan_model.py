from sklearn.cluster import DBSCAN
from utils.evaluation import evaluate_model
from tqdm import tqdm
import numpy as np

def smart_tune_dbscan(X, n_trials=50, sample_size=10000, random_state=42):
    """
    Randomized DBSCAN tuner:
    - Picks random eps, min_samples, metric, algorithm, leaf_size
    - Trains only on a sample
    - Ignores results with negative or None silhouette
    """
    rng = np.random.RandomState(random_state)

    # Sample X if too large
    if len(X) > sample_size:
        idx = rng.choice(len(X), size=sample_size, replace=False)
        X_used = X[idx]
    else:
        X_used = X

    results = []

    metrics_options = ["euclidean", "cosine"]   # keep fast + cosine for audio
    algorithms_options = ["ball_tree", "kd_tree"]  # fast neighbor search
    leaf_sizes = [20, 30, 50]

    for _ in tqdm(range(n_trials), desc="Smart DBSCAN Tuning"):
        eps = rng.uniform(0.3, 1.2)
        min_samples = rng.randint(3, 15)
        metric = rng.choice(metrics_options)
        algo = rng.choice(algorithms_options)
        leaf = rng.choice(leaf_sizes)

        try:
            model = DBSCAN(
                eps=eps,
                min_samples=min_samples,
                metric=metric,
                algorithm=algo,
                leaf_size=leaf
            )
            labels = model.fit_predict(X_used)

            # Skip if only 1 cluster or all noise
            unique_labels = set(labels)
            if len(unique_labels - {-1}) <= 1:
                continue

            metrics_dict = evaluate_model(X_used, labels)

            # Keep only positive silhouette
            if metrics_dict["silhouette"] is not None and metrics_dict["silhouette"] > 0:
                metrics_dict["params"] = {
                    "eps": eps,
                    "min_samples": min_samples,
                    "metric": metric,
                    "algorithm": algo,
                    "leaf_size": leaf
                }
                results.append(metrics_dict)

        except Exception:
            continue

    return results
