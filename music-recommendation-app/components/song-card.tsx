"use client"

import type { Song } from "@/lib/mock-data"
import { Play, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface SongCardProps {
  song: Song
  onSelect: (song: Song) => void
  onPlay?: (song: Song) => void
  isSelected?: boolean
}

export function SongCard({ song, onSelect, onPlay, isSelected = false }: SongCardProps) {
  return (
    <div
      className={`group bg-card rounded-lg p-4 border transition-all duration-200 hover:bg-accent cursor-pointer ${
        isSelected ? "border-primary bg-accent" : "border-border hover:border-primary/50"
      }`}
      onClick={() => onSelect(song)}
    >
      <div className="relative mb-3">
        <div className="aspect-square rounded-md overflow-hidden bg-muted">
          <Image
            src={song.albumArt || "/placeholder.svg"}
            alt={`${song.album} by ${song.artist}`}
            width={200}
            height={200}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        </div>

        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md flex items-center justify-center">
          <Button
            size="sm"
            className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={(e) => {
              e.stopPropagation()
              onPlay?.(song)
            }}
          >
            <Play className="h-5 w-5 ml-0.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">{song.name}</h3>
        <p className="text-muted-foreground text-xs line-clamp-1">{song.artist}</p>
        <p className="text-muted-foreground text-xs line-clamp-1">{song.album}</p>
      </div>

      {/* Audio features preview */}
      <div className="mt-3 flex items-center space-x-1">
        <Music className="h-3 w-3 text-muted-foreground" />
        <div className="flex space-x-1">
          <div className="w-1 h-2 bg-primary rounded-full" style={{ opacity: song.features.energy }} />
          <div className="w-1 h-2 bg-primary rounded-full" style={{ opacity: song.features.danceability }} />
          <div className="w-1 h-2 bg-primary rounded-full" style={{ opacity: song.features.valence }} />
        </div>
      </div>
    </div>
  )
}
