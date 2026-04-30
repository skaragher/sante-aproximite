<template>
  <section class="panel settings-panel">
    <h2>Importations</h2>
    <p class="settings-intro">
      Regroupez ici les imports de centres, regions et districts depuis vos fichiers CSV/Excel.
    </p>

    <div class="settings-grid">

      <!-- Template downloads + region/district imports -->
      <article class="card settings-card settings-card-span-2">
        <h3 class="settings-card-title">Canevas d'importation</h3>
        <p class="muted">Import des centres, regions et districts depuis Excel.</p>
        <div class="actions">
          <a class="download-link" href="/imports/canevas_centres_sante.csv" download>
            Canevas centres (CSV avec regionCode/districtCode)
          </a>
          <a
            class="download-link"
            href="/imports/BD_ETS_SANITAIRES_import_sante_aproximite.xlsx"
            download
          >
            Fichier exemple centres (XLSX)
          </a>
          <a
            class="download-link"
            href="/imports/BD_ETS_SANITAIRES_import_sante_aproximite.csv"
            download
          >
            Fichier exemple centres (CSV)
          </a>
          <a class="download-link" href="/imports/canevas_regions.csv" download>
            Canevas regions (CSV)
          </a>
          <a class="download-link" href="/imports/canevas_districts.csv" download>
            Canevas districts (CSV)
          </a>
        </div>
        <div class="form-grid">
          <label>Importer des regions</label>
          <input type="file" accept=".xlsx,.xls,.csv" @change="store.onRegionImportFileChange" />
          <p class="muted">Lignes valides regions: {{ store.regionImportPreviewCount }}</p>
          <button
            @click="store.importRegionsFromFile"
            :disabled="!store.parsedRegions.length || store.regionImportLoading"
          >
            {{ store.regionImportLoading ? "Import..." : "Importer regions" }}
          </button>

          <label>Importer des districts</label>
          <input type="file" accept=".xlsx,.xls,.csv" @change="store.onDistrictImportFileChange" />
          <p class="muted">Lignes valides districts: {{ store.districtImportPreviewCount }}</p>
          <button
            @click="store.importDistrictsFromFile"
            :disabled="!store.parsedDistricts.length || store.districtImportLoading"
          >
            {{ store.districtImportLoading ? "Import..." : "Importer districts" }}
          </button>
        </div>
        <p
          v-if="store.regionImportError || store.districtImportError"
          class="error"
        >
          {{ store.regionImportError || store.districtImportError }}
        </p>
        <p
          v-if="store.regionImportSuccess || store.districtImportSuccess"
          class="success"
        >
          {{ store.regionImportSuccess || store.districtImportSuccess }}
        </p>
      </article>

      <!-- Centers Excel import -->
      <article class="card settings-card">
        <h3 class="settings-card-title">Importer des centres de sante (Excel)</h3>
        <p class="muted">
          Colonnes acceptees: name, address, latitude, longitude, technicalPlatform, level,
          establishmentType, establishmentCode, regionCode, districtCode, services
        </p>
        <p class="muted">
          Regle: regionCode doit exister. Si districtCode est renseigne, il doit appartenir a
          regionCode.
        </p>
        <div class="actions">
          <a class="download-link" href="/imports/canevas_centres_sante.csv" download>
            Canevas officiel (CSV avec regionCode/districtCode)
          </a>
          <a
            class="download-link"
            href="/imports/BD_ETS_SANITAIRES_import_sante_aproximite.xlsx"
            download
          >
            Fichier exemple (XLSX)
          </a>
          <a
            class="download-link"
            href="/imports/BD_ETS_SANITAIRES_import_sante_aproximite.csv"
            download
          >
            Fichier exemple (CSV)
          </a>
        </div>
        <input type="file" accept=".xlsx,.xls" @change="store.onImportFileChange" />
        <p class="muted">Lignes valides detectees: {{ store.importPreviewCount }}</p>
        <div class="actions">
          <button
            @click="store.importCentersFromFile"
            :disabled="!store.parsedCenters.length || store.importLoading"
          >
            {{ store.importLoading ? "Import..." : "Importer" }}
          </button>
        </div>
        <p v-if="store.importError" class="error">{{ store.importError }}</p>
        <p v-if="store.importSuccess" class="success">{{ store.importSuccess }}</p>
      </article>
    </div>
  </section>
</template>

<script setup>
import { useDashboardStore } from "../../stores/dashboard";
const store = useDashboardStore();
</script>
