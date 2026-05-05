<template>
  <div class="analytics">
    <div class="analytics-header">
      <div>
        <h2 class="analytics-title">Statistiques d'utilisation</h2>
        <p class="analytics-subtitle">Vue d'ensemble de l'activité de la plateforme</p>
      </div>
      <div class="analytics-controls">
        <select v-model="period" class="period-select" @change="load">
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
          <option value="90">90 derniers jours</option>
        </select>
        <button class="refresh-btn" @click="load" :disabled="loading">
          {{ loading ? "Chargement..." : "↻ Actualiser" }}
        </button>
      </div>
    </div>

    <div v-if="error" class="analytics-error">{{ error }}</div>

    <template v-if="data">
      <div class="analytics-layout">
        <!-- Sidebar gauche : types de statistiques -->
        <div class="stat-sidebar">
          <button
            v-for="cat in categories"
            :key="cat.key"
            class="stat-tab"
            :class="{ 'stat-tab--active': activeTab === cat.key }"
            @click="activeTab = cat.key"
          >
            <span class="stat-tab-icon">{{ cat.icon }}</span>
            <div class="stat-tab-body">
              <div class="stat-tab-label">{{ cat.label }}</div>
              <div class="stat-tab-value">{{ cat.summary }}</div>
            </div>
            <span class="stat-tab-arrow">›</span>
          </button>
        </div>

        <!-- Panneau droit : détail de la catégorie sélectionnée -->
        <div class="stat-detail">

          <!-- Taux d'utilisation -->
          <template v-if="activeTab === 'usage'">
            <div class="kpi-grid">
              <div class="kpi-card kpi-blue">
                <div class="kpi-value">{{ formatRate(data.healthCenterAppUsage?.rate) }}</div>
                <div class="kpi-label">Taux d'utilisation</div>
                <div class="kpi-sub">{{ period }} jours</div>
              </div>
              <div class="kpi-card kpi-teal">
                <div class="kpi-value">{{ (data.healthCenterAppUsage?.activeOpeners || 0).toLocaleString() }}</div>
                <div class="kpi-label">Centres actifs</div>
                <div class="kpi-sub">ont ouvert l'application</div>
              </div>
              <div class="kpi-card kpi-green">
                <div class="kpi-value">{{ (data.healthCenterAppUsage?.eligibleUsers || 0).toLocaleString() }}</div>
                <div class="kpi-label">Centres éligibles</div>
                <div class="kpi-sub">comptes établissement actifs</div>
              </div>
              <div class="kpi-card kpi-purple">
                <div class="kpi-value">{{ centerInactiveCount.toLocaleString() }}</div>
                <div class="kpi-label">Centres inactifs</div>
                <div class="kpi-sub">sans ouverture</div>
              </div>
            </div>
            <div class="section-card">
              <h3 class="section-title">Adoption par les centres de santé</h3>
              <div class="pub-pro-bar-wrap">
                <div class="pub-pro-bar pub-pro-bar--public" :style="{ width: centerUsagePct + '%' }" :title="`Actifs : ${data.healthCenterAppUsage?.activeOpeners || 0}`">
                  <span v-if="centerUsagePct > 10">{{ centerUsagePct }}% Actifs</span>
                </div>
                <div class="pub-pro-bar pub-pro-bar--pro" :style="{ width: centerInactivePct + '%' }" :title="`Inactifs : ${centerInactiveCount}`">
                  <span v-if="centerInactivePct > 10">{{ centerInactivePct }}% Inactifs</span>
                </div>
              </div>
              <div class="pub-pro-legend">
                <span class="legend-dot legend-dot--blue"></span> Centres actifs ({{ data.healthCenterAppUsage?.activeOpeners || 0 }})
                &nbsp;&nbsp;
                <span class="legend-dot legend-dot--purple"></span> Centres inactifs ({{ centerInactiveCount }})
              </div>
            </div>
            <div class="section-card">
              <h3 class="section-title">Ouvertures de l'application</h3>
              <div class="module-list">
                <div v-for="item in appOpenActions" :key="item.action" class="module-row">
                  <div class="module-name"><span class="module-icon">📱</span>{{ actionLabel(item.action) }}</div>
                  <div class="module-bar-wrap">
                    <div class="module-bar" :style="{ width: barPct(item.count, maxAppOpenCount) + '%', backgroundColor: moduleColor('app') }"></div>
                  </div>
                  <div class="module-count">{{ item.count.toLocaleString() }}</div>
                  <div class="module-pct">{{ barPct(item.count, totalAppOpenActions) }}%</div>
                </div>
              </div>
            </div>
          </template>

          <!-- Plaintes soumises -->
          <template v-if="activeTab === 'complaints'">
            <div class="kpi-grid">
              <div class="kpi-card kpi-blue">
                <div class="kpi-value">{{ (data.complaintsStats?.total || 0).toLocaleString() }}</div>
                <div class="kpi-label">Total soumises</div>
                <div class="kpi-sub">{{ period }} jours</div>
              </div>
              <div class="kpi-card kpi-blue">
                <div class="kpi-value">{{ (data.complaintsStats?.new || 0).toLocaleString() }}</div>
                <div class="kpi-label">En attente</div>
                <div class="kpi-sub">non traitées</div>
              </div>
              <div class="kpi-card kpi-blue">
                <div class="kpi-value">{{ (data.complaintsStats?.inProgress || 0).toLocaleString() }}</div>
                <div class="kpi-label">En traitement</div>
                <div class="kpi-sub">en cours</div>
              </div>
              <div class="kpi-card kpi-blue">
                <div class="kpi-value">{{ (data.complaintsStats?.resolved || 0).toLocaleString() }}</div>
                <div class="kpi-label">Résolues</div>
                <div class="kpi-sub">clôturées</div>
              </div>
              <div class="kpi-card kpi-blue">
                <div class="kpi-value">{{ (data.complaintsStats?.rejected || 0).toLocaleString() }}</div>
                <div class="kpi-label">Rejetées</div>
                <div class="kpi-sub">non retenues</div>
              </div>
            </div>
            <div class="section-card" v-if="data.complaintsStats?.total">
              <h3 class="section-title">Répartition par statut</h3>
              <div class="status-bar-wrap">
                <div class="status-bar status-bar--gray"   :style="{ width: barPct(data.complaintsStats.new, data.complaintsStats.total) + '%' }" :title="`En attente : ${data.complaintsStats.new}`"></div>
                <div class="status-bar status-bar--orange" :style="{ width: barPct(data.complaintsStats.inProgress, data.complaintsStats.total) + '%' }" :title="`En traitement : ${data.complaintsStats.inProgress}`"></div>
                <div class="status-bar status-bar--green"  :style="{ width: barPct(data.complaintsStats.resolved, data.complaintsStats.total) + '%' }" :title="`Résolues : ${data.complaintsStats.resolved}`"></div>
                <div class="status-bar status-bar--red"    :style="{ width: barPct(data.complaintsStats.rejected, data.complaintsStats.total) + '%' }" :title="`Rejetées : ${data.complaintsStats.rejected}`"></div>
              </div>
              <div class="pub-pro-legend">
                <span class="legend-dot" style="background:#94A3B8"></span> En attente ({{ data.complaintsStats.new }})&nbsp;&nbsp;
                <span class="legend-dot" style="background:#EA580C"></span> En traitement ({{ data.complaintsStats.inProgress }})&nbsp;&nbsp;
                <span class="legend-dot" style="background:#059669"></span> Résolues ({{ data.complaintsStats.resolved }})&nbsp;&nbsp;
                <span class="legend-dot" style="background:#DC2626"></span> Rejetées ({{ data.complaintsStats.rejected }})
              </div>
            </div>
          </template>

          <!-- Urgences sanitaires -->
          <template v-if="activeTab === 'emergency'">
            <div class="kpi-grid">
              <div class="kpi-card kpi-blue">
                <div class="kpi-value">{{ (data.emergencyStats?.total || 0).toLocaleString() }}</div>
                <div class="kpi-label">Total envoyées</div>
                <div class="kpi-sub">{{ period }} jours</div>
              </div>
              <div class="kpi-card kpi-blue">
                <div class="kpi-value">{{ (data.emergencyStats?.new || 0).toLocaleString() }}</div>
                <div class="kpi-label">En attente</div>
                <div class="kpi-sub">non prises en charge</div>
              </div>
              <div class="kpi-card kpi-blue">
                <div class="kpi-value">{{ (data.emergencyStats?.inProgress || 0).toLocaleString() }}</div>
                <div class="kpi-label">En cours</div>
                <div class="kpi-sub">en intervention</div>
              </div>
              <div class="kpi-card kpi-blue">
                <div class="kpi-value">{{ (data.emergencyStats?.resolved || 0).toLocaleString() }}</div>
                <div class="kpi-label">Clôturées</div>
                <div class="kpi-sub">terminées</div>
              </div>
            </div>
            <div class="section-card" v-if="data.emergencyStats?.byService?.length">
              <h3 class="section-title">Par service destinataire</h3>
              <div class="module-list">
                <div v-for="s in data.emergencyStats.byService" :key="s.service" class="module-row">
                  <div class="module-name"><span class="module-icon">🚑</span>{{ serviceLabel(s.service) }}</div>
                  <div class="module-bar-wrap">
                    <div class="module-bar" :style="{ width: barPct(s.count, data.emergencyStats.total) + '%', backgroundColor: '#DC2626' }"></div>
                  </div>
                  <div class="module-count">{{ s.count.toLocaleString() }}</div>
                  <div class="module-pct">{{ barPct(s.count, data.emergencyStats.total) }}%</div>
                </div>
              </div>
            </div>
            <div class="section-card" v-if="data.emergencyStats?.total">
              <h3 class="section-title">Répartition par statut</h3>
              <div class="status-bar-wrap">
                <div class="status-bar status-bar--gray"   :style="{ width: barPct(data.emergencyStats.new, data.emergencyStats.total) + '%' }"></div>
                <div class="status-bar status-bar--orange" :style="{ width: barPct(data.emergencyStats.inProgress, data.emergencyStats.total) + '%' }"></div>
                <div class="status-bar status-bar--green"  :style="{ width: barPct(data.emergencyStats.resolved, data.emergencyStats.total) + '%' }"></div>
              </div>
              <div class="pub-pro-legend">
                <span class="legend-dot" style="background:#94A3B8"></span> En attente ({{ data.emergencyStats.new }})&nbsp;&nbsp;
                <span class="legend-dot" style="background:#EA580C"></span> En cours ({{ data.emergencyStats.inProgress }})&nbsp;&nbsp;
                <span class="legend-dot" style="background:#059669"></span> Clôturées ({{ data.emergencyStats.resolved }})
              </div>
            </div>
          </template>

          <!-- Urgences sécuritaires -->
          <template v-if="activeTab === 'security'">
            <div class="kpi-grid">
              <div class="kpi-card kpi-blue">
                <div class="kpi-value">{{ (data.securityStats?.total || 0).toLocaleString() }}</div>
                <div class="kpi-label">Total envoyées</div>
                <div class="kpi-sub">{{ period }} jours</div>
              </div>
              <div class="kpi-card kpi-blue">
                <div class="kpi-value">{{ (data.securityStats?.new || 0).toLocaleString() }}</div>
                <div class="kpi-label">En attente</div>
                <div class="kpi-sub">non traitées</div>
              </div>
              <div class="kpi-card kpi-blue">
                <div class="kpi-value">{{ (data.securityStats?.inProgress || 0).toLocaleString() }}</div>
                <div class="kpi-label">Prises en compte</div>
                <div class="kpi-sub">en cours</div>
              </div>
              <div class="kpi-card kpi-blue">
                <div class="kpi-value">{{ (data.securityStats?.resolved || 0).toLocaleString() }}</div>
                <div class="kpi-label">Résolues / Clôturées</div>
                <div class="kpi-sub">terminées</div>
              </div>
            </div>
            <div class="section-card" v-if="data.securityStats?.byService?.length">
              <h3 class="section-title">Par service destinataire</h3>
              <div class="module-list">
                <div v-for="s in data.securityStats.byService" :key="s.service" class="module-row">
                  <div class="module-name"><span class="module-icon">🚨</span>{{ serviceLabel(s.service) }}</div>
                  <div class="module-bar-wrap">
                    <div class="module-bar" :style="{ width: barPct(s.count, data.securityStats.total) + '%', backgroundColor: '#7C3AED' }"></div>
                  </div>
                  <div class="module-count">{{ s.count.toLocaleString() }}</div>
                  <div class="module-pct">{{ barPct(s.count, data.securityStats.total) }}%</div>
                </div>
              </div>
            </div>
            <div class="section-card" v-if="data.securityStats?.total">
              <h3 class="section-title">Répartition par statut</h3>
              <div class="status-bar-wrap">
                <div class="status-bar status-bar--gray"   :style="{ width: barPct(data.securityStats.new, data.securityStats.total) + '%' }"></div>
                <div class="status-bar status-bar--orange" :style="{ width: barPct(data.securityStats.inProgress, data.securityStats.total) + '%' }"></div>
                <div class="status-bar status-bar--green"  :style="{ width: barPct(data.securityStats.resolved, data.securityStats.total) + '%' }"></div>
              </div>
              <div class="pub-pro-legend">
                <span class="legend-dot" style="background:#94A3B8"></span> En attente ({{ data.securityStats.new }})&nbsp;&nbsp;
                <span class="legend-dot" style="background:#EA580C"></span> Prises en compte ({{ data.securityStats.inProgress }})&nbsp;&nbsp;
                <span class="legend-dot" style="background:#059669"></span> Résolues ({{ data.securityStats.resolved }})
              </div>
            </div>
          </template>

        </div>
      </div>
    </template>

    <div v-else-if="!loading" class="analytics-empty">
      <p>Aucune donnée disponible.</p>
      <button class="refresh-btn" @click="load">Charger les statistiques</button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { apiFetch } from "../../api/client";
