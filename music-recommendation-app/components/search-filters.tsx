"use client"

import { useState } from "react"
import { Search, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface SearchFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedArtists: string[]
  onArtistToggle: (artist: string) => void
  availableArtists: string[]
  onClearFilters: () => void
}

export function SearchFilters({
  searchQuery,
  onSearchChange,
  selectedArtists,
  onArtistToggle,
  availableArtists,
  onClearFilters,
}: SearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search songs, artists, or albums..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-12 h-12 text-base"
        />
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Active filters */}
      {selectedArtists.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {selectedArtists.map((artist) => (
            <Badge
              key={artist}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => onArtistToggle(artist)}
            >
              {artist}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-xs">
            Clear all
          </Button>
        </div>
      )}

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-3">Filter by Artist</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {availableArtists.slice(0, 20).map((artist) => (
              <Button
                key={artist}
                variant={selectedArtists.includes(artist) ? "default" : "outline"}
                size="sm"
                className="justify-start text-xs"
                onClick={() => onArtistToggle(artist)}
              >
                {artist}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
