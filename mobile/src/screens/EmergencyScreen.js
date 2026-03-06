import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

const EMERGENCY_CONTACTS = [
  {
    id: "SAMU",
    label: "SAMU",
    subtitle: "Urgence medicale",
    number: "15",
    color: "#b42318"
  },
  {
    id: "SAPPEUR_POMPIER",
    label: "Sapeurs-pompiers",
    subtitle: "Incendie, secours et accidents",
    number: "18",
    color: "#d9480f"
  }
];

const EMERGENCY_TYPES = [
  "Accident de route",
  "Malaise",
  "Incendie",
  "Violence",
  "Autre"
];
const EMERGENCY_PHONE_KEY = "sante_aproxmite_emergency_phone";
const IDEAL_GPS_RADIUS_METERS = 10;
const TARGET_GPS_RADIUS_METERS = 20;
const MAX_GPS_RADIUS_METERS = 300;
const REPORTS_PREVIEW_LIMIT = 3;

const EMERGENCY_STATUS_LABELS = {
  NEW: "Nouvelle alerte",
  ACKNOWLEDGED: "Prise en charge",
  EN_ROUTE: "Equipe en route",
  ON_SITE: "Equipe sur site",
  COMPLETED: "Intervention terminee",
  CLOSED: "Alerte cloturee"
};

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatEmergencyStatus(status) {
  return EMERGENCY_STATUS_LABELS[String(status || "").toUpperCase()] || "Statut inconnu";
}

