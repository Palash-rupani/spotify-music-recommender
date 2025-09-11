from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
import numpy as np

def evaluate_model(X, labels, sample_size=10000, random_state=42):
    X = np.array(X)
    labels = np.array(labels)

    # ensure at least 2 clusters
    if len(np.unique(labels)) < 2:
        return {
            "silhouette": None,
            "davies_bouldin": None,
            "calinski_harabasz": None,
            "note": "Only one cluster found"
        }

    # sample data if too large
    if len(X) > sample_size:
        rng = np.random.RandomState(random_state)
        idx = rng.choice(len(X), size=sample_size, replace=False)
        X_sample = X[idx]
        labels_sample = labels[idx]
    else:
        X_sample, labels_sample = X, labels

    return {
        "silhouette": silhouette_score(X_sample, labels_sample),
        "davies_bouldin": davies_bouldin_score(X_sample, labels_sample),
        "calinski_harabasz": calinski_harabasz_score(X_sample, labels_sample)
    }
