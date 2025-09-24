export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-8 text-center">About SoundScope</h1>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-card rounded-lg p-6 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              SoundScope uses advanced machine learning algorithms to help you discover new music that matches your
              taste. Our recommendation engine analyzes audio features like danceability, energy, and valence to find
              songs you'll love.
            </p>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground leading-relaxed">
              Choose any song from our database, and we'll generate three types of recommendations: cluster-based
              (similar genres), KNN-based (audio similarity), and hybrid (combining both approaches) to give you the
              best music discovery experience.
            </p>
          </div>
        </div>

        <div className="bg-card rounded-lg p-8 border border-border">
          <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">Recommendation Types</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold">C</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Cluster-Based</h3>
              <p className="text-muted-foreground text-sm">Groups songs by similar characteristics and genres</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold">K</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">KNN-Based</h3>
              <p className="text-muted-foreground text-sm">Finds songs with the most similar audio features</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold">H</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Hybrid</h3>
              <p className="text-muted-foreground text-sm">Combines both approaches for balanced recommendations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
