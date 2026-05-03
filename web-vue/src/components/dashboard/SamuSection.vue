<template>
  <section class="samu-root">

    <!-- ═══ En-tête ═══ -->
    <div class="samu-header">
      <div class="samu-header-brand">
        <span class="samu-badge">🚑 SAMU</span>
        <div>
          <h2 class="samu-title">Centre de Régulation Médicale</h2>
          <p class="samu-subtitle">Service d'Aide Médicale Urgente — Tableau de bord opérationnel</p>
        </div>
      </div>
      <div class="samu-header-right">
        <div class="samu-rate-badge" v-if="totalAlerts > 0">
          <span class="samu-rate-value">{{ traitementRate }}%</span>
          <span class="samu-rate-label">Taux de traitement</span>
        </div>
        <div class="samu-clock">🕐 {{ nowStr }}</div>
      </div>
    </div>

    <!-- ═══ Bandeau d'alerte si cas non traités ═══ -->
    <div class="samu-alert-banner" v-if="store.emergencyStats.nonTraite > 0">
      <span class="samu-alert-pulse"></span>
      <strong>{{ store.emergencyStats.nonTraite }} alerte(s) médicale(s) en attente de prise en charge !</strong>
      <button class="samu-alert-cta" @click="store.openUnhandledEmergencyAlerts">
        Traiter maintenant →
      </button>
    </div>

    <!-- ═══ KPI Cards ═══ -->
    <div class="samu-cards">

      <div class="samu-card samu-card-red" role="button" tabindex="0"
        @click="store.openUnhandledEmergencyAlerts"
        @keydown.enter.prevent="store.openUnhandledEmergencyAlerts">
        <div class="samu-card-top">
          <span class="samu-card-tag">🆘 NON TRAITÉES</span>
          <span class="samu-card-ico samu-ico-red">🆘</span>
        </div>
        <div class="samu-card-val">{{ store.emergencyStats.nonTraite }}</div>
        <div class="samu-card-sub">Alertes en attente</div>
        <button class="samu-card-btn" v-if="store.emergencyStats.nonTraite > 0">
          → Prendre en charge
        </button>
        <div class="samu-card-detail" v-else>Aucune alerte en attente ✓</div>
      </div>

      <div class="samu-card samu-card-amber">
        <div class="samu-card-top">
          <span class="samu-card-tag">🚑 EN COURS</span>
          <span class="samu-card-ico samu-ico-amber">🚑</span>
        </div>
        <div class="samu-card-val">{{ store.emergencyStats.enCours }}</div>
        <div class="samu-card-sub">Interventions actives</div>
        <div class="samu-card-detail">
          Équipes déployées sur le terrain
        </div>
      </div>

      <div class="samu-card samu-card-green">
        <div class="samu-card-top">
          <span class="samu-card-tag">✅ TERMINÉES</span>
          <span class="samu-card-ico samu-ico-green">✅</span>
        </div>
        <div class="samu-card-val">{{ store.emergencyStats.traite }}</div>
        <div class="samu-card-sub">Interventions complétées</div>
        <div class="samu-progress-bar">
          <div class="samu-progress-fill" :style="`width:${traitementRate}%`"></div>
        </div>
        <div class="samu-card-detail">Taux de résolution {{ traitementRate }}%</div>
      </div>

      <div class="samu-card samu-card-gray">
        <div class="samu-card-top">
          <span class="samu-card-tag">📁 CLÔTURÉES</span>
          <span class="samu-card-ico samu-ico-gray">📁</span>
        </div>
        <div class="samu-card-val">{{ store.emergencyStats.rejete }}</div>
        <div class="samu-card-sub">Dossiers clos</div>
        <div class="samu-card-detail">Période : {{ periodLabel }}</div>
      </div>

    </div>

    <!-- ═══ Barre récapitulative ═══ -->
    <div class="samu-summary-bar">
      <div class="samu-summary-left">
        <span class="samu-summary-title">🩺 Récapitulatif période — {{ periodLabel }}</span>
      </div>
      <div class="samu-summary-stats">
        <div class="samu-stat">
          <span class="samu-stat-val">{{ totalAlerts }}</span>
          <span class="samu-stat-lbl">Total alertes</span>
        </div>
        <div class="samu-stat">
          <span class="samu-stat-val samu-red">{{ store.emergencyStats.nonTraite }}</span>
          <span class="samu-stat-lbl">Non traitées</span>
        </div>
        <div class="samu-stat">
          <span class="samu-stat-val samu-amber">{{ store.emergencyStats.enCours }}</span>
          <span class="samu-stat-lbl">En cours</span>
        </div>
        <div class="samu-stat">
          <span class="samu-stat-val samu-green">{{ store.emergencyStats.traite }}</span>
          <span class="samu-stat-lbl">Terminées</span>
        </div>
        <div class="samu-stat">
          <span class="samu-stat-val samu-green">{{ traitementRate }}%</span>
          <span class="samu-stat-lbl">Taux traitement</span>
        </div>
      </div>
    </div>

    <!-- ═══ Graphiques ═══ -->
    <div class="samu-charts">

      <!-- Barres : alertes par heure -->
      <div class="samu-chart-card">
        <div class="samu-chart-header">
          <span class="samu-chart-title">📊 Alertes par heure — période en cours</span>
          <span class="samu-chart-badge">Total : {{ totalAlerts }}</span>
        </div>
        <div class="samu-bar-wrap">
          <svg :viewBox="`0 0 ${BAR_W} ${BAR_H}`" preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;display:block">
            <template v-for="tick in yTicks" :key="tick.val">
              <line :x1="BAR_LEFT" :y1="tick.y" :x2="BAR_W - 6" :y2="tick.y" stroke="#e5e7eb" stroke-width="1"/>
              <text :x="BAR_LEFT - 4" :y="tick.y + 4" font-size="10" fill="#9ca3af" text-anchor="end">{{ tick.val }}</text>
            </template>
            <template v-for="(bar, i) in barData" :key="i">
              <rect :x="bar.x" :y="bar.y" :width="bar.w" :height="bar.h" rx="2" fill="#fca5a5"/>
              <rect :x="bar.x" :y="bar.y" :width="bar.w" :height="bar.h" rx="2" fill="#ef4444" :opacity="bar.count > 0 ? 0.85 : 0"/>
              <text v-if="bar.count > 0" :x="bar.x + bar.w / 2" :y="bar.y - 3" font-size="8" fill="#b91c1c" text-anchor="middle">{{ bar.count }}</text>
              <text :x="bar.x + bar.w / 2" :y="BAR_H - 4" font-size="8" fill="#6b7280" text-anchor="middle">{{ bar.label }}</text>
            </template>
          </svg>
        </div>
      </div>

      <!-- Donut : répartition par statut -->
      <div class="samu-chart-card">
        <div class="samu-chart-header">
          <span class="samu-chart-title">🍩 Répartition par statut</span>
        </div>
        <div class="samu-donut-wrap">
          <svg viewBox="0 0 180 180" class="samu-donut-svg">
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
            <text x="90" y="103" text-anchor="middle" font-size="10" fill="#64748b">alertes</text>
          </svg>
          <div class="samu-donut-legend">
            <div v-for="seg in donutSegments" :key="seg.label" class="samu-legend-item">
              <span class="samu-legend-dot" :style="`background:${seg.color}`"></span>
              <span class="samu-legend-lbl">{{ seg.label }}</span>
              <span class="samu-legend-val">{{ seg.count }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ═══ Alertes actives urgentes ═══ -->
    <div class="samu-active-section" v-if="activeAlerts.length > 0">
      <div class="samu-section-header">
        <span class="samu-section-title">🔴 Alertes actives — intervention requise</span>
        <button class="secondary samu-see-all" @click="store.tab = 'emergency-alerts'">
          Tout voir →
        </button>
      </div>
      <div class="samu-active-list">
        <div
          v-for="item in activeAlerts"
          :key="item.id"
          class="samu-alert-card"
          :class="item.status === 'NEW' ? 'samu-alert-new' : 'samu-alert-progress'"
        >
          <div class="samu-alert-head">
            <span class="samu-alert-type">{{ item.emergencyType || 'Urgence médicale' }}</span>
            <span class="samu-alert-status">{{ formatStatus(item.status) }}</span>
          </div>
          <div class="samu-alert-meta">
            <span v-if="item.reporterName">👤 {{ item.reporterName }}</span>
            <span v-if="item.phoneNumber">📞 {{ item.phoneNumber }}</span>
            <span v-if="item.handlerBaseName">🏥 {{ item.handlerBaseName }}</span>
            <span v-if="item.createdAt">🕐 {{ formatTime(item.createdAt) }}</span>
          </div>
          <div class="samu-alert-desc" v-if="item.description">{{ item.description }}</div>
          <div class="samu-alert-actions">
            <button v-if="item.status === 'NEW'" @click="store.takeEmergencyInCharge(item)">
              Prendre en charge
            </button>
            <button class="secondary" @click="store.navigateToEmergency(item)">
              🗺 Naviguer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Actions ═══ -->
    <div class="samu-actions">
      <button @click="store.fetchEmergencyAlerts">Actualiser</button>
      <button class="secondary" @click="store.tab = 'emergency-alerts'">
        Toutes les alertes
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

// ─── Formatage ───────────────────────────────────────────────────────────────
function formatStatus(status) {
  const map = {
    NEW: "NOUVELLE",
    ACKNOWLEDGED: "PRISE EN CHARGE",
    EN_ROUTE: "EN ROUTE",
    ON_SITE: "SUR SITE",
    COMPLETED: "TERMINÉE",
    CLOSED: "CLÔTURÉE",
  };
  return map[status] || status;
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

// ─── Graphique à barres (alertes par heure) ───────────────────────────────
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
    const h = String(i).padStart(2, "0");
    const h2 = String((i + 1) % 24).padStart(2, "0");
    const label = i % 3 === 0 ? `${h}h` : "";
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
    { label: "Non traitées",  count: store.emergencyStats.nonTraite, color: "#ef4444" },
    { label: "En cours",      count: store.emergencyStats.enCours,   color: "#f59e0b" },
    { label: "Terminées",     count: store.emergencyStats.traite,    color: "#10b981" },
    { label: "Clôturées",     count: store.emergencyStats.rejete,    color: "#94a3b8" },
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
.samu-root { padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }

/* ── En-tête ── */
.samu-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.samu-header-brand { display: flex; align-items: center; gap: 14px; }
.samu-badge { background: #dc2626; color: #fff; font-size: 0.85rem; font-weight: 800; padding: 6px 14px; border-radius: 8px; letter-spacing: .04em; }
.samu-title { font-size: 1.55rem; font-weight: 700; color: #0f172a; margin: 0; }
.samu-subtitle { font-size: 0.8rem; color: #64748b; margin: 3px 0 0; }
.samu-header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.samu-rate-badge { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 6px 14px; text-align: center; }
.samu-rate-value { display: block; font-size: 1.1rem; font-weight: 800; color: #059669; }
.samu-rate-label { font-size: 0.7rem; color: #6b7280; }
.samu-clock { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 7px 14px; font-size: 0.82rem; font-weight: 600; color: #dc2626; }

/* ── Bandeau alerte ── */
.samu-alert-banner {
  background: linear-gradient(90deg, #fef2f2, #fee2e2);
  border: 2px solid #fca5a5; border-radius: 12px;
  padding: 12px 20px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  animation: pulse-border 1.5s ease-in-out infinite;
}
@keyframes pulse-border {
  0%, 100% { border-color: #fca5a5; }
  50% { border-color: #ef4444; }
}
.samu-alert-pulse {
  width: 12px; height: 12px; border-radius: 50%; background: #dc2626;
  box-shadow: 0 0 0 0 rgba(220,38,38,0.5);
  animation: pulse-dot 1.2s ease-in-out infinite;
}
@keyframes pulse-dot {
  0% { box-shadow: 0 0 0 0 rgba(220,38,38,0.5); }
  70% { box-shadow: 0 0 0 10px rgba(220,38,38,0); }
  100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
}
.samu-alert-banner strong { color: #7f1d1d; font-size: 0.9rem; flex: 1; }
.samu-alert-cta { background: #dc2626; color: #fff; border: none; border-radius: 6px; padding: 7px 16px; font-size: 0.8rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
.samu-alert-cta:hover { background: #b91c1c; }

/* ── KPI Cards ── */
.samu-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
@media (max-width: 900px) { .samu-cards { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .samu-cards { grid-template-columns: 1fr; } }

.samu-card {
  background: #fff; border-radius: 14px; padding: 18px 20px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,.07); border-top: 4px solid transparent;
  display: flex; flex-direction: column; gap: 6px;
  transition: transform .15s, box-shadow .15s;
}
.samu-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.1); }
.samu-card-red   { border-top-color: #ef4444; cursor: pointer; }
.samu-card-amber { border-top-color: #f59e0b; }
.samu-card-green { border-top-color: #10b981; }
.samu-card-gray  { border-top-color: #94a3b8; }

.samu-card-top { display: flex; align-items: center; justify-content: space-between; }
.samu-card-tag { font-size: 0.72rem; font-weight: 600; letter-spacing: .04em; color: #6b7280; }
.samu-card-ico { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
.samu-ico-red   { background: #fff5f5; }
.samu-ico-amber { background: #fffbeb; }
.samu-ico-green { background: #f0fdf4; }
.samu-ico-gray  { background: #f8fafc; }
.samu-card-val { font-size: 2.4rem; font-weight: 800; color: #0f172a; line-height: 1; }
.samu-card-sub  { font-size: 0.8rem; color: #64748b; }
.samu-card-detail { font-size: 0.75rem; color: #94a3b8; }
.samu-progress-bar { height: 6px; background: #e5e7eb; border-radius: 99px; overflow: hidden; }
.samu-progress-fill { height: 100%; background: #10b981; border-radius: 99px; transition: width .5s; }
.samu-card-btn { align-self: flex-start; background: #ef4444; color: #fff; border: none; border-radius: 6px; padding: 5px 12px; font-size: 0.75rem; font-weight: 600; cursor: pointer; }
.samu-card-btn:hover { background: #dc2626; }

/* ── Summary bar ── */
.samu-summary-bar {
  background: linear-gradient(90deg, #7f1d1d, #991b1b, #b91c1c);
  border-radius: 12px; padding: 14px 24px;
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
}
.samu-summary-left { }
.samu-summary-title { color: #fecaca; font-size: 0.85rem; font-weight: 600; }
.samu-summary-stats { display: flex; gap: 28px; flex-wrap: wrap; }
.samu-stat { display: flex; flex-direction: column; align-items: center; }
.samu-stat-val { font-size: 1.25rem; font-weight: 800; color: #fff; }
.samu-stat-lbl { font-size: 0.68rem; color: #fca5a5; }
.samu-red   { color: #fca5a5 !important; }
.samu-amber { color: #fde68a !important; }
.samu-green { color: #6ee7b7 !important; }

/* ── Graphiques ── */
.samu-charts { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }
@media (max-width: 860px) { .samu-charts { grid-template-columns: 1fr; } }

.samu-chart-card { background: #fff; border-radius: 14px; padding: 18px 20px; box-shadow: 0 2px 8px rgba(0,0,0,.07); display: flex; flex-direction: column; gap: 12px; }
.samu-chart-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.samu-chart-title { font-size: 0.88rem; font-weight: 600; color: #1e293b; }
.samu-chart-badge { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 20px; padding: 2px 10px; font-size: 0.75rem; font-weight: 600; }
.samu-bar-wrap { width: 100%; overflow: hidden; }
.samu-donut-wrap { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.samu-donut-svg { width: 150px; height: 150px; flex-shrink: 0; }
.samu-donut-legend { display: flex; flex-direction: column; gap: 10px; }
.samu-legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; }
.samu-legend-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.samu-legend-lbl { color: #374151; flex: 1; }
.samu-legend-val { font-weight: 700; color: #0f172a; }

/* ── Alertes actives ── */
.samu-active-section { background: #fff; border-radius: 14px; padding: 18px 20px; box-shadow: 0 2px 8px rgba(0,0,0,.07); display: flex; flex-direction: column; gap: 14px; }
.samu-section-header { display: flex; align-items: center; justify-content: space-between; }
.samu-section-title { font-size: 0.95rem; font-weight: 700; color: #1e293b; }
.samu-see-all { font-size: 0.8rem; }
.samu-active-list { display: flex; flex-direction: column; gap: 10px; }

.samu-alert-card { border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
.samu-alert-new      { background: #fef2f2; border: 1px solid #fecaca; }
.samu-alert-progress { background: #fffbeb; border: 1px solid #fde68a; }

.samu-alert-head { display: flex; align-items: center; justify-content: space-between; }
.samu-alert-type { font-weight: 700; color: #0f172a; font-size: 0.88rem; }
.samu-alert-new .samu-alert-status { background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; }
.samu-alert-progress .samu-alert-status { background: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; }

.samu-alert-meta { display: flex; gap: 14px; flex-wrap: wrap; font-size: 0.78rem; color: #64748b; }
.samu-alert-desc { font-size: 0.78rem; color: #475569; background: rgba(0,0,0,.03); padding: 6px 10px; border-radius: 6px; }
.samu-alert-actions { display: flex; gap: 8px; flex-wrap: wrap; }

/* ── Actions ── */
.samu-actions { display: flex; gap: 10px; flex-wrap: wrap; }
</style>
