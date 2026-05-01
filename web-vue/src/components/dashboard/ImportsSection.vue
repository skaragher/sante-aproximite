<template>
  <section class="imports-page">
    <header class="imports-hero">
      <div>
        <p class="imports-kicker">Gouvernance des donnees</p>
        <h2>Importations</h2>
        <p class="imports-intro">
          Centralisez ici les canevas, les exports de reference et les imports de centres,
          regions et districts dans un seul espace.
        </p>
      </div>
      <div class="imports-hero-badge">
        <strong>3 flux</strong>
        <span>Centres, regions, districts</span>
      </div>
    </header>

    <div class="imports-layout">
      <article class="imports-card imports-card-wide">
        <div class="imports-card-head">
          <div>
            <p class="imports-eyebrow">Ressources</p>
            <h3>Canevas et exports</h3>
          </div>
          <p class="muted">
            Telechargez les canevas officiels puis exportez les donnees existantes pour reutiliser
            exactement le meme format.
          </p>
        </div>

        <div class="resource-grid">
          <section class="resource-panel">
            <h4>Centres de sante</h4>
            <p class="muted">
              Format attendu pour les centres: name, address, latitude, longitude,
              technicalPlatform, level, establishmentType, establishmentCode, regionCode,
              districtCode, services.
            </p>
            <div class="resource-actions">
              <a class="resource-link" href="/imports/canevas_centres_sante.csv" download>
                Canevas centres CSV
              </a>
              <a
                class="resource-link"
                href="/imports/BD_ETS_SANITAIRES_import_sante_aproximite.xlsx"
                download
              >
                Exemple centres XLSX
              </a>
              <a
                class="resource-link"
                href="/imports/BD_ETS_SANITAIRES_import_sante_aproximite.csv"
                download
              >
                Exemple centres CSV
              </a>
              <button type="button" class="resource-link resource-link-button" @click="store.exportEspcCsv">
                Export centres de proximite
              </button>
            </div>
          </section>

          <section class="resource-panel">
            <h4>Decoupage geographique</h4>
            <p class="muted">
              Utilisez ces canevas pour maintenir les regions et districts avant d'importer les
              centres.
            </p>
            <div class="resource-actions">
              <a class="resource-link" href="/imports/canevas_regions.csv" download>
                Canevas regions CSV
              </a>
              <a class="resource-link" href="/imports/canevas_districts.csv" download>
                Canevas districts CSV
              </a>
              <button type="button" class="resource-link resource-link-button" @click="store.exportRegionsCsv">
                Export regions
              </button>
              <button type="button" class="resource-link resource-link-button" @click="store.exportDistrictsCsv">
                Export districts
              </button>
            </div>
          </section>
        </div>

        <p v-if="store.geoError" class="error imports-feedback">{{ store.geoError }}</p>
        <p v-if="store.geoSuccess" class="success imports-feedback">{{ store.geoSuccess }}</p>
      </article>

      <article class="imports-card">
        <div class="imports-card-head">
          <div>
            <p class="imports-eyebrow">Import geographique</p>
            <h3>Regions</h3>
          </div>
          <span class="status-chip">{{ store.regionImportPreviewCount }} ligne(s) valide(s)</span>
        </div>

        <p class="muted">
          Importez un fichier CSV ou Excel contenant au minimum `code` et `name`.
        </p>
        <label class="file-drop">
          <span>Choisir le fichier regions</span>
          <input type="file" accept=".xlsx,.xls,.csv" @change="store.onRegionImportFileChange" />
        </label>
        <button
          class="primary-action"
          @click="store.importRegionsFromFile"
          :disabled="!store.parsedRegions.length || store.regionImportLoading"
        >
          {{ store.regionImportLoading ? "Import en cours..." : "Importer les regions" }}
        </button>
        <p v-if="store.regionImportError" class="error imports-feedback">{{ store.regionImportError }}</p>
        <p v-if="store.regionImportSuccess" class="success imports-feedback">{{ store.regionImportSuccess }}</p>
      </article>

      <article class="imports-card">
        <div class="imports-card-head">
          <div>
            <p class="imports-eyebrow">Import geographique</p>
            <h3>Districts</h3>
          </div>
          <span class="status-chip">{{ store.districtImportPreviewCount }} ligne(s) valide(s)</span>
        </div>

        <p class="muted">
          Importez un fichier CSV ou Excel contenant `code`, `name` et `regionCode`.
        </p>
        <label class="file-drop">
          <span>Choisir le fichier districts</span>
          <input type="file" accept=".xlsx,.xls,.csv" @change="store.onDistrictImportFileChange" />
        </label>
        <button
          class="primary-action"
          @click="store.importDistrictsFromFile"
          :disabled="!store.parsedDistricts.length || store.districtImportLoading"
        >
          {{ store.districtImportLoading ? "Import en cours..." : "Importer les districts" }}
        </button>
        <p v-if="store.districtImportError" class="error imports-feedback">{{ store.districtImportError }}</p>
        <p v-if="store.districtImportSuccess" class="success imports-feedback">{{ store.districtImportSuccess }}</p>
      </article>

      <article class="imports-card imports-card-wide">
        <div class="imports-card-head">
          <div>
            <p class="imports-eyebrow">Import principal</p>
            <h3>Centres de sante</h3>
          </div>
          <span class="status-chip">{{ store.importPreviewCount }} ligne(s) valide(s)</span>
        </div>

        <div class="centers-import-grid">
          <div class="guidance-panel">
            <h4>Avant d'importer</h4>
            <ul class="guidance-list">
              <li>`name`, `latitude` et `longitude` sont obligatoires.</li>
              <li>Les fichiers CSV et Excel sont acceptes.</li>
              <li>Un fichier exporte par l'application peut etre reimporte directement.</li>
              <li>Les codes region/district connus sont verifies automatiquement.</li>
            </ul>
            <div class="resource-actions">
              <a class="resource-link" href="/imports/canevas_centres_sante.csv" download>
                Canevas centres officiel
              </a>
              <a
                class="resource-link"
                href="/imports/BD_ETS_SANITAIRES_import_sante_aproximite.xlsx"
                download
              >
                Exemple centres XLSX
              </a>
            </div>
          </div>

          <div class="upload-panel">
            <label class="file-drop file-drop-large">
              <span>Choisir le fichier centres</span>
              <small>CSV, XLSX ou XLS</small>
              <input type="file" accept=".xlsx,.xls,.csv" @change="store.onImportFileChange" />
            </label>

            <button
              class="primary-action primary-action-large"
              @click="store.importCentersFromFile"
              :disabled="!store.parsedCenters.length || store.importLoading"
            >
              {{ store.importLoading ? "Import des centres..." : "Importer les centres" }}
            </button>
          </div>
        </div>

        <p v-if="store.importError" class="error imports-feedback">{{ store.importError }}</p>
        <p v-if="store.importSuccess" class="success imports-feedback">{{ store.importSuccess }}</p>
      </article>
    </div>
  </section>
