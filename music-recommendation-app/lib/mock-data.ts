export interface Song {
  id: string
  name: string
  artist: string
  album: string
  albumArt: string
  previewUrl?: string
  features: {
    danceability: number
    energy: number
    valence: number
    speechiness: number
    instrumentalness: number
    acousticness: number
    liveness: number
    tempo: number
    duration_ms?: number
  }
}

export interface Recommendation extends Song {
  similarityScore: number
  clusterId?: number
  recommendationType: "cluster" | "knn" | "hybrid"
}

// Mock song data - in production this would come from your backend
export const mockSongs: Song[] = [
  {
    id: "1",
    name: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    albumArt: "/the-weeknd-after-hours-album-cover.jpg",
    previewUrl: "https://example.com/preview1.mp3",
    features: {
      danceability: 0.514,
      energy: 0.73,
      valence: 0.334,
      speechiness: 0.0598,
      instrumentalness: 0.00242,
      acousticness: 0.00146,
      liveness: 0.0897,
      tempo: 171.005,
    },
  },
  {
    id: "2",
    name: "Watermelon Sugar",
    artist: "Harry Styles",
    album: "Fine Line",
    albumArt: "/harry-styles-fine-line-album-cover.jpg",
    previewUrl: "https://example.com/preview2.mp3",
    features: {
      danceability: 0.548,
      energy: 0.816,
      valence: 0.557,
      speechiness: 0.0465,
      instrumentalness: 0.000000856,
      acousticness: 0.122,
      liveness: 0.0931,
      tempo: 95.39,
    },
  },
  {
    id: "3",
    name: "Good 4 U",
    artist: "Olivia Rodrigo",
    album: "SOUR",
    albumArt: "/placeholder-psxm4.png",
    previewUrl: "https://example.com/preview3.mp3",
    features: {
      danceability: 0.563,
      energy: 0.664,
      valence: 0.688,
      speechiness: 0.154,
      instrumentalness: 0.0000000613,
      acousticness: 0.105,
      liveness: 0.0849,
      tempo: 178.086,
    },
  },
  {
    id: "4",
    name: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    albumArt: "/dua-lipa-future-nostalgia-album-cover.jpg",
    previewUrl: "https://example.com/preview4.mp3",
    features: {
      danceability: 0.702,
      energy: 0.825,
      valence: 0.915,
      speechiness: 0.0601,
      instrumentalness: 0.00000191,
      acousticness: 0.00883,
      liveness: 0.0674,
      tempo: 103.0,
    },
  },
  {
    id: "5",
    name: "Stay",
    artist: "The Kid LAROI & Justin Bieber",
    album: "F*CK LOVE 3: OVER YOU",
    albumArt: "/placeholder-zmhml.png",
    previewUrl: "https://example.com/preview5.mp3",
    features: {
      danceability: 0.591,
      energy: 0.764,
      valence: 0.478,
      speechiness: 0.037,
      instrumentalness: 0.0000000124,
      acousticness: 0.0119,
      liveness: 0.103,
      tempo: 169.928,
    },
  },
]

// Generate more mock songs to reach ~10,000
export const generateMockSongs = (): Song[] => {
  const artists = [
    "Taylor Swift",
    "Drake",
    "Billie Eilish",
    "Post Malone",
    "Ariana Grande",
    "Ed Sheeran",
    "The Weeknd",
    "Dua Lipa",
    "Harry Styles",
    "Olivia Rodrigo",
    "Bad Bunny",
    "BTS",
    "Adele",
    "Bruno Mars",
    "Rihanna",
    "Kanye West",
    "Kendrick Lamar",
    "Travis Scott",
    "SZA",
    "Lorde",
    "Frank Ocean",
    "Tyler, The Creator",
    "Mac Miller",
    "J. Cole",
    "Childish Gambino",
  ]

  const songTitles = [
    "Midnight Dreams",
    "Electric Nights",
    "Golden Hour",
    "Neon Lights",
    "Summer Vibes",
    "City Rain",
    "Ocean Waves",
    "Mountain High",
    "Desert Storm",
    "Frozen Time",
    "Dancing Shadows",
    "Velvet Sky",
    "Crystal Clear",
    "Thunder Road",
    "Silver Moon",
    "Crimson Dawn",
    "Purple Haze",
    "Emerald Eyes",
    "Diamond Heart",
    "Ruby Red",
  ]

  const albums = [
    "Midnight Collection",
    "Electric Dreams",
    "Golden Memories",
    "Neon Nights",
    "Summer Sessions",
    "City Stories",
    "Ocean Deep",
    "Mountain View",
    "Desert Winds",
    "Frozen Moments",
    "Shadow Dance",
    "Sky High",
    "Crystal Vision",
    "Thunder & Lightning",
    "Moonlight Serenade",
    "Dawn Chorus",
  ]

  const songs: Song[] = [...mockSongs]

  for (let i = 6; i <= 100; i++) {
    const artist = artists[Math.floor(Math.random() * artists.length)]
    const title = songTitles[Math.floor(Math.random() * songTitles.length)]
    const album = albums[Math.floor(Math.random() * albums.length)]

    songs.push({
      id: i.toString(),
      name: `${title} ${i > 50 ? "(Remix)" : ""}`,
      artist,
      album,
      albumArt: `/placeholder.svg?height=300&width=300&query=${artist.toLowerCase().replace(/\s+/g, "-")}-album-cover`,
      previewUrl: `https://example.com/preview${i}.mp3`,
      features: {
        danceability: Math.random(),
        energy: Math.random(),
        valence: Math.random(),
        speechiness: Math.random() * 0.5,
        instrumentalness: Math.random() * 0.3,
        acousticness: Math.random(),
        liveness: Math.random() * 0.5,
        tempo: 60 + Math.random() * 140,
      },
    })
  }

  return songs
}

export const allSongs = generateMockSongs()

// Mock recommendation generator
export const generateRecommendations = (
  selectedSong: Song,
): {
  cluster: Recommendation[]
  knn: Recommendation[]
  hybrid: Recommendation[]
} => {
  const otherSongs = allSongs.filter((song) => song.id !== selectedSong.id)

  // Simple similarity calculation based on features
  const calculateSimilarity = (song1: Song, song2: Song): number => {
    const features1 = Object.values(song1.features)
    const features2 = Object.values(song2.features)

    let similarity = 0
    for (let i = 0; i < features1.length; i++) {
      similarity += Math.abs(features1[i] - features2[i])
    }

    return 1 - similarity / features1.length
  }

  const songsWithSimilarity = otherSongs.map((song) => ({
    ...song,
    similarityScore: calculateSimilarity(selectedSong, song),
  }))

  songsWithSimilarity.sort((a, b) => b.similarityScore - a.similarityScore)

  const cluster: Recommendation[] = songsWithSimilarity.slice(0, 6).map((song, index) => ({
    ...song,
    recommendationType: "cluster" as const,
    clusterId: Math.floor(index / 2) + 1,
  }))

  const knn: Recommendation[] = songsWithSimilarity.slice(6, 12).map((song) => ({
    ...song,
    recommendationType: "knn" as const,
  }))

  const hybrid: Recommendation[] = songsWithSimilarity.slice(12, 18).map((song, index) => ({
    ...song,
    recommendationType: "hybrid" as const,
    clusterId: index % 2 === 0 ? Math.floor(index / 2) + 1 : undefined,
  }))

  return { cluster, knn, hybrid }
}
