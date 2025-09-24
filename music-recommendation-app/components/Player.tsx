'use client'; // Marks this component as client-side

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Define types based on your API responses
interface Song {
  id: string;
  name: string | null;
  artists: string[] | null;
  preview_url: string | null;
  album_art: string | null;
}

interface PlayerProps {}

const Player: React.FC<PlayerProps> = () => {
  const [clusters, setClusters] = useState<Song[]>([]);
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const API_URL = 'http://localhost:8000'; // Match your FastAPI server URL

  // Fetch clusters (dummy songs) on component mount
  useEffect(() => {
    const fetchClusters = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_URL}/clusters`);
        setClusters(response.data.songs || []);
      } catch (err) {
        setError('Failed to fetch clusters. Check the server.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClusters();
  }, []);

  // Fetch recommendations when a song is clicked
  const handleRecommendation = async (trackId: string) => {
    setLoading(true);
    setError(null);
    setSelectedTrackId(trackId);
    try {
      const response = await axios.post(`${API_URL}/recommend`, {
        track_id: trackId,
        n: 5, // Adjust number of recommendations as needed
      });
      setRecommendations(response.data.recommendations);
    } catch (err) {
      setError('Failed to fetch recommendations. Check the track ID or server.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Music Recommendation App</h1>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Display Clusters (Dummy Songs) */}
      <div>
        <h2>Dummy Songs:</h2>
        <ul>
          {clusters.map((song, index) => (
            <li key={index} style={{ margin: '10px 0', cursor: 'pointer' }} onClick={() => handleRecommendation(song.id)}>
              <strong>{song.name}</strong> by {song.artists?.join(', ')}
              {song.preview_url && (
                <audio controls style={{ marginLeft: '10px' }}>
                  <source src={song.preview_url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              )}
              {song.album_art && (
                <img
                  src={song.album_art}
                  alt={`${song.name} album art`}
                  style={{ width: '50px', height: '50px', marginLeft: '10px' }}
                />
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Display Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h2>Recommendations for {clusters.find(song => song.id === selectedTrackId)?.name || 'Selected Song'}:</h2>
          <ul>
            {recommendations.map((rec, index) => (
              <li key={index} style={{ margin: '10px 0' }}>
                <strong>{rec.name}</strong> by {rec.artists?.join(', ')}
                {rec.preview_url && (
                  <audio controls style={{ marginLeft: '10px' }}>
                    <source src={rec.preview_url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                )}
                {rec.album_art && (
                  <img
                    src={rec.album_art}
                    alt={`${rec.name} album art`}
                    style={{ width: '50px', height: '50px', marginLeft: '10px' }}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Player;