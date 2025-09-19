🎵 Spotify Music Recommender

A machine learning project that clusters Spotify tracks based on their audio features to enable playlist generation and music recommendation.

We explore multiple clustering algorithms (KMeans, DBSCAN, Agglomerative Clustering) and evaluate them using Silhouette Score, Davies-Bouldin Index, and Calinski-Harabasz Score.

📌 Motivation

Spotify provides detailed audio features (danceability, energy, tempo, etc.) for each track. By clustering these tracks, we can group sonically similar songs, which can then be used to:

Build recommendation engines

Auto-generate playlists

Discover hidden patterns in music

📂 Dataset

Source: Cleaned Spotify dataset (~hundreds of thousands of tracks).

Features used for clustering:

danceability, energy, loudness, speechiness, acousticness,
instrumentalness, liveness, valence, tempo, duration_ms

Preprocessing

Scaling → Standardization (zero mean, unit variance)

Dimensionality Reduction → PCA (retain 90% variance)

⚙️ Clustering Approach

We evaluated KMeans, DBSCAN, and Agglomerative Clustering.

1. KMeans Clustering
Why KMeans?

Good baseline, widely used for high-dimensional data.

Scales to large datasets (unlike Agglomerative).

Robust and interpretable.

Methodology

Feature subset search to select best-performing features.

Tune n_clusters (range: 5–10) on a 10k sample.

Choose the best configuration using silhouette score.

Retrain final KMeans on the entire dataset for scalability.

Hyperparameters
Parameter	Value	Reason
n_clusters	Tuned (5–10)	Strongest effect on clustering quality.
n_init	10	Improves stability by running multiple initializations.
max_iter	300	Ensures convergence without wasting runtime.
init	'k-means++'	Smart initialization to avoid poor local minima.
Performance

Silhouette Score: ~0.39 (sample of 10k)

Acceptable baseline, but weaker than DBSCAN and Agglomerative.

2. DBSCAN (Density-Based Spatial Clustering)
Why DBSCAN?

Captures arbitrary-shaped clusters.

Automatically detects outliers (noise points).

Does not require pre-specifying k.

Methodology

Smart randomized hyperparameter tuning on a 10k sample.

Key parameters: eps (neighborhood radius), min_samples (density threshold).

Selected best config based on silhouette score.

Performance

Silhouette Score: ~0.52 (sample of 10k)

Significantly better than KMeans.

Strength: handles noisy tracks and irregular cluster shapes.

3. Agglomerative Clustering
Why Agglomerative?

Produces hierarchical clusters.

Achieved the highest silhouette score across models.

Captures nested structure (e.g., moods inside genres).

Methodology

Grid + randomized search on 10k sample.

Tuned n_clusters (3–20) and linkage methods (ward, complete, average, single).

Final model trained only on sample (not full dataset) due to scalability limits.

Performance

Silhouette Score: ~0.55 (sample of 10k)

Best-performing model in terms of cluster quality.

Trade-off: Not scalable to 100k+ tracks due to memory/time.

🔑 Summary Table
Algorithm	Tuning Data	Final Training Data	Silhouette	Notes
KMeans	10k sample	Full dataset	~0.39	Best balance of scalability & quality
DBSCAN	10k sample	10k sample	~0.52	Strong clustering, detects outliers
Agglomerative	10k sample	10k sample	~0.55	Best quality, not scalable
📊 Evaluation Metrics

Silhouette Score → Cluster cohesion & separation (higher = better).

Davies-Bouldin Index → Cluster similarity (lower = better).

Calinski-Harabasz Score → Separation vs compactness (higher = better).

📂 Project Structure
spotify-music-recommender/
│── data/                         # Dataset folder
│   └── spotify_tracks_clean.csv
│── models/
│   ├── kmeans_model.py           # KMeans tuning & training
│   ├── dbscan_model.py           # DBSCAN tuning
│   └── agglomerative_model.py    # Agglomerative tuning
│── results/                      # Metrics & CSV reports
│── reports/                      # Model performance reports
│── saved_models/                 # Trained models, scalers, PCA
│── utils/
│   ├── preprocessing.py          # Scaling + PCA
│   └── evaluation.py             # Evaluation metrics
│── main.py                       # Main pipeline (training workflow)
│── requirements.txt              # Dependencies
│── README.md                     # Documentation

🛠️ Installation & Setup
# 1. Clone the repository
git clone https://github.com/yourusername/spotify-music-recommender.git
cd spotify-music-recommender

# 2. Create & activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # On Windows PowerShell
# Or
source .venv/bin/activate      # On Mac/Linux

# 3. Install dependencies
pip install -r requirements.txt

▶️ Running the Project

Run the training + evaluation pipeline:

python main.py


This will:

Preprocess data (scaling + PCA)

Tune KMeans, DBSCAN, and Agglomerative clustering on a sample

Train final KMeans on full dataset

Save models, scalers, PCA, and evaluation results

📑 References

Scikit-learn: KMeans

Scikit-learn: DBSCAN

Scikit-learn: Agglomerative Clustering

Arthur, D., & Vassilvitskii, S. (2007). k-means++: The Advantages of Careful Seeding. Stanford University.