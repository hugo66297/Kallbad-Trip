// Map creation and configuration
var map = L.map('map').setView([63.8258, 20.2630], 5);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

// Fetching data from the backend API
fetch('http://localhost:3000/api/bathing-waters')
  .then(response => {
    if (!response.ok) {
      throw new Error('Data fetch error: ' + response.status);
    }
    return response.json();
  })
  .then(json => {
    if (json.success && Array.isArray(json.data)) {
      json.data.forEach(site => {
        const { latitude, longitude } = site.coordinates;
        const name = site.name;

        // Adding markers to the map
        L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup(`<b>${name}</b>`);
      });
    } else {
      console.error('Unexpected data format:', json);
    }
  })
  .catch(error => console.error('Fetch error:', error));
