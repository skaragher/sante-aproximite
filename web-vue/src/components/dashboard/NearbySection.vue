<template>
  <section class="panel">
    <div class="toolbar">
      <label>Rayon (km)</label>
      <input v-model.number="store.radiusKm" type="number" min="1" max="700" />
      <input
        v-model="store.nearbySearch"
        type="text"
        placeholder="Rechercher: nom, type, service, plateau technique"
      />
      <button class="secondary" @click="handleRefreshPosition">Utiliser ma position actuelle</button>
      <button @click="store.fetchNearby()">Rechercher</button>
    </div>

    <p v-if="store.info" class="muted">{{ store.info }}</p>
    <p v-if="store.error" class="error">{{ store.error }}</p>

    <div ref="mapEl" class="map"></div>

    <div class="card-list">
      <p v-if="store.filteredNearbyCenters.length === 0" class="muted">
        Aucun centre a afficher pour le moment.
      </p>
      <article
        v-for="center in store.filteredNearbyCenters"
        :key="center._id"
        class="card"
        :class="{ selected: store.selectedCenter?._id === center._id }"
      >
        <h3>{{ center.name }} - {{ center.distanceKm }} km</h3>
        <p><strong>Code:</strong> {{ center.establishmentCode || "-" }}</p>
        <p>{{ center.address }}</p>
        <p><strong>Niveau:</strong> {{ store.formatLevel(center.level) }}</p>
        <p><strong>Type:</strong> {{ store.formatType(center.establishmentType) }}</p>
        <p><strong>Plateau:</strong> {{ center.technicalPlatform }}</p>
        <p>
          <strong>Services:</strong>
          {{ center.services.map((s) => s.name).join(", ") || "Aucun" }}
        </p>
        <div class="actions">
          <button @click="focusCenter(center)">Voir sur carte</button>
          <button class="secondary" @click="navigateTo(center)">Naviguer</button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import L from "leaflet";
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useDashboardStore } from "../../stores/dashboard";

const store = useDashboardStore();

const mapEl = ref(null);
let map = null;
let markersLayer = null;
let routeLine = null;

// ─── Map helpers ─────────────────────────────────────────────────────────────

