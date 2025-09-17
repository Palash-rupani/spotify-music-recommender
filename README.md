🎵 Spotify Music Recommender

A machine learning project that clusters Spotify tracks based on their audio features to enable playlist generation and music recommendation.

We explore multiple clustering algorithms (KMeans, MiniBatchKMeans, Agglomerative Clustering) and evaluate them using silhouette score, Davies-Bouldin Index, and Calinski-Harabasz Score.

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


Preprocessing:

Scaling → Standardization

Dimensionality Reduction → PCA (retain 90% variance)

⚙️ Clustering Approach

We evaluated KMeans, MiniBatchKMeans, and Agglomerative Clustering.

1. KMeans Clustering
Why KMeans?

Produced higher silhouette score (~0.26) compared to MiniBatchKMeans (~0.18).

Scales to large datasets, unlike Agglomerative.

Robust when trained on the full dataset.

Methodology

Tune n_clusters (range: 3–20) on a sample of 10,000 tracks.

Sampling reduces computation time.

Maintains representative structure.

Select the best cluster number based on metrics.

Retrain final KMeans on the entire dataset.

Hyperparameters
Parameter	Value	Reason
n_clusters	Tuned (3–20)	Largest impact on clustering quality. Affects silhouette, Davies-Bouldin, and Calinski-Harabasz scores.
n_init	10	Runs algorithm with multiple centroid seeds → improves robustness. Increasing further improves stability but increases runtime linearly.
max_iter	300	Ensures convergence. Going beyond 300 yields negligible improvement but higher runtime.
init	'k-means++'	Smart centroid initialization. Reduces risk of poor local minima vs random initialization. Arthur & Vassilvitskii, 2007
.

Rationale for Fixing Values

Only n_clusters is tuned because it strongly affects cluster quality.

Other parameters are fixed at reasonable defaults to balance accuracy vs runtime.

Avoids unnecessary nested loops during tuning on large datasets.

Performance

Silhouette Score: ~0.26 on full dataset

Acceptable for high-dimensional, real-world data.

2. MiniBatchKMeans
Why MiniBatchKMeans?

Standard KMeans is accurate but slow on large datasets since each iteration uses all data points.

MiniBatchKMeans samples random mini-batches per iteration → much faster while maintaining similar results.

Trade-off

Faster runtime ✅

Lower silhouette score (~0.18) ❌

Parameters (Fixed)
Parameter	Value	Reason
batch_size	1024	Balances speed vs accuracy. Larger batch sizes approximate full KMeans better, smaller ones are faster but less accurate.
n_init	5	Lower than standard KMeans since batches already add randomness.
max_iter	200	Enough iterations for convergence in minibatch mode.

Use Case

Best for datasets > 50k samples when runtime is critical.

Not chosen as final model due to weaker clustering quality.

3. Agglomerative Clustering
Why Agglomerative?

Achieved the highest silhouette score (~0.42) on a 10k sample.

Produces compact and well-separated clusters.

Trade-off

Very slow and memory-intensive.

Cannot scale to hundreds of thousands of tracks.

Methodology

Tune n_clusters (3–20) and linkage methods (ward, complete, average, single) on the 10k sample.

Train final Agglomerative model on the sample only (not full dataset).

🔑 Summary Table
Algorithm	Tuning Data	Final Training Data	Silhouette	Notes
KMeans	Sample (10k)	Full dataset	~0.26	Best balance of scalability & quality
MiniBatchKMeans	Sample (10k)	Full dataset	~0.18	Faster but weaker clustering
Agglomerative	Sample (10k)	Sample (10k)	~0.42	Best quality, but not scalable
📊 Evaluation Metrics

We use three metrics to evaluate clustering quality:

Silhouette Score → Measures separation & cohesion (higher = better).

Davies-Bouldin Index → Measures average similarity of clusters (lower = better).

Calinski-Harabasz Score → Ratio of between-cluster vs within-cluster variance (higher = better).

📂 Project Structure
spotify-music-recommender/
│── data/                         # Dataset folder
│   └── spotify_tracks_clean.csv
│── models/
│   ├── kmeans_model.py           # KMeans tuning & training
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
1. Clone the repository
git clone https://github.com/yourusername/spotify-music-recommender.git
cd spotify-music-recommender

2. Create & activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # On Windows PowerShell
# Or
source .venv/bin/activate      # On Mac/Linux

3. Install dependencies
pip install -r requirements.txt

▶️ Running the Project

Run the training + evaluation pipeline:

python main.py


This will:

Preprocess data (scaling + PCA).

Tune KMeans and Agglomerative clustering on sample.

Train final KMeans on full dataset.

Save models, scalers, PCA, and evaluation results.

📑 References

Scikit-learn: KMeans

Scikit-learn: MiniBatchKMeans

Arthur, D., & Vassilvitskii, S. (2007). k-means++: The Advantages of Careful Seeding. Stanford University. PDF
