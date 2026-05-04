import { ActivityIndicator, AppState, Image, Linking, Modal, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useRef, useState } from "react";
import { apiFetch, clearLocalCache, getPendingRequestsCount, syncPendingRequests } from "./api/client";
import { useAuth } from "./context/AuthContext";
import { C, S } from "./theme";
import { AuthScreen } from "./screens/AuthScreen";
import { ProjectDigitalizationModal } from "./components/ProjectDigitalizationModal";

const APP_VERSION = "1.0.0";

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

  // Refresh & update state
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

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

  // Check for app update on mount
  useEffect(() => {
    async function checkForUpdate() {
      try {
        const data = await apiFetch("/version", { token: null });
        if (data?.version && data.version !== APP_VERSION) {
          setUpdateAvailable(true);
          setUpdateVersion(data.version);
        }
      } catch {
        // ignore — offline or endpoint not available
      }
    }
    checkForUpdate();
  }, []);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    await new Promise((r) => setTimeout(r, 900));
    setRefreshing(false);
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    await clearLocalCache();
    await new Promise((r) => setTimeout(r, 600));
    setClearingCache(false);
    setRefreshKey((k) => k + 1);
  };

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
      return <NearbyScreen key={refreshKey} />;
    }
    if (canComplain && currentTab === "complaints") {
      const { ComplaintScreen } = require("./screens/ComplaintScreen");
      return <ComplaintScreen key={refreshKey} hideHistory />;
    }
    if (canComplain && currentTab === "complaints_tracking") {
      const { ComplaintScreen } = require("./screens/ComplaintScreen");
      return <ComplaintScreen key={refreshKey} hideForm />;
    }
    if (currentTab === "chef") {
      const { ChefScreen } = require("./screens/ChefScreen");
      return <ChefScreen key={refreshKey} />;
    }
    if (currentTab === "alerts") {
      const { EmergencyOpsScreen } = require("./screens/EmergencyOpsScreen");
      return <EmergencyOpsScreen key={refreshKey} />;
    }
    if (currentTab === "security_ops") {
      const { SecurityAlertOpsScreen } = require("./screens/SecurityAlertOpsScreen");
      return <SecurityAlertOpsScreen key={refreshKey} />;
    }
    if (currentTab === "emergency") {
      const { EmergencyScreen } = require("./screens/EmergencyScreen");
      return <EmergencyScreen key={refreshKey} />;
    }
    if (currentTab === "security_alert") {
      const { SecurityAlertScreen } = require("./screens/SecurityAlertScreen");
      return <SecurityAlertScreen key={refreshKey} />;
    }
    if (currentTab === "settings") {
      const { CenterSettingsScreen } = require("./screens/CenterSettingsScreen");
      return <CenterSettingsScreen key={refreshKey} />;
    }
    if (currentTab === "contact_developer") {
      const { ContactDeveloperScreen } = require("./screens/ContactDeveloperScreen");
      return <ContactDeveloperScreen key={refreshKey} />;
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
          {/* Refresh button */}
          <Pressable
            style={styles.refreshBtn}
            onPress={handleRefresh}
            accessibilityLabel="Actualiser"
          >
            <Text style={[styles.refreshBtnText, refreshing && styles.refreshBtnTextSpinning]}>↻</Text>
          </Pressable>
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
                    <Text style={styles.supportModuleHint}>Choisissez l'action que vous voulez lancer</Text>
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

                    {/* A propos */}
                    <Pressable
                      style={[styles.supportActionBtn, { backgroundColor: C.primaryLight }]}
                      onPress={() => {
                        setSupportActionsOpen(false);
                        setMenuOpen(false);
                        setShowAbout(true);
                      }}
                    >
                      <Text style={styles.supportActionIconText}>ℹ️</Text>
                      <View style={styles.supportActionTextWrap}>
                        <Text style={[styles.supportActionTitleDark, { color: C.primaryDark }]}>A propos de l'application</Text>
                        <Text style={[styles.supportActionSubDark, { color: C.primary }]}>Version {APP_VERSION} — Sante et Securite a Proximite</Text>
                      </View>
                    </Pressable>

                    {/* Aide */}
                    <Pressable
                      style={[styles.supportActionBtn, { backgroundColor: C.tealLight }]}
                      onPress={() => {
                        setSupportActionsOpen(false);
                        setMenuOpen(false);
                        setShowHelp(true);
                      }}
                    >
                      <Text style={styles.supportActionIconText}>❓</Text>
                      <View style={styles.supportActionTextWrap}>
                        <Text style={[styles.supportActionTitleDark, { color: C.teal }]}>Aide & FAQ</Text>
                        <Text style={[styles.supportActionSubDark, { color: C.teal }]}>Comment utiliser l'application</Text>
                      </View>
                    </Pressable>

                    {/* Vider le cache */}
                    <Pressable
                      style={[styles.supportActionBtn, { backgroundColor: C.amberLight, opacity: clearingCache ? 0.6 : 1 }]}
                      onPress={async () => {
                        setSupportActionsOpen(false);
                        setMenuOpen(false);
                        await handleClearCache();
                      }}
                      disabled={clearingCache}
                    >
                      <Text style={styles.supportActionIconText}>🗑️</Text>
                      <View style={styles.supportActionTextWrap}>
                        <Text style={[styles.supportActionTitleDark, { color: C.amber }]}>
                          {clearingCache ? "Nettoyage en cours..." : "Vider le cache local"}
                        </Text>
                        <Text style={[styles.supportActionSubDark, { color: C.amber }]}>
                          Libere l'espace si l'appli est lente ou bloquee
                        </Text>
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
        {/* Update banner */}
        {updateAvailable ? (
          <Pressable
            style={styles.updateBanner}
            onPress={() => Linking.openURL("https://play.google.com/store/apps/details?id=com.yefa.sante")}
          >
            <Text style={styles.updateBannerText}>
              🚀 Mise a jour disponible (v{updateVersion}) — Appuyez pour mettre a jour
            </Text>
          </Pressable>
        ) : null}

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

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[C.primary]}
              tintColor={C.primary}
              title="Actualisation..."
              titleColor={C.textMuted}
            />
          }
          scrollEnabled={false}
          nestedScrollEnabled
        >
          {renderCurrentScreen()}
        </ScrollView>
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

      {/* A propos modal */}
      <Modal visible={showAbout} transparent animationType="slide" onRequestClose={() => setShowAbout(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>A propos</Text>
              <Pressable style={styles.drawerCloseBtn} onPress={() => setShowAbout(false)}>
                <Text style={styles.drawerCloseBtnText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.aboutLogoWrap}>
                <Image source={require("../assets/logo-sante.png")} style={styles.aboutLogo} resizeMode="contain" />
              </View>

              <Text style={styles.aboutAppName}>Sante et Securite a Proximite</Text>
              <Text style={styles.aboutVersion}>Version {APP_VERSION}</Text>

              <View style={styles.aboutDivider} />

              <Text style={styles.aboutSectionTitle}>Description</Text>
              <Text style={styles.aboutText}>
                Sante et Securite a Proximite est une application mobile permettant aux citoyens de localiser facilement les centres de sante et services d'urgence a proximite, de soumettre des plaintes, et de signaler des situations d'urgence sanitaire ou securitaire en temps reel.
              </Text>

              <View style={styles.aboutDivider} />

              <Text style={styles.aboutSectionTitle}>Fonctionnalites</Text>
              {[
                "Localisation des centres de sante les plus proches",
                "Soumission et suivi de plaintes",
                "Signalement d'urgences sanitaires et securitaires",
                "Interface dediee aux professionnels de sante",
                "Coordination SAMU, pompiers et forces de l'ordre",
                "Fonctionnement hors ligne avec synchronisation automatique",
              ].map((f, i) => (
                <View key={i} style={styles.aboutFeatureRow}>
                  <Text style={styles.aboutFeatureDot}>•</Text>
                  <Text style={styles.aboutFeatureText}>{f}</Text>
                </View>
              ))}

              <View style={styles.aboutDivider} />

              <Text style={styles.aboutSectionTitle}>Developpeur</Text>
              <Text style={styles.aboutText}>YEFA TECHNOLOGIE</Text>
              <Pressable onPress={() => Linking.openURL("mailto:yefa.technologie@gmail.com")}>
                <Text style={[styles.aboutText, { color: C.primary, fontWeight: "700", marginTop: 4 }]}>
                  yefa.technologie@gmail.com
                </Text>
              </Pressable>

              <View style={styles.aboutDivider} />

              <View style={styles.aboutVersionRow}>
                <Text style={styles.aboutVersionLabel}>Version de l'application</Text>
                <Text style={styles.aboutVersionValue}>{APP_VERSION}</Text>
              </View>
              {updateAvailable ? (
                <Pressable
                  style={[styles.aboutUpdateBtn]}
                  onPress={() => Linking.openURL("https://play.google.com/store/apps/details?id=com.yefa.sante")}
                >
                  <Text style={styles.aboutUpdateBtnText}>Mise a jour disponible : v{updateVersion} — Mettre a jour</Text>
                </Pressable>
              ) : (
                <Text style={styles.aboutUpToDate}>✓ Application a jour</Text>
              )}

              <View style={styles.aboutDivider} />

              <Pressable
                style={[styles.aboutUpdateBtn, { backgroundColor: C.amber, opacity: clearingCache ? 0.6 : 1 }]}
                onPress={async () => {
                  await handleClearCache();
                  setShowAbout(false);
                }}
                disabled={clearingCache}
              >
                <Text style={styles.aboutUpdateBtnText}>
                  {clearingCache ? "Nettoyage en cours..." : "🗑️  Vider le cache local"}
                </Text>
              </Pressable>
              <Text style={[styles.helpContact, { marginTop: 8 }]}>
                Vider le cache libere l'espace disque si l'application est lente ou affiche des erreurs de stockage.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Aide modal */}
      <Modal visible={showHelp} transparent animationType="slide" onRequestClose={() => setShowHelp(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Aide & FAQ</Text>
              <Pressable style={styles.drawerCloseBtn} onPress={() => setShowHelp(false)}>
                <Text style={styles.drawerCloseBtnText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {[
                {
                  q: "Comment trouver un centre de sante proche ?",
                  a: "Depuis l'ecran principal, l'application detecte votre position et affiche les centres de sante les plus proches sur la carte. Vous pouvez filtrer par type d'etablissement ou ajuster le rayon de recherche.",
                },
                {
                  q: "Comment actualiser les donnees ?",
                  a: "Faites glisser l'ecran vers le bas (tirer vers le bas) pour actualiser, ou appuyez sur le bouton ↻ en haut a droite de l'application.",
                },
                {
                  q: "Comment soumettre une plainte ?",
                  a: "Allez dans la section 'Poser une plainte', selectionnez le centre concerne, decrivez le probleme et soumettez. Vous pouvez suivre l'etat de vos plaintes dans 'Suivi des plaintes'.",
                },
                {
                  q: "Comment signaler une urgence sanitaire ?",
                  a: "Appuyez sur 'Urgence sanitaire' dans le menu. Remplissez le formulaire avec votre localisation et la description de l'urgence. Le SAMU ou les pompiers seront alertes.",
                },
                {
                  q: "Comment signaler une urgence securitaire ?",
                  a: "Appuyez sur 'Urgence securitaire'. Decrivez la situation et soumettez. La police ou la gendarmerie recevra l'alerte.",
                },
                {
                  q: "L'application fonctionne-t-elle sans connexion ?",
                  a: "Oui. Les actions effectuees hors ligne sont enregistrees localement et synchronisees automatiquement des que la connexion est retablie. Une notification vous informe de l'etat de la synchronisation.",
                },
                {
                  q: "Comment mettre a jour l'application ?",
                  a: "Si une mise a jour est disponible, une banniere s'affiche en haut de l'ecran. Appuyez dessus pour acceder a la mise a jour. Vous pouvez aussi verifier dans 'A propos' dans le menu Support.",
                },
                {
                  q: "Je suis chef d'etablissement, comment gerer mon centre ?",
                  a: "Connectez-vous avec votre compte chef. L'application vous redirige automatiquement vers 'Espace chef' ou vous pouvez gerer les informations de votre etablissement, suivre les plaintes et les services.",
                },
                {
                  q: "Comment contacter le support ?",
                  a: "Dans le menu (icone hamburger en haut a droite), allez dans 'Support & projet' puis 'Contacter le developpeur'. Vous pouvez aussi ecrire directement a yefa.technologie@gmail.com.",
                },
              ].map((item, i) => (
                <View key={i} style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>{item.q}</Text>
                  <Text style={styles.faqAnswer}>{item.a}</Text>
                </View>
              ))}

              <View style={styles.aboutDivider} />
              <Text style={styles.helpContact}>
                Vous n'avez pas trouve votre reponse ?{"\n"}
                Contactez-nous a{" "}
                <Text
                  style={{ color: C.primary, fontWeight: "700" }}
                  onPress={() => Linking.openURL("mailto:yefa.technologie@gmail.com")}
                >
                  yefa.technologie@gmail.com
                </Text>
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  refreshBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  refreshBtnText: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  refreshBtnTextSpinning: { opacity: 0.5 },
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
  supportModuleBody: { gap: 10 },
  supportActionBtn: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...S.sm,
  },
  supportActionBtnYellow: { backgroundColor: "#FACC15" },
  supportActionBtnRed:    { backgroundColor: "#DC2626" },
  supportActionIcon:      { width: 28, height: 28 },
  supportActionIconText:  { fontSize: 24 },
  supportActionTextWrap:  { flex: 1, minWidth: 0 },
  supportActionTitleDark: { color: "#1F2937", fontWeight: "900", fontSize: 16 },
  supportActionSubDark:   { color: "#4B5563", fontSize: 12, marginTop: 3, fontWeight: "600" },
  supportActionTitleLight: { color: "#FFFFFF", fontWeight: "900", fontSize: 15 },
  supportActionSubLight:   { color: "rgba(255,255,255,0.88)", fontSize: 12, marginTop: 3, fontWeight: "600" },

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

  // Update banner
  updateBanner: {
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: C.primaryDark,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    ...S.sm,
  },
  updateBannerText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  syncNotice: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  syncNoticeWarning: { backgroundColor: C.amberLight, borderColor: C.amber },
  syncNoticeSuccess: { backgroundColor: C.greenLight, borderColor: C.green },
  syncNoticeText:    { fontSize: 12, fontWeight: "700", textAlign: "center" },
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

  // Generic modal sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: C.textDark },

  // About
  aboutLogoWrap:   { alignItems: "center", marginBottom: 12 },
  aboutLogo:       { width: 80, height: 80, borderRadius: 20 },
  aboutAppName:    { fontSize: 18, fontWeight: "800", color: C.textDark, textAlign: "center" },
  aboutVersion:    { fontSize: 13, color: C.textMuted, fontWeight: "600", textAlign: "center", marginTop: 4, marginBottom: 4 },
  aboutDivider:    { height: 1, backgroundColor: C.border, marginVertical: 16 },
  aboutSectionTitle: { fontSize: 13, fontWeight: "800", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  aboutText:       { fontSize: 14, color: C.textMed, lineHeight: 22 },
  aboutFeatureRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  aboutFeatureDot: { color: C.primary, fontWeight: "900", fontSize: 16, lineHeight: 22 },
  aboutFeatureText:{ fontSize: 14, color: C.textMed, flex: 1, lineHeight: 22 },
  aboutVersionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  aboutVersionLabel: { fontSize: 14, color: C.textMuted, fontWeight: "600" },
  aboutVersionValue: { fontSize: 14, color: C.textDark, fontWeight: "700" },
  aboutUpdateBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    ...S.sm,
  },
  aboutUpdateBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  aboutUpToDate: { color: C.green, fontWeight: "700", fontSize: 14, textAlign: "center", paddingVertical: 10 },

  // Help / FAQ
  faqItem: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
    ...S.sm,
  },
  faqQuestion: { fontSize: 14, fontWeight: "800", color: C.textDark, marginBottom: 6 },
  faqAnswer:   { fontSize: 13, color: C.textMed, lineHeight: 20 },
  helpContact: { fontSize: 13, color: C.textMuted, textAlign: "center", lineHeight: 22 },
});
