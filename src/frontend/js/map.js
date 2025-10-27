// Map initialization
var map = L.map('map').setView([63.8258, 20.2630], 6);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

// markersLayer and lastBounds are declared below (debounced loader)

// Finding bathing waters in the current map view
  let markersLayer = L.layerGroup().addTo(map); // Contains all markers
  let lastBounds = null;
  let loadTimer = null;
  const DEBOUNCE_MS = 300; // wait before calling server after interactions
  const MIN_ZOOM_TO_LOAD = 5; // don't load markers when zoomed out too far

  // Finding bathing waters in the current map view (debounced)
  async function fetchBathingWatersForBounds(north, south, east, west) {
    try {
      // Ask server to filter by bounds; set a large limit so server returns all visible in one call
      const params = new URLSearchParams();
      params.append('bounds', JSON.stringify({ north, south, east, west }));
      params.append('limit', '1000');
      params.append('page', '1');

      const url = `http://localhost:3000/api/bathing-waters?${params.toString()}`;
      console.log('Fetching visible sites from:', url);
      const res = await fetch(url);
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.error('Error fetching bathing waters for bounds:', err);
      return [];
    }
  }

  async function loadBathingWatersInView() {
    // Debounce rapid map events
    if (loadTimer) clearTimeout(loadTimer);

    loadTimer = setTimeout(async () => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();

      if (zoom < MIN_ZOOM_TO_LOAD) {
        // Optionally clear markers when too zoomed out to avoid clutter
        markersLayer.clearLayers();
        console.log('Zoom level too low, skipping load.');
        return;
      }

      // avoid reloading if bounds haven't changed significantly
      if (lastBounds && lastBounds.contains(bounds)) return;
      lastBounds = bounds.pad(-0.2); // 20% margin

      markersLayer.clearLayers();

      const north = bounds.getNorth();
      const south = bounds.getSouth();
      const east = bounds.getEast();
      const west = bounds.getWest();

      // Fetch only the bathing waters inside current view using server-side filtering
      const allSites = await fetchBathingWatersForBounds(north, south, east, west);

      let counter = 0;
      allSites.forEach(site => {
        if (!site.coordinates) return;
        const { latitude, longitude } = site.coordinates;
        L.marker([latitude, longitude])
          .addTo(markersLayer)
          .bindPopup(`<div><b>${site.name}</b><br/><a href="./location.html?id=${encodeURIComponent(site.id)}">View details</a></div>`);
        counter++;
      });

      console.log(`${counter} visible sites added to the map (out of ${allSites.length} returned by server).`);
    }, DEBOUNCE_MS);
  }

// --- Map events ---
map.on('moveend', loadBathingWatersInView);
map.on('zoomend', loadBathingWatersInView);

// --- Initial load ---
loadBathingWatersInView();
