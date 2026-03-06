import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

const ESTABLISHMENT_TYPE_OPTIONS = [
  { label: "Confessionnel", value: "CONFESSIONNEL" },
  { label: "Prive", value: "PRIVE" },
  { label: "Publique", value: "PUBLIQUE" }
];
const LEVEL_OPTIONS = [
  { label: "CHU", value: "CHU" },
  { label: "CHR", value: "CHR" },
  { label: "CH", value: "CH" },
  { label: "CHS", value: "CHS" },
  { label: "Clinique privee", value: "CLINIQUE_PRIVEE" },
  { label: "CLCC", value: "CLCC" },
  { label: "ESPC", value: "ESPC" },
  { label: "Centre de sante", value: "CENTRE_SANTE" },
  { label: "SSR", value: "SSR" },
  { label: "EHPAD / USLD", value: "EHPAD_USLD" },
  { label: "Centre de radiotherapie", value: "CENTRE_RADIOTHERAPIE" },
  { label: "Centre de cardiologie", value: "CENTRE_CARDIOLOGIE" }
];

function parseServices(servicesCsv) {
  return servicesCsv
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

export function ChefScreen() {
  const { token } = useAuth();
  const [centerId, setCenterId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    establishmentCode: "",
    regionCode: "",
    districtCode: "",
    level: "CENTRE_SANTE",
    establishmentType: "PUBLIQUE",
    technicalPlatform: "",
    servicesCsv: "",
    latitude: "",
    longitude: ""
  });

  async function loadChefCenter({ silent = false } = {}) {
    try {
      const data = await apiFetch("/centers", { token });
      const center = data?.[0];
      if (!center) return;
      setCenterId(center._id);
      setForm({
        name: center.name || "",
        address: center.address || "",
        establishmentCode: center.establishmentCode || "",
        regionCode: center.regionCode || "",
        districtCode: center.districtCode || "",
        level: center.level || "CENTRE_SANTE",
        establishmentType: center.establishmentType || "PUBLIQUE",
        technicalPlatform: center.technicalPlatform || "",
        servicesCsv: Array.isArray(center.services) ? center.services.map((s) => s.name).join(", ") : "",
        latitude: String(center.location?.coordinates?.[1] || ""),
        longitude: String(center.location?.coordinates?.[0] || "")
      });
    } catch (err) {
      if (!silent) setError(err.message);
    }
  }

  useEffect(() => {
    loadChefCenter();
    const interval = setInterval(() => {
      loadChefCenter({ silent: true }).catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, [token]);

  async function getCurrentPosition() {
    setError("");
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== "granted") {
      setError("Permission de localisation refusee");
      return;
    }

    const current = await Location.getCurrentPositionAsync({});
    setForm((prev) => ({
      ...prev,
      latitude: String(current.coords.latitude),
      longitude: String(current.coords.longitude)
    }));
  }

  async function createCenter() {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const result = await apiFetch(centerId ? `/centers/${centerId}` : "/centers", {
        token,
        method: centerId ? "PUT" : "POST",
        body: {
          name: form.name,
          address: form.address,
          establishmentCode: form.establishmentCode,
          regionCode: String(form.regionCode || "").trim().toUpperCase(),
          districtCode: String(form.districtCode || "").trim().toUpperCase() || null,
          level: form.level,
          establishmentType: form.establishmentType,
          technicalPlatform: form.technicalPlatform,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          services: parseServices(form.servicesCsv)
        }
      });

      if (result?.queued) {
        setMessage(result.message || "Action enregistree hors ligne.");
      } else {
        setMessage(centerId ? "Centre mis a jour et envoye en validation" : "Centre cree et envoye en validation");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Creer un centre de sante</Text>

      <TextInput style={styles.input} placeholder="Nom du centre" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
      <TextInput style={styles.input} placeholder="Adresse" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} />
      <TextInput
        style={styles.input}
        placeholder="Code etablissement (optionnel)"
        autoCapitalize="characters"
        value={form.establishmentCode}
        onChangeText={(v) => setForm({ ...form, establishmentCode: v })}
      />
      <TextInput
        style={styles.input}
        placeholder="Region (obligatoire)"
        autoCapitalize="characters"
        value={form.regionCode}
        onChangeText={(v) => setForm({ ...form, regionCode: v })}
      />
      <TextInput
        style={styles.input}
        placeholder="District (optionnel)"
        autoCapitalize="characters"
        value={form.districtCode}
        onChangeText={(v) => setForm({ ...form, districtCode: v })}
      />
      <Text style={styles.groupLabel}>Niveau d'etablissement</Text>
      <View style={styles.typeGroup}>
        {LEVEL_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[styles.typeChip, form.level === option.value ? styles.typeChipActive : null]}
            onPress={() => setForm({ ...form, level: option.value })}
          >
            <Text style={[styles.typeChipText, form.level === option.value ? styles.typeChipTextActive : null]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.groupLabel}>Type d'etablissement</Text>
      <View style={styles.typeGroup}>
        {ESTABLISHMENT_TYPE_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[styles.typeChip, form.establishmentType === option.value ? styles.typeChipActive : null]}
            onPress={() => setForm({ ...form, establishmentType: option.value })}
          >
            <Text style={[styles.typeChipText, form.establishmentType === option.value ? styles.typeChipTextActive : null]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        multiline
        placeholder="Plateau technique"
        value={form.technicalPlatform}
        onChangeText={(v) => setForm({ ...form, technicalPlatform: v })}
      />
      <TextInput
        style={styles.input}
        placeholder="Services (Urgences, Radiologie, ... )"
        value={form.servicesCsv}
        onChangeText={(v) => setForm({ ...form, servicesCsv: v })}
      />

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.flex]}
          keyboardType="numeric"
          placeholder="Latitude"
          value={form.latitude}
          onChangeText={(v) => setForm({ ...form, latitude: v })}
        />
        <TextInput
          style={[styles.input, styles.flex]}
          keyboardType="numeric"
          placeholder="Longitude"
          value={form.longitude}
          onChangeText={(v) => setForm({ ...form, longitude: v })}
        />
      </View>

      <Pressable style={styles.secondaryButton} onPress={getCurrentPosition}>
        <Text style={styles.secondaryButtonText}>Utiliser ma position</Text>
      </Pressable>

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.primaryButton} onPress={createCenter} disabled={loading}>
        <Text style={styles.primaryButtonText}>
          {loading ? "Enregistrement..." : centerId ? "Mettre a jour" : "Enregistrer"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 10, paddingBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  input: {
    backgroundColor: "#fff",
    borderColor: "#d0e3ec",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  inputMultiline: { minHeight: 90, textAlignVertical: "top" },
  groupLabel: { color: "#0f172a", fontWeight: "600", marginTop: 2 },
  typeGroup: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  typeChip: {
    borderWidth: 1,
    borderColor: "#d0e3ec",
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  typeChipActive: {
    backgroundColor: "#0b7285",
    borderColor: "#0b7285"
  },
  typeChipText: { color: "#0f172a", fontWeight: "600" },
  typeChipTextActive: { color: "#fff" },
  row: { flexDirection: "row", gap: 8 },
  flex: { flex: 1 },
  secondaryButton: {
    borderColor: "#0b7285",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center"
  },
  secondaryButtonText: { color: "#0b7285", fontWeight: "600" },
  primaryButton: {
    backgroundColor: "#0b7285",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center"
  },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
  error: { color: "#b42318" },
  success: { color: "#067647" }
});
