<template>
  <div class="analytics">
    <div class="analytics-header">
      <div>
        <h2 class="analytics-title">Statistiques d'utilisation</h2>
        <p class="analytics-subtitle">Taux d'utilisation par module, fonction et profil utilisateur</p>
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
      <!-- KPI cards -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-blue">
          <div class="kpi-value">{{ data.total.toLocaleString() }}</div>
          <div class="kpi-label">Actions totales</div>
          <div class="kpi-sub">{{ period }} jours</div>
        </div>
        <div class="kpi-card kpi-teal">
          <div class="kpi-value">{{ data.uniqueUsers.toLocaleString() }}</div>
          <div class="kpi-label">Utilisateurs actifs</div>
          <div class="kpi-sub">uniques</div>
        </div>
        <div class="kpi-card kpi-green">
          <div class="kpi-value">{{ data.publicVsPro.public.toLocaleString() }}</div>
          <div class="kpi-label">Comptes publics</div>
          <div class="kpi-sub">rôle USER</div>
        </div>
        <div class="kpi-card kpi-purple">
          <div class="kpi-value">{{ data.publicVsPro.pro.toLocaleString() }}</div>
          <div class="kpi-label">Comptes professionnels</div>
          <div class="kpi-sub">CHEF, SAMU, POLICE…</div>
        </div>
      </div>

      <!-- Public vs Pro bar -->
      <div class="section-card">
        <h3 class="section-title">Répartition Public / Professionnel</h3>
        <div class="pub-pro-bar-wrap">
          <div
            class="pub-pro-bar pub-pro-bar--public"
            :style="{ width: pubPct + '%' }"
            :title="`Public : ${data.publicVsPro.public}`"
          >
            <span v-if="pubPct > 10">{{ pubPct }}% Public</span>
          </div>
          <div
            class="pub-pro-bar pub-pro-bar--pro"
            :style="{ width: proPct + '%' }"
            :title="`Professionnel : ${data.publicVsPro.pro}`"
          >
            <span v-if="proPct > 10">{{ proPct }}% Pro</span>
          </div>
          <div
            v-if="anonPct > 0"
            class="pub-pro-bar pub-pro-bar--anon"
            :style="{ width: anonPct + '%' }"
            :title="`Non identifié : ${data.publicVsPro.anon}`"
          >
            <span v-if="anonPct > 5">{{ anonPct }}%</span>
          </div>
        </div>
        <div class="pub-pro-legend">
          <span class="legend-dot legend-dot--blue"></span> Public ({{ data.publicVsPro.public }})
          &nbsp;&nbsp;
          <span class="legend-dot legend-dot--purple"></span> Professionnel ({{ data.publicVsPro.pro }})
          &nbsp;&nbsp;
          <span class="legend-dot legend-dot--gray"></span> Non identifié ({{ data.publicVsPro.anon }})
        </div>
      </div>

      <!-- Module usage -->
      <div class="section-card">
        <h3 class="section-title">Utilisation par module</h3>
        <div class="module-list">
          <div
            v-for="item in data.byModule"
            :key="item.module"
            class="module-row"
          >
            <div class="module-name">
              <span class="module-icon">{{ moduleIcon(item.module) }}</span>
              {{ moduleLabel(item.module) }}
            </div>
            <div class="module-bar-wrap">
              <div
                class="module-bar"
                :style="{
                  width: barPct(item.count, maxModuleCount) + '%',
                  backgroundColor: moduleColor(item.module)
                }"
              ></div>
            </div>
            <div class="module-count">{{ item.count.toLocaleString() }}</div>
            <div class="module-pct">{{ barPct(item.count, data.total) }}%</div>
          </div>
        </div>
      </div>

      <!-- Function breakdown -->
      <div class="section-card">
        <h3 class="section-title">Détail par fonction</h3>
        <div class="action-table">
          <div class="action-table-head">
            <span>Module</span>
            <span>Action</span>
            <span>Nombre</span>
            <span>%</span>
          </div>
          <div
            v-for="item in data.byAction"
            :key="item.module + item.action"
            class="action-table-row"
          >
            <span>
              <span class="module-badge" :style="{ backgroundColor: moduleColor(item.module) + '22', color: moduleColor(item.module) }">
                {{ moduleLabel(item.module) }}
              </span>
            </span>
            <span class="action-name">{{ actionLabel(item.action) }}</span>
            <span class="action-count">{{ item.count.toLocaleString() }}</span>
            <span class="action-pct">{{ barPct(item.count, data.total) }}%</span>
          </div>
        </div>
      </div>

      <!-- Role distribution -->
      <div class="section-card">
        <h3 class="section-title">Utilisation par rôle</h3>
        <div class="module-list">
          <div
            v-for="item in data.byRole"
            :key="item.role"
            class="module-row"
          >
            <div class="module-name" style="min-width:160px">{{ roleLabel(item.role) }}</div>
            <div class="module-bar-wrap">
              <div
                class="module-bar"
                :style="{
                  width: barPct(item.count, data.total) + '%',
                  backgroundColor: roleColor(item.role)
                }"
              ></div>
            </div>
            <div class="module-count">{{ item.count.toLocaleString() }}</div>
            <div class="module-pct">{{ barPct(item.count, data.total) }}%</div>
          </div>
        </div>
      </div>

      <!-- Daily activity -->
      <div class="section-card">
        <h3 class="section-title">Activité quotidienne</h3>
        <div class="daily-chart">
          <div
            v-for="item in data.daily"
            :key="item.day"
            class="daily-col"
            :title="`${formatDay(item.day)} : ${item.count} actions`"
          >
            <div class="daily-bar-wrap">
              <div
                class="daily-bar"
                :style="{ height: dailyBarHeight(item.count) + '%' }"
              ></div>
            </div>
            <div class="daily-label">{{ formatDay(item.day) }}</div>
          </div>
        </div>
        <div v-if="!data.daily.length" class="empty-hint">Aucune donnée sur la période</div>
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

