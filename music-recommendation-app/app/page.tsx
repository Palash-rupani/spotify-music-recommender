"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import type { Song } from "@/lib/mock-data"
import { SongCard } from "@/components/song-card"
import { SearchFilters } from "@/components/search-filters"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Search } from "lucide-react"
import { useMusicPlayerContext } from "@/components/music-player-provider"

export default function HomePage() {
  const router = useRouter()
  const { play } = useMusicPlayerContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedArtists, setSelectedArtists] = useState<string[]>([])
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [songs, setSongs] = useState<Song[]>([]) // All loaded records
  const [visibleSongs, setVisibleSongs] = useState<Song[]>([]) // Subset to display
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const recordsPerPage = 100

  const API_URL = 'http://localhost:8000' // Match your FastAPI server URL

  // Fetch all clusters on component mount
  useEffect(() => {
    const fetchClusters = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching from:", `${API_URL}/clusters`);
        const response = await axios.get(`${API_URL}/clusters`);
        console.log("Response Data:", response.data);
        if (!response.data.songs) {
          throw new Error("No 'songs' array in response");
        }
        const fetchedSongs = response.data.songs.map((song: any) => {
          const artists = Array.isArray(song.artists) ? song.artists.join(", ") : song.artists || "Unknown Artist";
          return {
            id: song.id,
            name: song.name || "Unknown Title",
            artist: artists,
            album: song.album_art ? "Has Album Art" : "No Album",
            albumArt: song.album_art || "/placeholder.svg",
            previewUrl: song.preview_url || undefined,
            features: song.features || {
              danceability: 0,
              energy: 0,
              valence: 0,
              speechiness: 0,
              instrumentalness: 0,
              acousticness: 0,
              liveness: 0,
              tempo: 0,
            },
          };
        });
        console.log("Transformed Songs:", fetchedSongs);
        setSongs(fetchedSongs);
        // Set initial visible songs
        setVisibleSongs(fetchedSongs.slice(0, recordsPerPage));
      } catch (err: any) {
        console.error("Fetch Error:", err.message);
        console.error("Full Error Object:", err);
        setError(`Failed to fetch songs: ${err.message}. Check the server. Falling back to mock data.`);
        const { allSongs } = await import("@/lib/mock-data");
        setSongs(allSongs);
        setVisibleSongs(allSongs.slice(0, recordsPerPage));
      } finally {
        setLoading(false);
      }
    };
    fetchClusters();
  }, []);

  // Get unique artists for filter
  const availableArtists = useMemo(() => {
    const artists = Array.from(new Set(songs.map((song) => song.artist)));
    return artists.sort();
  }, [songs]);

  // Filter visible songs based on search and artist filters
  const filteredSongs = useMemo(() => {
    let filtered = visibleSongs;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (song) =>
          song.name.toLowerCase().includes(query) ||
          song.artist.toLowerCase().includes(query) ||
          song.album.toLowerCase().includes(query),
      );
    }

    if (selectedArtists.length > 0) {
      filtered = filtered.filter((song) => selectedArtists.includes(song.artist));
    }

    return filtered;
  }, [searchQuery, selectedArtists, visibleSongs]);

  const handleArtistToggle = (artist: string) => {
    setSelectedArtists((prev) => (prev.includes(artist) ? prev.filter((a) => a !== artist) : [...prev, artist]));
  };

  const handleClearFilters = () => {
    setSelectedArtists([]);
    setSearchQuery("");
  };

  const handleSongSelect = (song: Song) => {
    setSelectedSong(song);
  };

  const handleGetRecommendations = async () => {
    if (selectedSong) {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.post(`${API_URL}/recommend`, {
          track_id: selectedSong.id,
          n: 5,
        });
        const recommendations = response.data.recommendations.map((rec: any) => ({
          ...rec,
          similarityScore: rec.similarity || 0,
          recommendationType: "cluster" as const,
          clusterId: undefined,
        }));
        router.push(
          `/recommendations?songId=${selectedSong.id}&data=${encodeURIComponent(JSON.stringify(recommendations))}`,
        );
      } catch (err) {
        setError("Failed to fetch recommendations. Check the server.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePlaySong = (song: Song) => {
    play(song, filteredSongs);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const start = (nextPage - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    const newVisibleSongs = [
      ...visibleSongs,
      ...songs.slice(start, end),
    ];
    setVisibleSongs(newVisibleSongs);
    setPage(nextPage);
  };

  if (loading) return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;
  if (error) return <div className="container mx-auto px-4 py-8 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 text-balance">
          Discover Your Next
          <span className="text-primary"> Favorite Song</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
          Choose any track from our library and get personalized recommendations powered by advanced machine learning
          algorithms.
        </p>

        {selectedSong && (
          <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-auto mb-8">
            <div className="flex items-center space-x-4">
              <img
                src={selectedSong.albumArt || "/placeholder.svg"}
                alt={selectedSong.album}
                className="w-16 h-16 rounded-md object-cover"
              />
              <div className="text-left">
                <h3 className="font-semibold text-foreground">{selectedSong.name}</h3>
                <p className="text-muted-foreground text-sm">{selectedSong.artist}</p>
                <p className="text-muted-foreground text-xs">{selectedSong.album}</p>
              </div>
            </div>
            <Button onClick={handleGetRecommendations} className="w-full mt-4" size="lg" disabled={loading}>
              <Sparkles className="h-4 w-4 mr-2" />
              {loading ? "Loading..." : "Get Recommendations"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>

      {/* Search and filters */}
      <div className="mb-8">
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedArtists={selectedArtists}
          onArtistToggle={handleArtistToggle}
          availableArtists={availableArtists}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">{filteredSongs.length.toLocaleString()} songs available</p>
        {selectedSong && (
          <Button variant="outline" onClick={() => setSelectedSong(null)}>
            Clear Selection
          </Button>
        )}
      </div>

      {/* Song grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {filteredSongs.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            onSelect={handleSongSelect}
            onPlay={handlePlaySong}
            isSelected={selectedSong?.id === song.id}
          />
        ))}
      </div>

      {/* Load More button */}
      {visibleSongs.length < songs.length && (
        <div className="text-center mt-6">
          <Button onClick={loadMore} disabled={loading}>
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}

      {/* Empty state */}
      {filteredSongs.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No songs found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search terms or clearing the filters.</p>
          <Button variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}