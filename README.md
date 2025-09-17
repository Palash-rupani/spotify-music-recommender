🎵 Spotify Music Recommender

A machine learning project that clusters Spotify tracks based on their audio features to power recommendation systems.

We experiment with multiple clustering algorithms (KMeans, MiniBatchKMeans, Agglomerative Clustering) and evaluate them using metrics such as Silhouette Score, Davies-Bouldin Index, and Calinski-Harabasz Score.

🚀 Project Overview

Goal: Group similar songs together using clustering to enable playlist generation and recommendations.

Dataset: Cleaned Spotify tracks dataset (hundreds of thousands of tracks).

Features Used:

danceability, energy, loudness, speechiness,
acousticness, instrumentalness, liveness, valence,
tempo, duration_ms

Dimensionality Reduction: PCA (retaining 90% variance).

⚙️ Clustering Approach
1. KMeans Clustering

Why KMeans?

Produces higher silhouette score (~0.26) compared to MiniBatchKMeans (~0.18).

Scales well when trained on the full dataset.

Methodology:

Tune n_clusters (3–20) on a sample of 10,000 tracks.

Select the best n_clusters based on evaluation metrics.

Train the final KMeans model on the full dataset.

Fixed Parameters:

Parameter	Value	Reason
n_init	10	Robust centroids, avoids poor local minima.
max_iter	300	Sufficient for convergence.
init	'k-means++'	Smart centroid initialization.
2. MiniBatchKMeans

Why MiniBatchKMeans?

Much faster on very large datasets by using random batches.

However, lower clustering quality (silhouette ~0.18).

Use Case:

Suitable for quick experiments or datasets > 50k samples.

Not chosen as the final model due to weaker clustering quality.

3. Agglomerative Clustering

Why Agglomerative?

Achieves the highest silhouette score (~0.42) on a 10k sample.

Produces compact and well-separated clusters.

Limitation:

Does not scale to the full dataset (computationally expensive).

Final model trained only on the sample.

🔑 Summary Table
Algorithm	Tuning Data	Final Training Data	Silhouette	Notes
KMeans	Sample (10k)	Full dataset	~0.26	Best trade-off between quality & scalability
MiniBatchKMeans	Sample (10k)	Full dataset	~0.18	Faster but lower quality
Agglomerative	Sample (10k)	Sample (10k)	~0.42	Best quality but not scalable
📊 Evaluation Metrics

We use three clustering metrics:

Silhouette Score → Measures separation between clusters (higher = better).

Davies-Bouldin Index → Lower values indicate better clustering.

Calinski-Harabasz Score → Higher values indicate better defined clusters.

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

▶️ Running the Project

Run the full training + evaluation pipeline:

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