<template>
  <section class="panel">
    <div class="sec-header">
      <div class="sec-title-row">
        <span class="sec-icon">🛡</span>
        <div>
          <h2 class="sec-title">Alertes de sécurité</h2>
          <p class="sec-sub">{{ serviceLabel }}</p>
        </div>
      </div>

      <div class="sec-stats">
        <div class="stat-chip stat-new">
          <span class="stat-num">{{ store.securityAlertStats.nonTraite }}</span>
          <span class="stat-lbl">Nouveaux</span>
        </div>
        <div class="stat-chip stat-progress">
          <span class="stat-num">{{ store.securityAlertStats.enCours }}</span>
          <span class="stat-lbl">En cours</span>
        </div>
        <div class="stat-chip stat-resolved">
          <span class="stat-num">{{ store.securityAlertStats.resolu }}</span>
          <span class="stat-lbl">Résolus</span>
        </div>
        <div class="stat-chip stat-closed">
          <span class="stat-num">{{ store.securityAlertStats.cloture }}</span>
          <span class="stat-lbl">Clôturés</span>
        </div>
      </div>
    </div>

    <div class="toolbar">
      <button
        v-for="item in store.securityCategoryMenu"
        :key="item.key"
        :class="['ghost', { active: store.securityCategory === item.key }]"
        @click="store.securityCategory = item.key"
      >
        {{ item.label }}
      </button>
      <button class="ml-auto" @click="store.fetchSecurityAlerts()">↺ Actualiser</button>
    </div>

    <p v-if="store.securityAlertsError" class="error">{{ store.securityAlertsError }}</p>
    <p v-if="store.securityAlertsSuccess" class="success">{{ store.securityAlertsSuccess }}</p>

    <div class="card-list">
      <article
        v-for="item in store.filteredSecurityAlerts"
        :key="item.id"
        class="sec-card"
        :class="store.getSecurityAlertCardClass(item.status)"
      >
        <div class="sec-card-head">
          <div class="sec-card-type">
            <span class="sec-type-icon">{{ typeIcon(item.alertType) }}</span>
            <strong>{{ store.formatSecurityAlertType(item.alertType) }}</strong>
          </div>
          <span
            class="sec-status-badge"
            :class="store.getSecurityStatusClass(item.status)"
          >
            {{ store.formatSecurityStatus(item.status) }}
          </span>
        </div>

        <div class="sec-card-body">
          <div class="sec-field-grid">
            <div class="sec-field">
              <span class="sec-field-lbl">Service</span>
              <span class="sec-field-val">{{ item.targetService || "-" }}</span>
            </div>
            <div class="sec-field">
              <span class="sec-field-lbl">Lieu</span>
              <span class="sec-field-val">{{ item.locationName || "-" }}</span>
            </div>
            <div class="sec-field">
              <span class="sec-field-lbl">Signalant</span>
              <span class="sec-field-val">{{ item.reporterName || "-" }}</span>
            </div>
            <div class="sec-field">
              <span class="sec-field-lbl">Téléphone</span>
              <span class="sec-field-val">{{ item.phoneNumber || "-" }}</span>
            </div>
            <div class="sec-field" v-if="item.handlerName">
              <span class="sec-field-lbl">Pris en charge par</span>
              <span class="sec-field-val">{{ item.handlerName }}</span>
            </div>
            <div class="sec-field" v-if="item.handledAt">
              <span class="sec-field-lbl">Pris en charge le</span>
              <span class="sec-field-val">{{ formatDate(item.handledAt) }}</span>
            </div>
            <div class="sec-field">
              <span class="sec-field-lbl">Signalé le</span>
              <span class="sec-field-val">{{ formatDate(item.createdAt) }}</span>
            </div>
            <div class="sec-field">
              <span class="sec-field-lbl">Position</span>
              <span class="sec-field-val">{{ item.latitude }}, {{ item.longitude }}</span>
            </div>
          </div>

          <p v-if="item.description" class="sec-description">{{ item.description }}</p>

          <div v-if="item.photos && item.photos.length" class="sec-photos">
            <img
              v-for="(photo, idx) in item.photos"
              :key="idx"
              :src="photo"
              alt="Photo alerte"
              class="sec-photo"
            />
          </div>

          <div class="sec-mini-map-wrap">
            <iframe
              class="sec-mini-map"
              :src="store.buildSecurityMapEmbedUrl(item.latitude, item.longitude)"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              title="Carte position alerte securite"
            ></iframe>
          </div>
        </div>

        <div class="actions">
          <button
            v-if="item.status === 'NEW'"
            @click="store.takeSecurityAlertInCharge(item)"
          >
            Prendre en compte
          </button>
          <button
            v-if="item.status === 'ACKNOWLEDGED'"
            class="secondary"
            @click="store.resolveSecurityAlert(item)"
          >
            Marquer résolu
          </button>
          <button
            v-if="['ACKNOWLEDGED', 'RESOLVED'].includes(item.status)"
            class="ghost"
            @click="store.closeSecurityAlert(item)"
          >
            Clôturer
          </button>
          <button class="secondary" @click="store.navigateToSecurityAlert(item)">
            Naviguer
          </button>
        </div>
      </article>

      <p v-if="store.filteredSecurityAlerts.length === 0" class="muted">
        Aucune alerte pour ce filtre.
      </p>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useDashboardStore } from "../../stores/dashboard";

