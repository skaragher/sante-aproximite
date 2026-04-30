import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { apiFetch, getPendingRequests } from "../api/client";
import { loadCenterCatalog, syncCenterCatalog } from "../storage/centerCatalog";
import { useAuth } from "../context/AuthContext";
import { C, R, S, shared } from "../theme";

const QUICK_SUBJECTS = ["Accueil", "Temps d'attente", "Proprete", "Tarification", "Disponibilite des soins"];

const STATUS_CONFIG = {
  NEW:         { label: "NOUVELLE",    color: C.statusNew,        bg: C.statusNewBg        },
  IN_PROGRESS: { label: "EN COURS",    color: C.statusInProgress, bg: C.statusInProgressBg },
  RESOLVED:    { label: "RESOLUE",     color: C.statusResolved,   bg: C.statusResolvedBg   },
  REJECTED:    { label: "REJETEE",     color: C.statusRejected,   bg: C.statusRejectedBg   },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status || "-", color: C.textMuted, bg: C.bg };
  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function toOfflineComplaint(queueItem, centers) {
  const centerId = queueItem?.body?.centerId || null;
  const matchedCenter = Array.isArray(centers)
    ? centers.find((center) => String(center?._id || "") === String(centerId || ""))
    : null;
  return {
    id: `offline_${queueItem.createdAt}_${queueItem.body?.subject || "complaint"}`,
    subject: String(queueItem?.body?.subject || "Plainte hors ligne"),
    message: String(queueItem?.body?.message || ""),
    centerName: matchedCenter?.name || null,
    status: "IN_PROGRESS",
    updates: [
      {
        id: `offline_update_${queueItem.createdAt}`,
        message: "Plainte enregistree hors ligne. Synchronisation en attente."
      }
    ],
    createdAt: queueItem?.createdAt || new Date().toISOString(),
    isOfflinePending: true
  };
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
      const catalog = await loadCenterCatalog(token);
      setCenters(Array.isArray(catalog?.centers) ? catalog.centers : []);
      let complaintData = [];
      try {
        complaintData = await apiFetch("/complaints/mine", { token });
      } catch (err) {
        if (!silent) setError(err.message);
      }
      const queue = await getPendingRequests();
      const offlineComplaints = queue
        .filter((item) => item?.path === "/complaints" && String(item?.method || "").toUpperCase() === "POST")
        .map((item) => toOfflineComplaint(item, catalog?.centers || []));
      setMyComplaints([...(Array.isArray(complaintData) ? complaintData : []), ...offlineComplaints]);
      syncCenterCatalog(token)
        .then((nextCatalog) => setCenters(Array.isArray(nextCatalog?.centers) ? nextCatalog.centers : []))
        .catch(() => {});
    } catch (err) {
      if (!silent) setError(err.message);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(() => { loadData({ silent: true }).catch(() => {}); }, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const filteredCenters = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return centers.slice(0, 20);
    return centers.filter((center) =>
      center.name.toLowerCase().includes(q) || center.address.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [centers, search]);

  const needsCenter = complaintType === "WITH_CENTER";
  const canSubmit = subject.trim().length > 2 && message.trim().length > 9 && (!needsCenter || !!selectedCenter);
  const activeComplaints   = myComplaints.filter((item) => !["RESOLVED", "REJECTED"].includes(item.status));
  const resolvedComplaints = myComplaints.filter((item) =>  ["RESOLVED", "REJECTED"].includes(item.status));
  const displayedComplaints = historyTab === "RESOLVED" ? resolvedComplaints : activeComplaints;

  async function submitComplaint() {
    setError("");
    setSuccess("");
    if (!subject.trim() || !message.trim()) { setError("Sujet et message sont obligatoires"); return; }
    if (needsCenter && !selectedCenter) { setError("Selectionnez un centre ou passez en plainte generale"); return; }
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
        const queuedComplaint = toOfflineComplaint(
          {
            path: "/complaints",
            method: "POST",
            body: {
              centerId: needsCenter ? selectedCenter?._id ?? null : null,
              subject: subject.trim(),
              message: message.trim()
            },
            createdAt: new Date().toISOString()
          },
          centers
        );
        setMyComplaints((prev) => [queuedComplaint, ...prev]);
      } else {
        setSuccess("Plainte envoyee avec succes");
        const mine = await apiFetch("/complaints/mine", { token });
        setMyComplaints(mine);
      }
      setSubject("");
      setMessage("");
      if (needsCenter) { setSelectedCenter(null); setSearch(""); }
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {!hideForm ? (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Poser une plainte</Text>
            <Text style={styles.subtitle}>Decrivez votre experience pour ameliorer les services de sante.</Text>
          </View>

          {/* Type selector */}
          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeBtn, complaintType === "WITH_CENTER" && styles.modeBtnActive]}
              onPress={() => setComplaintType("WITH_CENTER")}
            >
              <Text style={[styles.modeBtnText, complaintType === "WITH_CENTER" && styles.modeBtnTextActive]}>
                Avec un centre
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeBtn, complaintType === "GENERAL" && styles.modeBtnActive]}
              onPress={() => setComplaintType("GENERAL")}
            >
              <Text style={[styles.modeBtnText, complaintType === "GENERAL" && styles.modeBtnTextActive]}>
                Plainte generale
              </Text>
            </Pressable>
          </View>

          {/* Center selection */}
          {needsCenter ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>CENTRE DE SANTE</Text>
              <TextInput
                style={styles.input}
                placeholder="Rechercher un centre..."
                placeholderTextColor={C.textLight}
                value={search}
                onChangeText={setSearch}
              />
              {selectedCenter ? (
                <View style={styles.selectedCenterBox}>
                  <View style={styles.selectedCenterInfo}>
                    <Text style={styles.selectedCenterName}>{selectedCenter.name}</Text>
                    <Text style={styles.selectedCenterAddr}>{selectedCenter.address}</Text>
                  </View>
                  <Pressable style={styles.changeCenterBtn} onPress={() => setSelectedCenter(null)}>
                    <Text style={styles.changeCenterBtnText}>Changer</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.centerList}>
                  {filteredCenters.map((center) => (
                    <Pressable
                      key={center._id}
                      style={styles.centerListItem}
                      onPress={() => setSelectedCenter(center)}
                    >
                      <Text style={styles.centerListName}>{center.name}</Text>
                      <Text style={styles.centerListAddr}>{center.address}</Text>
                    </Pressable>
                  ))}
                  {filteredCenters.length === 0 ? (
                    <Text style={shared.hint}>Aucun centre trouve.</Text>
                  ) : null}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxText}>Cette plainte ne sera pas liee a un centre specifique.</Text>
            </View>
          )}

          {/* Subject */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>SUJET</Text>
            <View style={styles.quickSubjects}>
              {QUICK_SUBJECTS.map((item) => (
                <Pressable
                  key={item}
                  style={[styles.quickChip, subject === item && styles.quickChipActive]}
                  onPress={() => setSubject(item)}
                >
                  <Text style={[styles.quickChipText, subject === item && styles.quickChipTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Ou saisissez un sujet libre..."
              placeholderTextColor={C.textLight}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          {/* Description */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Decrivez precisement le probleme rencontre..."
              placeholderTextColor={C.textLight}
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <Text style={shared.hint}>{message.trim().length} caractere(s)</Text>
          </View>

          {error   ? <Text style={styles.errorMsg}>{error}</Text>   : null}
          {success ? <Text style={styles.successMsg}>{success}</Text> : null}

          <Pressable
            style={[styles.submitBtn, (!canSubmit || loading) && styles.submitBtnDisabled]}
            onPress={submitComplaint}
            disabled={!canSubmit || loading}
          >
            <Text style={styles.submitBtnText}>{loading ? "Envoi en cours..." : "Envoyer la plainte"}</Text>
          </Pressable>
        </>
      ) : null}

      {/* History */}
      {!hideHistory ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>MES PLAINTES</Text>
          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tab, historyTab === "ACTIVE" && styles.tabActive]}
              onPress={() => setHistoryTab("ACTIVE")}
            >
              <Text style={[styles.tabText, historyTab === "ACTIVE" && styles.tabTextActive]}>
                En cours ({activeComplaints.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, historyTab === "RESOLVED" && styles.tabActive]}
              onPress={() => setHistoryTab("RESOLVED")}
            >
              <Text style={[styles.tabText, historyTab === "RESOLVED" && styles.tabTextActive]}>
                Resolues ({resolvedComplaints.length})
              </Text>
            </Pressable>
          </View>

          {displayedComplaints.length === 0 ? (
            <Text style={shared.hint}>Aucune plainte dans cet onglet.</Text>
          ) : null}

          {displayedComplaints.map((item) => (
            <View key={item.id} style={styles.complaintCard}>
              <View style={styles.complaintCardHeader}>
                <Text style={styles.complaintSubject}>{item.subject}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={styles.complaintMeta}>
                {item.centerName || "Plainte generale"} · {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              {item.isOfflinePending ? (
                <View style={styles.pendingSyncTag}>
                  <Text style={styles.pendingSyncTagText}>En attente de synchronisation</Text>
                </View>
              ) : null}
              {Array.isArray(item.updates) && item.updates.length > 0 ? (
                <View style={styles.updatesList}>
                  {item.updates.map((u) => (
                    <View key={u.id} style={styles.updateItem}>
                      <View style={styles.updateDot} />
                      <Text style={styles.updateText}>{u.message}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {["RESOLVED", "REJECTED"].includes(item.status) ? (
                item.userFeedbackStatus ? (
                  <View style={[
                    styles.feedbackTag,
                    { backgroundColor: item.userFeedbackStatus === "SATISFIED" ? C.greenLight : C.redLight }
                  ]}>
                    <Text style={[
                      styles.feedbackTagText,
                      { color: item.userFeedbackStatus === "SATISFIED" ? C.green : C.red }
                    ]}>
                      {item.userFeedbackStatus === "SATISFIED" ? "Satisfait" : "Insatisfait"}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.feedbackActions}>
                    <Text style={[shared.hint, { marginBottom: 6 }]}>Votre avis sur le traitement :</Text>
                    <View style={styles.feedbackBtns}>
                      <Pressable
                        style={styles.feedbackBtnSatisfied}
                        onPress={() => submitComplaintFeedback(item.id, "SATISFIED")}
                      >
                        <Text style={styles.feedbackBtnText}>
                          {feedbackLoadingComplaintId === item.id ? "..." : "Satisfait"}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.feedbackBtnUnsatisfied}
                        onPress={() => submitComplaintFeedback(item.id, "UNSATISFIED")}
                      >
                        <Text style={styles.feedbackBtnText}>
                          {feedbackLoadingComplaintId === item.id ? "..." : "Insatisfait"}
                        </Text>
                      </Pressable>
                    </View>
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
  container: { flex: 1, backgroundColor: C.bg },
  content:   { padding: 14, gap: 14, paddingBottom: 32 },

  header:   { gap: 4 },
  title:    { fontSize: 20, fontWeight: "800", color: C.textDark },
  subtitle: { fontSize: 13, color: C.textMuted },

  modeRow: { flexDirection: "row", gap: 8 },
  modeBtn: {
    flex: 1,
    borderRadius: R.sm,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: C.surface,
  },
  modeBtnActive:    { backgroundColor: C.primary, borderColor: C.primary },
  modeBtnText:      { color: C.textMed, fontWeight: "700", fontSize: 13 },
  modeBtnTextActive:{ color: "#fff" },

  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 10,
    ...S.sm,
  },
  sectionLabel: shared.sectionLabel,
  input: { ...shared.input },
  textArea: { ...shared.input, ...shared.textArea },

  infoBox: {
    backgroundColor: C.primaryLight,
    borderRadius: R.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: C.primary + "33",
  },
  infoBoxText: { color: C.primary, fontWeight: "600", fontSize: 13 },

  selectedCenterBox: {
    backgroundColor: C.primaryLight,
    borderRadius: R.sm,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectedCenterInfo:  { flex: 1 },
  selectedCenterName:  { fontWeight: "700", color: C.primary, fontSize: 14 },
  selectedCenterAddr:  { fontSize: 12, color: C.textMuted, marginTop: 2 },
  changeCenterBtn: {
    borderWidth: 1,
    borderColor: C.primary,
    borderRadius: R.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  changeCenterBtnText: { color: C.primary, fontWeight: "600", fontSize: 12 },

  centerList: { gap: 6, maxHeight: 200 },
  centerListItem: {
    backgroundColor: C.bg,
    borderRadius: R.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  centerListName: { fontWeight: "700", color: C.textDark, fontSize: 13 },
  centerListAddr: { color: C.textMuted, fontSize: 12, marginTop: 2 },

  quickSubjects: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickChip: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: C.bg,
  },
  quickChipActive:    { backgroundColor: C.primary, borderColor: C.primary },
  quickChipText:      { color: C.textMed, fontWeight: "600", fontSize: 12 },
  quickChipTextActive:{ color: "#fff" },

  submitBtn: {
    backgroundColor: C.primary,
    borderRadius: R.md,
    paddingVertical: 15,
    alignItems: "center",
    ...S.sm,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  errorMsg:   { ...shared.error,   backgroundColor: "#FEF2F2", padding: 10, borderRadius: R.sm },
  successMsg: { ...shared.success, backgroundColor: "#ECFDF5", padding: 10, borderRadius: R.sm },

  tabRow: { flexDirection: "row", gap: 8 },
  tab: {
    flex: 1,
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 9,
    alignItems: "center",
    backgroundColor: C.bg,
  },
  tabActive:    { backgroundColor: C.primary, borderColor: C.primary },
  tabText:      { color: C.textMed, fontWeight: "700", fontSize: 13 },
  tabTextActive:{ color: "#fff" },

  complaintCard: {
    backgroundColor: C.bg,
    borderRadius: R.sm,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  complaintCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  complaintSubject: { flex: 1, fontWeight: "700", color: C.textDark, fontSize: 14 },
  complaintMeta:    { fontSize: 12, color: C.textMuted },

  statusBadge: {
    borderRadius: R.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: { fontSize: 10, fontWeight: "700" },

  updatesList: { gap: 4, paddingLeft: 4 },
  updateItem:  { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  updateDot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: C.border, marginTop: 5 },
  updateText:  { flex: 1, fontSize: 12, color: C.textMed },

  feedbackTag: {
    alignSelf: "flex-start",
    borderRadius: R.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  feedbackTagText: { fontSize: 12, fontWeight: "700" },
  pendingSyncTag: {
    alignSelf: "flex-start",
    backgroundColor: C.amberLight,
    borderRadius: R.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pendingSyncTagText: { color: C.amber, fontSize: 12, fontWeight: "700" },

  feedbackActions: { gap: 6 },
  feedbackBtns: { flexDirection: "row", gap: 8 },
  feedbackBtnSatisfied: {
    flex: 1,
    backgroundColor: C.green,
    borderRadius: R.sm,
    paddingVertical: 8,
    alignItems: "center",
  },
  feedbackBtnUnsatisfied: {
    flex: 1,
    backgroundColor: C.red,
    borderRadius: R.sm,
    paddingVertical: 8,
    alignItems: "center",
  },
  feedbackBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