function getCenterLatLng(center) {
  const lat = Number(center?.location?.coordinates?.[1]);
  const lon = Number(center?.location?.coordinates?.[0]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return [lat, lon];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getCenterMarkerColor(center) {
  if (center?.establishmentType === "PUBLIQUE") return "#1d4ed8";
  if (center?.establishmentType === "PRIVE") return "#16a34a";
  if (center?.establishmentType === "CONFESSIONNEL") return "#d97706";
  return "#475569";
}

function createPinIcon({ color, symbol, size = 18 }) {
  const pinSize = size + 8;
  return L.divIcon({
    className: "custom-map-pin",
    html: `<div style="
      width:${pinSize}px;height:${pinSize}px;border-radius:999px;background:${color};
      border:2px solid #ffffff;box-shadow:0 3px 10px rgba(15,23,42,0.35);
      display:grid;place-items:center;color:#ffffff;font-size:${size - 6}px;font-weight:700;
    ">${symbol}</div>`,
    iconSize: [pinSize, pinSize],
    iconAnchor: [pinSize / 2, pinSize / 2],
  });
}

function buildCenterPopup(center) {
  const services = Array.isArray(center?.services)
    ? center.services.map((s) => s?.name).filter(Boolean).join(", ")
    : "";
  return `
    <div style="min-width:240px">
      <strong>${escapeHtml(center?.name || "Centre de sante")}</strong><br/>
      <small>${escapeHtml(center?.address || "-")}</small><br/>
      <small><b>Distance:</b> ${escapeHtml(center?.distanceKm ?? "-")} km</small><br/>
      <small><b>Niveau:</b> ${escapeHtml(store.formatLevel(center?.level))}</small><br/>
      <small><b>Type:</b> ${escapeHtml(store.formatType(center?.establishmentType))}</small><br/>
      <small><b>Plateau:</b> ${escapeHtml(center?.technicalPlatform || "-")}</small><br/>
      <small><b>Services:</b> ${escapeHtml(services || "Aucun")}</small>
    </div>
  `;
}

function ensureMap() {
  if (map || !mapEl.value) return;
  map = L.map(mapEl.value).setView([6.5244, 3.3792], 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
}

function redrawMap() {
  if (!map || !markersLayer) return;
  markersLayer.clearLayers();
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }

  const coords = store.coords;

  if (coords) {
    L.marker([coords.lat, coords.lon], {
      icon: createPinIcon({ color: "#0ea5e9", symbol: "📍", size: 20 }),
    })
      .addTo(markersLayer)
      .bindTooltip("Vous etes ici", { direction: "top" })
      .bindPopup("<strong>Votre position actuelle</strong>");
  }

  const validCenters = store.filteredNearbyCenters
    .map((center) => ({ center, latlng: getCenterLatLng(center) }))
    .filter((item) => Array.isArray(item.latlng));

  validCenters.forEach(({ center, latlng }) => {
    const marker = L.marker(latlng, {
      icon: createPinIcon({ color: getCenterMarkerColor(center), symbol: "🏥", size: 18 }),
    }).addTo(markersLayer);

    marker.bindTooltip(`${center.name || "Centre"} - ${center.distanceKm ?? "?"} km`, {
      direction: "top",
      sticky: true,
      opacity: 0.95,
    });
    marker.bindPopup(buildCenterPopup(center), { maxWidth: 320 });
    marker.on("mouseover", () => marker.openTooltip());
    marker.on("click", () => { marker.openPopup(); focusCenter(center); });
  });

  if (store.selectedCenter && coords) {
    const selectedLatLng = getCenterLatLng(store.selectedCenter);
    if (!selectedLatLng) return;
    routeLine = L.polyline(
      [[coords.lat, coords.lon], selectedLatLng],
      { color: "#0b7285", weight: 4 }
    ).addTo(map);
    return;
  }

  if (validCenters.length > 0 && !store.selectedCenter) {
    const points = [
      ...(coords ? [[coords.lat, coords.lon]] : []),
      ...validCenters.map((item) => item.latlng),
    ];
    if (points.length > 1) map.fitBounds(points, { padding: [40, 40] });
    else if (points.length === 1) map.setView(points[0], 12);
    return;
  }

  if (validCenters.length === 0 && coords) {
    map.setView([coords.lat, coords.lon], 12);
  }
}

function focusCenter(center) {
  store.selectedCenter = center;
  if (!map) return;
  const latlng = getCenterLatLng(center);
  if (!latlng) { store.error = "Coordonnees du centre invalides"; return; }
  if (store.coords) {
    map.fitBounds(
      L.latLngBounds([[store.coords.lat, store.coords.lon], latlng]),
      { padding: [50, 50] }
    );
  } else {
    map.setView(latlng, 14);
  }
  redrawMap();
}

function navigateTo(center) {
  const latlng = getCenterLatLng(center);
  if (!latlng) { store.error = "Coordonnees du centre invalides"; return; }
  const [lat, lon] = latlng;
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, "_blank");
}

async function handleRefreshPosition() {
  store.error = "";
  store.info = "";
  const newCoords = await store.refreshCurrentPosition();
  if (newCoords && map) {
    ensureMap();
    map.setView([newCoords.lat, newCoords.lon], 12);
  }
  redrawMap();
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

onMounted(async () => {
  if (!store.nearbyBootstrapped && !store.isChef) {
    store.nearbyBootstrapped = true;
    await nextTick();
    ensureMap();
    await handleRefreshPosition();
  }
  await nextTick();
  ensureMap();
  if (map) {
    map.invalidateSize();
    if (store.coords) map.setView([store.coords.lat, store.coords.lon], 12);
  }
  redrawMap();
});

onBeforeUnmount(() => {
  if (map) { map.remove(); map = null; }
  markersLayer = null;
  routeLine = null;
});

watch(() => store.nearbyCenters, redrawMap);
watch(() => store.nearbySearch, redrawMap);
watch(() => store.allCenters, redrawMap);
</script>
