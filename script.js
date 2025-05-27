let map;
let geojsonLayer;
let allFeatures = [];
let userLocation = null;
let routingControl = null;

function initMap() {
  map = L.map("map");

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
  }).addTo(map);

  // Obter localização do usuário
  map.locate({ setView: true, maxZoom: 15 });

  map.on("locationfound", (e) => {
    userLocation = e.latlng;
    L.circleMarker(userLocation, {
      radius: 10,
      fillColor: "blue",
      color: "#000",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.7,
    })
      .addTo(map)
      .bindPopup("Você está aqui.")
      .openPopup();
  });

  fetch("pontos.json")
    .then((response) => response.json())
    .then((data) => {
      allFeatures = data.features;

      geojsonLayer = createGeoJsonLayer(allFeatures);
      geojsonLayer.addTo(map);

      map.fitBounds(geojsonLayer.getBounds());
      updateResultsList(allFeatures.slice(0, 50));
    });
}

function createGeoJsonLayer(features) {
  return L.geoJSON(features, {
    pointToLayer: (feature, latlng) => {
      const color = feature.properties["icon-color"] || "#3388ff";
      const marker = L.circleMarker(latlng, {
        radius: 8,
        fillColor: color,
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
      });

      marker.bindPopup(
        `<strong>${feature.properties.name}</strong><br>${
          feature.properties.description || ""
        }<br><button onclick="createRoute([${latlng.lat}, ${latlng.lng}])">Traçar rota</button>`
      );

      return marker;
    },
  });
}

function createRoute(destination) {
  if (!userLocation) {
    alert("Localização atual não encontrada ainda.");
    return;
  }

  if (routingControl) {
    map.removeControl(routingControl);
  }

  routingControl = L.Routing.control({
    waypoints: [userLocation, L.latLng(destination)],
    lineOptions: {
      styles: [{ color: "blue", weight: 5 }],
    },
    createMarker: () => null, // Remove marcadores padrão
    addWaypoints: false,
    draggableWaypoints: false,
    routeWhileDragging: false,
  }).addTo(map);
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
          }<br><button onclick="createRoute([${lat}, ${lng}])">Traçar rota</button>`
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
