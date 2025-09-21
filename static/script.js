// Init icons
lucide.createIcons();

let numRecommendations = 10;
const grid = document.getElementById("recommendationsGrid");

// Render recommendations dynamically
function renderRecommendations(recs) {
  grid.innerHTML = "";
  recs.slice(0, numRecommendations).forEach(song => {
    const card = document.createElement("div");
    card.className =
      "group overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-2";
    card.innerHTML = `
      <div class="relative">
        <img src="${song.album_art}" alt="${song.name} album cover" class="w-full aspect-square object-cover rounded-t-2xl"/>
        ${
          song.preview_url
            ? `<audio id="audio-${song.id}" src="${song.preview_url}"></audio>
              <button onclick="document.getElementById('audio-${song.id}').play()"
                class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
                <i data-lucide="play" class="h-6 w-6"></i>
              </button>`
            : `<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-sm bg-gray-700 px-3 py-1 rounded">No Preview</div>`
        }
      </div>
      <div class="p-4">
        <h3 class="font-bold text-lg text-slate-800 mb-1">${song.name}</h3>
        <p class="text-slate-600 text-sm">${song.artist}</p>
      </div>
    `;
    grid.appendChild(card);
  });
  lucide.createIcons();
}

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
  });
});

// Search form submit → call Flask API
document.getElementById("searchForm").addEventListener("submit", e => {
  e.preventDefault();
  const query = document.getElementById("searchInput").value;
  const recType = document.getElementById("recType").value;

  fetch("/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ track_id: query, recType })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
      } else {
        renderRecommendations(data.recommendations);
      }
    })
    .catch(err => {
      console.error("Error fetching recommendations:", err);
    });
});
