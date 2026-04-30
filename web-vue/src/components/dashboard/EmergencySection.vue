<template>
  <section class="panel">
    <h2>Alertes urgence</h2>

    <div class="toolbar">
      <button
        v-for="item in store.emergencyCategoryMenu"
        :key="item.key"
        :class="['ghost', { active: store.emergencyCategory === item.key }]"
        @click="store.emergencyCategory = item.key"
      >
        {{ item.label }}
      </button>
      <label>Du</label>
      <input v-model="store.emergencyPeriodFrom" type="date" />
      <label>Au</label>
      <input v-model="store.emergencyPeriodTo" type="date" />
      <button @click="store.fetchEmergencyAlerts">Actualiser</button>
    </div>

    <p v-if="store.emergencyAlertsError" class="error">{{ store.emergencyAlertsError }}</p>
    <p v-if="store.emergencyAlertsSuccess" class="success">{{ store.emergencyAlertsSuccess }}</p>

    <div class="card-list">
      <article
        v-for="item in store.filteredEmergencyAlerts"
        :key="item.id"
        class="card"
        :class="store.getEmergencyAlertCardClass(item.status)"
      >
        <h4>{{ item.emergencyType }}</h4>
        <p>
          <strong>Statut:</strong>
          <span
            class="emergency-status-badge"
            :class="store.getEmergencyStatusClass(item.status)"
          >
            {{ store.formatEmergencyStatus(item.status) }}
          </span>
        </p>
        <p><strong>Service:</strong> {{ item.targetService }}</p>
        <p><strong>Demandeur:</strong> {{ item.reporterName || "-" }}</p>
        <p><strong>Telephone:</strong> {{ item.phoneNumber }}</p>
        <p><strong>Position:</strong> {{ item.latitude }}, {{ item.longitude }}</p>
        <p><strong>Point de prise en charge:</strong> {{ store.getEmergencyPlaceName(item) }}</p>
        <p><strong>Pays:</strong> {{ store.getEmergencyCountry(item) }}</p>
        <p><strong>Ville:</strong> {{ store.getEmergencyCity(item) }}</p>
        <p><strong>Localite:</strong> {{ store.getEmergencyLocality(item) }}</p>
        <div class="emergency-mini-map-wrap">
          <iframe
            class="emergency-mini-map"
            :src="store.buildEmergencyMapEmbedUrl(item.latitude, item.longitude)"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            title="Carte position alerte"
          ></iframe>
        </div>
        <p>{{ item.description }}</p>
        <p v-if="item.teamLatitude != null && item.teamLongitude != null">
          <strong>Equipe:</strong> {{ item.teamLatitude }}, {{ item.teamLongitude }}
        </p>
        <p v-if="item.teamNote"><strong>Avancement:</strong> {{ item.teamNote }}</p>
        <textarea
          v-model="store.emergencyStepNotes[item.id]"
          class="complaint-note-input"
          placeholder="Note d'avancement pour le demandeur"
          rows="3"
        />
        <div class="actions">
          <button v-if="item.status === 'NEW'" @click="store.takeEmergencyInCharge(item)">
            Prendre en compte
          </button>
          <button
            v-if="['ACKNOWLEDGED','EN_ROUTE','ON_SITE'].includes(item.status)"
            class="secondary"
            @click="store.setEmergencyProgress(item, 'EN_ROUTE')"
          >
            En route
          </button>
          <button
            v-if="['ACKNOWLEDGED','EN_ROUTE','ON_SITE'].includes(item.status)"
            class="secondary"
            @click="store.setEmergencyProgress(item, 'ON_SITE')"
          >
            Sur site
          </button>
          <button
            v-if="['ACKNOWLEDGED','EN_ROUTE','ON_SITE'].includes(item.status)"
            @click="store.setEmergencyProgress(item, 'COMPLETED')"
          >
            Terminer
          </button>
          <button class="secondary" @click="store.navigateToEmergency(item)">
            Naviguer vers l'alerte
          </button>
        </div>
      </article>

      <p v-if="store.filteredEmergencyAlerts.length === 0" class="muted">
        Aucune alerte pour ce filtre/periode.
      </p>
    </div>
  </section>
</template>

<script setup>
import { useDashboardStore } from "../../stores/dashboard";
const store = useDashboardStore();
</script>
