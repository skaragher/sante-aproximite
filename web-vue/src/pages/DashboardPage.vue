<template>
  <main class="dashboard">
    <!-- Dashboard SAMU -->
    <SamuSection
      v-if="store.tab === 'overview' && isSamu"
    />
    <!-- Dashboard Sapeurs-Pompiers -->
    <SapeurPompierSection
      v-else-if="store.tab === 'overview' && isSapeurPompier"
    />
    <!-- Dashboard général (régulateurs, utilisateurs standards) -->
    <OverviewSection
      v-else-if="store.tab === 'overview' && !store.isChef"
    />
    <NearbySection
      v-show="store.tab === 'nearby' && !store.isChef"
    />
    <EmergencySection
      v-if="store.tab === 'emergency-alerts' && store.isEmergencyResponder"
    />
    <ComplaintsSection
      v-if="store.tab === 'complaints' && store.canSeeComplaintsPanel"
    />
    <EvaluationsSection
      v-if="store.tab === 'evaluations' && store.canSeeComplaintsPanel"
    />
    <MyCenterSection
      v-if="store.tab === 'my-center' && store.isChef"
    />
    <SettingsSection
      v-if="store.tab === 'settings' && store.isRegulator"
    />
    <ImportsSection
      v-if="store.tab === 'imports' && store.isRegulator"
    />
    <RolesSection
      v-if="store.tab === 'roles' && store.isRegulator"
    />
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useDashboardStore } from "../stores/dashboard";

import ComplaintsSection from "../components/dashboard/ComplaintsSection.vue";
import EmergencySection from "../components/dashboard/EmergencySection.vue";
import EvaluationsSection from "../components/dashboard/EvaluationsSection.vue";
import ImportsSection from "../components/dashboard/ImportsSection.vue";
import MyCenterSection from "../components/dashboard/MyCenterSection.vue";
import NearbySection from "../components/dashboard/NearbySection.vue";
import OverviewSection from "../components/dashboard/OverviewSection.vue";
import SamuSection from "../components/dashboard/SamuSection.vue";
import SapeurPompierSection from "../components/dashboard/SapeurPompierSection.vue";
import RolesSection from "../components/dashboard/RolesSection.vue";
import SettingsSection from "../components/dashboard/SettingsSection.vue";

const normalizeRole = (v) => String(v || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
const isSamu = computed(() => store.authRoles.includes("SAMU"));
const isSapeurPompier = computed(() =>
  store.authRoles.some((r) => ["SAPEUR_POMPIER", "SAPEUR_POMPIER"].includes(r))
);

const route = useRoute();
const store = useDashboardStore();

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  store.tab = store.resolveTab(route.query.tab);

  if (store.isEmergencyResponder) {
    store.fetchEmergencyAlerts();
    store.startEmergencyAutoRefresh();
  }

  if (store.isRegulator) {
    store.fetchUsers();
    store.fetchPendingCenters();
    store.fetchRegions();
    store.fetchDistricts();
    store.fetchComplaints();
    store.fetchComplaintSummary();
  }

  if (store.isChef) {
    store.fetchAllCenters().then(() => {
      if (!store.hasApprovedChefCenter) return;
      store.fetchComplaints();
      store.fetchComplaintSummary();
    });
  }
});

onBeforeUnmount(() => {
  store.stopEmergencyAutoRefresh();
});

// ─── Watchers ─────────────────────────────────────────────────────────────────
watch(
  () => store.tab,
  async (value) => {
    if (value === "emergency-alerts" && store.isEmergencyResponder) {
      await store.fetchEmergencyAlerts();
    }
    if (value === "complaints" && store.canSeeComplaintsPanel) {
      await store.fetchComplaints();
      await store.fetchComplaintSummary();
    }
    if (
      (value === "my-center" || value === "settings" || value === "evaluations") &&
      store.allCenters.length === 0
    ) {
      await store.fetchAllCenters();
    }
    if (value === "settings" && store.isRegulator) {
      await store.fetchAllCenters();
    }
    if ((value === "settings" || value === "imports") && store.isRegulator) {
      if (store.regions.length === 0) await store.fetchRegions();
      if (store.districts.length === 0) await store.fetchDistricts();
    }
    if (value === "evaluations" && store.canSeeComplaintsPanel) {
      await store.fetchComplaintSummary();
    }
  }
);

watch(
  () => route.query.tab,
  (value) => {
    store.tab = store.resolveTab(value);
  }
);

watch(
  [() => store.isChef, () => store.isRegulator, () => store.isEmergencyResponder],
  () => {
    store.tab = store.resolveTab(route.query.tab);
    if (store.isRegulator) {
      store.fetchRegions();
      store.fetchDistricts();
    }
  }
);

watch(
  () => store.isEmergencyResponder,
  (value) => {
    if (value) { store.startEmergencyAutoRefresh(); return; }
    store.stopEmergencyAutoRefresh();
  }
);
</script>
