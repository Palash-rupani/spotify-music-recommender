import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { MusicPlayerProvider } from "@/components/music-player-provider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "SoundScope - Music Recommendation Engine",
  description: "Discover new music with AI-powered recommendations based on your favorite tracks",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen bg-background font-sans">
        <MusicPlayerProvider>
          <Navigation />
          <main className="pb-24">{children}</main>
        </MusicPlayerProvider>
      </body>
    </html>
  )
}