</template>

<script setup>
import { useDashboardStore } from "../../stores/dashboard";

const store = useDashboardStore();
</script>

<style scoped>
.imports-page {
  display: grid;
  gap: 20px;
}

.imports-hero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 26px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(68, 189, 94, 0.18), transparent 38%),
    linear-gradient(135deg, #0b2a60 0%, #12479d 54%, #1d6cd6 100%);
  color: #fff;
  box-shadow: 0 16px 36px rgba(12, 45, 107, 0.22);
}

.imports-kicker {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(220, 236, 255, 0.78);
}

.imports-hero h2 {
  margin: 0;
  font-size: 30px;
  line-height: 1.1;
}

.imports-intro {
  max-width: 760px;
  margin: 10px 0 0;
  color: rgba(239, 246, 255, 0.92);
}

.imports-hero-badge {
  min-width: 180px;
  align-self: flex-start;
  display: grid;
  gap: 6px;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  text-align: right;
}

.imports-hero-badge strong {
  font-size: 22px;
}

.imports-hero-badge span {
  color: rgba(230, 241, 255, 0.82);
  font-size: 13px;
}

.imports-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.imports-card {
  display: grid;
  gap: 16px;
  padding: 22px;
  border-radius: 20px;
  border: 1px solid rgba(15, 61, 148, 0.08);
  background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.06);
}

.imports-card-wide {
  grid-column: 1 / -1;
}

.imports-card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.imports-card-head h3,
.resource-panel h4,
.guidance-panel h4 {
  margin: 0;
}

.imports-eyebrow {
  margin: 0 0 6px;
  color: var(--blue-700);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: #edf6ff;
  color: var(--blue-800);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.resource-grid,
.centers-import-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.resource-panel,
.guidance-panel,
.upload-panel {
  display: grid;
  gap: 12px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.9);
}

.resource-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.resource-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid rgba(17, 82, 188, 0.16);
  background: #f7faff;
  color: var(--blue-800);
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
}

.resource-link:hover,
.resource-link-button:hover {
  transform: translateY(-1px);
  background: #eef5ff;
  box-shadow: 0 10px 20px rgba(17, 82, 188, 0.08);
}

.resource-link-button {
  font: inherit;
}

.file-drop {
  display: grid;
  gap: 6px;
  justify-items: start;
  padding: 16px;
  border: 1px dashed rgba(17, 82, 188, 0.28);
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%);
  color: var(--blue-900);
  font-weight: 700;
}

.file-drop input {
  width: 100%;
  color: var(--gray-700);
  font-weight: 500;
}

.file-drop-large {
  min-height: 150px;
  align-content: center;
  justify-items: center;
  text-align: center;
}

.file-drop small {
  color: var(--gray-600);
  font-weight: 600;
}

.primary-action {
  min-height: 44px;
  padding: 0 16px;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, #1152bc 0%, #1a67d4 100%);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(17, 82, 188, 0.18);
}

.primary-action:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

.primary-action-large {
  min-height: 50px;
}

.guidance-list {
  margin: 0;
  padding-left: 18px;
  color: var(--gray-700);
}

.imports-feedback {
  margin: 0;
}

@media (max-width: 980px) {
  .imports-layout,
  .resource-grid,
  .centers-import-grid {
    grid-template-columns: 1fr;
  }

  .imports-hero,
  .imports-card-head {
    grid-template-columns: 1fr;
    display: grid;
  }

  .imports-hero-badge {
    text-align: left;
    min-width: 0;
  }
}
</style>
