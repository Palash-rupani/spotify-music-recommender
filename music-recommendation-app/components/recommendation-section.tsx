"use client"

import type { Recommendation } from "@/lib/mock-data"
import { RecommendationCard } from "./recommendation-card"
import { Target, Zap, Music } from "lucide-react"

interface RecommendationSectionProps {
  title: string
  description: string
  recommendations: Recommendation[]
  type: "cluster" | "knn" | "hybrid"
  onPlay?: (song: Recommendation) => void
  onCompare?: (song: Recommendation) => void
  comparingSong?: Recommendation | null
}

export function RecommendationSection({
  title,
  description,
  recommendations,
  type,
  onPlay,
  onCompare,
  comparingSong,
}: RecommendationSectionProps) {
  const getIcon = () => {
    switch (type) {
      case "cluster":
        return <Target className="h-5 w-5 text-blue-600" />
      case "knn":
        return <Zap className="h-5 w-5 text-green-600" />
      case "hybrid":
        return <Music className="h-5 w-5 text-purple-600" />
    }
  }

  const getAccentColor = () => {
    switch (type) {
      case "cluster":
        return "border-l-blue-500"
      case "knn":
        return "border-l-green-500"
      case "hybrid":
        return "border-l-purple-500"
    }
  }

  return (
    <section className={`bg-card rounded-lg border-l-4 ${getAccentColor()} p-6 mb-8`}>
      <div className="flex items-center space-x-3 mb-4">
        {getIcon()}
        <div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {recommendations.map((recommendation) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            onPlay={onPlay}
            onCompare={onCompare}
            isComparing={comparingSong?.id === recommendation.id}
          />
        ))}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No recommendations available for this section.</p>
        </div>
      )}
    </section>
  )
}
