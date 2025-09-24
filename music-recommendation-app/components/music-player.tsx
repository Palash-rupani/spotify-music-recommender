"use client"

import { useState, useEffect, useRef } from "react"
import type { Song, Recommendation } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle } from "lucide-react"
import Image from "next/image"

interface MusicPlayerProps {
  currentSong: Song | Recommendation | null
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onNext?: () => void
  onPrevious?: () => void
  playlist?: (Song | Recommendation)[]
}

export function MusicPlayer({
  currentSong,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  playlist = [],
}: MusicPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(30) // 30-second preview
  const [volume, setVolume] = useState(75)
  const [isMuted, setIsMuted] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [isRepeating, setIsRepeating] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Simulate audio playback with timer
  useEffect(() => {
    if (isPlaying && currentSong) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            onPause()
            return 0
          }
          return prev + 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, currentSong, duration, onPause])

  // Reset time when song changes
  useEffect(() => {
    setCurrentTime(0)
  }, [currentSong])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    setIsMuted(false)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled)
  }

  const toggleRepeat = () => {
    setIsRepeating(!isRepeating)
  }

  if (!currentSong) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border backdrop-blur-md bg-card/95 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center space-x-4">
          {/* Song info */}
          <div className="flex items-center space-x-3 min-w-0 flex-1 md:flex-none md:w-64">
            <Image
              src={currentSong.albumArt || "/placeholder.svg"}
              alt={currentSong.album}
              width={48}
              height={48}
              className="rounded-md object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-foreground text-sm truncate">{currentSong.name}</h4>
              <p className="text-muted-foreground text-xs truncate">{currentSong.artist}</p>
            </div>
          </div>

          {/* Player controls */}
          <div className="flex-1 max-w-2xl">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleShuffle}
                className={`h-8 w-8 ${isShuffled ? "text-primary" : "text-muted-foreground"}`}
              >
                <Shuffle className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onPrevious}
                disabled={!onPrevious}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                onClick={isPlaying ? onPause : onPlay}
                className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onNext}
                disabled={!onNext}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleRepeat}
                className={`h-8 w-8 ${isRepeating ? "text-primary" : "text-muted-foreground"}`}
              >
                <Repeat className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress bar */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground w-10 text-right">{formatTime(currentTime)}</span>
              <Slider value={[currentTime]} max={duration} step={1} onValueChange={handleSeek} className="flex-1" />
              <span className="text-xs text-muted-foreground w-10">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume controls */}
          <div className="hidden md:flex items-center space-x-2 w-32">
            <Button variant="ghost" size="sm" onClick={toggleMute} className="h-8 w-8 text-muted-foreground">
              {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="flex-1"
            />
          </div>

          {/* Playlist info */}
          {playlist.length > 0 && (
            <div className="hidden lg:block text-xs text-muted-foreground">{playlist.length} songs in queue</div>
          )}
        </div>
      </div>
    </div>
  )
}