const store = useDashboardStore();

const serviceLabel = computed(() => {
  if (store.authRoles.includes("POLICE"))            return "Police Nationale";
  if (store.authRoles.includes("GENDARMERIE"))       return "Gendarmerie Nationale";
  if (store.authRoles.includes("PROTECTION_CIVILE")) return "Protection Civile";
  return "Toutes les alertes de sécurité";
});

function typeIcon(type) {
  const map = { AGRESSION: "⚠️", ACCIDENT: "🚗", INCENDIE: "🔥", INTRUSION: "🚪", AUTRE: "📋" };
  return map[String(type || "").toUpperCase()] || "📋";
}

function formatDate(raw) {
  if (!raw) return "-";
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(raw));
  } catch {
    return String(raw);
  }
}
</script>

<style scoped>
.panel {
  padding: 24px;
}

.sec-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.sec-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.sec-icon {
  font-size: 2.2rem;
  line-height: 1;
}

.sec-title {
  margin: 0 0 2px;
  font-size: 1.4rem;
  font-weight: 800;
  color: #0d2f57;
}

.sec-sub {
  margin: 0;
  font-size: 0.85rem;
  color: #5a7aa8;
  font-weight: 600;
}

.sec-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.stat-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 18px;
  border-radius: 12px;
  min-width: 72px;
}

.stat-num {
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1;
}

.stat-lbl {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 3px;
}

.stat-new      { background: #fff4f4; border: 1px solid #f4c0c0; color: #c0392b; }
.stat-progress { background: #fffbf0; border: 1px solid #f5d87a; color: #b07700; }
.stat-resolved { background: #f0fff8; border: 1px solid #7fd9b0; color: #1a7a4a; }
.stat-closed   { background: #f5f5f5; border: 1px solid #c8c8c8; color: #666; }

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.ml-auto { margin-left: auto; }

.card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sec-card {
  border-radius: 14px;
  border: 1.5px solid #e0e8f5;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(10, 50, 100, 0.06);
}

.sec-card.card-new        { border-left: 5px solid #e74c3c; }
.sec-card.card-in-progress{ border-left: 5px solid #f39c12; }
.sec-card.card-resolved   { border-left: 5px solid #27ae60; }
.sec-card.card-closed     { border-left: 5px solid #95a5a6; opacity: 0.85; }

.sec-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px 10px;
  border-bottom: 1px solid #edf2fa;
}

.sec-card-type {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.05rem;
  color: #1a3a6e;
}

.sec-type-icon {
  font-size: 1.3rem;
}

.sec-status-badge {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.badge-new         { background: #fdecec; color: #c0392b; }
.badge-in-progress { background: #fef9e7; color: #b07700; }
.badge-success     { background: #eafaf1; color: #1a7a4a; }
.badge-closed      { background: #f0f0f0; color: #666; }

.sec-card-body {
  padding: 14px 18px;
}

.sec-field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px 16px;
  margin-bottom: 12px;
}

.sec-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sec-field-lbl {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #7a95bc;
}

.sec-field-val {
  font-size: 0.9rem;
  color: #1a3a6e;
  font-weight: 600;
}

.sec-description {
  margin: 0 0 12px;
  padding: 10px 12px;
  background: #f7faff;
  border-radius: 8px;
  border: 1px solid #dce8f5;
  font-size: 0.9rem;
  color: #2c4a72;
  line-height: 1.5;
}

.sec-photos {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.sec-photo {
  width: 90px;
  height: 90px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #dce8f5;
}

.sec-mini-map-wrap {
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 12px;
  border: 1px solid #dce8f5;
}

.sec-mini-map {
  width: 100%;
  height: 200px;
  border: none;
  display: block;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 18px 14px;
  border-top: 1px solid #edf2fa;
}
</style>
