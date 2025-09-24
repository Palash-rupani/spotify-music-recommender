"use client"

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from "recharts"
import type { Song } from "@/lib/mock-data"

interface FeatureRadarChartProps {
  originalSong: Song
  comparisonSong: Song
}

export function FeatureRadarChart({ originalSong, comparisonSong }: FeatureRadarChartProps) {
  const data = [
    {
      feature: "Danceability",
      original: originalSong.features.danceability * 100,
      comparison: comparisonSong.features.danceability * 100,
    },
    {
      feature: "Energy",
      original: originalSong.features.energy * 100,
      comparison: comparisonSong.features.energy * 100,
    },
    {
      feature: "Valence",
      original: originalSong.features.valence * 100,
      comparison: comparisonSong.features.valence * 100,
    },
    {
      feature: "Speechiness",
      original: originalSong.features.speechiness * 100,
      comparison: comparisonSong.features.speechiness * 100,
    },
    {
      feature: "Instrumentalness",
      original: originalSong.features.instrumentalness * 100,
      comparison: comparisonSong.features.instrumentalness * 100,
    },
    {
      feature: "Acousticness",
      original: originalSong.features.acousticness * 100,
      comparison: comparisonSong.features.acousticness * 100,
    },
    {
      feature: "Liveness",
      original: originalSong.features.liveness * 100,
      comparison: comparisonSong.features.liveness * 100,
    },
  ]

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="feature" tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
          <Radar
            name={originalSong.name}
            dataKey="original"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.1}
            strokeWidth={2}
          />
          <Radar
            name={comparisonSong.name}
            dataKey="comparison"
            stroke="hsl(var(--chart-2))"
            fill="hsl(var(--chart-2))"
            fillOpacity={0.1}
            strokeWidth={2}
          />
          <Legend
            wrapperStyle={{
              color: "hsl(var(--foreground))",
              fontSize: "14px",
              paddingTop: "20px",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
