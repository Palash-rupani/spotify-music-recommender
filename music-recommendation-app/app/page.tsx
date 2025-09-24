"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { type Song, allSongs } from "@/lib/mock-data"
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

  // Get unique artists for filter
  const availableArtists = useMemo(() => {
    const artists = Array.from(new Set(allSongs.map((song) => song.artist)))
    return artists.sort()
  }, [])

  // Filter songs based on search and artist filters
  const filteredSongs = useMemo(() => {
    let filtered = allSongs

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (song) =>
          song.name.toLowerCase().includes(query) ||
          song.artist.toLowerCase().includes(query) ||
          song.album.toLowerCase().includes(query),
      )
    }

    // Apply artist filter
    if (selectedArtists.length > 0) {
      filtered = filtered.filter((song) => selectedArtists.includes(song.artist))
    }

    return filtered
  }, [searchQuery, selectedArtists])

  const handleArtistToggle = (artist: string) => {
    setSelectedArtists((prev) => (prev.includes(artist) ? prev.filter((a) => a !== artist) : [...prev, artist]))
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
    play(song, filteredSongs)
  }

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
            <Button onClick={handleGetRecommendations} className="w-full mt-4" size="lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Get Recommendations
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
  )
}
