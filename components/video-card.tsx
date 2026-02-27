"use client"

import Image from "next/image"
import { Star, Heart, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

export interface VideoData {
  id: number
  title: string
  description: string
  thumbnail: string
  duration: string
  host: string
  accent: string
  topics: string[]
  difficulty: number
  date: string
  completed: boolean
  favorited: boolean
}

export function VideoCard({ video }: { video: VideoData }) {
  const [isFavorited, setIsFavorited] = useState(video.favorited)

  const formattedDate = (() => {
    const d = new Date(video.date)
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  })()

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
      {/* Favorite button - visible on hover or if favorited */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsFavorited(!isFavorited)
        }}
        className={`absolute top-3 right-3 z-20 flex size-8 items-center justify-center rounded-full shadow-sm transition-all ${
          isFavorited
            ? "bg-card/90 opacity-100"
            : "bg-card/90 opacity-0 group-hover:opacity-100"
        }`}
        aria-label={isFavorited ? "取消收藏" : "收藏"}
      >
        <Heart
          className={`size-4 transition-colors ${
            isFavorited
              ? "fill-red-500 text-red-500"
              : "text-muted-foreground hover:text-red-400"
          }`}
        />
      </button>

      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Bottom overlay gradient */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Host name + accent badge — bottom left of thumbnail */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <span className="rounded-md bg-foreground/70 px-2 py-0.5 text-xs font-medium text-card backdrop-blur-sm">
            @{video.host}
          </span>
          <span className="rounded-md bg-primary/90 px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground backdrop-blur-sm">
            {video.accent}
          </span>
        </div>

        {/* Duration badge — bottom right of thumbnail */}
        <span className="absolute bottom-2 right-2 rounded-md bg-foreground/70 px-2 py-0.5 text-xs font-medium text-card backdrop-blur-sm">
          {video.duration}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2.5 p-4">
        <h3 className="line-clamp-1 text-sm font-bold text-foreground">
          {video.title}
        </h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {video.description}
        </p>

        {/* Topic tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {video.topics.map((topic) => (
            <Badge
              key={topic}
              variant="outline"
              className="border-success/30 bg-success/10 text-success text-[10px] px-2 py-0.5 font-medium"
            >
              {topic}
            </Badge>
          ))}
        </div>

        {/* Footer: difficulty stars + date */}
        <div className="flex items-center justify-between pt-1">
          {/* 5 stars for difficulty */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-4 ${
                  i < video.difficulty
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>

          {/* Date */}
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>
      </div>
    </div>
  )
}
