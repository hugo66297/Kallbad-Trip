// Map initialization
var map = L.map('map').setView([63.8258, 20.2630], 6);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map); // Contains all markers
let lastBounds = null;

// Finding bathing waters in the current map view
async function loadBathingWatersInView() {
  const bounds = map.getBounds();
  const north = bounds.getNorth();
  const south = bounds.getSouth();
  const east = bounds.getEast();
  const west = bounds.getWest();

  // avoid reloading if bounds haven't changed significantly
  if (lastBounds && lastBounds.contains(bounds)) return;
  lastBounds = bounds.pad(-0.2); // 20% margin

  markersLayer.clearLayers();
  console.log(`Loading visible sites from 27 pages...`);

  const totalPages = 27;
  let allSites = [];

  try {
    // Fetching ALL pages
    const pagePromises = Array.from({ length: totalPages }, (_, i) =>
      fetch(`http://localhost:3000/api/bathing-waters?page=${i + 1}`)
        .then(res => res.json())
        .then(json => json.data || [])
        .catch(err => {
          console.error(`Error at page ${i + 1}:`, err);
          return [];
        })
    );

    // Waiting for all pages
    const allResults = await Promise.all(pagePromises);
    allSites = allResults.flat();

    let counter = 0;

    // Filtering + adding to the map
    allSites.forEach(site => {
      if (!site.coordinates) return;
      const { latitude, longitude } = site.coordinates;

      // Only if the point is in the visible area
      if (latitude < south || latitude > north || longitude < west || longitude > east) return;

      L.marker([latitude, longitude])
        .addTo(markersLayer)
        .bindPopup(`<b>${site.name}</b>`);
      counter++;
    });

    console.log(`${counter} visible sites added to the map (out of ${allSites.length} total).`);
  } catch (err) {
    console.error('Error loading data:', err);
  }
}

// --- Map events ---
map.on('moveend', loadBathingWatersInView);
map.on('zoomend', loadBathingWatersInView);

// --- Initial load ---
loadBathingWatersInView();