export function EmergencyScreen() {
  const { token, user } = useAuth();
  const [targetService, setTargetService] = useState("SAMU");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emergencyType, setEmergencyType] = useState("Accident de route");
  const [pickupPointName, setPickupPointName] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([]);
  const [coords, setCoords] = useState(null);
  const [loadingGps, setLoadingGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myReports, setMyReports] = useState([]);
  const [showAllReports, setShowAllReports] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function callNumber(number) {
    try {
      await Linking.openURL(`tel:${number}`);
    } catch {
      // Ignore dialer errors.
    }
  }

  async function loadPosition() {
    setLoadingGps(true);
    setError("");
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        throw new Error("Permission de localisation refusee");
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest
      });
      const accuracyMeters = Number(current?.coords?.accuracy);
      if (!Number.isFinite(accuracyMeters)) {
        throw new Error("Precision GPS indisponible. Reessayez.");
      }
      if (accuracyMeters > MAX_GPS_RADIUS_METERS) {
        throw new Error(
          `Precision GPS trop faible (${Math.round(
            accuracyMeters
          )} m). Rapprochez-vous d'une zone ouverte puis reessayez (max ${MAX_GPS_RADIUS_METERS} m).`
        );
      }
      setCoords({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        accuracyMeters
      });
    } catch (err) {
      setError(err.message || "Impossible de recuperer la position GPS");
    } finally {
      setLoadingGps(false);
    }
  }

  useEffect(() => {
    loadPosition().catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.phoneNumber) {
      setPhoneNumber(String(user.phoneNumber));
    }
  }, [user?.phoneNumber]);

  useEffect(() => {
    if (user?.phoneNumber) return;
    AsyncStorage.getItem(EMERGENCY_PHONE_KEY)
      .then((storedPhone) => {
        if (storedPhone) setPhoneNumber(storedPhone);
      })
      .catch(() => {});
  }, [user?.phoneNumber]);

  const canSubmit = useMemo(() => {
    const normalizedPhone = normalizePhone(phoneNumber);
    return (
      normalizedPhone.length === 10 &&
      String(emergencyType || "").trim().length >= 3 &&
      String(pickupPointName || "").trim().length >= 3 &&
      String(description || "").trim().length >= 10 &&
      !!coords &&
      Number.isFinite(Number(coords.accuracyMeters)) &&
      Number(coords.accuracyMeters) <= MAX_GPS_RADIUS_METERS
    );
  }, [phoneNumber, emergencyType, pickupPointName, description, coords]);

  async function submitEmergencyReport() {
    setError("");
    setSuccess("");

    if (!canSubmit) {
      setError(`Completez le formulaire et utilisez une position GPS acceptable (max ${MAX_GPS_RADIUS_METERS} m).`);
      return;
    }

    setSubmitting(true);
    try {
      const normalizedPhone = normalizePhone(phoneNumber);
      await AsyncStorage.setItem(EMERGENCY_PHONE_KEY, normalizedPhone);
      const result = await apiFetch("/emergency-reports", {
        token,
        method: "POST",
        body: {
          targetService,
          phoneNumber: normalizedPhone,
          emergencyType: emergencyType.trim(),
          pickupPointName: pickupPointName.trim(),
          description: description.trim(),
          photos,
          latitude: coords.latitude,
          longitude: coords.longitude
        }
      });

      if (result?.queued) {
        setSuccess(result.message || "Signalement enregistre hors ligne.");
      } else {
        const reportId = result?.report?.id ? ` #${result.report.id}` : "";
        setSuccess(`Signalement envoye${reportId}.`);
      }
      setPickupPointName("");
      setDescription("");
      setPhotos([]);
    } catch (err) {
      setError(err.message || "Envoi impossible");
    } finally {
      setSubmitting(false);
    }
  }

  async function loadMyReports({ silent = false } = {}) {
    if (!silent) setLoadingReports(true);
    try {
      const data = await apiFetch("/emergency-reports/mine", { token });
      setMyReports(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!silent) setError(err.message || "Chargement du suivi impossible");
    } finally {
      if (!silent) setLoadingReports(false);
    }
  }

  async function takePhoto() {
    setError("");
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== "granted") {
        throw new Error("Permission camera refusee");
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.6,
        base64: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images
      });

      if (result.canceled) return;

      const nextPhotos = (result.assets || [])
        .map((asset) => {
          if (!asset?.base64) return "";
          const mime = asset.mimeType || "image/jpeg";
          return `data:${mime};base64,${asset.base64}`;
        })
        .filter(Boolean);

      setPhotos((prev) => [...prev, ...nextPhotos].slice(0, 4));
    } catch (err) {
      setError(err.message || "Impossible de prendre une photo");
    }
  }

  useEffect(() => {
    loadMyReports();
    const interval = setInterval(() => {
      loadMyReports({ silent: true }).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const trackedReports = useMemo(
    () => myReports.filter((report) => String(report?.status || "").toUpperCase() !== "NEW"),
    [myReports]
  );

  const visibleReports = useMemo(() => {
    if (showAllReports) return trackedReports;
    return trackedReports.slice(0, REPORTS_PREVIEW_LIMIT);
  }, [trackedReports, showAllReports]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Signaler une urgence</Text>
        <Text style={styles.subtitle}>Le signalement envoie service cible, telephone, position GPS et description.</Text>

        <Text style={styles.sectionTitle}>Service d'urgence</Text>
        <View style={styles.rowWrap}>
          {EMERGENCY_CONTACTS.map((contact) => {
            const selected = targetService === contact.id;
            return (
              <Pressable
                key={contact.id}
                style={[
                  styles.selectButton,
                  { borderColor: contact.color },
                  selected && { backgroundColor: contact.color }
                ]}
                onPress={() => setTargetService(contact.id)}
              >
                <Text style={[styles.selectButtonTitle, selected && styles.selectButtonTitleActive]}>
                  {contact.label}
                </Text>
                <Text style={[styles.selectButtonSub, selected && styles.selectButtonSubActive]}>
                  {contact.subtitle}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Numero de telephone</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="Ex: 0612345678"
          value={phoneNumber}
          onChangeText={(value) => setPhoneNumber(normalizePhone(value).slice(0, 10))}
        />
        <Text style={styles.gpsText}>Le numero doit contenir exactement 10 chiffres.</Text>

        <Text style={styles.sectionTitle}>Type d'urgence</Text>
        <View style={styles.rowWrap}>
          {EMERGENCY_TYPES.map((item) => (
            <Pressable
              key={item}
              style={[styles.chip, emergencyType === item && styles.chipActive]}
              onPress={() => setEmergencyType(item)}
            >
              <Text style={[styles.chipText, emergencyType === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder="Precisez le type si necessaire"
          value={emergencyType}
          onChangeText={setEmergencyType}
        />

        <Text style={styles.sectionTitle}>Point de prise en charge</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Carrefour Faya, devant pharmacie X"
          value={pickupPointName}
          onChangeText={setPickupPointName}
        />

        <Text style={styles.sectionTitle}>Description de l'urgence</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          placeholder="Decrivez clairement ce qui se passe"
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.sectionTitle}>Photos (optionnel)</Text>
        <Pressable style={styles.secondaryButton} onPress={takePhoto}>
          <Text style={styles.secondaryButtonText}>Ouvrir la camera</Text>
        </Pressable>
        <Text style={styles.gpsText}>{photos.length} photo(s) prise(s)</Text>

        <View style={styles.gpsRow}>
          <Pressable style={styles.secondaryButton} onPress={loadPosition}>
            <Text style={styles.secondaryButtonText}>{loadingGps ? "GPS..." : "Mettre a jour ma position"}</Text>
          </Pressable>
          <Text style={styles.gpsText}>
            {coords
              ? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)} (precision ~${Math.round(
                  Number(coords.accuracyMeters)
                )} m)`
              : "Position non disponible"}
          </Text>
          <Text style={styles.gpsText}>
            {coords
              ? Number(coords.accuracyMeters) <= IDEAL_GPS_RADIUS_METERS
                ? "Precision GPS: excellente."
                : Number(coords.accuracyMeters) <= TARGET_GPS_RADIUS_METERS
                  ? "Precision GPS: correcte."
                  : Number(coords.accuracyMeters) <= 50
                    ? "Precision GPS: moyenne (envoi autorise)."
                    : "Precision GPS: faible (envoi autorise mais moins precis)."
              : `Precision cible: ${IDEAL_GPS_RADIUS_METERS}-${TARGET_GPS_RADIUS_METERS} m.`}
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        <Pressable
          style={[styles.primaryButton, (!canSubmit || submitting) && styles.primaryButtonDisabled]}
          onPress={submitEmergencyReport}
          disabled={!canSubmit || submitting}
        >
          <Text style={styles.primaryButtonText}>{submitting ? "Envoi..." : "Envoyer le signalement"}</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Appel direct</Text>
        {EMERGENCY_CONTACTS.map((contact) => (
          <Pressable key={`${contact.id}_call`} style={styles.callButton} onPress={() => callNumber(contact.number)}>
            <Text style={styles.callButtonText}>
              Appeler {contact.label} ({contact.number})
            </Text>
          </Pressable>
        ))}
        <Text style={styles.helpText}>Si vous n'etes pas sur, composez le 112.</Text>

        <Text style={styles.sectionTitle}>Suivi de mes alertes</Text>
        <Text style={styles.gpsText}>{loadingReports ? "Chargement..." : `${trackedReports.length} alerte(s)`}</Text>
        {trackedReports.length > REPORTS_PREVIEW_LIMIT ? (
          <Pressable style={styles.secondaryButton} onPress={() => setShowAllReports((prev) => !prev)}>
            <Text style={styles.secondaryButtonText}>
              {showAllReports ? "Voir moins d'alertes" : `Voir plus d'alertes (${trackedReports.length})`}
            </Text>
          </Pressable>
        ) : null}
        {visibleReports.map((report) => (
          <View key={report.id} style={styles.trackCard}>
            <Text style={styles.trackTitle}>{report.emergencyType}</Text>
            {report.pickupPointName ? <Text style={styles.trackLine}>Point: {report.pickupPointName}</Text> : null}
            {report.userStatusMessage ? <Text style={styles.trackHighlight}>{report.userStatusMessage}</Text> : null}
            <View style={styles.statusRow}>
              <Text style={styles.trackLine}>Statut:</Text>
              <Text style={styles.statusBadge}>{formatEmergencyStatus(report.status)}</Text>
            </View>
            {report.estimatedArrivalLabel ? (
              <Text style={styles.trackLine}>Arrivee estimee: {report.estimatedArrivalLabel}</Text>
            ) : Number.isFinite(Number(report.estimatedArrivalMinutes)) &&
              Number(report.estimatedArrivalMinutes) > 0 ? (
                <Text style={styles.trackLine}>Arrivee estimee: {report.estimatedArrivalMinutes} min</Text>
              ) : null}
            <Text style={styles.trackLine}>Service: {report.targetService}</Text>
            {report.handlerBaseName ? <Text style={styles.trackLine}>Caserne: {report.handlerBaseName}</Text> : null}
            {report.handlerName ? <Text style={styles.trackLine}>Equipe: {report.handlerName}</Text> : null}
            {report.teamLatitude != null && report.teamLongitude != null ? (
              <Text style={styles.trackLine}>Position equipe: {report.teamLatitude}, {report.teamLongitude}</Text>
            ) : null}
            {report.teamNote ? <Text style={styles.trackLine}>Avancement: {report.teamNote}</Text> : null}
          </View>
        ))}
        {!loadingReports && visibleReports.length === 0 ? <Text style={styles.gpsText}>Aucune alerte suivie pour le moment.</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderColor: "#dbe7ef",
    borderWidth: 1,
    padding: 14,
    gap: 12
  },
  title: { fontSize: 21, fontWeight: "700", color: "#0f172a" },
  subtitle: { color: "#334155" },
  sectionTitle: { color: "#0f172a", fontWeight: "700", marginTop: 2 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectButton: {
    flex: 1,
    minWidth: 140,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: "#fff"
  },
  selectButtonTitle: { fontWeight: "700", color: "#0f172a" },
  selectButtonTitleActive: { color: "#fff" },
  selectButtonSub: { color: "#475569", marginTop: 2, fontSize: 12 },
  selectButtonSubActive: { color: "#fff" },
  input: {
    backgroundColor: "#fff",
    borderColor: "#d0e3ec",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  chip: {
    borderColor: "#93c5d2",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#f0fbff"
  },
  chipActive: { borderColor: "#0b7285", backgroundColor: "#0b7285" },
  chipText: { color: "#0b7285", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  gpsRow: { gap: 8 },
  secondaryButton: {
    borderColor: "#0b7285",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center"
  },
  secondaryButtonText: { color: "#0b7285", fontWeight: "700" },
  gpsText: { color: "#334155", fontSize: 12 },
  primaryButton: {
    backgroundColor: "#b42318",
    borderColor: "#7f1d1d",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: "#7f1d1d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3
  },
  primaryButtonDisabled: { opacity: 0.55 },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
  callButton: {
    borderColor: "#d0e3ec",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#f8fbfe"
  },
  callButtonText: { color: "#0f172a", fontWeight: "600" },
  helpText: { color: "#475569", fontSize: 12, marginTop: 2 },
  trackCard: {
    borderColor: "#d0e3ec",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#f8fbfe"
  },
  trackTitle: { color: "#0f172a", fontWeight: "700" },
  trackHighlight: {
    marginTop: 4,
    color: "#0b3b7a",
    backgroundColor: "#eaf2ff",
    borderColor: "#bfd2ff",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  trackLine: { color: "#334155", marginTop: 2 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  statusBadge: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdca",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    color: "#b42318",
    fontWeight: "700",
    fontSize: 12
  },
  error: { color: "#b42318" },
  success: { color: "#067647" }
});
