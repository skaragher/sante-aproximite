<template>
  <section class="panel">
    <h2>Gestion des plaintes</h2>

    <div class="stats-grid" v-if="store.complaintSummary">
      <article class="stat-card">
        <h3>{{ store.complaintSummary.scope }}</h3>
        <p>Portee</p>
      </article>
      <article class="stat-card">
        <h3>{{ store.complaintSummary.centerCount }}</h3>
        <p>Centres du perimetre</p>
      </article>
      <article class="stat-card">
        <h3>{{ store.complaintSummary.ratingAverage ?? "-" }}</h3>
        <p>Note moyenne</p>
      </article>
      <article class="stat-card">
        <h3>
          {{
            store.complaintSummary.satisfactionRate == null
              ? "-"
              : `${store.complaintSummary.satisfactionRate}%`
          }}
        </h3>
        <p>Taux de satisfaction</p>
      </article>
    </div>

    <div class="toolbar">
      <select v-model="store.complaintStatusFilter">
        <option value="">Toutes</option>
        <option value="NEW">Nouvelles</option>
        <option value="IN_PROGRESS">En cours</option>
        <option value="RESOLVED">Resolues</option>
        <option value="REJECTED">Rejetees</option>
      </select>
      <button @click="store.fetchComplaints">Actualiser</button>
      <button class="secondary" @click="store.fetchComplaintSummary">Actualiser synthese</button>
    </div>

    <p v-if="store.complaintAdminError" class="error">{{ store.complaintAdminError }}</p>
    <p v-if="store.complaintSuccess" class="success">{{ store.complaintSuccess }}</p>

    <div class="card-list">
      <article v-for="item in store.paginatedComplaintsList" :key="item.id" class="card">
        <h4 :class="{ 'complaint-rejected-text': item.status === 'REJECTED' }">
          {{ item.subject }}
        </h4>
        <p><strong>Usager:</strong> Anonyme</p>
        <p>
          <strong>Centre:</strong>
          {{ item.centerName || "Non specifie" }} ({{ item.centerCode || "-" }})
        </p>
        <p :class="{ 'complaint-rejected-text': item.status === 'REJECTED' }">
          <strong>Statut:</strong> {{ store.formatComplaintStatus(item.status) }}
        </p>
        <p>{{ item.message }}</p>
        <p><small>{{ store.formatDate(item.createdAt) }}</small></p>

        <textarea
          v-if="store.canHandleComplaintActions"
          v-model="store.complaintStepNotes[item.id]"
          class="complaint-note-input"
          :placeholder="
            item.status === 'NEW'
              ? 'Commentaire pour la prise en charge'
              : 'Commentaire pour la resolution'
          "
          rows="3"
        />

        <div
          v-if="store.isRegulator && Array.isArray(item.updates) && item.updates.length"
          class="complaint-updates"
        >
          <p><strong>Justifications:</strong></p>
          <p v-for="u in item.updates" :key="u.id" class="muted">
            • {{ store.formatComplaintStatus(u.status) }}: {{ u.message }}
            ({{ store.formatDate(u.createdAt) }})
          </p>
        </div>

        <div class="actions">
          <button
            v-if="store.canHandleComplaintActions"
            class="secondary"
            @click="store.addComplaintExplanation(item)"
          >
            Ajouter explication
          </button>
          <button
            v-if="store.isRegulator && item.status === 'NEW'"
            @click="store.setComplaintStatus(item, 'IN_PROGRESS')"
          >
            Prendre en compte
          </button>
          <button
            v-if="store.isRegulator && (item.status === 'NEW' || item.status === 'IN_PROGRESS')"
            class="ghost danger"
            @click="store.setComplaintStatus(item, 'REJECTED')"
          >
            Rejeter
          </button>
          <button
            v-if="store.isRegulator && item.status === 'IN_PROGRESS'"
            class="secondary"
            @click="store.setComplaintStatus(item, 'RESOLVED')"
          >
            Marquer resolue
          </button>
        </div>
      </article>

      <p v-if="store.complaintsList.length === 0" class="muted">Aucune plainte.</p>

      <div v-if="store.complaintsPageCount > 1" class="actions">
        <button
          class="ghost"
          :disabled="store.complaintsPage <= 1"
          @click="store.complaintsPage = Math.max(1, store.complaintsPage - 1)"
        >
          Precedent
        </button>
        <span class="muted">Page {{ store.complaintsPage }} / {{ store.complaintsPageCount }}</span>
        <button
          class="ghost"
          :disabled="store.complaintsPage >= store.complaintsPageCount"
          @click="store.complaintsPage = Math.min(store.complaintsPageCount, store.complaintsPage + 1)"
        >
          Suivant
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useDashboardStore } from "../../stores/dashboard";
const store = useDashboardStore();
</script>
