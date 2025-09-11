from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import pandas as pd

def load_data(path):
    return pd.read_csv(path)

def preprocess_data(df, features, use_pca=True, variance_threshold=0.9):
    # Step 1: Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(df[features])

    # Step 2: Apply PCA
    pca = None
    if use_pca:
        pca = PCA(n_components=variance_threshold, svd_solver='full')
        X_transformed = pca.fit_transform(X_scaled)
        return X_transformed, scaler, pca
    else:
        return X_scaled, scaler, None
