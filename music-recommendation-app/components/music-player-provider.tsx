"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { MusicPlayer } from "./music-player"
import type { Song, Recommendation } from "@/lib/mock-data"

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
  const musicPlayer = useMusicPlayer()

  return (
    <MusicPlayerContext.Provider value={musicPlayer}>
      {children}
      <MusicPlayer
        currentSong={musicPlayer.currentSong}
        isPlaying={musicPlayer.isPlaying}
        onPlay={musicPlayer.resume}
        onPause={musicPlayer.pause}
        onNext={musicPlayer.hasNext ? musicPlayer.next : undefined}
        onPrevious={musicPlayer.hasPrevious ? musicPlayer.previous : undefined}
        playlist={musicPlayer.playlist}
      />
    </MusicPlayerContext.Provider>
  )
}

export function useMusicPlayerContext() {
  const context = useContext(MusicPlayerContext)
  if (context === undefined) {
    throw new Error("useMusicPlayerContext must be used within a MusicPlayerProvider")
  }
  return context
}
