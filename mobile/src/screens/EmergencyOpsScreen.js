import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

const STATUS_FLOW = ["EN_ROUTE", "ON_SITE", "COMPLETED"];

function labelStatus(status) {
  if (status === "NEW") return "NOUVELLE";
  if (status === "ACKNOWLEDGED") return "PRISE EN CHARGE";
  if (status === "EN_ROUTE") return "EN ROUTE";
  if (status === "ON_SITE") return "SUR SITE";
  if (status === "COMPLETED") return "TERMINEE";
  if (status === "CLOSED") return "CLOTUREE";
  return status || "-";
}

function toNumberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildMapRegion(item) {
  const lat = toNumberOrNull(item?.latitude);
  const lon = toNumberOrNull(item?.longitude);
  if (lat == null || lon == null) return null;

  const teamLat = toNumberOrNull(item?.teamLatitude);
  const teamLon = toNumberOrNull(item?.teamLongitude);
  if (teamLat == null || teamLon == null) {
    return {
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02
    };
  }

  const midLat = (lat + teamLat) / 2;
  const midLon = (lon + teamLon) / 2;
  const latDelta = Math.max(0.02, Math.abs(lat - teamLat) * 2.4);
  const lonDelta = Math.max(0.02, Math.abs(lon - teamLon) * 2.4);
  return {
    latitude: midLat,
    longitude: midLon,
    latitudeDelta: latDelta,
    longitudeDelta: lonDelta
  };
}

