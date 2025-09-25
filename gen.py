# gen_preview_urls.py
import os
import pandas as pd
import requests
from dotenv import load_dotenv
from time import sleep
from tqdm import tqdm

# =============================
# Load environment variables
# =============================
load_dotenv()
CLIENT_ID = os.getenv("SPOTIPY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIPY_CLIENT_SECRET")

if not CLIENT_ID or not CLIENT_SECRET:
    raise ValueError("Spotify Client ID and Secret must be set in .env")

# =============================
# Get Access Token
# =============================
def get_access_token():
    url = "https://accounts.spotify.com/api/token"
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    data = {
        "grant_type": "client_credentials",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    }
    r = requests.post(url, headers=headers, data=data)
    r.raise_for_status()
    return r.json()["access_token"]

ACCESS_TOKEN = get_access_token()
HEADERS = {"Authorization": f"Bearer {ACCESS_TOKEN}"}

# =============================
# Load your CSV
# =============================
INPUT_CSV = "clustered_datasets_new/spotify_spectral_sample.csv"
OUTPUT_CSV = "clustered_datasets_new/spotify_spectral_with_preview.csv"

df = pd.read_csv(INPUT_CSV)

# Ensure preview_url and album_art columns exist
for col in ["preview_url", "album_art"]:
    if col not in df.columns:
        df[col] = None

# =============================
# Fetch preview URLs + album art in batches
# =============================
BATCH_SIZE = 50
track_ids = df["id"].dropna().tolist()

for i in tqdm(range(0, len(track_ids), BATCH_SIZE)):
    batch_ids = track_ids[i:i + BATCH_SIZE]
    try:
        url = "https://api.spotify.com/v1/tracks"
        params = {"ids": ",".join(batch_ids)}
        resp = requests.get(url, headers=HEADERS, params=params)
        resp.raise_for_status()
        tracks = resp.json().get("tracks", [])

        for idx, track in enumerate(tracks):
            if track:
                # Preview URL
                preview_url = track.get("preview_url")
                if not preview_url:
                    preview_url = None  # Ensure empty previews are stored as None

                # Album art (take the first image if available)
                album_images = track.get("album", {}).get("images", [])
                album_art = album_images[0]["url"] if album_images else None

                # Update DataFrame
                df.loc[df["id"] == batch_ids[idx], "preview_url"] = preview_url
                df.loc[df["id"] == batch_ids[idx], "album_art"] = album_art

    except requests.exceptions.RequestException as e:
        print(f"Error fetching batch {i}-{i+BATCH_SIZE}: {e}")
        sleep(2)  # Wait before retrying

# =============================
# Save updated CSV
# =============================
df.to_csv(OUTPUT_CSV, index=False)
print(f"Saved preview URLs and album art to {OUTPUT_CSV}")
