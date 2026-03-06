import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

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

function parseRadiusKm(rawValue) {
  const normalized = String(rawValue ?? "").trim().replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  if (parsed <= 0) return null;
  return parsed;
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
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [feedbackSavingCenterId, setFeedbackSavingCenterId] = useState("");

  async function loadPosition() {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== "granted") {
      throw new Error("Permission de localisation refusee");
    }
    const current = await Location.getCurrentPositionAsync({});
    return { lat: current.coords.latitude, lon: current.coords.longitude };
  }

  async function fetchNearby(position = coords, { silent = false } = {}) {
    if (!position) return;
    if (!silent) setLoading(true);
    setError("");
    try {
      const parsedRadius = parseRadiusKm(radiusKm);
      if (parsedRadius === null) {
        throw new Error("Rayon invalide. Entrez une valeur numerique en km (ex: 700 ou 700,5).");
      }
      const data = await apiFetch(
        `/centers/nearby?latitude=${position.lat}&longitude=${position.lon}&radiusKm=${parsedRadius}`,
        { token }
      );
      const safeData = Array.isArray(data) ? data : [];
      setCenters(safeData);
      const bases = await apiFetch(
        `/emergency-reports/bases/nearby?latitude=${position.lat}&longitude=${position.lon}&radiusKm=${parsedRadius}`,
        { token }
      );
      setEmergencyBases(Array.isArray(bases) ? bases : []);
      if (safeData.length === 0) {
        setSelectedCenterId("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadPosition()
      .then((position) => {
        setCoords(position);
        return fetchNearby(position);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!coords) return undefined;

    const interval = setInterval(() => {
      fetchNearby(coords, { silent: true }).catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, [coords, radiusKm, token]);

  useEffect(() => {
    if (!coords) return undefined;

    const parsedRadius = parseRadiusKm(radiusKm);
    if (parsedRadius === null) return undefined;

    const timer = setTimeout(() => {
      fetchNearby(coords).catch(() => {});
    }, 500);

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
        [
          { latitude: coords.lat, longitude: coords.lon },
          centerPoint
        ],
        {
          edgePadding: { top: 90, right: 90, bottom: 90, left: 90 },
          animated: true
        }
      );
      return;
    }

    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...centerPoint,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06
        },
        700
      );
    }
  }

  const normalizedCenters = useMemo(
    () =>
      centers
        .filter(hasValidCoordinates)
        .map((center) => ({
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
          next[center._id] = {
            rating: center.myRating ?? 0,
            satisfaction: center.mySatisfaction || ""
          };
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
    if (!coords) {
      return {
        latitude: 6.5244,
        longitude: 3.3792,
        latitudeDelta: 0.25,
        longitudeDelta: 0.25
      };
    }

    return {
      latitude: coords.lat,
      longitude: coords.lon,
      latitudeDelta: 0.13,
      longitudeDelta: 0.13
    };
  }, [coords]);

  const filteredCenters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return normalizedCenters;

    return normalizedCenters.filter((center) => {
      const centerName = String(center.name || "").toLowerCase();
      const hasNameMatch = centerName.includes(q);
      const hasServiceMatch = Array.isArray(center.services)
        ? center.services.some((service) => String(service.name || "").toLowerCase().includes(q))
        : false;
      return hasNameMatch || hasServiceMatch;
    });
  }, [normalizedCenters, searchQuery]);

  const safeEmergencyBases = useMemo(
    () => emergencyBases.filter(hasValidBaseCoordinates),
    [emergencyBases]
  );

  function updateCenterDraft(centerId, patch) {
    setFeedbackDrafts((prev) => ({
      ...prev,
      [centerId]: {
        rating: prev[centerId]?.rating ?? 0,
        satisfaction: prev[centerId]?.satisfaction || "",
        ...patch
      }
    }));
  }

  async function submitCenterFeedback(centerId) {
    const draft = feedbackDrafts[centerId] || { rating: 0, satisfaction: "" };
    const rating = Number(draft.rating) || 0;
    const satisfaction = draft.satisfaction || "";
    if (!rating && !satisfaction) {
      setError("Choisissez une note ou un niveau de satisfaction");
      return;
    }

    setFeedbackSavingCenterId(centerId);
    setError("");
    try {
      await apiFetch(`/centers/${centerId}/rating`, {
        token,
        method: "POST",
        body: {
          rating: rating || null,
          satisfaction: satisfaction || null
        }
      });
      if (coords) {
        await fetchNearby(coords, { silent: true });
      } else {
        await fetchNearby(undefined, { silent: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setFeedbackSavingCenterId("");
    }
  }

  useEffect(() => {
    if (!mapRef.current || !coords || selectedCenter || isMapFullscreen) return;

    if (filteredCenters.length === 0) {
      mapRef.current.animateToRegion(
        {
          latitude: coords.lat,
          longitude: coords.lon,
          latitudeDelta: 0.12,
          longitudeDelta: 0.12
        },
        500
      );
      return;
    }

    const points = [
      { latitude: coords.lat, longitude: coords.lon },
      ...filteredCenters.map((center) => ({
        latitude: center.location.coordinates[1],
        longitude: center.location.coordinates[0]
      }))
    ];

    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
      animated: true
    });
  }, [coords, filteredCenters, selectedCenter, isMapFullscreen]);

  return (
    <View style={styles.container}>
      {!isMapFullscreen ? (
        <View style={styles.controls}>
          <Text style={styles.label}>Rayon (km)</Text>
          <TextInput
            style={styles.radiusInput}
            keyboardType="numeric"
            value={radiusKm}
            onChangeText={setRadiusKm}
          />
          <Pressable style={styles.searchButton} onPress={() => fetchNearby()}>
            <Text style={styles.searchButtonText}>{loading ? "Recherche..." : "Rechercher"}</Text>
          </Pressable>
        </View>
      ) : null}
      {!isMapFullscreen ? (
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher par nom ou service"
          />
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={isMapFullscreen ? styles.mapFullscreenWrap : undefined}>
        <MapView
          ref={mapRef}
          style={isMapFullscreen ? styles.mapFullscreen : styles.map}
          initialRegion={mapRegion}
        >
          {coords ? <Marker coordinate={{ latitude: coords.lat, longitude: coords.lon }} title="Vous" pinColor="#0b7285" /> : null}
          {filteredCenters.slice(0, MAX_MAP_CENTER_MARKERS).map((center) => (
            <Marker
              key={center._id}
              coordinate={{
                latitude: center.location.coordinates[1],
                longitude: center.location.coordinates[0]
              }}
              title={`${center.name} (${center.distanceKm} km)`}
              description={center.technicalPlatform}
              pinColor={center._id === selectedCenterId ? "#0b7285" : undefined}
              onPress={() => selectCenter(center)}
            />
          ))}
          {safeEmergencyBases.slice(0, MAX_MAP_BASE_MARKERS).map((base) => (
            <Marker
              key={`base_${base.id}`}
              coordinate={{
                latitude: Number(base.location.coordinates[1]),
                longitude: Number(base.location.coordinates[0])
              }}
              title={`${base.name} (${base.serviceType})`}
              description={base.address}
              pinColor={base.serviceType === "SAMU" ? "#d97706" : "#b91c1c"}
            />
          ))}
          {coords && selectedCenter ? (
            <Polyline
              coordinates={[
                { latitude: coords.lat, longitude: coords.lon },
                {
                  latitude: selectedCenter.location.coordinates[1],
                  longitude: selectedCenter.location.coordinates[0]
                }
              ]}
              strokeWidth={4}
              strokeColor="#0b7285"
            />
          ) : null}
        </MapView>

        {isMapFullscreen ? (
          <Pressable
            style={styles.closeMapButton}
            onPress={() => {
              setIsMapFullscreen(false);
              setSelectedCenterId("");
            }}
          >
            <Text style={styles.closeMapButtonText}>Fermer la carte</Text>
          </Pressable>
        ) : null}
      </View>

      {!isMapFullscreen ? (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {filteredCenters.length === 0 ? <Text>Aucun centre trouve.</Text> : null}
          {filteredCenters.map((center) => (
            <Pressable
              key={center._id}
              style={[styles.card, center._id === selectedCenterId && styles.cardSelected]}
              onPress={() => selectCenter(center)}
            >
              <Text style={styles.cardTitle}>{center.name}</Text>
              <Text style={styles.cardSmall}>{center.distanceKm} km</Text>
              <Text>{center.address}</Text>
              <Text style={styles.cardLine}>Plateau technique: {center.technicalPlatform}</Text>
              <Text style={styles.cardLine}>
                Services: {center.services.map((s) => s?.name).filter(Boolean).join(", ") || "Aucun"}
              </Text>
              <Text style={styles.cardLine}>
                Note moyenne: {center.ratingAverage == null ? "-" : `${center.ratingAverage}/5`} ({center.ratingCount || 0} avis)
              </Text>
              <Text style={styles.cardLine}>
                Satisfaction: {center.satisfactionRate == null ? "-" : `${center.satisfactionRate}% satisfaits`}
              </Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((value) => {
                  const selected = (feedbackDrafts[center._id]?.rating || 0) >= value;
                  return (
                    <Pressable
                      key={`${center._id}_star_${value}`}
                      style={[styles.starButton, selected && styles.starButtonActive]}
                      onPress={() => updateCenterDraft(center._id, { rating: value })}
                    >
                      <Text style={[styles.starText, selected && styles.starTextActive]}>★</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.feedbackRow}>
                <Pressable
                  style={[
                    styles.feedbackButton,
                    feedbackDrafts[center._id]?.satisfaction === "SATISFIED" && styles.feedbackButtonActive
                  ]}
                  onPress={() => updateCenterDraft(center._id, { satisfaction: "SATISFIED" })}
                >
                  <Text
                    style={[
                      styles.feedbackButtonText,
                      feedbackDrafts[center._id]?.satisfaction === "SATISFIED" && styles.feedbackButtonTextActive
                    ]}
                  >
                    Satisfait
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.feedbackButton,
                    feedbackDrafts[center._id]?.satisfaction === "UNSATISFIED" && styles.feedbackButtonActive
                  ]}
                  onPress={() => updateCenterDraft(center._id, { satisfaction: "UNSATISFIED" })}
                >
                  <Text
                    style={[
                      styles.feedbackButtonText,
                      feedbackDrafts[center._id]?.satisfaction === "UNSATISFIED" && styles.feedbackButtonTextActive
                    ]}
                  >
                    Insatisfait
                  </Text>
                </Pressable>
                <Pressable style={styles.feedbackSaveButton} onPress={() => submitCenterFeedback(center._id)}>
                  <Text style={styles.feedbackSaveButtonText}>
                    {feedbackSavingCenterId === center._id ? "..." : "Valider"}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.cardActions}>
                <Pressable style={styles.navButton} onPress={() => startNavigation(center)}>
                  <Text style={styles.navButtonText}>Naviguer</Text>
                </Pressable>
              </View>
            </Pressable>
          ))}
          {safeEmergencyBases.length ? (
            <View style={styles.baseSection}>
              <Text style={styles.baseTitle}>Bases d'urgence a proximite</Text>
              {safeEmergencyBases.map((base) => (
                <View key={`base_card_${base.id}`} style={styles.baseCard}>
                  <Text style={styles.baseName}>{base.name}</Text>
                  <Text style={styles.baseLine}>Service: {base.serviceType}</Text>
                  <Text style={styles.baseLine}>{base.address}</Text>
                  {base.distanceKm != null ? <Text style={styles.baseLine}>Distance: {base.distanceKm} km</Text> : null}
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  controls: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderBottomColor: "#dbe7ef",
    borderBottomWidth: 1
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    borderBottomColor: "#dbe7ef",
    borderBottomWidth: 1
  },
  searchInput: {
    backgroundColor: "#fff",
    borderColor: "#d0e3ec",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9
  },
  label: { color: "#334155", fontWeight: "600" },
  radiusInput: {
    width: 70,
    backgroundColor: "#fff",
    borderColor: "#d0e3ec",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  searchButton: {
    backgroundColor: "#0b7285",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  searchButtonText: { color: "#fff", fontWeight: "700" },
  error: { color: "#b42318", paddingHorizontal: 16, paddingTop: 8 },
  map: { height: 290, width: "100%" },
  mapFullscreenWrap: { flex: 1 },
  mapFullscreen: { flex: 1, width: "100%" },
  closeMapButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#0f172a",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  closeMapButtonText: { color: "#fff", fontWeight: "700" },
  list: { flex: 1 },
  listContent: { padding: 16, gap: 8, paddingBottom: 28 },
  card: {
    backgroundColor: "#fff",
    borderColor: "#d0e3ec",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 3
  },
  cardSelected: {
    borderColor: "#0b7285",
    borderWidth: 2
  },
  cardTitle: { fontWeight: "700", color: "#0f172a" },
  cardSmall: { color: "#0b7285", fontWeight: "600" },
  cardLine: { color: "#1e293b" },
  ratingRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  starButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#93c5d2",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0fbff"
  },
  starButtonActive: { backgroundColor: "#0b7285", borderColor: "#0b7285" },
  starText: { color: "#0b7285", fontWeight: "700" },
  starTextActive: { color: "#fff" },
  feedbackRow: { flexDirection: "row", gap: 8, marginTop: 8, alignItems: "center" },
  feedbackButton: {
    borderColor: "#0b7285",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#f0fbff"
  },
  feedbackButtonActive: { backgroundColor: "#0b7285" },
  feedbackButtonText: { color: "#0b7285", fontWeight: "600" },
  feedbackButtonTextActive: { color: "#fff" },
  feedbackSaveButton: {
    backgroundColor: "#0f172a",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  feedbackSaveButtonText: { color: "#fff", fontWeight: "700" },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  navButton: {
    backgroundColor: "#0b7285",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  navButtonText: { color: "#fff", fontWeight: "700" },
  success: { color: "#067647", paddingHorizontal: 2 }
  ,
  baseSection: { marginTop: 8, gap: 6 },
  baseTitle: { color: "#0f172a", fontWeight: "800" },
  baseCard: {
    backgroundColor: "#fff7ed",
    borderColor: "#fdba74",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10
  },
  baseName: { color: "#7c2d12", fontWeight: "700" },
  baseLine: { color: "#9a3412" }
});
