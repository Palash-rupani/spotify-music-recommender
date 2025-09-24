"use client"

import type { Song } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"

interface FeatureComparisonTableProps {
  originalSong: Song
  comparisonSong: Song
}

export function FeatureComparisonTable({ originalSong, comparisonSong }: FeatureComparisonTableProps) {
  const features = [
    {
      key: "danceability",
      label: "Danceability",
      description: "How suitable a track is for dancing",
    },
    {
      key: "energy",
      label: "Energy",
      description: "Perceptual measure of intensity and power",
    },
    {
      key: "valence",
      label: "Valence",
      description: "Musical positiveness conveyed by a track",
    },
    {
      key: "speechiness",
      label: "Speechiness",
      description: "Presence of spoken words in a track",
    },
    {
      key: "instrumentalness",
      label: "Instrumentalness",
      description: "Predicts whether a track contains no vocals",
    },
    {
      key: "acousticness",
      label: "Acousticness",
      description: "Confidence measure of whether the track is acoustic",
    },
    {
      key: "liveness",
      label: "Liveness",
      description: "Detects the presence of an audience in the recording",
    },
    {
      key: "tempo",
      label: "Tempo",
      description: "Overall estimated tempo of a track in BPM",
      isSpecial: true,
    },
  ]

  const getDifferenceBadge = (original: number, comparison: number, isSpecial = false) => {
    const diff = isSpecial ? Math.abs(original - comparison) : Math.abs(original - comparison) * 100

    if (diff < (isSpecial ? 10 : 5)) {
      return (
        <Badge variant="secondary" className="text-xs">
          Very Similar
        </Badge>
      )
    } else if (diff < (isSpecial ? 25 : 15)) {
      return (
        <Badge variant="outline" className="text-xs">
          Similar
        </Badge>
      )
    } else if (diff < (isSpecial ? 50 : 30)) {
      return <Badge className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Different</Badge>
    } else {
      return <Badge className="text-xs bg-red-500/10 text-red-600 border-red-500/20">Very Different</Badge>
    }
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-semibold text-foreground">Feature</th>
              <th className="text-center p-4 font-semibold text-foreground">{originalSong.name}</th>
              <th className="text-center p-4 font-semibold text-foreground">{comparisonSong.name}</th>
              <th className="text-center p-4 font-semibold text-foreground">Similarity</th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => {
              const originalValue = originalSong.features[feature.key as keyof typeof originalSong.features]
              const comparisonValue = comparisonSong.features[feature.key as keyof typeof comparisonSong.features]

              return (
                <tr key={feature.key} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-foreground">{feature.label}</div>
                      <div className="text-xs text-muted-foreground">{feature.description}</div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="font-mono text-foreground">
                      {feature.isSpecial ? `${originalValue.toFixed(0)} BPM` : `${(originalValue * 100).toFixed(1)}%`}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="font-mono text-foreground">
                      {feature.isSpecial
                        ? `${comparisonValue.toFixed(0)} BPM`
                        : `${(comparisonValue * 100).toFixed(1)}%`}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {getDifferenceBadge(originalValue, comparisonValue, feature.isSpecial)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