const maxModuleCount = computed(() =>
  data.value ? Math.max(...data.value.byModule.map((m) => m.count), 1) : 1
);

const pubPct = computed(() => {
  if (!data.value) return 0;
  const total = data.value.publicVsPro.public + data.value.publicVsPro.pro + data.value.publicVsPro.anon;
  return total ? Math.round((data.value.publicVsPro.public / total) * 100) : 0;
});
const proPct = computed(() => {
  if (!data.value) return 0;
  const total = data.value.publicVsPro.public + data.value.publicVsPro.pro + data.value.publicVsPro.anon;
  return total ? Math.round((data.value.publicVsPro.pro / total) * 100) : 0;
});
const anonPct = computed(() => 100 - pubPct.value - proPct.value);

const maxDaily = computed(() =>
  data.value ? Math.max(...data.value.daily.map((d) => d.count), 1) : 1
);

function barPct(count, total) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

function dailyBarHeight(count) {
  return Math.max(4, Math.round((count / maxDaily.value) * 100));
}

function formatDay(dayStr) {
  if (!dayStr) return "";
  const d = new Date(dayStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

const MODULE_LABELS = {
  nearby: "Centres de santé",
  complaints: "Plaintes",
  complaints_tracking: "Suivi plaintes",
  chef: "Espace chef",
  alerts: "Urgences sanitaires",
  emergency: "Signalement urgence",
  security_ops: "Urgences sécuritaires",
  security_alert: "Signalement sécurité",
  settings: "Paramètres",
  app: "Application",
  contact_developer: "Contact support",
};
const MODULE_ICONS = {
  nearby: "🏥",
  complaints: "📋",
  complaints_tracking: "🔍",
  chef: "🏨",
  alerts: "🚑",
  emergency: "🆘",
  security_ops: "🚔",
  security_alert: "🚨",
  settings: "⚙️",
  app: "📱",
  contact_developer: "💬",
};
const MODULE_COLORS = {
  nearby: "#0891B2",
  complaints: "#1A56DB",
  complaints_tracking: "#1A56DB",
  chef: "#0891B2",
  alerts: "#EA580C",
  emergency: "#DC2626",
  security_ops: "#1A56DB",
  security_alert: "#7C3AED",
  settings: "#64748B",
  app: "#059669",
  contact_developer: "#D97706",
};

function moduleLabel(m) { return MODULE_LABELS[m] || m; }
function moduleIcon(m) { return MODULE_ICONS[m] || "📊"; }
function moduleColor(m) { return MODULE_COLORS[m] || "#64748B"; }

const ACTION_LABELS = {
  screen_view: "Vue écran",
  login: "Connexion",
  logout: "Déconnexion",
  submit: "Soumission",
  refresh: "Actualisation",
  send_emergency: "Urgence envoyée",
  send_security: "Alerte envoyée",
  rate_center: "Évaluation",
  clear_cache: "Cache vidé",
};
function actionLabel(a) { return ACTION_LABELS[a] || a; }

const ROLE_LABELS = {
  USER: "Utilisateur public",
  REGULATOR: "Régulateur",
  NATIONAL: "National",
  REGION: "Région",
  DISTRICT: "District",
  ETABLISSEMENT: "Etablissement",
  CHEF_ETABLISSEMENT: "Chef d'établissement",
  SAMU: "SAMU",
  SAPEUR_POMPIER: "Sapeurs-Pompiers",
  POLICE: "Police",
  GENDARMERIE: "Gendarmerie",
  PROTECTION_CIVILE: "Protection Civile",
  DEVELOPER: "Développeur",
  anonyme: "Non identifié",
};
const ROLE_COLORS = {
  USER: "#1A56DB",
  REGULATOR: "#7C3AED",
  NATIONAL: "#0891B2",
  REGION: "#059669",
  DISTRICT: "#D97706",
  CHEF_ETABLISSEMENT: "#0891B2",
  SAMU: "#EA580C",
  SAPEUR_POMPIER: "#EA580C",
  POLICE: "#334155",
  GENDARMERIE: "#334155",
  DEVELOPER: "#DC2626",
  anonyme: "#94A3B8",
};
function roleLabel(r) { return ROLE_LABELS[r] || r; }
function roleColor(r) { return ROLE_COLORS[r] || "#64748B"; }
</script>

<style scoped>
.analytics { padding: 24px; max-width: 1100px; margin: 0 auto; }

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

/* KPI cards */
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
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
.kpi-value  { font-size: 32px; font-weight: 900; line-height: 1; }
.kpi-label  { font-size: 13px; font-weight: 700; margin-top: 6px; opacity: 0.92; }
.kpi-sub    { font-size: 11px; opacity: 0.7; margin-top: 2px; }

/* Section cards */
.section-card {
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.section-title { font-size: 15px; font-weight: 800; color: #0F172A; margin: 0 0 16px; }

/* Public vs Pro bar */
.pub-pro-bar-wrap { display: flex; height: 36px; border-radius: 10px; overflow: hidden; background: #F1F5F9; }
.pub-pro-bar { display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; transition: width 0.5s ease; min-width: 0; overflow: hidden; }
.pub-pro-bar--public  { background: #1A56DB; }
.pub-pro-bar--pro     { background: #7C3AED; }
.pub-pro-bar--anon    { background: #94A3B8; }
.pub-pro-legend { margin-top: 10px; font-size: 13px; color: #64748B; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.legend-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
.legend-dot--blue   { background: #1A56DB; }
.legend-dot--purple { background: #7C3AED; }
.legend-dot--gray   { background: #94A3B8; }

/* Module bars */
.module-list { display: flex; flex-direction: column; gap: 10px; }
.module-row { display: flex; align-items: center; gap: 12px; }
.module-name { min-width: 180px; font-size: 13px; font-weight: 600; color: #334155; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.module-icon { font-size: 16px; }
.module-bar-wrap { flex: 1; background: #F1F5F9; border-radius: 999px; height: 10px; overflow: hidden; }
.module-bar { height: 100%; border-radius: 999px; transition: width 0.5s ease; min-width: 4px; }
.module-count { font-size: 13px; font-weight: 700; color: #0F172A; min-width: 56px; text-align: right; }
.module-pct { font-size: 12px; color: #64748B; min-width: 36px; text-align: right; }

/* Action table */
.action-table { display: flex; flex-direction: column; gap: 0; }
.action-table-head {
  display: grid;
  grid-template-columns: 1fr 1fr 80px 60px;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 800;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  border-bottom: 1px solid #E2E8F0;
}
.action-table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 80px 60px;
  padding: 9px 12px;
  font-size: 13px;
  border-bottom: 1px solid #F1F5F9;
  align-items: center;
}
.action-table-row:last-child { border-bottom: none; }
.module-badge { border-radius: 999px; padding: 2px 9px; font-size: 11px; font-weight: 700; }
.action-name { color: #334155; font-weight: 600; }
.action-count { font-weight: 700; color: #0F172A; }
.action-pct { color: #64748B; font-size: 12px; }

/* Daily chart */
.daily-chart { display: flex; align-items: flex-end; gap: 6px; height: 100px; overflow-x: auto; padding-bottom: 4px; }
.daily-col { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 32px; }
.daily-bar-wrap { flex: 1; display: flex; align-items: flex-end; height: 72px; width: 100%; }
.daily-bar { width: 100%; background: #1A56DB; border-radius: 4px 4px 0 0; transition: height 0.4s ease; min-height: 3px; }
.daily-label { font-size: 10px; color: #94A3B8; font-weight: 600; white-space: nowrap; }

.analytics-empty { text-align: center; padding: 48px 24px; color: #64748B; }
.empty-hint { color: #94A3B8; font-size: 13px; margin-top: 12px; text-align: center; }
</style>
