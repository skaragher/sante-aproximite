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
      v-if="store.tab === 'settings' && store.canManageUsers"
    />
    <ImportsSection
      v-if="store.tab === 'imports' && store.isRegulator"
    />
    <RolesSection
      v-if="store.tab === 'roles' && store.isRegulator"
    />
    <SecurityAlertSection
      v-if="store.tab === 'security-alerts' && store.isSecurityResponder"
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
import SecurityAlertSection from "../components/dashboard/SecurityAlertSection.vue";
import SettingsSection from "../components/dashboard/SettingsSection.vue";

const isSamu = computed(() => store.authRoles.includes("SAMU"));
const isSapeurPompier = computed(() =>
  store.authRoles.some((r) => ["SAPEUR_POMPIER", "SAPEUR_POMPIER"].includes(r))
);

const route = useRoute();
const store = useDashboardStore();

function runBackground(task) {
  Promise.resolve()
    .then(task)
    .catch(() => {});
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  store.tab = store.resolveTab(route.query.tab);

  if (store.isEmergencyResponder && !store.isNational) {
    runBackground(() => store.fetchEmergencyAlerts());
    store.startEmergencyAutoRefresh();
  }

  if (store.isSecurityResponder && !store.isNational) {
    runBackground(() => store.fetchSecurityAlerts());
  }

  if (store.canManageUsers && !store.isRegulator) {
    runBackground(() => store.fetchUsers());
  }

  if (store.isRegulator) {
    runBackground(() => Promise.allSettled([
      store.fetchAllCenters(),
      store.fetchUsers(),
      store.fetchPendingCenters(),
      store.fetchRegions(),
      store.fetchDistricts(),
      store.fetchComplaints(),
      store.fetchComplaintSummary(),
    ]));
  }

  if (store.isChef) {
    runBackground(async () => {
      await store.fetchAllCenters();
      if (!store.hasApprovedChefCenter) return;
      await Promise.allSettled([
        store.fetchComplaints(),
        store.fetchComplaintSummary(),
      ]);
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
    if (value === "overview" && store.isRegulator && store.allCenters.length === 0) {
      await Promise.resolve(store.fetchAllCenters()).catch(() => {});
    }
    if (value === "emergency-alerts" && store.isEmergencyResponder) {
      await Promise.resolve(store.fetchEmergencyAlerts()).catch(() => {});
    }
    if (value === "security-alerts" && store.isSecurityResponder) {
      await Promise.resolve(store.fetchSecurityAlerts()).catch(() => {});
    }
    if (value === "complaints" && store.canSeeComplaintsPanel) {
      await Promise.allSettled([
        store.fetchComplaints(),
        store.fetchComplaintSummary(),
      ]);
    }
    if (
      (value === "my-center" || value === "settings" || value === "evaluations") &&
      store.allCenters.length === 0
    ) {
      await Promise.resolve(store.fetchAllCenters()).catch(() => {});
    }
    if (value === "settings" && store.isRegulator) {
      await Promise.allSettled([
        store.allCenters.length === 0 ? store.fetchAllCenters() : Promise.resolve(),
        store.users.length === 0 ? store.fetchUsers() : Promise.resolve(),
        store.pendingCenters.length === 0 ? store.fetchPendingCenters() : Promise.resolve(),
        store.regions.length === 0 ? store.fetchRegions() : Promise.resolve(),
        store.districts.length === 0 ? store.fetchDistricts() : Promise.resolve(),
      ]);
    }
    if ((value === "settings" || value === "imports") && store.isRegulator) {
      if (store.regions.length === 0) await Promise.resolve(store.fetchRegions()).catch(() => {});
      if (store.districts.length === 0) await Promise.resolve(store.fetchDistricts()).catch(() => {});
    }
    if (value === "evaluations" && store.canSeeComplaintsPanel) {
      await Promise.resolve(store.fetchComplaintSummary()).catch(() => {});
    }
    if (value === "roles") {
      await Promise.allSettled([
        store.fetchRbacRoles(),
        store.fetchRbacPermissions(),
      ]);
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
      runBackground(() => Promise.allSettled([
        store.fetchRegions(),
        store.fetchDistricts(),
      ]));
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
