"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Music, Home, Info } from "lucide-react"

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div className="flex items-center space-x-1">
            <Music className="h-6 w-6 text-primary" />
            <div className="flex space-x-1">
              <div className="w-1 h-4 bg-primary music-bar"></div>
              <div className="w-1 h-4 bg-primary music-bar"></div>
              <div className="w-1 h-4 bg-primary music-bar"></div>
            </div>
          </div>
          <span className="text-xl font-bold text-foreground">SoundScope</span>
        </Link>

        <div className="flex items-center space-x-6">
          <Link
            href="/"
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
              pathname === "/"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <Link
            href="/about"
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
              pathname === "/about"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Info className="h-4 w-4" />
            <span>About</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
