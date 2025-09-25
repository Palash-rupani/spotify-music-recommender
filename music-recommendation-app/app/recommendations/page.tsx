"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import axios from "axios"
import { type Song, type Recommendation } from "@/lib/mock-data"
import { RecommendationSection } from "@/components/recommendation-section"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play } from "lucide-react"
import Image from "next/image"
import { useMusicPlayerContext } from "@/components/music-player-provider"

function RecommendationsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { play } = useMusicPlayerContext()
  const songId = searchParams.get("songId")?.trim()

  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [recommendations, setRecommendations] = useState<{
    cluster: Recommendation[]
    knn: Recommendation[]
    hybrid: Recommendation[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comparingSong, setComparingSong] = useState<Recommendation | null>(null)

  useEffect(() => {
    async function fetchSongAndRecommendations() {
      setLoading(true)
      setError(null)
      if (!songId) {
        router.push("/")
        return
      }

      try {
        // Fetch all songs to ensure selected song exists
        const songResponse = await axios.get("http://localhost:8000/clusters?random_sample=false")
        const songs = songResponse.data.songs
        const song = songs.find((s: any) => String(s.id).trim() === songId)

        if (!song) {
          setError("Selected song not found in backend data.")
          setLoading(false)
          return
        }

        setSelectedSong({
          id: String(song.id).trim(),
          name: song.name || "Unknown Title",
          artist: Array.isArray(song.artists) ? song.artists.join(", ") : song.artists || "Unknown Artist",
          album: song.album || "Unknown Album",
          albumArt: song.album_art && song.album_art !== "" ? song.album_art : "/placeholder.svg",
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
        })

        // Fetch recommendations
        const [clusterRes, knnRes, hybridRes] = await Promise.all([
          axios.post("http://localhost:8000/recommend", { track_id: songId, n: 10, mode: "cluster" }),
          axios.post("http://localhost:8000/recommend", { track_id: songId, n: 10, mode: "knn" }),
          axios.post("http://localhost:8000/recommend", { track_id: songId, n: 10, mode: "cluster_knn" }),
        ])

        const mapRecommendations = (arr: any[]) =>
          arr.map((r) => ({
            ...r,
            albumArt: r.album_art && r.album_art !== "" ? r.album_art : "/placeholder.svg",
            previewUrl: r.preview_url || undefined,
          }))

        setRecommendations({
          cluster: mapRecommendations(clusterRes.data.recommendations || []),
          knn: mapRecommendations(knnRes.data.recommendations || []),
          hybrid: mapRecommendations(hybridRes.data.recommendations || []),
        })
      } catch (err: any) {
        setError(`Failed to load song or recommendations: ${err.message}`)
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchSongAndRecommendations()
  }, [songId, router])

  const handlePlay = (song: Song | Recommendation) => {
    if (!selectedSong) return
    const allRecommendations = recommendations
      ? [...recommendations.cluster, ...recommendations.knn, ...recommendations.hybrid]
      : []
    play(song, [selectedSong, ...allRecommendations])
  }

  const handleCompare = (song: Recommendation) => {
    setComparingSong(comparingSong?.id === song.id ? null : song)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading recommendations...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-600">
        <p>{error}</p>
        <Button onClick={() => router.push("/")}>Back to Song Selection</Button>
      </div>
    )
  }

  if (!selectedSong) return null

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Song Selection
        </Button>

        <div className="bg-card rounded-lg p-6 border border-border">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Image
                src={selectedSong.albumArt}
                alt={selectedSong.album}
                width={120}
                height={120}
                className="rounded-lg object-cover"
              />
              <Button
                size="sm"
                className="absolute bottom-2 right-2 rounded-full w-10 h-10"
                onClick={() => handlePlay(selectedSong)}
              >
                <Play className="h-4 w-4 ml-0.5" />
              </Button>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Recommendations for "{selectedSong.name}"
              </h1>
              <p className="text-lg text-muted-foreground mb-1">by {selectedSong.artist}</p>
              <p className="text-muted-foreground mb-4">from {selectedSong.album}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation Sections */}
      {recommendations && (
        <>
          <RecommendationSection
            title="Cluster-Based Recommendations"
            description="Songs grouped by similar characteristics and genres"
            recommendations={recommendations.cluster}
            type="cluster"
            onPlay={handlePlay}
            onCompare={handleCompare}
            comparingSong={comparingSong}
          />
          <RecommendationSection
            title="KNN-Based Recommendations"
            description="Songs with the most similar audio features"
            recommendations={recommendations.knn}
            type="knn"
            onPlay={handlePlay}
            onCompare={handleCompare}
            comparingSong={comparingSong}
          />
          <RecommendationSection
            title="Hybrid Recommendations"
            description="Combining cluster and KNN approaches for balanced results"
            recommendations={recommendations.hybrid}
            type="hybrid"
            onPlay={handlePlay}
            onCompare={handleCompare}
            comparingSong={comparingSong}
          />
        </>
      )}
    </div>
  )
}

export default function RecommendationsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading recommendations...</p>
            </div>
          </div>
        </div>
      }
    >
      <RecommendationsContent />
    </Suspense>
  )
}
