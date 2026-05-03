<template>
  <section class="sp-root">

    <!-- ═══ En-tête ═══ -->
    <div class="sp-header">
      <div class="sp-header-brand">
        <span class="sp-badge">🚒 SAPEURS-POMPIERS</span>
        <div>
          <h2 class="sp-title">Centre Opérationnel de Secours</h2>
          <p class="sp-subtitle">Service Départemental d'Incendie et de Secours — Tableau de bord opérationnel</p>
        </div>
      </div>
      <div class="sp-header-right">
        <div class="sp-rate-badge" v-if="totalAlerts > 0">
          <span class="sp-rate-value">{{ traitementRate }}%</span>
          <span class="sp-rate-label">Taux de traitement</span>
        </div>
        <div class="sp-clock">🕐 {{ nowStr }}</div>
      </div>
    </div>

    <!-- ═══ Bandeau d'alerte si cas non traités ═══ -->
    <div class="sp-alert-banner" v-if="store.emergencyStats.nonTraite > 0">
      <span class="sp-alert-pulse"></span>
      <strong>{{ store.emergencyStats.nonTraite }} intervention(s) en attente de déclenchement !</strong>
      <button class="sp-alert-cta" @click="store.openUnhandledEmergencyAlerts">
        Déclencher →
      </button>
    </div>

    <!-- ═══ KPI Cards ═══ -->
    <div class="sp-cards">

      <div class="sp-card sp-card-red" role="button" tabindex="0"
        @click="store.openUnhandledEmergencyAlerts"
        @keydown.enter.prevent="store.openUnhandledEmergencyAlerts">
        <div class="sp-card-top">
          <span class="sp-card-tag">🔥 NON DÉCLENCHÉES</span>
          <span class="sp-card-ico sp-ico-red">🔥</span>
        </div>
        <div class="sp-card-val">{{ store.emergencyStats.nonTraite }}</div>
        <div class="sp-card-sub">Appels en attente</div>
        <button class="sp-card-btn" v-if="store.emergencyStats.nonTraite > 0">
          → Déclencher l'intervention
        </button>
        <div class="sp-card-detail" v-else>Aucune intervention en attente ✓</div>
      </div>

      <div class="sp-card sp-card-orange">
        <div class="sp-card-top">
          <span class="sp-card-tag">🚒 EN INTERVENTION</span>
          <span class="sp-card-ico sp-ico-orange">🚒</span>
        </div>
        <div class="sp-card-val">{{ store.emergencyStats.enCours }}</div>
        <div class="sp-card-sub">Véhicules déployés</div>
        <div class="sp-card-detail">Équipes sur le terrain</div>
      </div>

      <div class="sp-card sp-card-green">
        <div class="sp-card-top">
          <span class="sp-card-tag">✅ TERMINÉES</span>
          <span class="sp-card-ico sp-ico-green">✅</span>
        </div>
        <div class="sp-card-val">{{ store.emergencyStats.traite }}</div>
        <div class="sp-card-sub">Interventions accomplies</div>
        <div class="sp-progress-bar">
          <div class="sp-progress-fill" :style="`width:${traitementRate}%`"></div>
        </div>
        <div class="sp-card-detail">Taux de résolution {{ traitementRate }}%</div>
      </div>

      <div class="sp-card sp-card-gray">
        <div class="sp-card-top">
          <span class="sp-card-tag">📁 CLÔTURÉES</span>
          <span class="sp-card-ico sp-ico-gray">📁</span>
        </div>
        <div class="sp-card-val">{{ store.emergencyStats.rejete }}</div>
        <div class="sp-card-sub">Dossiers clos / annulés</div>
        <div class="sp-card-detail">Période : {{ periodLabel }}</div>
      </div>

    </div>

    <!-- ═══ Barre récapitulative ═══ -->
    <div class="sp-summary-bar">
      <div class="sp-summary-title">🪣 Récapitulatif période — {{ periodLabel }}</div>
      <div class="sp-summary-stats">
        <div class="sp-stat">
          <span class="sp-stat-val">{{ totalAlerts }}</span>
          <span class="sp-stat-lbl">Total appels</span>
        </div>
        <div class="sp-stat">
          <span class="sp-stat-val sp-red">{{ store.emergencyStats.nonTraite }}</span>
          <span class="sp-stat-lbl">Non déclenchés</span>
        </div>
        <div class="sp-stat">
          <span class="sp-stat-val sp-orange">{{ store.emergencyStats.enCours }}</span>
          <span class="sp-stat-lbl">En cours</span>
        </div>
        <div class="sp-stat">
          <span class="sp-stat-val sp-green">{{ store.emergencyStats.traite }}</span>
          <span class="sp-stat-lbl">Terminées</span>
        </div>
        <div class="sp-stat">
          <span class="sp-stat-val sp-green">{{ traitementRate }}%</span>
          <span class="sp-stat-lbl">Taux traitement</span>
        </div>
      </div>
    </div>

    <!-- ═══ Graphiques ═══ -->
    <div class="sp-charts">

      <!-- Barres : appels par heure -->
      <div class="sp-chart-card">
        <div class="sp-chart-header">
          <span class="sp-chart-title">📊 Appels reçus par heure — période en cours</span>
          <span class="sp-chart-badge">Total : {{ totalAlerts }}</span>
        </div>
        <div class="sp-bar-wrap">
          <svg :viewBox="`0 0 ${BAR_W} ${BAR_H}`" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;display:block">
            <template v-for="tick in yTicks" :key="tick.val">
              <line :x1="BAR_LEFT" :y1="tick.y" :x2="BAR_W - 6" :y2="tick.y" stroke="#e5e7eb" stroke-width="1"/>
              <text :x="BAR_LEFT - 4" :y="tick.y + 4" font-size="10" fill="#9ca3af" text-anchor="end">{{ tick.val }}</text>
            </template>
            <template v-for="(bar, i) in barData" :key="i">
              <rect :x="bar.x" :y="bar.y" :width="bar.w" :height="bar.h" rx="2" fill="#fdba74"/>
              <rect :x="bar.x" :y="bar.y" :width="bar.w" :height="bar.h" rx="2" fill="#f97316" :opacity="bar.count > 0 ? 0.85 : 0"/>
              <text v-if="bar.count > 0" :x="bar.x + bar.w / 2" :y="bar.y - 3" font-size="8" fill="#c2410c" text-anchor="middle">{{ bar.count }}</text>
              <text :x="bar.x + bar.w / 2" :y="BAR_H - 4" font-size="8" fill="#6b7280" text-anchor="middle">{{ bar.label }}</text>
            </template>
          </svg>
        </div>
      </div>

      <!-- Donut : répartition par statut -->
      <div class="sp-chart-card">
        <div class="sp-chart-header">
          <span class="sp-chart-title">🍩 Répartition par statut</span>
        </div>
        <div class="sp-donut-wrap">
          <svg viewBox="0 0 180 180" class="sp-donut-svg">
            <circle cx="90" cy="90" r="60" fill="none" stroke="#f1f5f9" stroke-width="26"/>
            <circle
              v-for="(seg, i) in donutSegments" :key="i"
              cx="90" cy="90" r="60" fill="none"
              :stroke="seg.color" stroke-width="26"
              :stroke-dasharray="`${seg.dash} ${seg.gap}`"
              :stroke-dashoffset="seg.dashoffset"
              transform="rotate(-90 90 90)"
            />
            <text x="90" y="86" text-anchor="middle" font-size="22" font-weight="700" fill="#1e293b">{{ totalAlerts }}</text>
            <text x="90" y="103" text-anchor="middle" font-size="10" fill="#64748b">appels</text>
          </svg>
          <div class="sp-donut-legend">
            <div v-for="seg in donutSegments" :key="seg.label" class="sp-legend-item">
              <span class="sp-legend-dot" :style="`background:${seg.color}`"></span>
              <span class="sp-legend-lbl">{{ seg.label }}</span>
              <span class="sp-legend-val">{{ seg.count }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ═══ Interventions actives ═══ -->
    <div class="sp-active-section" v-if="activeAlerts.length > 0">
      <div class="sp-section-header">
        <span class="sp-section-title">🔴 Interventions actives — à traiter</span>
        <button class="secondary sp-see-all" @click="store.tab = 'emergency-alerts'">
          Tout voir →
        </button>
      </div>
      <div class="sp-active-list">
        <div
          v-for="item in activeAlerts"
          :key="item.id"
          class="sp-alert-card"
          :class="item.status === 'NEW' ? 'sp-alert-new' : 'sp-alert-progress'"
        >
          <div class="sp-alert-head">
            <span class="sp-alert-type">{{ item.emergencyType || 'Intervention de secours' }}</span>
            <span class="sp-alert-status">{{ formatStatus(item.status) }}</span>
          </div>
          <div class="sp-alert-meta">
            <span v-if="item.reporterName">👤 {{ item.reporterName }}</span>
            <span v-if="item.phoneNumber">📞 {{ item.phoneNumber }}</span>
            <span v-if="item.handlerBaseName">🚒 Caserne : {{ item.handlerBaseName }}</span>
            <span v-if="item.createdAt">🕐 {{ formatTime(item.createdAt) }}</span>
          </div>
          <div class="sp-alert-desc" v-if="item.description">{{ item.description }}</div>
          <div class="sp-alert-actions">
            <button v-if="item.status === 'NEW'" @click="store.takeEmergencyInCharge(item)">
              Déclencher l'intervention
            </button>
            <button
              v-if="['ACKNOWLEDGED','EN_ROUTE','ON_SITE'].includes(item.status)"
              class="secondary"
              @click="store.setEmergencyProgress(item, 'EN_ROUTE')"
            >En route</button>
            <button
              v-if="['ACKNOWLEDGED','EN_ROUTE','ON_SITE'].includes(item.status)"
              class="secondary"
              @click="store.setEmergencyProgress(item, 'ON_SITE')"
            >Sur site</button>
            <button class="secondary" @click="store.navigateToEmergency(item)">
              🗺 Naviguer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Actions ═══ -->
    <div class="sp-actions">
      <button @click="store.fetchEmergencyAlerts">Actualiser</button>
      <button class="secondary" @click="store.tab = 'emergency-alerts'">
        Toutes les interventions
      </button>
      <button class="secondary" @click="store.tab = 'nearby'">
        Centres de santé proches
      </button>
    </div>

    <p v-if="store.emergencyAlertsError" class="error">{{ store.emergencyAlertsError }}</p>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useDashboardStore } from "../../stores/dashboard";

