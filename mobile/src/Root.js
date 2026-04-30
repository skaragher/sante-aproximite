import { ActivityIndicator, AppState, Image, Linking, Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useEffect, useRef, useState } from "react";
import { apiFetch, getPendingRequestsCount, syncPendingRequests } from "./api/client";
import { useAuth } from "./context/AuthContext";
import { C, S } from "./theme";
import { AuthScreen } from "./screens/AuthScreen";
import { ProjectDigitalizationModal } from "./components/ProjectDigitalizationModal";

const MODULE_ICONS = {
  centers:   { uri: "https://img.icons8.com/color/96/hospital-3.png" },
  complaints:{ uri: "https://img.icons8.com/color/96/complaint.png" },
  tracking:  { uri: "https://img.icons8.com/color/96/time-machine.png" },
  chef:      { uri: "https://img.icons8.com/color/96/clinic.png" },
  alerts:    { uri: "https://img.icons8.com/color/96/ambulance.png" },
  emergency: { uri: "https://img.icons8.com/color/96/ambulance.png" },
  security:  { uri: "https://img.icons8.com/color/96/police-badge.png" },
  settings:  { uri: "https://img.icons8.com/color/96/settings.png" },
  developer: { uri: "https://img.icons8.com/color/96/filled-topic.png" },
  project:   { uri: "https://img.icons8.com/color/96/rocket--v1.png" },
};

const MODULE_COLORS = {
  nearby:              C.teal,
  complaints:          C.primary,
  complaints_tracking: C.primary,
  chef:                C.teal,
  alerts:              C.orange,
  emergency:           C.red,
  security_alert:      "#7C3AED",
  security_ops:        C.primary,
  settings:            C.textMuted,
};

