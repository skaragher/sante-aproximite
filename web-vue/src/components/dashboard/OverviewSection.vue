<template>
  <section class="panel">
    <h2>Tableau de bord</h2>
    <div class="stats-grid">
      <article class="stat-card">
        <h3>{{ store.allCenters.length }}</h3>
        <p>Centres enregistres</p>
      </article>
      <article class="stat-card">
        <h3>{{ store.nearbyCenters.length }}</h3>
        <p>Centres proches ({{ Number(store.radiusKm) || 20 }} km)</p>
      </article>
      <article class="stat-card">
        <h3>{{ store.isRegulator ? store.users.length : "-" }}</h3>
        <p>Utilisateurs geres</p>
      </article>

      <template v-if="store.isEmergencyResponder">
        <article
          class="stat-card stat-card-emergency-new stat-card-clickable"
          role="button"
          tabindex="0"
          @click="store.openUnhandledEmergencyAlerts"
          @keydown.enter.prevent="store.openUnhandledEmergencyAlerts"
          @keydown.space.prevent="store.openUnhandledEmergencyAlerts"
        >
          <h3>{{ store.emergencyStats.nonTraite }}</h3>
          <p>Alertes non traitees</p>
        </article>
        <article class="stat-card stat-card-emergency-progress">
          <h3>{{ store.emergencyStats.enCours }}</h3>
          <p>Alertes en cours</p>
        </article>
        <article class="stat-card stat-card-emergency-done">
          <h3>{{ store.emergencyStats.traite }}</h3>
          <p>Alertes traitees</p>
        </article>
        <article class="stat-card stat-card-emergency-closed">
          <h3>{{ store.emergencyStats.rejete }}</h3>
          <p>Alertes rejetees</p>
        </article>
      </template>
    </div>

    <div class="actions">
      <button @click="store.fetchAllCenters">Actualiser les centres</button>
      <button class="secondary" @click="store.fetchNearby()">Actualiser les centres proches</button>
      <button
        v-if="store.isEmergencyResponder"
        class="secondary"
        @click="store.tab = 'emergency-alerts'"
      >
        Voir les alertes
      </button>
    </div>

    <p v-if="store.info" class="muted">{{ store.info }}</p>
    <p v-if="store.error" class="error">{{ store.error }}</p>
  </section>
</template>

<script setup>
import { useDashboardStore } from "../../stores/dashboard";
const store = useDashboardStore();
</script>
