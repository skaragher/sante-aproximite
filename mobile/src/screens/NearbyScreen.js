import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { apiFetch } from "../api/client";
import {
  getCenterCatalogMeta,
  loadCenterCatalog,
  META_KEY_INITIAL_LOAD_NOTIFIED,
  setCenterCatalogMeta,
  syncCenterCatalog,
  updateCachedCenter,
} from "../storage/centerCatalog";
import { useAuth } from "../context/AuthContext";
import { C, R, S, shared } from "../theme";

const MAX_MAP_CENTER_MARKERS = 200;
const MAX_MAP_BASE_MARKERS = 120;

function hasValidCoordinates(center) {
  const lat = Number(center?.location?.coordinates?.[1]);
  const lon = Number(center?.location?.coordinates?.[0]);
  return Number.isFinite(lat) && Number.isFinite(lon);
}

function hasValidBaseCoordinates(base) {
  const lat = Number(base?.location?.coordinates?.[1]);
  const lon = Number(base?.location?.coordinates?.[0]);
  return Number.isFinite(lat) && Number.isFinite(lon);
}

function getBaseServiceLabel(serviceType) {
  const value = String(serviceType || "").toUpperCase();
  if (value === "SAMU") return "SAMU";
  if (value === "SAPEUR_POMPIER") return "Sapeurs-Pompiers";
  if (value === "POLICE") return "Poste de police";
  if (value === "GENDARMERIE") return "Brigade de gendarmerie";
  if (value === "PROTECTION_CIVILE") return "Protection Civile";
  return serviceType || "Base";
}

function getBaseColor(serviceType) {
  const value = String(serviceType || "").toUpperCase();
  if (value === "SAMU") return C.amber;
  if (value === "SAPEUR_POMPIER") return C.red;
  if (value === "POLICE") return C.primary;
  if (value === "GENDARMERIE") return C.teal;
  if (value === "PROTECTION_CIVILE") return C.purple;
  return C.textMuted;
}

function parseRadiusKm(rawValue) {
  const normalized = String(rawValue ?? "").trim().replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  if (parsed <= 0) return null;
  if (parsed > 700) return null;
  return parsed;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const p = Math.PI / 180;
  const dLat = (lat2 - lat1) * p;
  const dLon = (lon2 - lon1) * p;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * p) * Math.cos(lat2 * p) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

