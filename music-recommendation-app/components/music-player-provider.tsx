"use client"

import { createContext, useContext, useRef, useState, ReactNode } from "react"
import type { Song, Recommendation } from "@/lib/mock-data"
import { MusicPlayer } from "./music-player"

interface MusicPlayerContextType {
  currentSong: Song | Recommendation | null
  isPlaying: boolean
  playlist: (Song | Recommendation)[]
  play: (song: Song | Recommendation, playlist?: (Song | Recommendation)[]) => void
  pause: () => void
  resume: () => void
  next: () => void
  previous: () => void
  stop: () => void
  hasNext: boolean
  hasPrevious: boolean
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined)

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentSong, setCurrentSong] = useState<Song | Recommendation | null>(null)
  const [playlist, setPlaylist] = useState<(Song | Recommendation)[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState<number>(0)

  const play = (song: Song | Recommendation, pl?: (Song | Recommendation)[]) => {
    if (!song.previewUrl) return // Don't play songs without preview
    if (audioRef.current) audioRef.current.pause()

    if (pl) {
      setPlaylist(pl)
      const index = pl.findIndex((s) => s.id === song.id)
      setCurrentIndex(index >= 0 ? index : 0)
    }

    audioRef.current = new Audio(song.previewUrl)
    audioRef.current.play()
    setCurrentSong(song)
    setIsPlaying(true)

    audioRef.current.onended = () => {
      if (hasNext) next()
      else setIsPlaying(false)
    }
  }

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const resume = () => {
    if (audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const stop = () => {
    if (audioRef.current) audioRef.current.pause()
    setIsPlaying(false)
    setCurrentSong(null)
  }

  const hasNext = playlist.length > currentIndex + 1
  const hasPrevious = playlist.length > 0 && currentIndex > 0

  const next = () => {
    if (!hasNext) return
    const nextSong = playlist[currentIndex + 1]
    setCurrentIndex(currentIndex + 1)
    play(nextSong, playlist)
  }

  const previous = () => {
    if (!hasPrevious) return
    const prevSong = playlist[currentIndex - 1]
    setCurrentIndex(currentIndex - 1)
    play(prevSong, playlist)
  }

  return (
    <MusicPlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        playlist,
        play,
        pause,
        resume,
        next,
        previous,
        stop,
        hasNext,
        hasPrevious,
      }}
    >
      {children}
      <MusicPlayer
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlay={resume}
        onPause={pause}
        onNext={hasNext ? next : undefined}
        onPrevious={hasPrevious ? previous : undefined}
        playlist={playlist}
      />
    </MusicPlayerContext.Provider>
  )
}

export function useMusicPlayerContext() {
  const context = useContext(MusicPlayerContext)
  if (!context) throw new Error("useMusicPlayerContext must be used within a MusicPlayerProvider")
  return context
}