export function Root() {
  const { user, token, ready, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState("nearby");
  const [menuOpen, setMenuOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [supportActionsOpen, setSupportActionsOpen] = useState(false);
  const [chefCenterApprovalStatus, setChefCenterApprovalStatus] = useState(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncNotice, setSyncNotice] = useState(null);
  const autoSelectedResponderTab = useRef(false);
  const pendingSyncCountRef = useRef(0);
  const syncNoticeTimeoutRef = useRef(null);

  const normalizeRoleValue = (value) => String(value || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  const normalizedRole = normalizeRoleValue(user?.role);
  const normalizedRoles = Array.from(
    new Set(
      [
        ...((Array.isArray(user?.roles) ? user.roles : []).map((entry) => normalizeRoleValue(entry?.role || entry))),
        normalizedRole
      ].filter(Boolean)
    )
  );
  const hasRole = (roleName) => normalizedRoles.includes(roleName);
  const hasAnyRole = (roleNames) => roleNames.some((roleName) => hasRole(roleName));
  const canManageCenters = hasAnyRole(["CHEF_ETABLISSEMENT", "ETABLISSEMENT"]);
  const canManageCenterSettings = hasAnyRole(["REGULATOR", "NATIONAL", "REGION", "DISTRICT"]) || canManageCenters;
  const chefHasPendingOrMissingCenter =
    canManageCenters && (!chefCenterApprovalStatus || chefCenterApprovalStatus === "PENDING");
  const isEmergencyResponder  = hasAnyRole(["SAMU", "SAPEUR_POMPIER", "SAPPEUR_POMPIER", "PROTECTION_CIVILE"]);
  const isSecurityResponder   = hasAnyRole(["POLICE", "GENDARMERIE"]);
  const isAnyResponder        = isEmergencyResponder || isSecurityResponder;
  const hasStandardMobileRole = hasAnyRole(["USER", "UTILISATEUR", "PATIENT"]);
  const canSeeNearby          = !canManageCenters || chefHasPendingOrMissingCenter;
  const canComplain           = (!canManageCenters || chefHasPendingOrMissingCenter) && (hasStandardMobileRole || !isAnyResponder);
  const canSendEmergencyRequest = (!canManageCenters || chefHasPendingOrMissingCenter) && (hasStandardMobileRole || !isAnyResponder);

  const emergencyAlertsLabel = hasRole("SAMU") && hasAnyRole(["SAPEUR_POMPIER", "SAPPEUR_POMPIER"])
    ? "Urgences sanitaires SAMU & Pompiers"
    : hasRole("SAMU")
      ? "Urgences sanitaires SAMU"
      : hasRole("PROTECTION_CIVILE")
        ? "Urgences sanitaires Protection Civile"
        : "Urgences sanitaires Pompiers";

  useEffect(() => {
    function showSyncNotice(message, tone = "info") {
      if (syncNoticeTimeoutRef.current) clearTimeout(syncNoticeTimeoutRef.current);
      setSyncNotice({ message, tone });
      syncNoticeTimeoutRef.current = setTimeout(() => {
        setSyncNotice(null);
        syncNoticeTimeoutRef.current = null;
      }, 4500);
    }

    const runSync = async () => {
      try {
        await syncPendingRequests();
      } finally {
        const nextCount = await getPendingRequestsCount().catch(() => 0);
        const previousCount = pendingSyncCountRef.current;
        if (previousCount === 0 && nextCount > 0) {
          showSyncNotice("Vous etes hors ligne. Les actions seront synchronisees automatiquement.", "warning");
        } else if (previousCount > 0 && nextCount === 0) {
          showSyncNotice("Synchronisation terminee.", "success");
        }
        pendingSyncCountRef.current = nextCount;
        setPendingSyncCount(nextCount);
      }
    };
    runSync();
    const interval = setInterval(runSync, 30000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") runSync();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
      if (syncNoticeTimeoutRef.current) clearTimeout(syncNoticeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadChefCenterStatus() {
      if (!user || !token || !canManageCenters) {
        if (!cancelled) setChefCenterApprovalStatus(null);
        return;
      }
      try {
        const centers = await apiFetch("/centers", { token });
        const first = Array.isArray(centers) ? centers[0] : null;
        if (!cancelled) setChefCenterApprovalStatus(first?.approvalStatus || null);
      } catch {
        if (!cancelled) setChefCenterApprovalStatus(null);
      }
    }
    loadChefCenterStatus();
    const interval = setInterval(() => { loadChefCenterStatus().catch(() => {}); }, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user, token, canManageCenters]);

  useEffect(() => {
    if (canManageCenters) {
      if (chefHasPendingOrMissingCenter) return;
      setCurrentTab("chef");
      return;
    }
    if (isSecurityResponder && !autoSelectedResponderTab.current) {
      setCurrentTab("security_ops");
      autoSelectedResponderTab.current = true;
      return;
    }
    if (isEmergencyResponder && !autoSelectedResponderTab.current) {
      setCurrentTab("alerts");
      autoSelectedResponderTab.current = true;
      return;
    }
    if (!canSeeNearby && currentTab === "nearby") {
      setCurrentTab("complaints");
      return;
    }
    if (!canComplain && ["complaints", "complaints_tracking"].includes(currentTab)) {
      setCurrentTab("nearby");
    }
  }, [canManageCenters, chefHasPendingOrMissingCenter, isEmergencyResponder, canSeeNearby, canComplain, currentTab]);

  if (!ready) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={C.primary} />
      </SafeAreaView>
    );
  }

  if (!user) return <AuthScreen />;

  function renderCurrentScreen() {
    if (canSeeNearby && currentTab === "nearby") {
      const { NearbyScreen } = require("./screens/NearbyScreen");
      return <NearbyScreen />;
    }
    if (canComplain && currentTab === "complaints") {
      const { ComplaintScreen } = require("./screens/ComplaintScreen");
      return <ComplaintScreen hideHistory />;
    }
    if (canComplain && currentTab === "complaints_tracking") {
      const { ComplaintScreen } = require("./screens/ComplaintScreen");
      return <ComplaintScreen hideForm />;
    }
    if (currentTab === "chef") {
      const { ChefScreen } = require("./screens/ChefScreen");
      return <ChefScreen />;
    }
    if (currentTab === "alerts") {
      const { EmergencyOpsScreen } = require("./screens/EmergencyOpsScreen");
      return <EmergencyOpsScreen />;
    }
    if (currentTab === "security_ops") {
      const { SecurityAlertOpsScreen } = require("./screens/SecurityAlertOpsScreen");
      return <SecurityAlertOpsScreen />;
    }
    if (currentTab === "emergency") {
      const { EmergencyScreen } = require("./screens/EmergencyScreen");
      return <EmergencyScreen />;
    }
    if (currentTab === "security_alert") {
      const { SecurityAlertScreen } = require("./screens/SecurityAlertScreen");
      return <SecurityAlertScreen />;
    }
    if (currentTab === "settings") {
      const { CenterSettingsScreen } = require("./screens/CenterSettingsScreen");
      return <CenterSettingsScreen />;
    }
    if (currentTab === "contact_developer") {
      const { ContactDeveloperScreen } = require("./screens/ContactDeveloperScreen");
      return <ContactDeveloperScreen />;
    }
    return null;
  }

  const tabs = [
    ...(canSeeNearby           ? [{ key: "nearby",              label: "Centres de sante",       icon: MODULE_ICONS.centers   }] : []),
    ...(canComplain             ? [{ key: "complaints",          label: "Poser une plainte",      icon: MODULE_ICONS.complaints }] : []),
    ...(canComplain             ? [{ key: "complaints_tracking", label: "Suivi des plaintes",     icon: MODULE_ICONS.tracking   }] : []),
    ...(canManageCenters        ? [{ key: "chef",                label: "Espace chef",            icon: MODULE_ICONS.chef       }] : []),
    ...(isEmergencyResponder    ? [{ key: "alerts",              label: emergencyAlertsLabel,     icon: MODULE_ICONS.alerts     }] : []),
    ...(isSecurityResponder     ? [{ key: "security_ops",        label: "Urgences securitaires",   icon: MODULE_ICONS.security   }] : []),
    ...(canSendEmergencyRequest ? [{ key: "emergency",           label: "Urgence sanitaire",      icon: MODULE_ICONS.emergency  }] : []),
    ...(canSendEmergencyRequest ? [{ key: "security_alert",      label: "Urgence securitaire",    icon: MODULE_ICONS.security   }] : []),
    ...(canManageCenterSettings ? [{ key: "settings",            label: "Parametres centres",     icon: MODULE_ICONS.settings   }] : []),
  ];

  const activeTab = tabs.find((t) => t.key === currentTab);
  const supportCardActive = currentTab === "contact_developer" || projectModalOpen || supportActionsOpen;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoWrap}>
            <Image source={require("../assets/logo-sante.png")} style={styles.logo} />
          </View>
          <View style={styles.brandText}>
            <Text style={styles.appName} numberOfLines={1}>Sante Aproximite</Text>
            <Text style={styles.userName} numberOfLines={1}>{user.fullName}</Text>
          </View>
        </View>
        <View style={styles.topBarRight}>
          {activeTab ? (
            <View style={[styles.moduleLabel, { backgroundColor: MODULE_COLORS[currentTab] || C.primary }]}>
              <Text style={styles.moduleLabelText} numberOfLines={1}>{activeTab.label}</Text>
            </View>
          ) : null}
          <Pressable style={styles.menuBtn} onPress={() => setMenuOpen(true)} accessibilityLabel="Menu">
            <View style={styles.hamburger}>
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </View>
          </Pressable>
        </View>
      </View>

      {/* Full-screen menu overlay */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.drawer} onPress={() => {}}>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerUserRow}>
                <View style={styles.drawerAvatar}>
                  <Text style={styles.drawerAvatarText}>{String(user.fullName || "?")[0].toUpperCase()}</Text>
                </View>
                <View style={styles.drawerUserInfo}>
                  <Text style={styles.drawerUserName}>{user.fullName}</Text>
                  <Text style={styles.drawerUserRole}>{normalizedRole || "Utilisateur"}</Text>
                </View>
              </View>
              <Pressable style={styles.drawerCloseBtn} onPress={() => setMenuOpen(false)}>
                <Text style={styles.drawerCloseBtnText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.drawerDivider} />

            <View style={styles.moduleGrid}>
              {tabs.map((tab) => {
                const accent = MODULE_COLORS[tab.key] || C.primary;
                const isActive = currentTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    style={[styles.moduleCard, isActive && { borderColor: accent, borderWidth: 2 }]}
                    onPress={() => { setCurrentTab(tab.key); setMenuOpen(false); }}
                  >
                    {isActive ? <View style={[styles.moduleCardActiveBar, { backgroundColor: accent }]} /> : null}
                    <Image source={tab.icon} style={styles.moduleCardIcon} />
                    <Text style={[styles.moduleCardText, isActive && { color: accent }]}>{tab.label}</Text>
                  </Pressable>
                );
              })}

              <Pressable
                style={[styles.moduleCard, supportCardActive && { borderColor: C.amber, borderWidth: 2 }]}
                onPress={() => setSupportActionsOpen((value) => !value)}
              >
                {supportCardActive ? <View style={[styles.moduleCardActiveBar, { backgroundColor: C.amber }]} /> : null}
                <Image source={MODULE_ICONS.developer} style={styles.moduleCardIcon} />
                <Text style={[styles.moduleCardText, supportCardActive && { color: C.amber }]}>Support & projet</Text>
              </Pressable>
            </View>

            {supportActionsOpen ? (
              <>
                <View style={styles.drawerDivider} />

                <View style={styles.supportModuleCard}>
                  <View style={styles.supportModuleHeader}>
                    <Text style={styles.supportModuleTitle}>Support & projet</Text>
                    <Text style={styles.supportModuleHint}>Choisissez l’action que vous voulez lancer</Text>
                  </View>

                  <View style={styles.supportModuleBody}>
                    <Pressable
                      style={[styles.supportActionBtn, styles.supportActionBtnYellow]}
                      onPress={() => {
                        setCurrentTab("contact_developer");
                        setSupportActionsOpen(false);
                        setMenuOpen(false);
                      }}
                    >
                      <Image source={MODULE_ICONS.developer} style={styles.supportActionIcon} />
                      <View style={styles.supportActionTextWrap}>
                        <Text style={styles.supportActionTitleDark}>Contacter le developpeur</Text>
                        <Text style={styles.supportActionSubDark}>Message direct a YEFA Technologie</Text>
                      </View>
                    </Pressable>

                    <Pressable
                      style={[styles.supportActionBtn, styles.supportActionBtnRed]}
                      onPress={() => {
                        setSupportActionsOpen(false);
                        setMenuOpen(false);
                        setProjectModalOpen(true);
                      }}
                    >
                      <Image source={MODULE_ICONS.project} style={styles.supportActionIcon} />
                      <View style={styles.supportActionTextWrap}>
                        <Text style={styles.supportActionTitleLight}>Vous avez un projet de digitalisation ?</Text>
                        <Text style={styles.supportActionSubLight}>Cliquez ici et parlez-en a YEFA</Text>
                      </View>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.drawerDivider} />
              </>
            ) : (
              <View style={styles.drawerDivider} />
            )}

            <Pressable
              style={styles.logoutBtn}
              onPress={() => { setMenuOpen(false); logout(); }}
            >
              <Text style={styles.logoutBtnText}>Se deconnecter</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <ProjectDigitalizationModal visible={projectModalOpen} onClose={() => setProjectModalOpen(false)} />

      {/* Content */}
      <View style={styles.content}>
        {syncNotice ? (
          <View
            style={[
              styles.syncNotice,
              syncNotice.tone === "success" ? styles.syncNoticeSuccess : styles.syncNoticeWarning
            ]}
          >
            <Text
              style={[
                styles.syncNoticeText,
                syncNotice.tone === "success" ? styles.syncNoticeTextSuccess : styles.syncNoticeTextWarning
              ]}
            >
              {syncNotice.message}
            </Text>
          </View>
        ) : null}
        {renderCurrentScreen()}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by YEFA TECHNOLOGIE</Text>
       <Text
    style={[styles.footerText, { color: '#2563eb' }]}
    onPress={() => Linking.openURL('mailto:yefa.technologie@gmail.com')}
  >
    yefa.technologie@gmail.com
  </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centered:  { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg },

  // Top bar
  topBar: {
    marginTop: 10,
    marginHorizontal: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.primary,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...S.md,
  },
  brandRow:    { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
  logoWrap:    { borderRadius: 12, overflow: "hidden", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  logo:        { width: 36, height: 36 },
  brandText:   { flex: 1, minWidth: 0 },
  appName:     { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
  userName:    { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "500", marginTop: 1 },
  topBarRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  moduleLabel: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 120,
  },
  moduleLabelText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  menuBtn:     { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  hamburger:   { gap: 5, alignItems: "center" },
  hamburgerLine: { width: 18, height: 2, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.9)" },

  // Modal overlay
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    justifyContent: "flex-end",
  },
  drawer: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: "85%",
  },
  drawerHeader:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  drawerUserRow:   { flexDirection: "row", alignItems: "center", gap: 12 },
  drawerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerAvatarText: { color: "#fff", fontWeight: "800", fontSize: 20 },
  drawerUserInfo:   { gap: 2 },
  drawerUserName:   { fontWeight: "700", fontSize: 16, color: C.textDark },
  drawerUserRole:   { fontSize: 12, color: C.textMuted, fontWeight: "600" },
  drawerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerCloseBtnText: { color: C.textMuted, fontWeight: "700", fontSize: 14 },
  drawerDivider:  { height: 1, backgroundColor: C.border, marginVertical: 14 },

  moduleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  moduleCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 8,
    overflow: "hidden",
    ...S.sm,
  },
  moduleCardActiveBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  moduleCardIcon: { width: 32, height: 32 },
  moduleCardText: {
    color: C.textMed,
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },
  supportModuleCard: {
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    ...S.sm,
  },
  supportModuleHeader: { gap: 4 },
  supportModuleTitle: {
    color: C.textDark,
    fontSize: 14,
    fontWeight: "800",
  },
  supportModuleHint: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  supportModuleBody: {
    gap: 10,
  },
  supportActionBtn: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...S.sm,
  },
  supportActionBtnYellow: {
    backgroundColor: "#FACC15",
  },
  supportActionBtnRed: {
    backgroundColor: "#DC2626",
  },
  supportActionIcon: { width: 28, height: 28 },
  supportActionTextWrap: { flex: 1, minWidth: 0 },
  supportActionTitleDark: { color: "#1F2937", fontWeight: "900", fontSize: 16 },
  supportActionSubDark: { color: "#4B5563", fontSize: 12, marginTop: 3, fontWeight: "600" },
  supportActionTitleLight: { color: "#FFFFFF", fontWeight: "900", fontSize: 15 },
  supportActionSubLight: { color: "rgba(255,255,255,0.88)", fontSize: 12, marginTop: 3, fontWeight: "600" },

  logoutBtn: {
    backgroundColor: C.redLight,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.red + "50",
  },
  logoutBtnText: { color: C.red, fontWeight: "700", fontSize: 15 },

  content: { flex: 1, marginTop: 10 },
  syncNotice: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  syncNoticeWarning: {
    backgroundColor: C.amberLight,
    borderColor: C.amber,
  },
  syncNoticeSuccess: {
    backgroundColor: C.greenLight,
    borderColor: C.green,
  },
  syncNoticeText: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  syncNoticeTextWarning: { color: C.amber },
  syncNoticeTextSuccess: { color: C.green },
  footer: {
    paddingVertical: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.surface,
  },
  footerText: { color: C.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
});
