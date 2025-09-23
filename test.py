# test_recommend.py
import pandas as pd
from utils.recommend import get_recommendations

# =============================
# Choose algorithm to test
# =============================
ALGO = "spectral"  # or "kmeans", "gmm", "agglomerative", "dbscan"

# =============================
# Load clustered dataset
# =============================
CLUSTERED_PATHS = {
    "kmeans": "clustered_datasets_old/spotify_kmeans_sample.csv",
    "gmm": "clustered_datasets_old/spotify_gmm_sample.csv",
    "agglomerative": "clustered_datasets_old/spotify_agglomerative_sample.csv",
    "dbscan": "clustered_datasets_old/spotify_dbscan_sample.csv",
    "spectral": "clustered_datasets_new/spotify_spectral_sample.csv"
}

df = pd.read_csv(CLUSTERED_PATHS[ALGO])

# =============================
# Show 5 random songs to pick from
# =============================
print("\n🎶 Sample songs to test:")
print(df[["id", "name", "artists"]].sample(5, random_state=42).to_string(index=False))

# =============================
# Ask user to input song ID
# =============================
while True:
    test_song_id = input("\nEnter the Spotify Song ID you want to test: ").strip()
    if test_song_id in df["id"].values:
        break
    print("⚠️ Song ID not found in dataset. Please try again.")

song_info = df[df["id"] == test_song_id][["name", "artists"]].iloc[0]
print(f"\n✅ Testing recommendations for song ID: {test_song_id}")
print(f"   🎵 {song_info['name']}  by  {song_info['artists']}")

# =============================
# Get recommendations for all 3 modes
# =============================
modes = ["knn", "cluster", "cluster_knn"]
for mode in modes:
    recs = get_recommendations(song_id=test_song_id, algo=ALGO, n=10, mode=mode)
    print(f"\n🎧 Top 10 Recommendations ({mode} mode):")
    if mode == "cluster":
        # Cluster-only mode doesn't have similarity
        print(recs.to_string(index=False))
    else:
        # KNN modes show similarity
        print(recs.to_string(index=False))
