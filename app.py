from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd
import numpy as np

# =============================
# Load models + preprocessors
# =============================
scaler = joblib.load("saved_models/kmeans/scaler_sample_features.joblib")
pca = joblib.load("saved_models/kmeans/pca_sample_features.joblib")
kmeans = joblib.load("saved_models/kmeans/kmeans_best_model_sample_features.joblib")

# Load dataset
df = pd.read_csv("data/spotify_tracks_clean.csv")

# Feature columns
features = [
    "danceability","energy","loudness","speechiness","acousticness",
    "instrumentalness","liveness","valence","tempo","duration_ms"
]

app = Flask(__name__)

# =============================
# Routes
# =============================

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json()
    song_name = data.get("song_id")

    # Find the song in dataset
    song = df[df["track_name"].str.lower() == song_name.lower()]
    if song.empty:
        return jsonify([])

    # Preprocess the song
    X = scaler.transform(song[features])
    X_pca = pca.transform(X)

    # Predict cluster
    cluster = kmeans.predict(X_pca)[0]

    # Recommend other songs from the same cluster
    cluster_songs = df[kmeans.predict(pca.transform(scaler.transform(df[features]))) == cluster]

    # Exclude the original song
    cluster_songs = cluster_songs[cluster_songs["track_name"].str.lower() != song_name.lower()]

    # Pick top 5
    recs = cluster_songs.sample(5, random_state=42)[["track_name", "artists"]].to_dict(orient="records")

    return jsonify(recs)

if __name__ == "__main__":
    app.run(debug=True)
