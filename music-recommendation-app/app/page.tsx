"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import type { Song } from "@/lib/mock-data"
import { SongCard } from "@/components/song-card"
import { SearchFilters } from "@/components/search-filters"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { useMusicPlayerContext } from "@/components/music-player-provider"

export default function HomePage() {
  const router = useRouter()
  const { play } = useMusicPlayerContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedArtists, setSelectedArtists] = useState<string[]>([])
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)

  const [allSongs, setAllSongs] = useState<Song[]>([])   // full dataset (10k)
  const [songs, setSongs] = useState<Song[]>([])         // currently visible
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const recordsPerPage = 500

  const API_URL = "http://localhost:8000"

  // Fetch songs once
  useEffect(() => {
    const fetchClusters = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await axios.get(`${API_URL}/clusters?random_sample=false`)
        const fetchedSongs: Song[] = response.data.songs.map((song: any) => {
          const artists = Array.isArray(song.artists)
            ? song.artists.join(", ")
            : song.artists || "Unknown Artist"

          return {
            id: String(song.id).trim(),
            name: song.name || "Unknown Title",
            artist: artists,
            album: song.album || "Unknown Album",
            albumArt: song.album_art || "/placeholder.svg",
            previewUrl: song.preview_url || null,
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
          }
        })

        setAllSongs(fetchedSongs) // keep full dataset
        setSongs(fetchedSongs.slice(0, recordsPerPage)) // show first 500
      } catch (err: any) {
        setError(`Failed to fetch songs: ${err.message}. Check the server.`)
      } finally {
        setLoading(false)
      }
    }

    fetchClusters()
  }, [])

  // Load more songs
  const handleLoadMore = () => {
    const nextPage = page + 1
    const start = (nextPage - 1) * recordsPerPage
    const end = start + recordsPerPage
    setSongs((prev) => [...prev, ...allSongs.slice(start, end)])
    setPage(nextPage)
  }

  // Unique artists for filters
  const availableArtists = useMemo(() => {
    const artists = Array.from(new Set(allSongs.map((song) => song.artist)))
    return artists.sort()
  }, [allSongs])

  // Filter songs based on search & selected artists
  const filteredSongs = useMemo(() => {
    let filtered = songs

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (song) =>
          song.name.toLowerCase().includes(query) ||
          song.artist.toLowerCase().includes(query) ||
          song.album.toLowerCase().includes(query),
      )
    }

    if (selectedArtists.length > 0) {
      filtered = filtered.filter((song) => selectedArtists.includes(song.artist))
    }

    return filtered
  }, [searchQuery, selectedArtists, songs])

  const handleArtistToggle = (artist: string) => {
    setSelectedArtists((prev) =>
      prev.includes(artist) ? prev.filter((a) => a !== artist) : [...prev, artist],
    )
  }

  const handleClearFilters = () => {
    setSelectedArtists([])
    setSearchQuery("")
  }

  const handleSongSelect = (song: Song) => {
    setSelectedSong(song)
  }

  const handleGetRecommendations = () => {
    if (selectedSong) {
      router.push(`/recommendations?songId=${selectedSong.id}`)
    }
  }

  const handlePlaySong = (song: Song) => {
    if (song.previewUrl) play(song, filteredSongs)
  }

  if (loading)
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  if (error)
    return <div className="container mx-auto px-4 py-8 text-center text-red-500">{error}</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 text-balance">
          Discover Your Next
          <span className="text-primary"> Favorite Song</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
          Choose any track from our library and get personalized recommendations powered
          by advanced machine learning algorithms.
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
            <Button onClick={handleGetRecommendations} className="w-full mt-4" size="lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Get Recommendations
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>

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

      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">
          Showing {songs.length.toLocaleString()} of {allSongs.length.toLocaleString()} songs
        </p>
        {selectedSong && (
          <Button variant="outline" onClick={() => setSelectedSong(null)}>
            Clear Selection
          </Button>
        )}
      </div>

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
      {songs.length < allSongs.length && (
        <div className="flex justify-center mt-8">
          <Button onClick={handleLoadMore} variant="secondary">
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}
