"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { type Song, type Recommendation, allSongs, generateRecommendations } from "@/lib/mock-data"
import { RecommendationSection } from "@/components/recommendation-section"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3, Play, Pause } from "lucide-react"
import Image from "next/image"
import { useMusicPlayerContext } from "@/components/music-player-provider"

function RecommendationsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { play } = useMusicPlayerContext()
  const songId = searchParams.get("songId")

  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [recommendations, setRecommendations] = useState<{
    cluster: Recommendation[]
    knn: Recommendation[]
    hybrid: Recommendation[]
  } | null>(null)
  const [comparingSong, setComparingSong] = useState<Recommendation | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSong, setCurrentSong] = useState<Song | Recommendation | null>(null)

  useEffect(() => {
    if (songId) {
      const song = allSongs.find((s) => s.id === songId)
      if (song) {
        setSelectedSong(song)
        const recs = generateRecommendations(song)
        setRecommendations(recs)
      } else {
        router.push("/")
      }
    } else {
      router.push("/")
    }
  }, [songId, router])

  const handlePlay = (song: Song | Recommendation) => {
    const allRecommendations = recommendations
      ? [...recommendations.cluster, ...recommendations.knn, ...recommendations.hybrid]
      : []
    play(song, [selectedSong!, ...allRecommendations])
  }

  const handleCompare = (song: Recommendation) => {
    setComparingSong(comparingSong?.id === song.id ? null : song)
  }

  if (!selectedSong || !recommendations) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with selected song */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Song Selection
        </Button>

        <div className="bg-card rounded-lg p-6 border border-border">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Image
                src={selectedSong.albumArt || "/placeholder.svg"}
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
                {currentSong?.id === selectedSong.id && isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </Button>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">Recommendations for "{selectedSong.name}"</h1>
              <p className="text-lg text-muted-foreground mb-1">by {selectedSong.artist}</p>
              <p className="text-muted-foreground mb-4">from {selectedSong.album}</p>

              {/* Audio features preview */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Energy:</span>
                  <div className="w-16 h-2 bg-muted rounded-full">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${selectedSong.features.energy * 100}%` }}
                    />
                  </div>
                  <span className="text-foreground font-medium">{Math.round(selectedSong.features.energy * 100)}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Danceability:</span>
                  <div className="w-16 h-2 bg-muted rounded-full">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${selectedSong.features.danceability * 100}%` }}
                    />
                  </div>
                  <span className="text-foreground font-medium">
                    {Math.round(selectedSong.features.danceability * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {comparingSong && (
              <Button
                variant="outline"
                onClick={() => router.push(`/compare?songId=${selectedSong.id}&compareId=${comparingSong.id}`)}
                className="flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>View Feature Comparison</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Recommendation sections */}
      <div className="space-y-8">
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
      </div>

      {/* Instructions */}
      <div className="mt-12 bg-muted/50 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">How to Use</h3>
        <p className="text-muted-foreground">
          Click the play button to preview songs, or select "Compare Features" to analyze audio characteristics between
          your selected song and any recommendation.
        </p>
      </div>
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
