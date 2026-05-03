<template>
  <section class="ov-root">

    <!-- ═══ En-tête ═══ -->
    <div class="ov-header">
      <div class="ov-header-left">
        <h2 class="ov-title">Tableau de bord</h2>
        <p class="ov-subtitle">📅 {{ currentYear }} - Vue globale - Données en temps réel</p>
      </div>
      <div class="ov-header-right">
        <div class="ov-rate-badge" v-if="store.allCenters.length > 0">
          <span class="ov-rate-value">{{ approvalRate }}%</span>
          <span class="ov-rate-label">Taux validation</span>
        </div>
        <div class="ov-date">🕐 {{ nowStr }}</div>
      </div>
    </div>

    <!-- ═══ Cartes statistiques KPI ═══ -->
    <div class="ov-cards">

      <div class="ov-card ov-card-blue">
        <div class="ov-card-top">
          <span class="ov-card-tag">⏳ EN ATTENTE</span>
          <span class="ov-card-icon-bg ov-icon-blue">⏳</span>
        </div>
        <div class="ov-card-value">{{ store.pendingCenters.length }}</div>
        <div class="ov-card-sub">
          {{ store.pendingCenters.length === 0 ? 'Aucun centre en attente' : 'Centre(s) à valider' }}
        </div>
        <div class="ov-card-detail" v-if="store.isRegulator">
          📋 Ce mois : {{ pendingThisMonth }}
        </div>
      </div>

      <div class="ov-card ov-card-green">
        <div class="ov-card-top">
          <span class="ov-card-tag">✅ APPROUVÉS</span>
          <span class="ov-card-icon-bg ov-icon-green">✅</span>
        </div>
        <div class="ov-card-value">{{ approvedCount }}</div>
        <div class="ov-card-sub">Centres actifs validés</div>
        <div class="ov-progress-bar">
          <div class="ov-progress-fill" :style="`width:${approvalRate}%`"></div>
        </div>
        <div class="ov-card-detail">Taux de validation {{ approvalRate }}%</div>
      </div>

      <div class="ov-card ov-card-red" v-if="!store.isNational"
        :class="{ 'ov-card-clickable': store.isEmergencyResponder }"
        :role="store.isEmergencyResponder ? 'button' : undefined"
        :tabindex="store.isEmergencyResponder ? 0 : undefined"
        @click="store.isEmergencyResponder && store.openUnhandledEmergencyAlerts()"
        @keydown.enter.prevent="store.isEmergencyResponder && store.openUnhandledEmergencyAlerts()"
      >
        <div class="ov-card-top">
          <span class="ov-card-tag">🚨 ALERTES</span>
          <span class="ov-card-icon-bg ov-icon-red">🚨</span>
        </div>
        <div class="ov-card-value">{{ store.emergencyStats.nonTraite }}</div>
        <div class="ov-card-sub">Sans prise en charge</div>
        <button v-if="store.emergencyStats.nonTraite > 0 && store.isEmergencyResponder" class="ov-action-btn">→ Action requise</button>
        <div class="ov-card-detail" v-else>En cours : {{ store.emergencyStats.enCours }}</div>
      </div>
      <!-- NATIONAL : pas d'accès direct aux données opérationnelles des services d'urgence -->
      <div class="ov-card ov-card-slate" v-else>
        <div class="ov-card-top">
          <span class="ov-card-tag">🏛 RÉFÉRENTIEL</span>
          <span class="ov-card-icon-bg" style="background:#f1f5f9">🏛</span>
        </div>
        <div class="ov-card-value">{{ store.regions.length }}</div>
        <div class="ov-card-sub">Régions actives</div>
        <div class="ov-card-detail">Districts : {{ store.districts?.length || '-' }}</div>
      </div>

      <div class="ov-card ov-card-orange">
        <div class="ov-card-top">
          <span class="ov-card-tag">📋 PLAINTES</span>
          <span class="ov-card-icon-bg ov-icon-orange">📋</span>
        </div>
        <div class="ov-card-value">{{ newComplaintsCount }}</div>
        <div class="ov-card-sub">Nouvelles plaintes reçues</div>
        <div class="ov-card-detail" v-if="store.isRegulator">
          👥 {{ store.users.length }} utilisateurs
        </div>
        <div class="ov-card-detail" v-else>
          Total : {{ store.complaintsList.length }}
        </div>
      </div>

    </div>

    <!-- ═══ Barre récapitulative ═══ -->
    <div class="ov-summary-bar">
      <div class="ov-summary-title">📊 {{ currentYear }} - Vue globale</div>
      <div class="ov-summary-stats">
        <div class="ov-summary-stat">
          <span class="ov-summary-val">{{ store.allCenters.length }}</span>
          <span class="ov-summary-lbl">Total centres</span>
        </div>
        <div class="ov-summary-stat">
          <span class="ov-summary-val">{{ approvedCount }}</span>
          <span class="ov-summary-lbl">Approuvés</span>
        </div>
        <div class="ov-summary-stat">
          <span class="ov-summary-val">{{ store.pendingCenters.length }}</span>
          <span class="ov-summary-lbl">En attente</span>
        </div>
        <div class="ov-summary-stat ov-summary-green">
          <span class="ov-summary-val">{{ approvalRate }}%</span>
          <span class="ov-summary-lbl">Taux validation</span>
        </div>
        <div class="ov-summary-stat ov-summary-red" v-if="!store.isNational">
          <span class="ov-summary-val">{{ store.emergencyStats.nonTraite }}</span>
          <span class="ov-summary-lbl">Alertes</span>
        </div>
        <div class="ov-summary-stat" v-else>
          <span class="ov-summary-val">{{ store.districts?.length || '-' }}</span>
          <span class="ov-summary-lbl">Districts</span>
        </div>
      </div>
    </div>

    <!-- ═══ Graphiques ═══ -->
    <div class="ov-charts">

      <div class="ov-chart-card">
        <div class="ov-chart-header">
          <span class="ov-chart-title">📊 Centres enregistrés par mois - {{ currentYear }}</span>
          <span class="ov-chart-badge">Total : {{ store.allCenters.length }}</span>
        </div>
        <div class="ov-bar-chart-wrap">
          <svg
            :viewBox="`0 0 ${BAR_W} ${BAR_H}`"
            preserveAspectRatio="xMidYMid meet"
            style="width:100%;height:auto;display:block"
          >
            <template v-for="tick in yTicks" :key="tick.val">
              <line
                :x1="BAR_LEFT" :y1="tick.y"
                :x2="BAR_W - 6" :y2="tick.y"
                stroke="#e5e7eb" stroke-width="1"
              />
              <text
                :x="BAR_LEFT - 4" :y="tick.y + 4"
                font-size="10" fill="#9ca3af" text-anchor="end"
              >{{ tick.val }}</text>
            </template>
            <template v-for="(bar, i) in barData" :key="i">
              <rect :x="bar.x" :y="bar.y" :width="bar.w" :height="bar.h" rx="3" fill="#93c5fd"/>
              <text v-if="bar.count > 0" :x="bar.x + bar.w / 2" :y="bar.y - 3" font-size="9" fill="#1d4ed8" text-anchor="middle">{{ bar.count }}</text>
              <text :x="bar.x + bar.w / 2" :y="BAR_H - 4" font-size="9" fill="#6b7280" text-anchor="middle">{{ bar.label }}</text>
            </template>
          </svg>
        </div>
      </div>

      <div class="ov-chart-card">
        <div class="ov-chart-header">
          <span class="ov-chart-title">🍩 Répartition par statut</span>
        </div>
        <div class="ov-donut-wrap">
          <svg viewBox="0 0 180 180" class="ov-donut-svg">
            <circle cx="90" cy="90" r="60" fill="none" stroke="#f1f5f9" stroke-width="26"/>
            <circle
              v-for="(seg, i) in donutSegments" :key="i"
              cx="90" cy="90" r="60"
              fill="none"
              :stroke="seg.color"
              stroke-width="26"
              :stroke-dasharray="`${seg.dash} ${seg.gap}`"
              :stroke-dashoffset="seg.dashoffset"
              transform="rotate(-90 90 90)"
            />
            <text x="90" y="86" text-anchor="middle" font-size="22" font-weight="700" fill="#1e293b">{{ store.allCenters.length }}</text>
            <text x="90" y="103" text-anchor="middle" font-size="10" fill="#64748b">centres</text>
          </svg>
          <div class="ov-donut-legend">
            <div v-for="seg in donutSegments" :key="seg.label" class="ov-legend-item">
              <span class="ov-legend-dot" :style="`background:${seg.color}`"></span>
              <span class="ov-legend-label">{{ seg.label }}</span>
              <span class="ov-legend-val">{{ seg.count }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ═══ Blocs thématiques ═══ -->
    <div class="ov-themes">

      <!-- Réseau de soins -->
      <div class="ov-theme-block ov-theme-blue" @click="store.tab = 'nearby'" role="button" tabindex="0" @keydown.enter.prevent="store.tab = 'nearby'">
        <div class="ov-theme-header">
          <span class="ov-theme-icon">🏥</span>
          <div>
            <div class="ov-theme-title">Réseau de Soins</div>
            <div class="ov-theme-sub">Centres de santé</div>
          </div>
        </div>
        <div class="ov-theme-kpis">
          <div class="ov-theme-kpi">
            <span class="ov-theme-kpi-val">{{ store.allCenters.length }}</span>
            <span class="ov-theme-kpi-lbl">Total</span>
          </div>
          <div class="ov-theme-kpi">
            <span class="ov-theme-kpi-val ov-kpi-green">{{ approvedCount }}</span>
            <span class="ov-theme-kpi-lbl">Actifs</span>
          </div>
          <div class="ov-theme-kpi">
            <span class="ov-theme-kpi-val ov-kpi-amber">{{ store.pendingCenters.length }}</span>
            <span class="ov-theme-kpi-lbl">En attente</span>
          </div>
        </div>
        <div class="ov-theme-cta">Voir la carte →</div>
      </div>

      <!-- Urgences : masqué pour NATIONAL (pas d'accès aux données opérationnelles) -->
      <div
        class="ov-theme-block ov-theme-red"
        v-if="store.isEmergencyResponder && !store.isNational"
        @click="store.tab = 'emergency-alerts'"
        role="button" tabindex="0"
        @keydown.enter.prevent="store.tab = 'emergency-alerts'"
      >
        <div class="ov-theme-header">
          <span class="ov-theme-icon">🚨</span>
          <div>
            <div class="ov-theme-title">Urgences</div>
            <div class="ov-theme-sub">Alertes d'urgence</div>
          </div>
        </div>
        <div class="ov-theme-kpis">
          <div class="ov-theme-kpi">
            <span class="ov-theme-kpi-val ov-kpi-red">{{ store.emergencyStats.nonTraite }}</span>
            <span class="ov-theme-kpi-lbl">Non traitées</span>
          </div>
          <div class="ov-theme-kpi">
            <span class="ov-theme-kpi-val ov-kpi-amber">{{ store.emergencyStats.enCours }}</span>
            <span class="ov-theme-kpi-lbl">En cours</span>
          </div>
          <div class="ov-theme-kpi">
            <span class="ov-theme-kpi-val ov-kpi-green">{{ store.emergencyStats.traite }}</span>
            <span class="ov-theme-kpi-lbl">Traitées</span>
          </div>
        </div>
        <div class="ov-theme-cta">Gérer les alertes →</div>
      </div>
      <div class="ov-theme-block ov-theme-red ov-theme-muted" v-else-if="!store.isNational">
        <div class="ov-theme-header">
          <span class="ov-theme-icon">🚨</span>
          <div>
            <div class="ov-theme-title">Urgences</div>
            <div class="ov-theme-sub">Alertes d'urgence</div>
          </div>
        </div>
        <div class="ov-theme-kpis">
          <div class="ov-theme-kpi">
            <span class="ov-theme-kpi-val ov-kpi-red">{{ store.emergencyStats.nonTraite }}</span>
            <span class="ov-theme-kpi-lbl">Non traitées</span>
          </div>
          <div class="ov-theme-kpi">
            <span class="ov-theme-kpi-val ov-kpi-amber">{{ store.emergencyStats.enCours }}</span>
            <span class="ov-theme-kpi-lbl">En cours</span>
          </div>
          <div class="ov-theme-kpi">
            <span class="ov-theme-kpi-val ov-kpi-green">{{ store.emergencyStats.traite }}</span>
            <span class="ov-theme-kpi-lbl">Traitées</span>
          </div>
        </div>
        <div class="ov-theme-cta ov-cta-muted">Accès réservé SAMU / Pompiers</div>
      </div>

      <!-- Qualité & Satisfaction -->
      <div
        class="ov-theme-block ov-theme-orange"
        v-if="store.canSeeComplaintsPanel"
        @click="store.tab = 'complaints'"
        role="button" tabindex="0"
        @keydown.enter.prevent="store.tab = 'complaints'"
      >
        <div class="ov-theme-header">
          <span class="ov-theme-icon">⭐</span>
          <div>
            <div class="ov-theme-title">Qualité & Satisfaction</div>
            <div class="ov-theme-sub">Plaintes & évaluations</div>
          </div>
        </div>
        <div class="ov-theme-kpis">
          <div class="ov-theme-kpi">
            <span class="ov-theme-kpi-val ov-kpi-red">{{ newComplaintsCount }}</span>
            <span class="ov-theme-kpi-lbl">Nouvelles</span>
          </div>
          <div class="ov-theme-kpi">
            <span class="ov-theme-kpi-val ov-kpi-amber">{{ inProgressComplaintsCount }}</span>
            <span class="ov-theme-kpi-lbl">En cours</span>
          </div>
          <div class="ov-theme-kpi">
            <span class="ov-theme-kpi-val ov-kpi-green">{{ satisfactionPct }}%</span>
            <span class="ov-theme-kpi-lbl">Satisfaction</span>
          </div>
        </div>
        <div class="ov-theme-cta">Voir les plaintes →</div>
      </div>

      <!-- Gouvernance (régulateurs seulement) -->
      <div
        class="ov-theme-block ov-theme-purple"
        v-if="store.isRegulator"
        @click="store.tab = 'settings'"
        role="button" tabindex="0"
        @keydown.enter.prevent="store.tab = 'settings'"
      >
        <div class="ov-theme-header">
          <span class="ov-theme-icon">⚙</span>
          <div>
            <div class="ov-theme-title">Gouvernance</div>
            <div class="ov-theme-sub">Utilisateurs & paramètres</div>
          </div>
        </div>
        <div class="ov-theme-kpis">
          <div class="ov-theme-kpi">
            <span class="ov-theme-kpi-val">{{ store.users.length }}</span>
            <span class="ov-theme-kpi-lbl">Utilisateurs</span>
          </div>
          <div class="ov-theme-kpi">
            <span class="ov-theme-kpi-val ov-kpi-amber">{{ store.pendingChefsCount }}</span>
            <span class="ov-theme-kpi-lbl">Chefs en attente</span>
          </div>
          <div class="ov-theme-kpi">
            <span class="ov-theme-kpi-val">{{ store.regions.length }}</span>
            <span class="ov-theme-kpi-lbl">Régions</span>
          </div>
        </div>
        <div class="ov-theme-cta">Gérer les accès →</div>
      </div>

    </div>

    <!-- ═══ Actions ═══ -->
    <div class="ov-actions">
      <button @click="store.fetchAllCenters">Actualiser</button>
      <button class="secondary" @click="store.tab = 'nearby'">Centres proches</button>
      <button class="secondary" v-if="store.isEmergencyResponder && !store.isNational" @click="store.tab = 'emergency-alerts'">Alertes d'urgence</button>
    </div>

    <p v-if="store.error" class="error">{{ store.error }}</p>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useDashboardStore } from "../../stores/dashboard";

const store = useDashboardStore();

// ─── Horloge ─────────────────────────────────────────────────────────────────
const now = ref(new Date());
let clockTimer;
onMounted(() => { clockTimer = setInterval(() => { now.value = new Date(); }, 1000); });
onUnmounted(() => clearInterval(clockTimer));

const currentYear = computed(() => now.value.getFullYear());
const nowStr = computed(() =>
  now.value.toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
);

// ─── KPI Centres ─────────────────────────────────────────────────────────────
const approvedCount = computed(() =>
  store.allCenters.filter(
    (c) => String(c?.approvalStatus || "").toUpperCase() === "APPROVED"
  ).length
);

const approvalRate = computed(() => {
  const total = store.allCenters.length;
  return total > 0 ? Math.round((approvedCount.value * 100) / total) : 0;
});

const pendingThisMonth = computed(() => {
  const d = new Date();
  return store.pendingCenters.filter((c) => {
    if (!c?.createdAt) return false;
    const cd = new Date(c.createdAt);
    return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth();
  }).length;
});

// ─── KPI Plaintes ─────────────────────────────────────────────────────────────
const newComplaintsCount = computed(() =>
  store.complaintsList.filter(
    (c) => String(c?.status || "").toUpperCase() === "NEW"
  ).length
);
const inProgressComplaintsCount = computed(() =>
  store.complaintsList.filter(
    (c) => String(c?.status || "").toUpperCase() === "IN_PROGRESS"
  ).length
);
const satisfactionPct = computed(() => {
  const rate = store.complaintSummary?.satisfactionRate;
  return rate == null ? 0 : Math.round(Number(rate));
});

// ─── Graphique à barres ───────────────────────────────────────────────────────
const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"];
const BAR_W = 520;
const BAR_H = 170;
const BAR_LEFT = 34;
const BAR_RIGHT = BAR_W - 8;
const BAR_TOP = 14;
const BAR_BOTTOM = BAR_H - 20;
const BAR_AREA_H = BAR_BOTTOM - BAR_TOP;
const BAR_AREA_W = BAR_RIGHT - BAR_LEFT;

const centersByMonth = computed(() => {
  const year = currentYear.value;
  const counts = Array(12).fill(0);
  store.allCenters.forEach((c) => {
    if (!c?.createdAt) return;
    const d = new Date(c.createdAt);
    if (d.getFullYear() === year) counts[d.getMonth()]++;
  });
  return counts;
});

const barData = computed(() => {
  const counts = centersByMonth.value;
  const maxVal = Math.max(...counts, 1);
  const gap = 4;
  const bw = (BAR_AREA_W - gap * 11) / 12;
  return MONTHS.map((label, i) => {
    const count = counts[i];
    const h = Math.max((count / maxVal) * BAR_AREA_H, count > 0 ? 4 : 0);
    const x = BAR_LEFT + i * (bw + gap);
    return { label, count, x, y: BAR_BOTTOM - h, w: bw, h };
  });
});

const yTicks = computed(() => {
  const maxVal = Math.max(...centersByMonth.value, 1);
  return [0, 1, 2, 3, 4].map((i) => ({
    val: Math.round((maxVal * i) / 4),
    y: BAR_BOTTOM - (i / 4) * BAR_AREA_H,
  }));
});

// ─── Graphique en anneau ──────────────────────────────────────────────────────
const CIRC = 2 * Math.PI * 60;

const donutSegments = computed(() => {
  const total = store.allCenters.length;
  const approved = approvedCount.value;
  const pending = store.pendingCenters.length;
  const other = Math.max(total - approved - pending, 0);

  const raw = [
    { label: "Approuvés",  count: approved, color: "#10B981" },
    { label: "En attente", count: pending,  color: "#F59E0B" },
    { label: "Autres",     count: other,    color: "#94a3b8" },
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
/* ── Root ── */
.ov-root { padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }

/* ── En-tête ── */
.ov-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.ov-title { font-size: 1.7rem; font-weight: 700; color: #0f172a; margin: 0; }
.ov-subtitle { font-size: 0.82rem; color: #64748b; margin: 4px 0 0; }
.ov-header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.ov-rate-badge { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 6px 14px; text-align: center; }
.ov-rate-value { display: block; font-size: 1.1rem; font-weight: 800; color: #059669; }
.ov-rate-label { font-size: 0.7rem; color: #6b7280; }
.ov-date { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 7px 14px; font-size: 0.82rem; font-weight: 600; color: #1d4ed8; }

/* ── Cartes KPI ── */
.ov-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
@media (max-width: 900px) { .ov-cards { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .ov-cards { grid-template-columns: 1fr; } }

.ov-card {
  background: #fff; border-radius: 14px; padding: 18px 20px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,.07); border-top: 4px solid transparent;
  display: flex; flex-direction: column; gap: 6px;
  transition: transform .15s, box-shadow .15s;
}
.ov-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.1); }
.ov-card-blue   { border-top-color: #3b82f6; }
.ov-card-green  { border-top-color: #10b981; }
.ov-card-red    { border-top-color: #ef4444; }
.ov-card-orange { border-top-color: #f59e0b; }
.ov-card-clickable { cursor: pointer; }

.ov-card-top { display: flex; align-items: center; justify-content: space-between; }
.ov-card-tag { font-size: 0.72rem; font-weight: 600; letter-spacing: .04em; color: #6b7280; }
.ov-card-icon-bg { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
.ov-icon-blue { background: #eff6ff; }
.ov-icon-green { background: #f0fdf4; }
.ov-icon-red { background: #fff5f5; }
.ov-icon-orange { background: #fffbeb; }

.ov-card-value { font-size: 2.4rem; font-weight: 800; color: #0f172a; line-height: 1; }
.ov-card-sub   { font-size: 0.8rem; color: #64748b; }
.ov-card-detail { font-size: 0.75rem; color: #94a3b8; }

.ov-progress-bar { height: 6px; background: #e5e7eb; border-radius: 99px; overflow: hidden; margin-top: 2px; }
.ov-progress-fill { height: 100%; background: #10b981; border-radius: 99px; transition: width .5s; }
.ov-action-btn { align-self: flex-start; margin-top: 4px; background: #ef4444; color: #fff; border: none; border-radius: 6px; padding: 5px 12px; font-size: 0.75rem; font-weight: 600; cursor: pointer; }
.ov-action-btn:hover { background: #dc2626; }

/* ── Barre récapitulative ── */
.ov-summary-bar { background: #1e3a8a; border-radius: 12px; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.ov-summary-title { color: #bfdbfe; font-size: 0.85rem; font-weight: 600; }
.ov-summary-stats { display: flex; gap: 32px; flex-wrap: wrap; }
.ov-summary-stat { display: flex; flex-direction: column; align-items: center; }
.ov-summary-val { font-size: 1.25rem; font-weight: 800; color: #fff; }
.ov-summary-lbl { font-size: 0.7rem; color: #93c5fd; }
.ov-summary-green .ov-summary-val { color: #34d399; }
.ov-summary-red   .ov-summary-val { color: #fca5a5; }

/* ── Graphiques ── */
.ov-charts { display: grid; grid-template-columns: 1fr 340px; gap: 16px; }
@media (max-width: 860px) { .ov-charts { grid-template-columns: 1fr; } }

.ov-chart-card { background: #fff; border-radius: 14px; padding: 18px 20px; box-shadow: 0 2px 8px rgba(0,0,0,.07); display: flex; flex-direction: column; gap: 14px; }
.ov-chart-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.ov-chart-title { font-size: 0.9rem; font-weight: 600; color: #1e293b; }
.ov-chart-badge { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 20px; padding: 2px 10px; font-size: 0.75rem; font-weight: 600; }
.ov-bar-chart-wrap { width: 100%; overflow: hidden; }
.ov-donut-wrap { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
.ov-donut-svg { width: 160px; height: 160px; flex-shrink: 0; }
.ov-donut-legend { display: flex; flex-direction: column; gap: 10px; }
.ov-legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; }
.ov-legend-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
.ov-legend-label { color: #374151; flex: 1; }
.ov-legend-val { font-weight: 700; color: #0f172a; }

/* ── Blocs thématiques ── */
.ov-themes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
@media (max-width: 1100px) { .ov-themes { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 580px)  { .ov-themes { grid-template-columns: 1fr; } }

.ov-theme-block {
  border-radius: 14px; padding: 18px 20px;
  cursor: pointer; transition: transform .15s, box-shadow .15s;
  display: flex; flex-direction: column; gap: 12px;
  border: 1px solid transparent;
}
.ov-theme-block:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.13); }
.ov-theme-muted { cursor: default; }
.ov-theme-muted:hover { transform: none; box-shadow: none; }

.ov-theme-blue   { background: linear-gradient(135deg, #eff6ff, #dbeafe); border-color: #bfdbfe; }
.ov-theme-red    { background: linear-gradient(135deg, #fff5f5, #fee2e2); border-color: #fecaca; }
.ov-theme-orange { background: linear-gradient(135deg, #fffbeb, #fef3c7); border-color: #fde68a; }
.ov-theme-purple { background: linear-gradient(135deg, #f5f3ff, #ede9fe); border-color: #ddd6fe; }

.ov-theme-header { display: flex; align-items: center; gap: 12px; }
.ov-theme-icon { font-size: 1.6rem; line-height: 1; }
.ov-theme-title { font-size: 0.95rem; font-weight: 700; color: #1e293b; }
.ov-theme-sub   { font-size: 0.75rem; color: #64748b; }

.ov-theme-kpis { display: flex; gap: 16px; flex-wrap: wrap; }
.ov-theme-kpi  { display: flex; flex-direction: column; align-items: center; min-width: 48px; }
.ov-theme-kpi-val { font-size: 1.4rem; font-weight: 800; color: #1e293b; }
.ov-theme-kpi-lbl { font-size: 0.68rem; color: #6b7280; text-align: center; }

.ov-kpi-green { color: #059669; }
.ov-kpi-amber { color: #d97706; }
.ov-kpi-red   { color: #dc2626; }

.ov-theme-cta { font-size: 0.78rem; font-weight: 600; color: #1d4ed8; }
.ov-theme-red .ov-theme-cta    { color: #dc2626; }
.ov-theme-orange .ov-theme-cta { color: #b45309; }
.ov-theme-purple .ov-theme-cta { color: #6d28d9; }
.ov-cta-muted { color: #9ca3af !important; }

/* ── Actions ── */
.ov-actions { display: flex; gap: 10px; flex-wrap: wrap; }
</style>
