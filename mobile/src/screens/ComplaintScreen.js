import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";

const QUICK_SUBJECTS = ["Accueil", "Temps d'attente", "Proprete", "Tarification", "Disponibilite des soins"];

function formatComplaintStatus(status) {
  if (status === "IN_PROGRESS") return "EN COURS";
  if (status === "NEW") return "NOUVELLE";
  if (status === "RESOLVED") return "RESOLUE";
  if (status === "REJECTED") return "REJETEE";
  return status || "-";
}

export function ComplaintScreen({ defaultHistoryTab = "ACTIVE", hideForm = false, hideHistory = false }) {
  const { token } = useAuth();
  const [centers, setCenters] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);
  const [complaintType, setComplaintType] = useState("WITH_CENTER");
  const [search, setSearch] = useState("");
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackLoadingComplaintId, setFeedbackLoadingComplaintId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [historyTab, setHistoryTab] = useState(defaultHistoryTab);

  async function loadData({ silent = false } = {}) {
    try {
      const [centerData, complaintData] = await Promise.all([
        apiFetch("/centers", { token }),
        apiFetch("/complaints/mine", { token })
      ]);
      setCenters(centerData);
      setMyComplaints(complaintData);
    } catch (err) {
      if (!silent) setError(err.message);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData({ silent: true }).catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, [token]);

  const filteredCenters = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return centers.slice(0, 20);
    return centers
      .filter((center) => center.name.toLowerCase().includes(q) || center.address.toLowerCase().includes(q))
      .slice(0, 20);
  }, [centers, search]);

  const needsCenter = complaintType === "WITH_CENTER";
  const canSubmit = subject.trim().length > 2 && message.trim().length > 9 && (!needsCenter || !!selectedCenter);
  const activeComplaints = myComplaints.filter((item) => !["RESOLVED", "REJECTED"].includes(item.status));
  const resolvedComplaints = myComplaints.filter((item) => ["RESOLVED", "REJECTED"].includes(item.status));
  const displayedComplaints = historyTab === "RESOLVED" ? resolvedComplaints : activeComplaints;

  async function submitComplaint() {
    setError("");
    setSuccess("");

    if (!subject.trim() || !message.trim()) {
      setError("Sujet et message sont obligatoires");
      return;
    }
    if (needsCenter && !selectedCenter) {
      setError("Selectionnez un centre ou passez en plainte generale");
      return;
    }

    setLoading(true);
    try {
      const result = await apiFetch("/complaints", {
        token,
        method: "POST",
        body: {
          centerId: needsCenter ? selectedCenter?._id ?? null : null,
          subject: subject.trim(),
          message: message.trim()
        }
      });
      if (result?.queued) {
        setSuccess(result.message || "Plainte enregistree hors ligne.");
      } else {
        setSuccess("Plainte envoyee avec succes");
      }
      setSubject("");
      setMessage("");
      if (needsCenter) {
        setSelectedCenter(null);
        setSearch("");
      }
      const mine = await apiFetch("/complaints/mine", { token });
      setMyComplaints(mine);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitComplaintFeedback(complaintId, status) {
    setError("");
    setSuccess("");
    setFeedbackLoadingComplaintId(complaintId);
    try {
      await apiFetch(`/complaints/${complaintId}/feedback`, {
        token,
        method: "POST",
        body: { status }
      });
      setSuccess("Validation enregistree");
      const mine = await apiFetch("/complaints/mine", { token });
      setMyComplaints(mine);
    } catch (err) {
      setError(err.message);
    } finally {
      setFeedbackLoadingComplaintId("");
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!hideForm ? <Text style={styles.title}>Poser une plainte</Text> : null}
      {!hideForm ? <Text style={styles.subtitle}>Choisissez le type, puis decrivez votre probleme.</Text> : null}

      {!hideForm ? (
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeButton, complaintType === "WITH_CENTER" && styles.modeButtonActive]}
            onPress={() => setComplaintType("WITH_CENTER")}
          >
            <Text style={[styles.modeButtonText, complaintType === "WITH_CENTER" && styles.modeButtonTextActive]}>
              Avec centre
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeButton, complaintType === "GENERAL" && styles.modeButtonActive]}
            onPress={() => setComplaintType("GENERAL")}
          >
            <Text style={[styles.modeButtonText, complaintType === "GENERAL" && styles.modeButtonTextActive]}>
              Generale
            </Text>
          </Pressable>
        </View>
      ) : null}

      {!hideForm && needsCenter ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Selection du centre</Text>
          <TextInput
            style={styles.input}
            placeholder="Rechercher un centre (nom ou adresse)"
            value={search}
            onChangeText={setSearch}
          />

          <View style={styles.selectedWrap}>
            <Text style={styles.selectedLabel}>Centre choisi</Text>
            <Text style={styles.selectedValue}>{selectedCenter ? selectedCenter.name : "Aucun centre selectionne"}</Text>
            {selectedCenter ? (
              <Pressable style={styles.clearButton} onPress={() => setSelectedCenter(null)}>
                <Text style={styles.clearButtonText}>Changer</Text>
              </Pressable>
            ) : null}
          </View>

          {!selectedCenter ? (
            <View style={styles.listBox}>
              <ScrollView style={styles.list} nestedScrollEnabled>
                {filteredCenters.map((center) => (
                  <Pressable
                    key={center._id}
                    style={[styles.centerItem, selectedCenter?._id === center._id && styles.centerItemSelected]}
                    onPress={() => setSelectedCenter(center)}
                  >
                    <Text style={styles.centerName}>{center.name}</Text>
                    <Text style={styles.centerAddress}>{center.address}</Text>
                  </Pressable>
                ))}
                {filteredCenters.length === 0 ? <Text style={styles.hint}>Aucun centre trouve.</Text> : null}
              </ScrollView>
            </View>
          ) : null}
        </View>
      ) : !hideForm ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Plainte generale</Text>
          <Text style={styles.hint}>Votre plainte ne sera pas liee a un centre specifique.</Text>
        </View>
      ) : null}

      {!hideForm ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sujet</Text>
          <View style={styles.quickSubjectWrap}>
            {QUICK_SUBJECTS.map((item) => (
              <Pressable
                key={item}
                style={[styles.quickSubjectButton, subject === item && styles.quickSubjectButtonActive]}
                onPress={() => setSubject(item)}
              >
                <Text style={[styles.quickSubjectText, subject === item && styles.quickSubjectTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Sujet de la plainte"
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Decrivez precisement le probleme"
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <Text style={styles.hint}>{message.trim().length} caractere(s)</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      {!hideForm ? (
        <Pressable style={[styles.submitButton, (!canSubmit || loading) && styles.submitButtonDisabled]} onPress={submitComplaint} disabled={!canSubmit || loading}>
          <Text style={styles.submitButtonText}>{loading ? "Envoi..." : "Envoyer la plainte"}</Text>
        </Pressable>
      ) : null}

      {!hideHistory ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Suivi de mes plaintes</Text>
          <View style={styles.historyTabsRow}>
            <Pressable
              style={[styles.historyTabButton, historyTab === "ACTIVE" && styles.historyTabButtonActive]}
              onPress={() => setHistoryTab("ACTIVE")}
            >
              <Text style={[styles.historyTabText, historyTab === "ACTIVE" && styles.historyTabTextActive]}>
                En cours
              </Text>
            </Pressable>
            <Pressable
              style={[styles.historyTabButton, historyTab === "RESOLVED" && styles.historyTabButtonActive]}
              onPress={() => setHistoryTab("RESOLVED")}
            >
              <Text style={[styles.historyTabText, historyTab === "RESOLVED" && styles.historyTabTextActive]}>
                Resolues
              </Text>
            </Pressable>
          </View>
          {displayedComplaints.length === 0 ? (
            <Text style={styles.hint}>Aucune plainte dans cet onglet.</Text>
          ) : null}
          {displayedComplaints.map((item) => (
            <View key={item.id} style={styles.centerItem}>
              <Text style={[styles.centerName, item.status === "REJECTED" && styles.rejectedText]}>{item.subject}</Text>
              <Text style={[styles.centerAddress, item.status === "REJECTED" && styles.rejectedText]}>
                Statut: {formatComplaintStatus(item.status)}
              </Text>
              <Text style={styles.hint}>{item.centerName || "Plainte generale"} - {new Date(item.createdAt).toLocaleString()}</Text>
              {Array.isArray(item.updates) ? item.updates.map((u) => (
                <Text key={u.id} style={styles.hint}>
                  • {formatComplaintStatus(u.status)}: {u.message} ({new Date(u.createdAt).toLocaleString()})
                </Text>
              )) : null}
              {["RESOLVED", "REJECTED"].includes(item.status) ? (
                item.userFeedbackStatus ? (
                  <Text style={styles.hint}>
                    Validation usager: {item.userFeedbackStatus === "SATISFIED" ? "Satisfait" : "Insatisfait"}
                  </Text>
                ) : (
                  <View style={styles.feedbackActionRow}>
                    <Pressable
                      style={styles.feedbackBadge}
                      onPress={() => submitComplaintFeedback(item.id, "SATISFIED")}
                    >
                      <Text style={styles.feedbackBadgeText}>
                        {feedbackLoadingComplaintId === item.id ? "..." : "Satisfait"}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.feedbackBadge, styles.feedbackBadgeDanger]}
                      onPress={() => submitComplaintFeedback(item.id, "UNSATISFIED")}
                    >
                      <Text style={styles.feedbackBadgeText}>
                        {feedbackLoadingComplaintId === item.id ? "..." : "Insatisfait"}
                      </Text>
                    </Pressable>
                  </View>
                )
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 30 },
  title: { fontSize: 21, fontWeight: "700", color: "#0f172a" },
  subtitle: { color: "#334155" },
  modeRow: { flexDirection: "row", gap: 8 },
  modeButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#0b7285",
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#f0fbff"
  },
  modeButtonActive: { backgroundColor: "#0b7285" },
  modeButtonText: { color: "#0b7285", fontWeight: "700" },
  modeButtonTextActive: { color: "#fff" },
  historyTabsRow: { flexDirection: "row", gap: 8 },
  historyTabButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#0b7285",
    paddingVertical: 9,
    alignItems: "center",
    backgroundColor: "#f0fbff"
  },
  historyTabButtonActive: { backgroundColor: "#0b7285" },
  historyTabText: { color: "#0b7285", fontWeight: "700" },
  historyTabTextActive: { color: "#fff" },
  sectionCard: {
    backgroundColor: "#fff",
    borderColor: "#d0e3ec",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12
  },
  sectionTitle: { color: "#0f172a", fontWeight: "700" },
  input: {
    backgroundColor: "#fff",
    borderColor: "#d0e3ec",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11
  },
  textArea: { minHeight: 110, textAlignVertical: "top" },
  selectedWrap: {
    borderColor: "#d0e3ec",
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#f8fbfe",
    padding: 10,
    gap: 6
  },
  selectedLabel: { color: "#64748b", fontSize: 12 },
  selectedValue: { color: "#0f172a", fontWeight: "700" },
  clearButton: {
    alignSelf: "flex-start",
    borderColor: "#64748b",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  clearButtonText: { color: "#64748b", fontWeight: "600" },
  quickSubjectWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickSubjectButton: {
    borderColor: "#93c5d2",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#f0fbff"
  },
  quickSubjectButtonActive: { borderColor: "#0b7285", backgroundColor: "#0b7285" },
  quickSubjectText: { color: "#0b7285", fontWeight: "600" },
  quickSubjectTextActive: { color: "#fff" },
  listBox: {
    borderColor: "#d0e3ec",
    borderWidth: 1,
    borderRadius: 12,
    maxHeight: 220,
    overflow: "hidden",
    backgroundColor: "#f8fbfe"
  },
  list: {
    padding: 8
  },
  centerItem: {
    backgroundColor: "#fff",
    borderColor: "#d0e3ec",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8
  },
  centerItemSelected: { borderColor: "#0b7285", borderWidth: 2 },
  centerName: { fontWeight: "700", color: "#0f172a" },
  centerAddress: { color: "#334155" },
  rejectedText: { color: "#b42318" },
  feedbackActionRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  feedbackBadge: {
    backgroundColor: "#0b7285",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  feedbackBadgeDanger: {
    backgroundColor: "#b42318"
  },
  feedbackBadgeText: { color: "#fff", fontWeight: "700" },
  submitButton: {
    backgroundColor: "#0b7285",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center"
  },
  submitButtonDisabled: { opacity: 0.55 },
  submitButtonText: { color: "#fff", fontWeight: "700" },
  hint: { color: "#64748b", fontSize: 12 },
  error: { color: "#b42318" },
  success: { color: "#067647" }
});
