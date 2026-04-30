<template>
  <section class="panel">
    <h2>Mon centre</h2>

    <form class="form-grid" @submit.prevent="store.saveMyCenter">
      <input v-model="store.chefForm.name" placeholder="Nom du centre" required />
      <input v-model="store.chefForm.address" placeholder="Adresse" required />
      <input
        v-model="store.chefForm.establishmentCode"
        placeholder="Code etablissement (optionnel)"
      />
      <select v-model="store.chefForm.level" required>
        <option value="CHU">CHU</option>
        <option value="CHR">CHR</option>
        <option value="CH">CH</option>
        <option value="CHS">CHS</option>
        <option value="CLINIQUE_PRIVEE">Clinique privee</option>
        <option value="CLCC">CLCC</option>
        <option value="ESPC">ESPC</option>
        <option value="CENTRE_SANTE">Centre de sante</option>
        <option value="SSR">SSR</option>
        <option value="EHPAD_USLD">EHPAD / USLD</option>
        <option value="CENTRE_RADIOTHERAPIE">Centre de radiotherapie</option>
        <option value="CENTRE_CARDIOLOGIE">Centre de cardiologie</option>
      </select>
      <select v-model="store.chefForm.establishmentType" required>
        <option value="CONFESSIONNEL">Confessionnel</option>
        <option value="PRIVE">Prive</option>
        <option value="PUBLIQUE">Publique</option>
      </select>
      <input v-model="store.chefForm.regionCode" placeholder="Region (ex: ABIDJAN)" required />
      <input v-model="store.chefForm.districtCode" placeholder="District (optionnel)" />
      <textarea
        v-model="store.chefForm.technicalPlatform"
        placeholder="Plateau technique"
        required
      />
      <input
        v-model="store.chefForm.servicesCsv"
        placeholder="Services (Urgences, Radiologie)"
      />
      <div class="grid2">
        <input
          v-model.number="store.chefForm.latitude"
          type="number"
          step="any"
          placeholder="Latitude"
          required
        />
        <input
          v-model.number="store.chefForm.longitude"
          type="number"
          step="any"
          placeholder="Longitude"
          required
        />
      </div>
      <div class="actions">
        <button type="button" class="secondary" @click="store.setCurrentPosition">
          Utiliser ma position
        </button>
        <button type="submit">
          {{ store.myCenterId ? "Mettre a jour" : "Creer mon centre" }}
        </button>
      </div>
    </form>

    <p v-if="!store.hasApprovedChefCenter" class="muted">
      Les notes et la gestion des plaintes seront disponibles apres approbation du centre.
    </p>
    <p class="muted">Apres creation/modification, le centre passe en attente de validation.</p>
    <p v-if="store.chefError" class="error">{{ store.chefError }}</p>
    <p v-if="store.chefSuccess" class="success">{{ store.chefSuccess }}</p>
  </section>
</template>

<script setup>
import { useDashboardStore } from "../../stores/dashboard";
const store = useDashboardStore();
</script>