import { useAuthStore } from "../../stores/auth";

const auth = useAuthStore();
const period = ref(30);
const data = ref(null);
const loading = ref(false);
const error = ref("");
const activeTab = ref("usage");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const result = await apiFetch(`/analytics/summary?days=${period.value}`, {
      token: auth.state.token,
    });
    data.value = result;
  } catch (e) {
    error.value = e?.message || "Erreur lors du chargement des statistiques";
  } finally {
    loading.value = false;
  }
}

onMounted(load);

const appOpenActions = computed(() =>
  (data.value?.byAction || []).filter((item) =>
    (item.module === "app" && ["login", "screen_view", "app_open"].includes(item.action)) ||
    item.action === "login"
  )
);

const totalAppOpenActions = computed(() =>
  appOpenActions.value.reduce((sum, item) => sum + Number(item.count || 0), 0)
);

const maxAppOpenCount = computed(() =>
  Math.max(...appOpenActions.value.map((item) => Number(item.count || 0)), 1)
);

const centerUsagePct = computed(() => Math.round(Number(data.value?.healthCenterAppUsage?.rate || 0)));
const centerInactiveCount = computed(() => {
  const eligible = Number(data.value?.healthCenterAppUsage?.eligibleUsers || 0);
  const active = Number(data.value?.healthCenterAppUsage?.activeOpeners || 0);
  return Math.max(eligible - active, 0);
});
const centerInactivePct = computed(() => {
  const eligible = Number(data.value?.healthCenterAppUsage?.eligibleUsers || 0);
  return eligible ? Math.round((centerInactiveCount.value / eligible) * 100) : 0;
});

