import { ActivityIndicator, AppState, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useEffect, useRef, useState } from "react";
import { syncPendingRequests } from "./api/client";
import { useAuth } from "./context/AuthContext";
import { AuthScreen } from "./screens/AuthScreen";
import { ChefScreen } from "./screens/ChefScreen";
import { ComplaintScreen } from "./screens/ComplaintScreen";
import { EmergencyOpsScreen } from "./screens/EmergencyOpsScreen";
import { EmergencyScreen } from "./screens/EmergencyScreen";
import { NearbyScreen } from "./screens/NearbyScreen";

const MENU_ICON_URIS = {
  centers: "https://img.icons8.com/color/96/hospital-3.png",
  complaints: "https://img.icons8.com/color/96/complaint.png",
  tracking: "https://img.icons8.com/color/96/time-machine.png",
  chef: "https://img.icons8.com/color/96/clinic.png",
  alerts: "https://img.icons8.com/color/96/ambulance.png",
  emergency: "https://img.icons8.com/color/96/ambulance.png",
  logout: "https://img.icons8.com/color/96/exit.png"
};

export function Root() {
  const { user, ready, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState("nearby");
  const [menuOpen, setMenuOpen] = useState(false);
  const autoSelectedResponderTab = useRef(false);
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
  const canManageCenters = hasRole("CHEF_ETABLISSEMENT");
  const isEmergencyResponder = hasAnyRole(["SAMU", "SAPPEUR_POMPIER", "SAPEUR_POMPIER"]);
  const hasStandardMobileRole = hasAnyRole(["USER", "UTILISATEUR", "PATIENT"]);
  const canSeeNearby = !canManageCenters;
  const canComplain = !canManageCenters && (hasStandardMobileRole || !isEmergencyResponder);
  const canSendEmergencyRequest = !canManageCenters && (hasStandardMobileRole || !isEmergencyResponder);
  const emergencyAlertsLabel = hasRole("SAMU") && hasAnyRole(["SAPPEUR_POMPIER", "SAPEUR_POMPIER"])
    ? "Alertes SAMU & Sapeur-pompier"
    : hasRole("SAMU")
      ? "Alertes SAMU"
      : "Alertes Sapeur-pompier";

  useEffect(() => {
    const runSync = () => {
      syncPendingRequests().catch(() => {});
    };

    runSync();
    const interval = setInterval(runSync, 30000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") runSync();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (canManageCenters) {
      setCurrentTab("chef");
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
  }, [canManageCenters, isEmergencyResponder, canSeeNearby, canComplain, currentTab]);

  if (!ready) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#0b7285" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const tabs = [
    ...(canSeeNearby ? [{ key: "nearby", label: "Geolocalisation des centres de sante", iconUri: MENU_ICON_URIS.centers }] : []),
    ...(canComplain
      ? [
          { key: "complaints", label: "Poser une plaintes", iconUri: MENU_ICON_URIS.complaints },
          { key: "complaints_tracking", label: "Suivi des plaintes", iconUri: MENU_ICON_URIS.tracking }
        ]
      : []),
    ...(canManageCenters ? [{ key: "chef", label: "Espace chef", iconUri: MENU_ICON_URIS.chef }] : []),
    ...(isEmergencyResponder ? [{ key: "alerts", label: emergencyAlertsLabel, iconUri: MENU_ICON_URIS.alerts }] : []),
    ...(canSendEmergencyRequest ? [{ key: "emergency", label: "Urgence sanitaire", iconUri: MENU_ICON_URIS.emergency }] : [])
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.brandWrap}>
          <View style={styles.logoWrap}>
            <Image source={require("../assets/logo-sante.png")} style={styles.logo} />
          </View>
          <View style={styles.brandTextWrap}>
            <Text style={styles.title} numberOfLines={1}>Sante Aproximite</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{user.fullName}</Text>
          </View>
        </View>
        <Pressable style={styles.menuButton} onPress={() => setMenuOpen((prev) => !prev)} aria-label="Menu">
          <View style={styles.menuBars}>
            <View style={styles.menuBarLine} />
            <View style={styles.menuBarLine} />
            <View style={styles.menuBarLine} />
          </View>
        </Pressable>
      </View>

      {menuOpen ? (
        <View style={styles.dropdownMenu}>
          <View style={styles.menuGrid}>
            {tabs.map((tab) => (
              <Pressable
                key={tab.key}
                style={[styles.menuModule, currentTab === tab.key && styles.menuModuleActive]}
                onPress={() => {
                  setCurrentTab(tab.key);
                  setMenuOpen(false);
                }}
              >
                <Image source={{ uri: tab.iconUri }} style={styles.menuModuleIconImage} />
                <Text style={[styles.menuModuleText, currentTab === tab.key && styles.menuModuleTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={styles.menuModule}
              onPress={() => {
                setMenuOpen(false);
                logout();
              }}
            >
              <Image source={{ uri: MENU_ICON_URIS.logout }} style={styles.menuModuleIconImage} />
              <Text style={styles.menuModuleText}>Deconnexion</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.contentWrap}>
        {canSeeNearby && currentTab === "nearby" ? <NearbyScreen /> : null}
        {canComplain && currentTab === "complaints" ? <ComplaintScreen hideHistory /> : null}
        {canComplain && currentTab === "complaints_tracking" ? <ComplaintScreen hideForm /> : null}
        {currentTab === "chef" ? <ChefScreen /> : null}
        {currentTab === "alerts" ? <EmergencyOpsScreen /> : null}
        {currentTab === "emergency" ? <EmergencyScreen /> : null}
      </View>
      <View style={styles.footer}>
        <View style={styles.poweredBadge}>
          <Text style={styles.footerText}>Powered by YEFA TECHNOLOGIE</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5fbff", paddingTop: 8 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: {
    marginTop: 14,
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#0057b8",
    borderColor: "#00408a",
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  brandWrap: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, minWidth: 0 },
  logoWrap: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#b8d5ff",
    padding: 2,
    backgroundColor: "#00408a"
  },
  logo: { width: 34, height: 34, borderRadius: 10 },
  title: { fontSize: 18, fontWeight: "800", color: "#ffffff" },
  subtitle: { color: "#dbeafe", marginTop: 1, fontWeight: "600", fontSize: 12 },
  brandTextWrap: { flex: 1, minWidth: 0 },
  menuButton: {
    width: 36,
    height: 36,
    borderColor: "transparent",
    borderWidth: 0,
    borderRadius: 10,
    backgroundColor: "transparent"
  },
  menuBars: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  menuBarLine: { width: 16, height: 2, borderRadius: 999, backgroundColor: "#dbeafe" },
  dropdownMenu: {
    position: "absolute",
    top: 74,
    right: 12,
    width: 292,
    zIndex: 20,
    backgroundColor: "#edf4ff",
    borderColor: "#a7c7f7",
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    gap: 6
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  menuModule: {
    width: 130,
    minHeight: 86,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 10
  },
  menuModuleActive: {
    backgroundColor: "#2563eb",
    borderColor: "#1e40af"
  },
  menuModuleIconImage: {
    width: 26,
    height: 26,
    marginBottom: 6
  },
  menuModuleText: {
    color: "#1e3a8a",
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center"
  },
  menuModuleTextActive: { color: "#ffffff" },
  contentWrap: { flex: 1, paddingBottom: 8 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#dbe7ef",
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    alignItems: "center"
  },
  poweredBadge: {
    backgroundColor: "#e6f4f7",
    borderColor: "#9fd3de",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5
  },
  footerText: { color: "#0b7285", fontWeight: "800", fontSize: 12, letterSpacing: 0.2 }
});
