<template>
  <section class="panel">
    <h2>Evaluations des centres</h2>

    <div class="toolbar">
      <input
        v-model="store.evaluationSearch"
        type="text"
        placeholder="Rechercher un centre (nom, code, ville)"
      />
      <button @click="store.fetchAllCenters">Actualiser</button>
      <button class="secondary" @click="store.fetchComplaintSummary">Actualiser synthese</button>
    </div>

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
        <p>Note moyenne globale</p>
      </article>
      <article class="stat-card">
        <h3>
          {{
            store.complaintSummary.satisfactionRate == null
              ? "-"
              : `${store.complaintSummary.satisfactionRate}%`
          }}
        </h3>
        <p>Satisfaction globale</p>
      </article>
      <article class="stat-card">
        <h3>{{ store.complaintSummary.centersWithoutEvaluation ?? 0 }}</h3>
        <p>Centres sans evaluation</p>
      </article>
    </div>

    <div class="evaluation-charts" v-if="store.complaintSummary">
      <!-- Coverage donut -->
      <article class="chart-card">
        <h3>Couverture des evaluations</h3>
        <div class="coverage-wrap">
          <div
            class="coverage-donut"
            :style="{ '--coverage': `${store.evaluationCoverage.percent}%` }"
          ></div>
          <div>
            <p>
              <strong>{{ store.evaluationCoverage.percent }}%</strong> de centres evalues
            </p>
            <p class="muted">
              {{ store.evaluationCoverage.withEvaluations }} /
              {{ store.evaluationCoverage.totalCenters }} centres
            </p>
            <p class="muted">
              {{ store.evaluationCoverage.withoutEvaluations }} centres sans evaluation
            </p>
          </div>
        </div>
      </article>

      <!-- Satisfaction bar -->
      <article class="chart-card">
        <h3>Satisfaction globale</h3>
        <div class="stack-bar">
          <span
            class="stack-satisfied"
            :style="{ width: `${store.satisfactionBreakdown.satisfied}%` }"
          ></span>
          <span
            class="stack-unsatisfied"
            :style="{ width: `${store.satisfactionBreakdown.unsatisfied}%` }"
          ></span>
        </div>
        <div class="legend-row">
          <span class="legend-chip legend-satisfied">
            Satisfaits: {{ store.satisfactionBreakdown.satisfied }}%
          </span>
          <span class="legend-chip legend-unsatisfied">
            Insatisfaits: {{ store.satisfactionBreakdown.unsatisfied }}%
          </span>
        </div>
      </article>

      <!-- Top 5 bar chart -->
      <article class="chart-card">
        <h3>Top 5 centres (notation)</h3>
        <div class="bar-chart">
          <div
            v-for="center in store.topRatedCenters"
            :key="`top_${center._id}`"
            class="bar-row"
          >
            <span class="bar-label">{{ center.name }}</span>
            <div class="bar-track">
              <div
                class="bar-fill"
                :style="{
                  width: `${Math.max(0, Math.min(100, (center.ratingAverage || 0) * 20))}%`,
                }"
              ></div>
            </div>
            <span class="bar-value">
              {{ center.ratingAverage == null ? "-" : center.ratingAverage }}
            </span>
          </div>
          <p v-if="store.topRatedCenters.length === 0" class="muted">
            Pas assez de donnees de notation.
          </p>
        </div>
      </article>
    </div>

    <p v-if="store.complaintAdminError" class="error">{{ store.complaintAdminError }}</p>

    <div class="card-list">
      <article
        v-for="center in store.paginatedEvaluationCenters"
        :key="center._id"
        class="card"
      >
        <h4>{{ center.name }}</h4>
        <p><strong>Code:</strong> {{ center.establishmentCode || "-" }}</p>
        <p><strong>Adresse:</strong> {{ center.address || "-" }}</p>
        <p>
          <strong>Note moyenne:</strong>
          {{ center.ratingAverage == null ? "-" : center.ratingAverage }}
        </p>
        <p>
          <strong>Taux de satisfaction:</strong>
          {{ center.satisfactionRate == null ? "-" : `${center.satisfactionRate}%` }}
        </p>
        <p><strong>Nombre d'evaluations:</strong> {{ center.ratingCount || 0 }}</p>
      </article>

      <p v-if="store.filteredEvaluationCenters.length === 0" class="muted">
        Aucune evaluation a afficher.
      </p>

      <div v-if="store.evaluationPageCount > 1" class="actions">
        <button
          class="ghost"
          :disabled="store.evaluationPage <= 1"
          @click="store.evaluationPage = Math.max(1, store.evaluationPage - 1)"
        >
          Precedent
        </button>
        <span class="muted">Page {{ store.evaluationPage }} / {{ store.evaluationPageCount }}</span>
        <button
          class="ghost"
          :disabled="store.evaluationPage >= store.evaluationPageCount"
          @click="store.evaluationPage = Math.min(store.evaluationPageCount, store.evaluationPage + 1)"
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