const store = useDashboardStore();

// ─── Horloge ─────────────────────────────────────────────────────────────────
const now = ref(new Date());
let clockTimer;
onMounted(async () => {
  clockTimer = setInterval(() => { now.value = new Date(); }, 1000);
  if (store.emergencyAlerts.length === 0) await store.fetchEmergencyAlerts();
});
onUnmounted(() => clearInterval(clockTimer));

const nowStr = computed(() =>
  now.value.toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  })
);

const periodLabel = computed(() => {
  const from = store.emergencyPeriodFrom;
  const to = store.emergencyPeriodTo;
  if (!from && !to) return "toute période";
  if (from && to) return `${from} → ${to}`;
  return from || to;
});

// ─── Stats ───────────────────────────────────────────────────────────────────
const totalAlerts = computed(() => store.emergencyAlerts.length);

const traitementRate = computed(() => {
  const total = totalAlerts.value;
  const done = store.emergencyStats.traite;
  return total > 0 ? Math.round((done * 100) / total) : 0;
});

const activeAlerts = computed(() =>
  store.emergencyAlerts
    .filter((a) => ["NEW", "ACKNOWLEDGED", "EN_ROUTE", "ON_SITE"].includes(a.status))
    .slice(0, 5)
);

function formatStatus(status) {
  const map = {
    NEW: "NOUVEAU",
    ACKNOWLEDGED: "DÉCLENCHÉ",
    EN_ROUTE: "EN ROUTE",
    ON_SITE: "SUR SITE",
    COMPLETED: "TERMINÉ",
    CLOSED: "CLÔTURÉ",
  };
  return map[status] || status;
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

// ─── Graphique à barres (appels par heure) ───────────────────────────────────
const BAR_W = 520;
const BAR_H = 160;
const BAR_LEFT = 30;
const BAR_RIGHT = BAR_W - 6;
const BAR_TOP = 12;
const BAR_BOTTOM = BAR_H - 18;
const BAR_AREA_H = BAR_BOTTOM - BAR_TOP;
const BAR_AREA_W = BAR_RIGHT - BAR_LEFT;

const alertsByHour = computed(() => {
  const counts = Array(24).fill(0);
  store.emergencyAlerts.forEach((a) => {
    if (!a?.createdAt) return;
    const h = new Date(a.createdAt).getHours();
    counts[h]++;
  });
  return counts;
});

const barData = computed(() => {
  const counts = alertsByHour.value;
  const maxVal = Math.max(...counts, 1);
  const gap = 2;
  const bw = (BAR_AREA_W - gap * 23) / 24;
  return counts.map((count, i) => {
    const label = i % 3 === 0 ? `${String(i).padStart(2, "0")}h` : "";
    const hPx = Math.max((count / maxVal) * BAR_AREA_H, count > 0 ? 3 : 0);
    const x = BAR_LEFT + i * (bw + gap);
    return { label, count, x, y: BAR_BOTTOM - hPx, w: bw, h: hPx };
  });
});

const yTicks = computed(() => {
  const maxVal = Math.max(...alertsByHour.value, 1);
  return [0, 1, 2, 3].map((i) => ({
    val: Math.round((maxVal * i) / 3),
    y: BAR_BOTTOM - (i / 3) * BAR_AREA_H,
  }));
});

// ─── Graphique en anneau ──────────────────────────────────────────────────────
const CIRC = 2 * Math.PI * 60;
const donutSegments = computed(() => {
  const total = totalAlerts.value;
  const raw = [
    { label: "Non déclenchées", count: store.emergencyStats.nonTraite, color: "#ef4444" },
    { label: "En cours",        count: store.emergencyStats.enCours,   color: "#f97316" },
    { label: "Terminées",       count: store.emergencyStats.traite,    color: "#10b981" },
    { label: "Clôturées",       count: store.emergencyStats.rejete,    color: "#94a3b8" },
  ].filter((s) => s.count > 0);
  let cumulative = 0;
  return raw.map((seg) => {
    const dash = total > 0 ? (seg.count / total) * CIRC : 0;
    const dashoffset = CIRC - cumulative;
    cumulative += dash;
    return { ...seg, dash, gap: CIRC - dash, dashoffset };
  });
});
</script>

<style scoped>
.sp-root { padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }

/* ── En-tête ── */
.sp-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.sp-header-brand { display: flex; align-items: center; gap: 14px; }
.sp-badge { background: linear-gradient(135deg, #c2410c, #ea580c); color: #fff; font-size: 0.85rem; font-weight: 800; padding: 6px 14px; border-radius: 8px; letter-spacing: .04em; }
.sp-title { font-size: 1.55rem; font-weight: 700; color: #0f172a; margin: 0; }
.sp-subtitle { font-size: 0.8rem; color: #64748b; margin: 3px 0 0; }
.sp-header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.sp-rate-badge { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 6px 14px; text-align: center; }
.sp-rate-value { display: block; font-size: 1.1rem; font-weight: 800; color: #059669; }
.sp-rate-label { font-size: 0.7rem; color: #6b7280; }
.sp-clock { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 7px 14px; font-size: 0.82rem; font-weight: 600; color: #c2410c; }

/* ── Bandeau alerte ── */
.sp-alert-banner {
  background: linear-gradient(90deg, #fff7ed, #ffedd5);
  border: 2px solid #fdba74; border-radius: 12px;
  padding: 12px 20px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  animation: pulse-border-sp 1.5s ease-in-out infinite;
}
@keyframes pulse-border-sp {
  0%, 100% { border-color: #fdba74; }
  50% { border-color: #f97316; }
}
.sp-alert-pulse {
  width: 12px; height: 12px; border-radius: 50%; background: #ea580c;
  animation: pulse-dot-sp 1.2s ease-in-out infinite;
  box-shadow: 0 0 0 0 rgba(234,88,12,0.5);
}
@keyframes pulse-dot-sp {
  0% { box-shadow: 0 0 0 0 rgba(234,88,12,0.5); }
  70% { box-shadow: 0 0 0 10px rgba(234,88,12,0); }
  100% { box-shadow: 0 0 0 0 rgba(234,88,12,0); }
}
.sp-alert-banner strong { color: #7c2d12; font-size: 0.9rem; flex: 1; }
.sp-alert-cta { background: #ea580c; color: #fff; border: none; border-radius: 6px; padding: 7px 16px; font-size: 0.8rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
.sp-alert-cta:hover { background: #c2410c; }

/* ── KPI Cards ── */
.sp-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
@media (max-width: 900px) { .sp-cards { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .sp-cards { grid-template-columns: 1fr; } }

.sp-card {
  background: #fff; border-radius: 14px; padding: 18px 20px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,.07); border-top: 4px solid transparent;
  display: flex; flex-direction: column; gap: 6px;
  transition: transform .15s, box-shadow .15s;
}
.sp-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.1); }
.sp-card-red    { border-top-color: #ef4444; cursor: pointer; }
.sp-card-orange { border-top-color: #f97316; }
.sp-card-green  { border-top-color: #10b981; }
.sp-card-gray   { border-top-color: #94a3b8; }

.sp-card-top { display: flex; align-items: center; justify-content: space-between; }
.sp-card-tag { font-size: 0.72rem; font-weight: 600; letter-spacing: .04em; color: #6b7280; }
.sp-card-ico { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
.sp-ico-red    { background: #fff5f5; }
.sp-ico-orange { background: #fff7ed; }
.sp-ico-green  { background: #f0fdf4; }
.sp-ico-gray   { background: #f8fafc; }
.sp-card-val { font-size: 2.4rem; font-weight: 800; color: #0f172a; line-height: 1; }
.sp-card-sub  { font-size: 0.8rem; color: #64748b; }
.sp-card-detail { font-size: 0.75rem; color: #94a3b8; }
.sp-progress-bar { height: 6px; background: #e5e7eb; border-radius: 99px; overflow: hidden; }
.sp-progress-fill { height: 100%; background: #10b981; border-radius: 99px; transition: width .5s; }
.sp-card-btn { align-self: flex-start; background: #ea580c; color: #fff; border: none; border-radius: 6px; padding: 5px 12px; font-size: 0.75rem; font-weight: 600; cursor: pointer; }
.sp-card-btn:hover { background: #c2410c; }

/* ── Summary bar ── */
.sp-summary-bar {
  background: linear-gradient(90deg, #431407, #7c2d12, #9a3412);
  border-radius: 12px; padding: 14px 24px;
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
}
.sp-summary-title { color: #fed7aa; font-size: 0.85rem; font-weight: 600; }
.sp-summary-stats { display: flex; gap: 28px; flex-wrap: wrap; }
.sp-stat { display: flex; flex-direction: column; align-items: center; }
.sp-stat-val { font-size: 1.25rem; font-weight: 800; color: #fff; }
.sp-stat-lbl { font-size: 0.68rem; color: #fdba74; }
.sp-red    { color: #fca5a5 !important; }
.sp-orange { color: #fdba74 !important; }
.sp-green  { color: #6ee7b7 !important; }

/* ── Graphiques ── */
.sp-charts { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }
@media (max-width: 860px) { .sp-charts { grid-template-columns: 1fr; } }

.sp-chart-card { background: #fff; border-radius: 14px; padding: 18px 20px; box-shadow: 0 2px 8px rgba(0,0,0,.07); display: flex; flex-direction: column; gap: 12px; }
.sp-chart-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.sp-chart-title { font-size: 0.88rem; font-weight: 600; color: #1e293b; }
.sp-chart-badge { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; border-radius: 20px; padding: 2px 10px; font-size: 0.75rem; font-weight: 600; }
.sp-bar-wrap { width: 100%; overflow: hidden; }
.sp-donut-wrap { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.sp-donut-svg { width: 150px; height: 150px; flex-shrink: 0; }
.sp-donut-legend { display: flex; flex-direction: column; gap: 10px; }
.sp-legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; }
.sp-legend-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.sp-legend-lbl { color: #374151; flex: 1; }
.sp-legend-val { font-weight: 700; color: #0f172a; }

/* ── Interventions actives ── */
.sp-active-section { background: #fff; border-radius: 14px; padding: 18px 20px; box-shadow: 0 2px 8px rgba(0,0,0,.07); display: flex; flex-direction: column; gap: 14px; }
.sp-section-header { display: flex; align-items: center; justify-content: space-between; }
.sp-section-title { font-size: 0.95rem; font-weight: 700; color: #1e293b; }
.sp-see-all { font-size: 0.8rem; }
.sp-active-list { display: flex; flex-direction: column; gap: 10px; }

.sp-alert-card { border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
.sp-alert-new      { background: #fff7ed; border: 1px solid #fed7aa; }
.sp-alert-progress { background: #fef3c7; border: 1px solid #fde68a; }

.sp-alert-head { display: flex; align-items: center; justify-content: space-between; }
.sp-alert-type { font-weight: 700; color: #0f172a; font-size: 0.88rem; }
.sp-alert-new .sp-alert-status { background: #ffedd5; color: #c2410c; padding: 2px 8px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; }
.sp-alert-progress .sp-alert-status { background: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; }

.sp-alert-meta { display: flex; gap: 14px; flex-wrap: wrap; font-size: 0.78rem; color: #64748b; }
.sp-alert-desc { font-size: 0.78rem; color: #475569; background: rgba(0,0,0,.03); padding: 6px 10px; border-radius: 6px; }
.sp-alert-actions { display: flex; gap: 8px; flex-wrap: wrap; }

/* ── Actions ── */
.sp-actions { display: flex; gap: 10px; flex-wrap: wrap; }
</style>