export function NearbyScreen() {
  const { token } = useAuth();
  const mapRef = useRef(null);
  const [coords, setCoords] = useState(null);
  const [radiusKm, setRadiusKm] = useState("5");
  const [searchQuery, setSearchQuery] = useState("");
  const [centers, setCenters] = useState([]);
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const [emergencyBases, setEmergencyBases] = useState([]);
  const [baseServiceFilter, setBaseServiceFilter] = useState("ALL");
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [feedbackSavingCenterId, setFeedbackSavingCenterId] = useState("");
  const [catalogStatus, setCatalogStatus] = useState({
    ready: false,
    lastSyncAt: null,
    centerCount: 0,
  });
  const [catalogNotice, setCatalogNotice] = useState(null);
  const noticeTimeoutRef = useRef(null);

  function showCatalogNotice(message, { tone = "success", durationMs = 30000 } = {}) {
    if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
    setCatalogNotice({ message, tone });
    if (durationMs > 0) {
      noticeTimeoutRef.current = setTimeout(() => {
        setCatalogNotice(null);
        noticeTimeoutRef.current = null;
      }, durationMs);
    }
  }

  function applyCatalogToState(catalog, position, radiusValue) {
    const parsedRadius = parseRadiusKm(radiusValue);
    const sourceCenters = Array.isArray(catalog?.centers) ? catalog.centers : [];
    setCatalogStatus({
      ready: true,
      lastSyncAt: catalog?.lastSyncAt || null,
      centerCount: sourceCenters.length,
    });
    if (!position || parsedRadius === null) return;
    const safeData = sourceCenters
      .filter(hasValidCoordinates)
      .map((center) => {
        const lat = Number(center.location.coordinates[1]);
        const lon = Number(center.location.coordinates[0]);
        const distanceKm = haversineKm(position.lat, position.lon, lat, lon);
        return { ...center, distanceKm: Number(distanceKm.toFixed(2)) };
      })
      .filter((center) => center.distanceKm <= parsedRadius)
      .sort((a, b) => a.distanceKm - b.distanceKm);
    setCenters(safeData);
    if (safeData.length === 0) setSelectedCenterId("");
  }

  async function loadPosition() {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== "granted") throw new Error("Permission de localisation refusee");
    const current = await Location.getCurrentPositionAsync({});
    return { lat: current.coords.latitude, lon: current.coords.longitude };
  }

  async function fetchNearby(position = coords, { silent = false } = {}) {
    if (!position) return;
    if (!silent) setLoading(true);
    if (!silent) setError("");
    try {
      const parsedRadius = parseRadiusKm(radiusKm);
      if (parsedRadius === null) throw new Error("Rayon invalide. Entrez une valeur entre 1 et 700 km.");
      const localCatalog = await loadCenterCatalog(token);
      const shouldForceFullSync = parsedRadius >= 500;
      if (localCatalog.centers.length === 0) {
        const syncResult = await syncCenterCatalog(token, { forceFull: true });
        const alreadyNotified = await getCenterCatalogMeta(META_KEY_INITIAL_LOAD_NOTIFIED);
        if (!alreadyNotified && syncResult.centerCount > 0) {
          showCatalogNotice("Les donnees locales sont pretes pour une utilisation hors ligne.");
          await setCenterCatalogMeta(META_KEY_INITIAL_LOAD_NOTIFIED, new Date().toISOString());
        }
      } else {
        applyCatalogToState(localCatalog, position, radiusKm);
        syncCenterCatalog(token, { forceFull: shouldForceFullSync })
          .then((syncResult) => {
            applyCatalogToState(syncResult, position, radiusKm);
          })
          .catch(() => {});
      }
      const refreshedCatalog = await loadCenterCatalog(token);
      applyCatalogToState(refreshedCatalog, position, radiusKm);
      try {
        const bases = await apiFetch(
          `/emergency-reports/bases/nearby?latitude=${position.lat}&longitude=${position.lon}&radiusKm=${parsedRadius}`,
          { token }
        );
        setEmergencyBases(Array.isArray(bases) ? bases : []);
      } catch {
        setEmergencyBases([]);
      }
    } catch (err) {
      const currentCatalog = await loadCenterCatalog(token).catch(() => ({ centers: [] }));
      const hasLocalCenters = Array.isArray(currentCatalog?.centers) && currentCatalog.centers.length > 0;
      if (!hasLocalCenters) {
        setError(err.message);
        setCatalogStatus((prev) => ({ ...prev, ready: false }));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [catalog, position] = await Promise.all([
          loadCenterCatalog(token),
          loadPosition(),
        ]);
        if (!mounted) return;
        setCoords(position);
        if (Array.isArray(catalog.centers) && catalog.centers.length > 0) {
          applyCatalogToState(catalog, position, radiusKm);
          fetchNearby(position, { silent: true }).catch(() => {});
          return;
        }
        await fetchNearby(position);
      } catch (err) {
        if (mounted) setError(err.message);
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!coords) return undefined;
    const interval = setInterval(() => { fetchNearby(coords, { silent: true }).catch(() => {}); }, 30000);
    return () => clearInterval(interval);
  }, [coords, radiusKm, token]);

  useEffect(() => {
    if (!coords) return undefined;
    const parsedRadius = parseRadiusKm(radiusKm);
    if (parsedRadius === null) return undefined;
    const timer = setTimeout(() => { fetchNearby(coords).catch(() => {}); }, 500);
    return () => clearTimeout(timer);
  }, [coords, radiusKm]);

  function selectCenter(center) {
    setSelectedCenterId(center._id);
    setIsMapFullscreen(true);
    const centerPoint = {
      latitude: center.location.coordinates[1],
      longitude: center.location.coordinates[0]
    };
    if (coords && mapRef.current) {
      mapRef.current.fitToCoordinates(
        [{ latitude: coords.lat, longitude: coords.lon }, centerPoint],
        { edgePadding: { top: 90, right: 90, bottom: 90, left: 90 }, animated: true }
      );
      return;
    }
    if (mapRef.current) {
      mapRef.current.animateToRegion({ ...centerPoint, latitudeDelta: 0.06, longitudeDelta: 0.06 }, 700);
    }
  }

  const normalizedCenters = useMemo(
    () => centers.filter(hasValidCoordinates).map((center) => ({
      ...center,
      services: Array.isArray(center.services) ? center.services : []
    })),
    [centers]
  );

  const selectedCenter = normalizedCenters.find((center) => center._id === selectedCenterId) || null;

  useEffect(() => {
    setFeedbackDrafts((prev) => {
      const next = { ...prev };
      for (const center of normalizedCenters) {
        if (!next[center._id]) {
          next[center._id] = { rating: center.myRating ?? 0, satisfaction: center.mySatisfaction || "" };
        }
      }
      return next;
    });
  }, [normalizedCenters]);

  async function startNavigation(center) {
    const lat = center.location.coordinates[1];
    const lon = center.location.coordinates[0];
    const googleWebUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    const googleNavUrl = `google.navigation:q=${lat},${lon}`;
    const appleMapsUrl = `http://maps.apple.com/?daddr=${lat},${lon}`;
    const targetUrl = Platform.OS === "ios" ? appleMapsUrl : googleNavUrl;
    try {
      const supported = await Linking.canOpenURL(targetUrl);
      await Linking.openURL(supported ? targetUrl : googleWebUrl);
    } catch {
      setError("Impossible d'ouvrir la navigation");
    }
  }

  const mapRegion = useMemo(() => {
    if (!coords) return { latitude: 6.5244, longitude: 3.3792, latitudeDelta: 0.25, longitudeDelta: 0.25 };
    return { latitude: coords.lat, longitude: coords.lon, latitudeDelta: 0.13, longitudeDelta: 0.13 };
  }, [coords]);

  const filteredCenters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return normalizedCenters;
    return normalizedCenters.filter((center) => {
      const hasNameMatch = String(center.name || "").toLowerCase().includes(q);
      const hasServiceMatch = Array.isArray(center.services)
        ? center.services.some((service) => String(service.name || "").toLowerCase().includes(q))
        : false;
      return hasNameMatch || hasServiceMatch;
    });
  }, [normalizedCenters, searchQuery]);

  const safeEmergencyBases = useMemo(() => emergencyBases.filter(hasValidBaseCoordinates), [emergencyBases]);
  const filteredEmergencyBases = useMemo(() => {
    if (baseServiceFilter === "ALL") return safeEmergencyBases;
    return safeEmergencyBases.filter(
      (base) => String(base?.serviceType || "").toUpperCase() === baseServiceFilter
    );
  }, [safeEmergencyBases, baseServiceFilter]);

  function updateCenterDraft(centerId, patch) {
    setFeedbackDrafts((prev) => ({
      ...prev,
      [centerId]: { rating: prev[centerId]?.rating ?? 0, satisfaction: prev[centerId]?.satisfaction || "", ...patch }
    }));
  }

  async function submitCenterFeedback(centerId) {
    const draft = feedbackDrafts[centerId] || { rating: 0, satisfaction: "" };
    const rating = Number(draft.rating) || 0;
    const satisfaction = draft.satisfaction || "";
    if (!rating && !satisfaction) { setError("Choisissez une note ou un niveau de satisfaction"); return; }
    setFeedbackSavingCenterId(centerId);
    setError("");
    try {
      await apiFetch(`/centers/${centerId}/rating`, {
        token,
        method: "POST",
        body: { rating: rating || null, satisfaction: satisfaction || null }
      });
      await updateCachedCenter(token, centerId, {
        myRating: rating || null,
        mySatisfaction: satisfaction || null,
      });
      syncCenterCatalog(token).catch(() => {});
      if (coords) await fetchNearby(coords, { silent: true });
      else await fetchNearby(undefined, { silent: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setFeedbackSavingCenterId("");
    }
  }

  useEffect(() => {
    if (!mapRef.current || !coords || selectedCenter || isMapFullscreen) return;
    if (filteredCenters.length === 0) {
      mapRef.current.animateToRegion({ latitude: coords.lat, longitude: coords.lon, latitudeDelta: 0.12, longitudeDelta: 0.12 }, 500);
      return;
    }
    const points = [
      { latitude: coords.lat, longitude: coords.lon },
      ...filteredCenters.map((center) => ({
        latitude: center.location.coordinates[1],
        longitude: center.location.coordinates[0]
      }))
    ];
    mapRef.current.fitToCoordinates(points, { edgePadding: { top: 80, right: 80, bottom: 80, left: 80 }, animated: true });
  }, [coords, filteredCenters, selectedCenter, isMapFullscreen]);

  return (
    <View style={styles.container}>
      {!isMapFullscreen ? (
        <View style={styles.toolbar}>
          <View style={styles.radiusWrap}>
            <Text style={styles.radiusLabel}>Rayon (km)</Text>
            <TextInput
              style={styles.radiusInput}
              keyboardType="numeric"
              value={radiusKm}
              onChangeText={setRadiusKm}
            />
          </View>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher par nom ou service..."
            placeholderTextColor={C.textLight}
          />
          <Pressable style={styles.searchBtn} onPress={() => fetchNearby()}>
            <Text style={styles.searchBtnText}>{loading ? "..." : "OK"}</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={styles.errorBar}>{error}</Text> : null}
      {catalogNotice ? (
        <View
          style={[
            styles.noticeBar,
            catalogNotice.tone === "success" ? styles.noticeBarSuccess : styles.noticeBarInfo,
          ]}
        >
          <Text
            style={[
              styles.noticeBarText,
              catalogNotice.tone === "success" ? styles.noticeBarTextSuccess : styles.noticeBarTextInfo,
            ]}
          >
            {catalogNotice.message}
          </Text>
        </View>
      ) : null}
      {!isMapFullscreen ? (
        <View style={styles.catalogInfoBox}>
          <Text style={styles.catalogInfoTitle}>
            {catalogStatus.ready ? "Success" : "Base locale en attente"}
          </Text>
          <Text style={styles.catalogInfoText}>
            Derniere sync : {catalogStatus.lastSyncAt ? new Date(catalogStatus.lastSyncAt).toLocaleString() : "-"}
          </Text>
          <Text style={styles.catalogInfoText}>
            Nombre de centres locaux : {catalogStatus.centerCount}
          </Text>
        </View>
      ) : null}

      <View style={isMapFullscreen ? styles.mapFullscreenWrap : undefined}>
        <MapView
          ref={mapRef}
          style={isMapFullscreen ? styles.mapFullscreen : styles.map}
          initialRegion={mapRegion}
        >
          {coords ? (
            <Marker coordinate={{ latitude: coords.lat, longitude: coords.lon }} title="Vous" pinColor={C.primary} />
          ) : null}
          {filteredCenters.slice(0, MAX_MAP_CENTER_MARKERS).map((center) => (
            <Marker
              key={center._id}
              coordinate={{ latitude: center.location.coordinates[1], longitude: center.location.coordinates[0] }}
              title={`${center.name} (${center.distanceKm} km)`}
              description={center.technicalPlatform}
              pinColor={center._id === selectedCenterId ? C.primary : undefined}
              onPress={() => selectCenter(center)}
            />
          ))}
          {filteredEmergencyBases.slice(0, MAX_MAP_BASE_MARKERS).map((base) => (
            <Marker
              key={`base_${base.id}`}
              coordinate={{ latitude: Number(base.location.coordinates[1]), longitude: Number(base.location.coordinates[0]) }}
              title={`${base.name} (${getBaseServiceLabel(base.serviceType)})`}
              description={base.address}
              pinColor={getBaseColor(base.serviceType)}
            />
          ))}
          {coords && selectedCenter ? (
            <Polyline
              coordinates={[
                { latitude: coords.lat, longitude: coords.lon },
                { latitude: selectedCenter.location.coordinates[1], longitude: selectedCenter.location.coordinates[0] }
              ]}
              strokeWidth={4}
              strokeColor={C.primary}
            />
          ) : null}
        </MapView>
        {isMapFullscreen ? (
          <Pressable style={styles.closeMapBtn} onPress={() => { setIsMapFullscreen(false); setSelectedCenterId(""); }}>
            <Text style={styles.closeMapBtnText}>✕ Fermer la carte</Text>
          </Pressable>
        ) : null}
      </View>

      {!isMapFullscreen ? (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filteredCenters.length === 0 && !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Aucun centre trouve dans ce rayon.</Text>
            </View>
          ) : null}

          {filteredCenters.map((center) => (
            <Pressable
              key={center._id}
              style={[styles.centerCard, center._id === selectedCenterId && styles.centerCardSelected]}
              onPress={() => selectCenter(center)}
            >
              <View style={styles.centerCardHeader}>
                <View style={styles.centerCardTitleWrap}>
                  <Text style={styles.centerName}>{center.name}</Text>
                  <Text style={styles.centerAddress}>{center.address}</Text>
                </View>
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceBadgeText}>{center.distanceKm} km</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.centerMeta}>
                <Text style={styles.metaLabel}>Plateau technique</Text>
                <Text style={styles.metaValue}>{center.technicalPlatform || "-"}</Text>
              </View>
              
              {/* Section Services améliorée */}
              {center.services && center.services.length > 0 ? (
                <View style={styles.servicesSection}>
                  <Text style={styles.metaLabel}>Services disponibles</Text>
                  <View style={styles.servicesList}>
                    {center.services.map((service, index) => (
                      <View key={`${center._id}_service_${index}`} style={styles.serviceTag}>
                        <Text style={styles.serviceTagText}>
                          {service.name}
                        </Text>
                        {service.description ? (
                          <Text style={styles.serviceDescription}>
                            {service.description}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.centerMeta}>
                  <Text style={styles.metaLabel}>Services</Text>
                  <Text style={styles.metaValue}>Aucun service disponible</Text>
                </View>
              )}

              <View style={styles.ratingBar}>
                <View style={styles.ratingInfo}>
                  <Text style={styles.ratingScore}>
                    {center.ratingAverage == null ? "—" : `${center.ratingAverage}/5`}
                  </Text>
                  <Text style={styles.ratingCount}>({center.ratingCount || 0} avis)</Text>
                  {center.satisfactionRate != null ? (
                    <Text style={styles.satisfactionRate}>{center.satisfactionRate}% satisfaits</Text>
                  ) : null}
                </View>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((value) => {
                    const active = (feedbackDrafts[center._id]?.rating || 0) >= value;
                    return (
                      <Pressable
                        key={`${center._id}_s_${value}`}
                        style={[styles.starBtn, active && styles.starBtnActive]}
                        onPress={() => updateCenterDraft(center._id, { rating: value })}
                      >
                        <Text style={[styles.starText, active && styles.starTextActive]}>★</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.feedbackRow}>
                <Pressable
                  style={[styles.feedbackBtn, feedbackDrafts[center._id]?.satisfaction === "SATISFIED" && styles.feedbackBtnSatisfied]}
                  onPress={() => updateCenterDraft(center._id, { satisfaction: "SATISFIED" })}
                >
                  <Text style={[styles.feedbackBtnText, feedbackDrafts[center._id]?.satisfaction === "SATISFIED" && styles.feedbackBtnTextActive]}>
                    Satisfait
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.feedbackBtn, feedbackDrafts[center._id]?.satisfaction === "UNSATISFIED" && styles.feedbackBtnUnsatisfied]}
                  onPress={() => updateCenterDraft(center._id, { satisfaction: "UNSATISFIED" })}
                >
                  <Text style={[styles.feedbackBtnText, feedbackDrafts[center._id]?.satisfaction === "UNSATISFIED" && styles.feedbackBtnTextActive]}>
                    Insatisfait
                  </Text>
                </Pressable>
                <Pressable style={styles.validateBtn} onPress={() => submitCenterFeedback(center._id)}>
                  <Text style={styles.validateBtnText}>{feedbackSavingCenterId === center._id ? "..." : "Valider"}</Text>
                </Pressable>
              </View>

              <Pressable style={styles.navBtn} onPress={() => startNavigation(center)}>
                <Text style={styles.navBtnText}>Itineraire</Text>
              </Pressable>
            </Pressable>
          ))}

          {safeEmergencyBases.length > 0 ? (
            <View style={styles.baseSection}>
              <Text style={styles.baseSectionTitle}>Services d'urgence et de securite a proximite</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.baseFilterRow}>
                {[
                  { key: "ALL", label: "Tous" },
                  { key: "SAMU", label: "SAMU" },
                  { key: "SAPEUR_POMPIER", label: "Pompiers" },
                  { key: "POLICE", label: "Police" },
                  { key: "GENDARMERIE", label: "Gendarmerie" },
                  { key: "PROTECTION_CIVILE", label: "Protection Civile" },
                ].map((item) => {
                  const active = baseServiceFilter === item.key;
                  return (
                    <Pressable
                      key={`base_filter_${item.key}`}
                      style={[
                        styles.baseFilterChip,
                        active && { backgroundColor: C.primary, borderColor: C.primary },
                      ]}
                      onPress={() => setBaseServiceFilter(item.key)}
                    >
                      <Text
                        style={[
                          styles.baseFilterChipText,
                          active && { color: "#fff" },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              {filteredEmergencyBases.map((base) => (
                <View
                  key={`base_${base.id}`}
                  style={[styles.baseCard, { borderLeftColor: getBaseColor(base.serviceType) }]}
                >
                  <Text style={styles.baseName}>{base.name}</Text>
                  <Text style={styles.baseMeta}>{getBaseServiceLabel(base.serviceType)} · {base.address}</Text>
                  {base.distanceKm != null ? <Text style={styles.baseMeta}>{base.distanceKm} km</Text> : null}
                </View>
              ))}
              {filteredEmergencyBases.length === 0 ? (
                <Text style={styles.baseMeta}>Aucun service pour ce filtre.</Text>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  radiusWrap: { alignItems: "center", gap: 2 },
  radiusLabel: { fontSize: 10, color: C.textMuted, fontWeight: "600" },
  radiusInput: {
    width: 56,
    backgroundColor: C.bg,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: R.sm,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    color: C.textDark,
    textAlign: "center",
  },
  searchInput: {
    flex: 1,
    backgroundColor: C.bg,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: R.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: C.textDark,
  },
  searchBtn: {
    backgroundColor: C.primary,
    borderRadius: R.sm,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  searchBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  errorBar: { color: C.red, fontSize: 13, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.redLight },
  noticeBar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  noticeBarSuccess: {
    backgroundColor: C.greenLight,
    borderBottomColor: "#b7ebc6",
  },
  noticeBarInfo: {
    backgroundColor: C.primaryLight,
    borderBottomColor: "#bed4ff",
  },
  noticeBarText: {
    fontSize: 13,
    fontWeight: "700",
  },
  noticeBarTextSuccess: { color: C.green },
  noticeBarTextInfo: { color: C.primary },
  catalogInfoBox: {
    backgroundColor: "#ecfdf5",
    borderBottomWidth: 1,
    borderBottomColor: "#bbf7d0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  catalogInfoTitle: { color: C.green, fontSize: 12, fontWeight: "800" },
  catalogInfoText: { color: C.textMed, fontSize: 11 },

  map: { height: 260, width: "100%" },
  mapFullscreenWrap: { flex: 1 },
  mapFullscreen: { flex: 1, width: "100%" },
  closeMapBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: C.textDark,
    borderRadius: R.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...S.sm,
  },
  closeMapBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  list:        { flex: 1 },
  listContent: { padding: 12, gap: 10, paddingBottom: 28 },

  emptyState: { alignItems: "center", paddingVertical: 32 },
  emptyStateText: { color: C.textMuted, fontSize: 14 },

  centerCard: {
    backgroundColor: C.surface,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 10,
    ...S.sm,
  },
  centerCardSelected: { borderColor: C.primary, borderWidth: 2 },
  centerCardHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  centerCardTitleWrap:{ flex: 1 },
  centerName:         { fontSize: 15, fontWeight: "700", color: C.textDark },
  centerAddress:      { fontSize: 12, color: C.textMuted, marginTop: 2 },
  distanceBadge: {
    backgroundColor: C.primaryLight,
    borderRadius: R.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  distanceBadgeText: { color: C.primary, fontWeight: "700", fontSize: 12 },

  divider: { height: 1, backgroundColor: C.border },

  centerMeta:  { gap: 2 },
  metaLabel:   { fontSize: 11, color: C.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  metaValue:   { fontSize: 13, color: C.textMed },

  // Nouveaux styles pour les services
  servicesSection: {
    gap: 6,
    marginTop: 4,
  },
  servicesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  serviceTag: {
    backgroundColor: C.primaryLight,
    borderRadius: R.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.primary,
  },
  serviceTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.primary,
  },
  serviceDescription: {
    fontSize: 10,
    color: C.textMuted,
    marginTop: 2,
  },

  ratingBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ratingInfo: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingScore: { fontSize: 14, fontWeight: "700", color: C.primary },
  ratingCount: { fontSize: 12, color: C.textMuted },
  satisfactionRate: { fontSize: 11, color: C.green, fontWeight: "600" },
  stars: { flexDirection: "row", gap: 4 },
  starBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
  },
  starBtnActive:  { backgroundColor: C.primary, borderColor: C.primary },
  starText:       { color: C.textLight, fontWeight: "700", fontSize: 14 },
  starTextActive: { color: "#fff" },

  feedbackRow:     { flexDirection: "row", gap: 8, alignItems: "center" },
  feedbackBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.sm,
    paddingVertical: 7,
    alignItems: "center",
    backgroundColor: C.bg,
  },
  feedbackBtnSatisfied:   { backgroundColor: C.greenLight,  borderColor: C.green },
  feedbackBtnUnsatisfied: { backgroundColor: C.redLight,    borderColor: C.red   },
  feedbackBtnText:        { color: C.textMed, fontWeight: "600", fontSize: 13 },
  feedbackBtnTextActive:  { color: C.textDark },
  validateBtn: {
    backgroundColor: C.textDark,
    borderRadius: R.sm,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  validateBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  navBtn: {
    backgroundColor: C.teal,
    borderRadius: R.sm,
    paddingVertical: 9,
    alignItems: "center",
  },
  navBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  baseSection:      { gap: 8, marginTop: 4 },
  baseSectionTitle: { fontSize: 14, fontWeight: "800", color: C.textDark },
  baseFilterRow: { gap: 8 },
  baseFilterChip: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: C.surface,
  },
  baseFilterChipText: { color: C.textMed, fontSize: 12, fontWeight: "700" },
  baseCard: {
    backgroundColor: C.surface,
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 4,
    padding: 12,
    gap: 3,
  },
  baseName: { fontWeight: "700", color: C.textDark, fontSize: 13 },
  baseMeta: { color: C.textMuted, fontSize: 12 },
});
