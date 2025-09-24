"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { type Song, allSongs } from "@/lib/mock-data"
import { FeatureRadarChart } from "@/components/feature-radar-chart"
import { FeatureBarChart } from "@/components/feature-bar-chart"
import { FeatureComparisonTable } from "@/components/feature-comparison-table"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, BarChart3, Radar, Table } from "lucide-react"
import Image from "next/image"

function CompareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const songId = searchParams.get("songId")
  const compareId = searchParams.get("compareId")

  const [originalSong, setOriginalSong] = useState<Song | null>(null)
  const [comparisonSong, setComparisonSong] = useState<Song | null>(null)

  useEffect(() => {
    if (songId && compareId) {
      const original = allSongs.find((s) => s.id === songId)
      const comparison = allSongs.find((s) => s.id === compareId)

      if (original && comparison) {
        setOriginalSong(original)
        setComparisonSong(comparison)
      } else {
        router.push("/")
      }
    } else {
      router.push("/")
    }
  }, [songId, compareId, router])

  if (!originalSong || !comparisonSong) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading comparison...</p>
          </div>
        </div>
      </div>
    )
  }

  const calculateOverallSimilarity = () => {
    const features1 = Object.values(originalSong.features)
    const features2 = Object.values(comparisonSong.features)

    let similarity = 0
    for (let i = 0; i < features1.length; i++) {
      similarity += Math.abs(features1[i] - features2[i])
    }

    return Math.round((1 - similarity / features1.length) * 100)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Recommendations
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Feature Comparison</h1>
          <p className="text-muted-foreground">Analyzing audio characteristics between your selected songs</p>
        </div>

        {/* Song comparison header */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Original song */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="text-center">
              <Image
                src={originalSong.albumArt || "/placeholder.svg"}
                alt={originalSong.album}
                width={120}
                height={120}
                className="rounded-lg object-cover mx-auto mb-4"
              />
              <h3 className="font-bold text-foreground mb-1">{originalSong.name}</h3>
              <p className="text-muted-foreground text-sm mb-1">{originalSong.artist}</p>
              <p className="text-muted-foreground text-xs">{originalSong.album}</p>
            </div>
          </div>

          {/* Similarity score */}
          <div className="bg-card rounded-lg p-6 border border-border flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{calculateOverallSimilarity()}%</div>
              <p className="text-muted-foreground text-sm">Overall Similarity</p>
              <div className="w-24 h-2 bg-muted rounded-full mx-auto mt-3">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${calculateOverallSimilarity()}%` }}
                />
              </div>
            </div>
          </div>

          {/* Comparison song */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="text-center">
              <Image
                src={comparisonSong.albumArt || "/placeholder.svg"}
                alt={comparisonSong.album}
                width={120}
                height={120}
                className="rounded-lg object-cover mx-auto mb-4"
              />
              <h3 className="font-bold text-foreground mb-1">{comparisonSong.name}</h3>
              <p className="text-muted-foreground text-sm mb-1">{comparisonSong.artist}</p>
              <p className="text-muted-foreground text-xs">{comparisonSong.album}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison charts */}
      <Tabs defaultValue="radar" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="radar" className="flex items-center space-x-2">
            <Radar className="h-4 w-4" />
            <span>Radar Chart</span>
          </TabsTrigger>
          <TabsTrigger value="bar" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Bar Chart</span>
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center space-x-2">
            <Table className="h-4 w-4" />
            <span>Detailed Table</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="radar" className="space-y-4">
          <div className="bg-card rounded-lg p-6 border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Audio Feature Radar Comparison</h2>
            <p className="text-muted-foreground text-sm mb-6">
              This radar chart shows how each song scores across different audio features. Overlapping areas indicate
              similar characteristics.
            </p>
            <FeatureRadarChart originalSong={originalSong} comparisonSong={comparisonSong} />
          </div>
        </TabsContent>

        <TabsContent value="bar" className="space-y-4">
          <div className="bg-card rounded-lg p-6 border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Audio Feature Bar Comparison</h2>
            <p className="text-muted-foreground text-sm mb-6">
              This bar chart provides a side-by-side comparison of audio features, making it easy to spot differences
              and similarities.
            </p>
            <FeatureBarChart originalSong={originalSong} comparisonSong={comparisonSong} />
          </div>
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Detailed Feature Analysis</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Detailed breakdown of each audio feature with exact values and similarity ratings.
            </p>
            <FeatureComparisonTable originalSong={originalSong} comparisonSong={comparisonSong} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Feature explanations */}
      <div className="mt-12 bg-muted/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Understanding Audio Features</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-2">
              <strong className="text-foreground">Danceability:</strong> How suitable a track is for dancing based on
              tempo, rhythm stability, beat strength, and overall regularity.
            </p>
            <p className="text-muted-foreground mb-2">
              <strong className="text-foreground">Energy:</strong> Perceptual measure of intensity and power. Energetic
              tracks feel fast, loud, and noisy.
            </p>
            <p className="text-muted-foreground mb-2">
              <strong className="text-foreground">Valence:</strong> Musical positiveness conveyed by a track. High
              valence sounds positive, while low valence sounds negative.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Speechiness:</strong> Detects the presence of spoken words in a track.
              Higher values indicate more speech-like recordings.
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-2">
              <strong className="text-foreground">Instrumentalness:</strong> Predicts whether a track contains no
              vocals. Higher values represent greater likelihood of instrumental content.
            </p>
            <p className="text-muted-foreground mb-2">
              <strong className="text-foreground">Acousticness:</strong> Confidence measure of whether the track is
              acoustic. Higher values indicate acoustic music.
            </p>
            <p className="text-muted-foreground mb-2">
              <strong className="text-foreground">Liveness:</strong> Detects the presence of an audience in the
              recording. Higher values indicate live performance.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Tempo:</strong> Overall estimated tempo of a track in beats per minute
              (BPM).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading comparison...</p>
            </div>
          </div>
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  )
}
