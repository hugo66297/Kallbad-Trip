// Création et configuration de la carte
var map = L.map('map').setView([63.8258, 20.2630], 5);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

// Fonction asynchrone pour récupérer toutes les pages
const totalPages = 27;
const promises = Array.from({ length: totalPages }, (_, i) =>
  fetch(`http://localhost:3000/api/bathing-waters?page=${i + 1}`).then(r => r.json())
);

Promise.all(promises)
  .then(results => {
    const allData = results.flatMap(r => r.data);
    allData.forEach(site => {
      const { latitude, longitude } = site.coordinates;
      L.marker([latitude, longitude]).addTo(map);
    });
  });
