// Init icons
lucide.createIcons();

const mockRecommendations = [
  { id: 1, title: "Blinding Lights", artist: "The Weeknd", albumArt: "https://i.scdn.co/image/ab67616d0000b2730b42e0b6c7c3c65e4f84e2c6" },
  { id: 2, title: "Watermelon Sugar", artist: "Harry Styles", albumArt: "https://i.scdn.co/image/ab67616d0000b273d3e2c6cf6c95cf76e8c1c7a9" },
  { id: 3, title: "Good 4 U", artist: "Olivia Rodrigo", albumArt: "https://i.scdn.co/image/ab67616d0000b27364fbb01e2f0a09a1c4f7ed36" },
  { id: 4, title: "Levitating", artist: "Dua Lipa", albumArt: "https://i.scdn.co/image/ab67616d0000b273b15a19a0b0d4e5f9a7a5e4d4" },
  { id: 5, title: "Stay", artist: "The Kid LAROI, Justin Bieber", albumArt: "https://i.scdn.co/image/ab67616d0000b273ee08e5ff0e3810055d3dbeec" },
  { id: 6, title: "Heat Waves", artist: "Glass Animals", albumArt: "https://i.scdn.co/image/ab67616d0000b273a0b205b5b61896f8aee4d5c7" },
];

let numRecommendations = 10;
const grid = document.getElementById("recommendationsGrid");

function renderRecommendations() {
  grid.innerHTML = "";
  mockRecommendations.slice(0, numRecommendations).forEach(song => {
    const card = document.createElement("div");
    card.className =
      "group overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-2";
    card.innerHTML = `
      <div class="relative">
        <img src="${song.albumArt}" alt="${song.title} album cover" class="w-full aspect-square object-cover rounded-t-2xl"/>
        <button class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
          <i data-lucide="play" class="h-6 w-6"></i>
        </button>
      </div>
      <div class="p-4">
        <h3 class="font-bold text-lg text-slate-800 mb-1">${song.title}</h3>
        <p class="text-slate-600 text-sm">${song.artist}</p>
      </div>
    `;
    grid.appendChild(card);
  });
  lucide.createIcons();
}

renderRecommendations();

// Filter buttons
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    numRecommendations = parseInt(btn.dataset.num);
    document.querySelectorAll(".filter-btn").forEach(b => {
      b.className =
        "filter-btn rounded-full px-6 py-2 bg-white/80 border border-slate-200";
    });
    btn.className =
      "filter-btn rounded-full px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg";
    renderRecommendations();
  });
});

// Search form
document.getElementById("searchForm").addEventListener("submit", e => {
  e.preventDefault();
  const query = document.getElementById("searchInput").value;
  console.log("Searching for:", query);
  // TODO: call Flask API with fetch
});
