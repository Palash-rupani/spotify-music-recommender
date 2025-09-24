"use client"

import type { Recommendation } from "@/lib/mock-data"
import { Play, Music, Target, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface RecommendationCardProps {
  recommendation: Recommendation
  onPlay?: (song: Recommendation) => void
  onCompare?: (song: Recommendation) => void
  isComparing?: boolean
}

export function RecommendationCard({
  recommendation,
  onPlay,
  onCompare,
  isComparing = false,
}: RecommendationCardProps) {
  const getTypeIcon = () => {
    switch (recommendation.recommendationType) {
      case "cluster":
        return <Target className="h-3 w-3" />
      case "knn":
        return <Zap className="h-3 w-3" />
      case "hybrid":
        return <Music className="h-3 w-3" />
    }
  }

  const getTypeColor = () => {
    switch (recommendation.recommendationType) {
      case "cluster":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "knn":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      case "hybrid":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20"
    }
  }

  return (
    <div
      className={`group bg-card rounded-lg p-4 border transition-all duration-200 hover:bg-accent ${
        isComparing ? "border-primary bg-accent" : "border-border hover:border-primary/50"
      }`}
    >
      <div className="relative mb-3">
        <div className="aspect-square rounded-md overflow-hidden bg-muted">
          <Image
            src={recommendation.albumArt || "/placeholder.svg"}
            alt={`${recommendation.album} by ${recommendation.artist}`}
            width={200}
            height={200}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        </div>

        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md flex items-center justify-center">
          <Button
            size="sm"
            className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={(e) => {
              e.stopPropagation()
              onPlay?.(recommendation)
            }}
          >
            <Play className="h-5 w-5 ml-0.5" />
          </Button>
        </div>

        {/* Recommendation type badge */}
        <div className="absolute top-2 left-2">
          <Badge className={`text-xs ${getTypeColor()}`}>
            {getTypeIcon()}
            <span className="ml-1 capitalize">{recommendation.recommendationType}</span>
          </Badge>
        </div>

        {/* Cluster ID badge */}
        {recommendation.clusterId && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs">
              C{recommendation.clusterId}
            </Badge>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div>
          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">{recommendation.name}</h3>
          <p className="text-muted-foreground text-xs line-clamp-1">{recommendation.artist}</p>
          <p className="text-muted-foreground text-xs line-clamp-1">{recommendation.album}</p>
        </div>

        {/* Similarity score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Similarity:</span>
            <div className="flex items-center space-x-1">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${recommendation.similarityScore * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-foreground">
                {Math.round(recommendation.similarityScore * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Compare button */}
        <Button
          variant={isComparing ? "default" : "outline"}
          size="sm"
          className="w-full text-xs"
          onClick={() => onCompare?.(recommendation)}
        >
          {isComparing ? "Comparing" : "Compare Features"}
        </Button>
      </div>
    </div>
  )
}
