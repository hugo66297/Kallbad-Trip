const map = L.map('map').setView([59.8586, 17.6389], 12); // exemple : Umeå

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker([59.8586, 17.6389]).addTo(map).bindPopup('Umeå !').openPopup();