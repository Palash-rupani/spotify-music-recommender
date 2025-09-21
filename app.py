from flask import Flask, render_template, request, jsonify
import joblib
import os
import pandas as pd
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from dotenv import load_dotenv
from sklearn.neighbors import NearestNeighbors

# Load env vars
load_dotenv()
CLIENT_ID = os.getenv("SPOTIPY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIPY_CLIENT_SECRET")

# Spotify API auth
sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET
))

# Flask app
app = Flask(__name__)

# Load models + data
model = joblib.load("saved_models/spectral/spectral_best_model_sample.joblib")
scaler = joblib.load("saved_models/spectral/scaler_sample_features.joblib")
tracks_df = pd.read_csv("data/tracks_with_clusters.csv")  # your dataset with features, clusters, etc.

# Pre-fit NearestNeighbors on full dataset
nn = NearestNeighbors(n_neighbors=10, metric="euclidean")
nn.fit(scaler.transform(tracks_df[["danceability", "energy", "valence"]]))

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.json
    track_id = data.get("track_id")
    rec_type = data.get("recType", "cluster")

    # Get features from Spotify
    features = sp.audio_features([track_id])[0]
    if not features:
        return jsonify({"error": "Track not found"}), 404

    # Extract features used in training
    X = [[features["danceability"], features["energy"], features["valence"]]]
    X_scaled = scaler.transform(X)

    recommendations = []

    if rec_type == "cluster":
        # Predict cluster
        cluster = model.predict(X_scaled)[0]
        recs = tracks_df[tracks_df["cluster"] == cluster].sample(10)

    elif rec_type == "nn":
        # Use kNN across all tracks
        indices = nn.kneighbors(X_scaled, return_distance=False)[0]
        recs = tracks_df.iloc[indices]

    elif rec_type == "combined":
        # Cluster first
        cluster = model.predict(X_scaled)[0]
        cluster_tracks = tracks_df[tracks_df["cluster"] == cluster]
        nn_cluster = NearestNeighbors(n_neighbors=10).fit(
            scaler.transform(cluster_tracks[["danceability", "energy", "valence"]])
        )
        indices = nn_cluster.kneighbors(X_scaled, return_distance=False)[0]
        recs = cluster_tracks.iloc[indices]

    else:
        return jsonify({"error": "Invalid recType"}), 400

    # Format results
    for _, row in recs.iterrows():
        recommendations.append({
            "id": row["track_id"],
            "name": row["track_name"],
            "artist": row["artist_name"],
            "preview_url": row.get("preview_url", None),
            "album_art": row.get("album_art", None)
        })

    return jsonify({"recommendations": recommendations})

if __name__ == "__main__":
    app.run(debug=True)
