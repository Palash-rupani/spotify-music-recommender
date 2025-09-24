"use client"

import { useState, useCallback } from "react"
import type { Song, Recommendation } from "@/lib/mock-data"

export function useMusicPlayer() {
  const [currentSong, setCurrentSong] = useState<Song | Recommendation | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playlist, setPlaylist] = useState<(Song | Recommendation)[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const play = useCallback((song: Song | Recommendation, newPlaylist?: (Song | Recommendation)[]) => {
    if (newPlaylist) {
      setPlaylist(newPlaylist)
      const index = newPlaylist.findIndex((s) => s.id === song.id)
      setCurrentIndex(index >= 0 ? index : 0)
    }

    setCurrentSong(song)
    setIsPlaying(true)
  }, [])

  const pause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const resume = useCallback(() => {
    if (currentSong) {
      setIsPlaying(true)
    }
  }, [currentSong])

  const next = useCallback(() => {
    if (playlist.length > 0 && currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setCurrentSong(playlist[nextIndex])
      setIsPlaying(true)
    }
  }, [playlist, currentIndex])

  const previous = useCallback(() => {
    if (playlist.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
      setCurrentSong(playlist[prevIndex])
      setIsPlaying(true)
    }
  }, [playlist, currentIndex])

  const stop = useCallback(() => {
    setIsPlaying(false)
    setCurrentSong(null)
  }, [])

  return {
    currentSong,
    isPlaying,
    playlist,
    play,
    pause,
    resume,
    next,
    previous,
    stop,
    hasNext: playlist.length > 0 && currentIndex < playlist.length - 1,
    hasPrevious: playlist.length > 0 && currentIndex > 0,
  }
}
