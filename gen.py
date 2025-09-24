# gen_preview_urls.py
import os
import pandas as pd
from spotipy import Spotify
from spotipy.oauth2 import SpotifyClientCredentials
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

sp = Spotify(auth_manager=SpotifyClientCredentials(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET
))

# =============================
# Load your CSV
# =============================
INPUT_CSV = "clustered_datasets_new/spotify_spectral_sample.csv"
OUTPUT_CSV = "clustered_datasets_new/spotify_spectral_with_preview.csv"

df = pd.read_csv(INPUT_CSV)

# Ensure there's an 'preview_url' column
if 'preview_url' not in df.columns:
    df['preview_url'] = None

# =============================
# Fetch preview URLs in batches
# =============================
BATCH_SIZE = 50  # Spotify API limit
track_ids = df['id'].tolist()

for i in tqdm(range(0, len(track_ids), BATCH_SIZE)):
    batch_ids = track_ids[i:i + BATCH_SIZE]
    try:
        tracks = sp.tracks(batch_ids)['tracks']
        for idx, track in enumerate(tracks):
            preview_url = track.get('preview_url')
            df.loc[df['id'] == batch_ids[idx], 'preview_url'] = preview_url
    except Exception as e:
        print(f"Error fetching batch {i}-{i+BATCH_SIZE}: {e}")
        sleep(2)  # wait a bit before retrying

# =============================
# Save updated CSV
# =============================
df.to_csv(OUTPUT_CSV, index=False)
print(f"Saved preview URLs to {OUTPUT_CSV}")
