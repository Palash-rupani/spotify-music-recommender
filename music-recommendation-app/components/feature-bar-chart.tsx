"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { Song } from "@/lib/mock-data"

interface FeatureBarChartProps {
  originalSong: Song
  comparisonSong: Song
}

export function FeatureBarChart({ originalSong, comparisonSong }: FeatureBarChartProps) {
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-foreground font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toFixed(1)}%
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="feature"
            tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} domain={[0, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              color: "hsl(var(--foreground))",
              fontSize: "14px",
              paddingTop: "20px",
            }}
          />
          <Bar dataKey="original" name={originalSong.name} fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
          <Bar dataKey="comparison" name={comparisonSong.name} fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