export function EmergencyOpsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [noteById, setNoteById] = useState({});
  const [pendingId, setPendingId] = useState("");

  async function loadItems({ silent = false } = {}) {
    if (!silent) setLoading(true);
    try {
      const data = await apiFetch("/emergency-reports", { token });
      setItems(Array.isArray(data) ? data : []);
      if (!silent) setError("");
    } catch (err) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
    const interval = setInterval(() => {
      loadItems({ silent: true }).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [token]);

  async function getCurrentPosition() {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== "granted") {
      throw new Error("Permission de localisation refusee");
    }
    const current = await Location.getCurrentPositionAsync({});
    return {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude
    };
  }

  async function acknowledge(itemId) {
    setPendingId(String(itemId));
    setError("");
    try {
      const position = await getCurrentPosition();
      await apiFetch(`/emergency-reports/${itemId}/acknowledge`, {
        token,
        method: "POST",
        body: {
          teamLatitude: position.latitude,
          teamLongitude: position.longitude
        }
      });
      await loadItems({ silent: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingId("");
    }
  }

  async function updateProgress(itemId, status) {
    setPendingId(String(itemId));
    setError("");
    try {
      const position = await getCurrentPosition();
      await apiFetch(`/emergency-reports/${itemId}/progress`, {
        token,
        method: "PATCH",
        body: {
          status,
          teamLatitude: position.latitude,
          teamLongitude: position.longitude,
          teamNote: noteById[itemId] || ""
        }
      });
      await loadItems({ silent: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingId("");
    }
  }

  async function navigateToAlert(item) {
    const lat = toNumberOrNull(item?.latitude);
    const lon = toNumberOrNull(item?.longitude);
    if (lat == null || lon == null) {
      setError("Coordonnees de l'alerte invalides");
      return;
    }
    const teamLat = toNumberOrNull(item?.teamLatitude);
    const teamLon = toNumberOrNull(item?.teamLongitude);
    const url =
      teamLat != null && teamLon != null
        ? `https://www.google.com/maps/dir/?api=1&origin=${teamLat},${teamLon}&destination=${lat},${lon}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    try {
      await Linking.openURL(url);
    } catch {
      setError("Impossible d'ouvrir la navigation");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Alertes de mon service</Text>
      <Text style={styles.subtitle}>{loading ? "Chargement..." : `${items.length} alerte(s)`}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {items.length === 0 ? <Text style={styles.empty}>Aucune alerte pour le moment.</Text> : null}

      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>{item.emergencyType}</Text>
          <Text style={styles.cardLine}>Statut: {labelStatus(item.status)}</Text>
          <Text style={styles.cardLine}>Demandeur: {item.reporterName || "-"}</Text>
          <Text style={styles.cardLine}>Tel: {item.phoneNumber}</Text>
          <Text style={styles.cardLine}>Position demandeur: {item.latitude}, {item.longitude}</Text>
          <Text style={styles.cardLine}>Description: {item.description}</Text>
          {item.teamLatitude != null && item.teamLongitude != null ? (
            <Text style={styles.cardLine}>Position equipe: {item.teamLatitude}, {item.teamLongitude}</Text>
          ) : null}
          {buildMapRegion(item) ? (
            <View style={styles.mapWrap}>
              <MapView style={styles.map} initialRegion={buildMapRegion(item)}>
                <Marker
                  coordinate={{
                    latitude: Number(item.latitude),
                    longitude: Number(item.longitude)
                  }}
                  title="Point de prise en charge"
                  pinColor="#b42318"
                />
                {item.teamLatitude != null && item.teamLongitude != null ? (
                  <Marker
                    coordinate={{
                      latitude: Number(item.teamLatitude),
                      longitude: Number(item.teamLongitude)
                    }}
                    title="Equipe d'urgence"
                    pinColor="#0b7285"
                  />
                ) : null}
                {item.teamLatitude != null && item.teamLongitude != null ? (
                  <Polyline
                    coordinates={[
                      { latitude: Number(item.teamLatitude), longitude: Number(item.teamLongitude) },
                      { latitude: Number(item.latitude), longitude: Number(item.longitude) }
                    ]}
                    strokeColor="#0b7285"
                    strokeWidth={4}
                  />
                ) : null}
              </MapView>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Note equipe (optionnel)"
            value={noteById[item.id] || ""}
            onChangeText={(value) => setNoteById((prev) => ({ ...prev, [item.id]: value }))}
          />

          {item.status === "NEW" ? (
            <View style={styles.actionsRow}>
              <Pressable style={styles.primaryButton} onPress={() => acknowledge(item.id)}>
                <Text style={styles.primaryButtonText}>{pendingId === String(item.id) ? "..." : "Prendre en charge"}</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => navigateToAlert(item)}>
                <Text style={styles.secondaryButtonText}>Naviguer</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.actionsRow}>
              {STATUS_FLOW.map((status) => (
                <Pressable
                  key={`${item.id}_${status}`}
                  style={[styles.secondaryButton, item.status === status && styles.secondaryButtonActive]}
                  onPress={() => updateProgress(item.id, status)}
                >
                  <Text style={[styles.secondaryButtonText, item.status === status && styles.secondaryButtonTextActive]}>
                    {labelStatus(status)}
                  </Text>
                </Pressable>
              ))}
              <Pressable style={styles.secondaryButton} onPress={() => navigateToAlert(item)}>
                <Text style={styles.secondaryButtonText}>Naviguer</Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 10, paddingBottom: 28 },
  title: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  subtitle: { color: "#475569" },
  error: { color: "#b42318" },
  empty: { color: "#64748b", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderColor: "#d0e3ec",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6
  },
  cardTitle: { fontWeight: "800", color: "#0f172a" },
  cardLine: { color: "#334155" },
  mapWrap: {
    marginTop: 6,
    borderRadius: 10,
    overflow: "hidden",
    borderColor: "#d0e3ec",
    borderWidth: 1
  },
  map: { width: "100%", height: 170 },
  input: {
    backgroundColor: "#fff",
    borderColor: "#d0e3ec",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4
  },
  primaryButton: {
    backgroundColor: "#b45309",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4
  },
  primaryButtonText: { color: "#fff", fontWeight: "800" },
  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  secondaryButton: {
    borderColor: "#b45309",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  secondaryButtonActive: { backgroundColor: "#b45309" },
  secondaryButtonText: { color: "#b45309", fontWeight: "700", fontSize: 12 },
  secondaryButtonTextActive: { color: "#fff" }
});
