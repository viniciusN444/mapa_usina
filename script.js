let map;
let geojsonLayer;
let allFeatures = [];

function initMap() {
  map = L.map("map"); // sem setView, vamos fazer fitBounds depois

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
  }).addTo(map);

  fetch("pontos.json")
    .then((response) => response.json())
    .then((data) => {
      allFeatures = data.features;

      geojsonLayer = createGeoJsonLayer(allFeatures);
      geojsonLayer.addTo(map);

      // Ajusta o mapa para caber todos os pontos
      map.fitBounds(geojsonLayer.getBounds());

      // Popula resultados iniciais
      updateResultsList(allFeatures.slice(0, 50));
    });
}

function createGeoJsonLayer(features) {
  return L.geoJSON(features, {
    pointToLayer: (feature, latlng) => {
      const color = feature.properties["icon-color"] || "#3388ff"; // cor padrão
      return L.circleMarker(latlng, {
        radius: 8,
        fillColor: color,
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
      }).bindPopup(
        `<strong>${feature.properties.name}</strong><br>${
          feature.properties.description || ""
        }`
      );
    },
  });
}

function filterMap(query) {
  const lowerQuery = query.toLowerCase();
  const filtered = allFeatures.filter((f) =>
    f.properties.name.toLowerCase().includes(lowerQuery)
  );

  if (geojsonLayer) {
    geojsonLayer.clearLayers();
  }

  geojsonLayer = createGeoJsonLayer(filtered);
  geojsonLayer.addTo(map);

  if (filtered.length > 0) {
    map.fitBounds(geojsonLayer.getBounds());
  }

  updateResultsList(filtered.slice(0, 50));
}

function updateResultsList(results) {
  const list = document.getElementById("results");
  list.innerHTML = "";

  results.forEach((feature) => {
    const li = document.createElement("li");
    li.textContent = feature.properties.name;
    li.addEventListener("click", () => {
      const [lng, lat] = feature.geometry.coordinates;
      map.setView([lat, lng], 17);
      L.popup()
        .setLatLng([lat, lng])
        .setContent(
          `<strong>${feature.properties.name}</strong><br>${
            feature.properties.description || ""
          }`
        )
        .openOn(map);
    });
    list.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initMap();

  const searchInput = document.getElementById("search");
  searchInput.addEventListener("input", () => {
    filterMap(searchInput.value);
  });
});