const categories = computed(() => [
  {
    key: "usage",
    icon: "📱",
    label: "Taux d'utilisation",
    summary: formatRate(data.value?.healthCenterAppUsage?.rate),
  },
  {
    key: "complaints",
    icon: "📋",
    label: "Plaintes soumises",
    summary: `${(data.value?.complaintsStats?.total || 0).toLocaleString()} plainte(s)`,
  },
  {
    key: "emergency",
    icon: "🚑",
    label: "Urgences sanitaires",
    summary: `${(data.value?.emergencyStats?.total || 0).toLocaleString()} urgence(s)`,
  },
  {
    key: "security",
    icon: "🚨",
    label: "Urgences sécuritaires",
    summary: `${(data.value?.securityStats?.total || 0).toLocaleString()} alerte(s)`,
  },
]);

function barPct(count, total) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

function formatRate(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

const MODULE_COLORS = {
  app: "#059669",
};
function moduleColor(m) { return MODULE_COLORS[m] || "#64748B"; }

const ACTION_LABELS = {
  screen_view: "Ouverture / vue d'écran",
  login: "Connexion",
  logout: "Déconnexion",
  app_open: "Ouverture de l'application",
  submit: "Soumission",
  refresh: "Actualisation",
  send_emergency: "Urgence envoyée",
  send_security: "Alerte envoyée",
  rate_center: "Évaluation",
  clear_cache: "Cache vidé",
};
function actionLabel(a) { return ACTION_LABELS[a] || a; }

const SERVICE_LABELS = {
  SAPEUR_POMPIER: "Sapeurs-Pompiers",
  SAMU: "SAMU",
  POLICE: "Police",
  GENDARMERIE: "Gendarmerie",
  PROTECTION_CIVILE: "Protection Civile",
  CROIX_ROUGE: "Croix-Rouge",
};
function serviceLabel(s) { return SERVICE_LABELS[s] || s; }
</script>

<style scoped>
.analytics { padding: 24px; max-width: 1200px; margin: 0 auto; }

.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}
.analytics-title { font-size: 22px; font-weight: 800; color: #0F172A; margin: 0 0 4px; }
.analytics-subtitle { color: #64748B; font-size: 14px; margin: 0; }
.analytics-controls { display: flex; gap: 10px; align-items: center; }
.period-select {
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  background: #fff;
  cursor: pointer;
}
.refresh-btn {
  background: #1A56DB;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.analytics-error {
  background: #FEE2E2;
  color: #DC2626;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 20px;
}

/* Layout deux colonnes */
.analytics-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 20px;
  align-items: start;
}

/* Sidebar */
.stat-sidebar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.stat-tab {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border: 1.5px solid #E2E8F0;
  border-radius: 14px;
  padding: 14px 16px;
  cursor: pointer;
  text-align: left;
  transition: all 0.18s ease;
  width: 100%;
}
.stat-tab:hover { border-color: #1A56DB; background: #F8FAFF; }
.stat-tab--active {
  border-color: #1A56DB;
  background: linear-gradient(135deg, #1A56DB, #1337A4);
  color: #fff;
}
.stat-tab-icon { font-size: 22px; flex-shrink: 0; }
.stat-tab-body { flex: 1; min-width: 0; }
.stat-tab-label { font-size: 13px; font-weight: 700; color: #0F172A; line-height: 1.2; }
.stat-tab--active .stat-tab-label { color: #fff; }
.stat-tab-value { font-size: 12px; color: #64748B; margin-top: 2px; font-weight: 600; }
.stat-tab--active .stat-tab-value { color: rgba(255,255,255,0.75); }
.stat-tab-arrow { font-size: 18px; color: #CBD5E1; font-weight: 700; flex-shrink: 0; }
.stat-tab--active .stat-tab-arrow { color: rgba(255,255,255,0.6); }

/* Panneau droit */
.stat-detail { min-width: 0; }

/* KPI cards */
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 18px; }
.kpi-card {
  border-radius: 16px;
  padding: 20px;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
}
.kpi-blue   { background: linear-gradient(135deg, #1A56DB, #1337A4); }
.kpi-teal   { background: linear-gradient(135deg, #0891B2, #0E7490); }
.kpi-green  { background: linear-gradient(135deg, #059669, #047857); }
.kpi-purple { background: linear-gradient(135deg, #7C3AED, #6D28D9); }
.kpi-value  { font-size: 30px; font-weight: 900; line-height: 1; }
.kpi-label  { font-size: 12px; font-weight: 700; margin-top: 6px; opacity: 0.92; }
.kpi-sub    { font-size: 11px; opacity: 0.7; margin-top: 2px; }

/* Section cards */
.section-card {
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.section-title { font-size: 14px; font-weight: 800; color: #0F172A; margin: 0 0 14px; }

/* Adoption bar */
.pub-pro-bar-wrap { display: flex; height: 36px; border-radius: 10px; overflow: hidden; background: #F1F5F9; }
.pub-pro-bar { display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; transition: width 0.5s ease; min-width: 0; overflow: hidden; }
.pub-pro-bar--public { background: #1A56DB; }
.pub-pro-bar--pro    { background: #7C3AED; }
.pub-pro-legend { margin-top: 10px; font-size: 13px; color: #64748B; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.legend-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
.legend-dot--blue   { background: #1A56DB; }
.legend-dot--purple { background: #7C3AED; }

/* Module bars */
.module-list { display: flex; flex-direction: column; gap: 10px; }
.module-row { display: flex; align-items: center; gap: 12px; }
.module-name { min-width: 160px; font-size: 13px; font-weight: 600; color: #334155; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.module-icon { font-size: 16px; }
.module-bar-wrap { flex: 1; background: #F1F5F9; border-radius: 999px; height: 10px; overflow: hidden; }
.module-bar { height: 100%; border-radius: 999px; transition: width 0.5s ease; min-width: 4px; }
.module-count { font-size: 13px; font-weight: 700; color: #0F172A; min-width: 50px; text-align: right; }
.module-pct { font-size: 12px; color: #64748B; min-width: 36px; text-align: right; }

/* Status bar */
.status-bar-wrap { display: flex; height: 14px; border-radius: 999px; overflow: hidden; background: #F1F5F9; margin-bottom: 10px; }
.status-bar { height: 100%; transition: width 0.5s ease; }
.status-bar--gray   { background: #94A3B8; }
.status-bar--orange { background: #EA580C; }
.status-bar--green  { background: #059669; }
.status-bar--red    { background: #DC2626; }

.analytics-empty { text-align: center; padding: 48px 24px; color: #64748B; }

@media (max-width: 700px) {
  .analytics-layout { grid-template-columns: 1fr; }
}
</style>
