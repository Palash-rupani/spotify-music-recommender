"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import axios from "axios"
import type { Song } from "@/lib/mock-data"
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function ComparePage() {
  const searchParams = useSearchParams()
  const songId = searchParams.get("songId")
  const compareId = searchParams.get("compareId")

  const [originalSong, setOriginalSong] = useState<Song | null>(null)
  const [comparisonSong, setComparisonSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_URL = "http://localhost:8000"

  useEffect(() => {
    const fetchSongs = async () => {
      if (!songId || !compareId) {
        setError("Missing song IDs for comparison")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const [originalRes, comparisonRes] = await Promise.all([
          axios.get(`${API_URL}/song/${songId}`),
          axios.get(`${API_URL}/song/${compareId}`),
        ])

        const mapSong = (song: any): Song => {
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
              duration_ms: 0,
            },
          }
        }

        setOriginalSong(mapSong(originalRes.data))
        setComparisonSong(mapSong(comparisonRes.data))
      } catch (err: any) {
        setError(`Failed to fetch songs: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchSongs()
  }, [songId, compareId])

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500">
        {error}
      </div>
    )
  }

  if (!originalSong || !comparisonSong) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500">
        Could not load songs for comparison. Please try again.
      </div>
    )
  }

  // =============================
  // Prepare radar chart data
  // =============================
  const features = Object.keys(originalSong.features) as (keyof typeof originalSong.features)[]

  // Compute min/max for tempo & duration (so scaling adapts dynamically)
  const tempos = [
    originalSong.features.tempo as number,
    comparisonSong.features.tempo as number,
  ]
  const durations = [
    originalSong.features.duration_ms as number,
    comparisonSong.features.duration_ms as number,
  ]

  const maxTempo = Math.max(...tempos, 1)
  const maxDuration = Math.max(...durations, 1)

  // Normalization function
  const normalize = (feature: string, value: number) => {
    if (feature === "tempo") {
      return value / maxTempo
    }
    if (feature === "duration_ms") {
      return value / maxDuration
    }
    return value // most Spotify features are already 0–1
  }

  const chartData = features.map((feature) => ({
    feature,
    [originalSong.name]: normalize(feature, originalSong.features[feature] as number),
    [comparisonSong.name]: normalize(feature, comparisonSong.features[feature] as number),
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Song Feature Comparison</h1>

      <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-12">
        {/* Original Song */}
        <div className="text-center">
          <img
            src={originalSong.albumArt}
            alt={originalSong.album}
            className="w-32 h-32 rounded-md mx-auto mb-4 object-cover"
          />
          <h2 className="font-semibold">{originalSong.name}</h2>
          <p className="text-sm text-muted-foreground">{originalSong.artist}</p>
        </div>

        <span className="text-2xl font-bold">vs</span>

        {/* Comparison Song */}
        <div className="text-center">
          <img
            src={comparisonSong.albumArt}
            alt={comparisonSong.album}
            className="w-32 h-32 rounded-md mx-auto mb-4 object-cover"
          />
          <h2 className="font-semibold">{comparisonSong.name}</h2>
          <p className="text-sm text-muted-foreground">{comparisonSong.artist}</p>
        </div>
      </div>

      <div className="w-full h-[500px] mb-8">
        <ResponsiveContainer>
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="feature" />
            <PolarRadiusAxis angle={30} domain={[0, 1]} />
            <Radar
              name={originalSong.name}
              dataKey={originalSong.name}
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
            <Radar
              name={comparisonSong.name}
              dataKey={comparisonSong.name}
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.6}
            />
            <Tooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Note Section */}
      <div className="max-w-2xl mx-auto bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 shadow-sm">
        <p className="font-semibold mb-1">Note:</p>
        <p>
          Our ML model only compares songs using the following features:{" "}
          <span className="font-medium">
            instrumentalness, speechiness, danceability, valence, duration_ms
          </span>
          .
        </p>
      </div>
    </div>
  )
}
