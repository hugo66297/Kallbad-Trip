// --- Initialisation de la carte ---
var map = L.map('map').setView([63.8258, 20.2630], 6);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map); // contiendra les marqueurs actuels
let lastBounds = null;

// --- Fonction pour charger les lieux dans les bounds actuels ---
async function loadBathingWatersInView() {
  const bounds = map.getBounds();
  const north = bounds.getNorth();
  const south = bounds.getSouth();
  const east = bounds.getEast();
  const west = bounds.getWest();

  // On évite de recharger si la vue n’a pas beaucoup changé
  if (lastBounds && lastBounds.contains(bounds)) return;
  lastBounds = bounds.pad(-0.2); // marge de 20%

  // Nettoie les anciens marqueurs
  markersLayer.clearLayers();

  console.log(`🔄 Chargement des lieux visibles...`);

  try {
    const response = await fetch(`http://localhost:3000/api/bathing-waters`);
    const json = await response.json();
    const data = json.data || [];

    let counter = 0;

    data.forEach(site => {
      if (!site.coordinates) return;
      const { latitude, longitude } = site.coordinates;

      // On ne garde que ceux dans la zone visible
      if (latitude < south || latitude > north || longitude < west || longitude > east) return;

      const name = site.name;
      L.marker([latitude, longitude])
        .addTo(markersLayer)
        .bindPopup(`<b>${name}</b>`);
      counter++;
    });

    console.log(`✅ ${counter} lieux visibles ajoutés à la carte.`);
  } catch (err) {
    console.error('Erreur lors du chargement des données:', err);
  }
}

// --- Événements de la carte ---
map.on('moveend', loadBathingWatersInView);
map.on('zoomend', loadBathingWatersInView);

// --- Premier chargement ---
loadBathingWatersInView();

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('showLocation');
  button.addEventListener('click', () => {
    window.location.href = './location.html';
  });
});

