<template>
  <section class="panel settings-panel">
    <h2>Parametres</h2>
    <p class="settings-intro">
      Administration des comptes, du referentiel territorial et des centres de sante.
    </p>

    <!-- KPI row -->
    <div class="settings-kpi-row">
      <article class="settings-kpi">
        <p>Utilisateurs</p>
        <h3>{{ store.users.length }}</h3>
      </article>
      <article class="settings-kpi">
        <p>Chefs en attente</p>
        <h3>{{ store.pendingChefsCount }}</h3>
      </article>
      <article class="settings-kpi">
        <p>Comptes desactives</p>
        <h3>{{ store.disabledUsersCount }}</h3>
      </article>
      <article class="settings-kpi">
        <p>Centres en attente</p>
        <h3>{{ store.pendingCenters.length }}</h3>
      </article>
    </div>

    <!-- Section switch -->
    <div class="settings-switch">
      <button
        type="button"
        class="ghost settings-switch-btn"
        :class="{ active: store.settingsSection === 'users' }"
        @click="store.settingsSection = 'users'"
      >
        Gestion des utilisateurs
        <span class="settings-badge">{{ store.users.length }}</span>
      </button>
      <button
        type="button"
        class="ghost settings-switch-btn"
        :class="{ active: store.settingsSection === 'centers' }"
        @click="store.settingsSection = 'centers'"
      >
        Gestion des centres
        <span class="settings-badge">{{ store.pendingCenters.length }}</span>
      </button>
      <button
        v-if="canSeeCentersTab"
        type="button"
        class="ghost settings-switch-btn settings-switch-btn-alert"
        :class="{ active: store.settingsSection === 'pending-centers' }"
        @click="openPendingCentersOverview"
      >
        Centres en attente
        <span class="settings-badge">{{ store.pendingCenters.length }}</span>
      </button>
    </div>

    <!-- ── USERS ── -->
    <div v-if="store.settingsSection === 'users'">
      <UsersMgmtSection />
    </div>

    <!-- ── USERS (old, hidden) ── -->
    <div v-if="false" class="settings-users-layout">
      <article class="card settings-card">
        <form class="form-grid" @submit.prevent="store.createUser">
          <input v-model="store.userForm.fullName" placeholder="Nom complet" required />
          <input v-model="store.userForm.email" type="email" placeholder="Email" required />
          <input
            v-model="store.userForm.password"
            type="password"
            :placeholder="store.editingUserId ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'"
            :required="!store.editingUserId"
          />
          <select v-model="store.userForm.primaryRole">
            <option value="USER">Role principal: Utilisateur</option>
            <option value="NATIONAL">Role principal: National</option>
            <option value="REGION">Role principal: Region</option>
            <option value="DISTRICT">Role principal: District</option>
            <option value="ETABLISSEMENT">Role principal: Etablissement</option>
            <option value="SAPEUR_POMPIER">Role principal: Sapeur-Pompier</option>
            <option value="SAMU">Role principal: SAMU</option>
            <option value="POLICE">Role principal: Police</option>
            <option value="GENDARMERIE">Role principal: Gendarmerie</option>
            <option value="PROTECTION_CIVILE">Role principal: Protection Civile</option>
            <option value="REGULATOR">Role principal: Regulateur (legacy)</option>
          </select>
          <label>Roles supplementaires</label>
          <div class="role-chip-group">
            <label
              v-for="roleOption in store.userRoleOptions"
              :key="roleOption"
              class="role-chip-item"
            >
              <input
                type="checkbox"
                :value="roleOption"
                :checked="store.userForm.roles.includes(roleOption)"
                @change="store.toggleUserRole(roleOption)"
              />
              <span>{{ store.formatUserRoleLabel(roleOption) }}</span>
            </label>
          </div>
          <input
            v-if="store.requiresEstablishmentCode"
            v-model="store.userForm.establishmentCode"
            placeholder="Code de l'etablissement"
            required
          />
          <select v-model="store.userForm.regionCode">
            <option value="">Affectation region (optionnel)</option>
            <option
              v-for="region in store.regions"
              :key="`user_region_${region.code}`"
              :value="region.code"
            >
              {{ region.code }} - {{ region.name }}
            </option>
          </select>
          <select v-model="store.userForm.districtCode">
            <option value="">Affectation district (optionnel)</option>
            <option
              v-for="district in store.availableDistrictsForUserAssignment"
              :key="`user_district_${district.code}`"
              :value="district.code"
            >
              {{ district.code }} - {{ district.name }}
            </option>
          </select>
          <select v-model="store.userForm.centerId">
            <option value="">Affectation centre (optionnel)</option>
            <option
              v-for="center in store.assignableCentersForUser"
              :key="`user_center_${center._id}`"
              :value="String(center._id)"
            >
              {{ center.name }} ({{ center.establishmentCode || "sans code" }})
            </option>
          </select>
          <div class="actions">
            <button type="submit">
              {{ store.editingUserId ? "Mettre a jour" : "Ajouter" }}
            </button>
            <button
              v-if="store.editingUserId"
              type="button"
              class="ghost"
              @click="store.resetUserForm"
            >
              Annuler
            </button>
          </div>
        </form>
        <p v-if="store.usersError" class="error">{{ store.usersError }}</p>
        <p v-if="store.usersSuccess" class="success">{{ store.usersSuccess }}</p>
      </article>

      <!-- Users table -->
      <article class="card settings-card">
        <div class="settings-table-header">
          <div>
            <h3 class="settings-card-title">Utilisateurs</h3>
            <p class="muted settings-card-subtitle">
              {{ store.filteredUsers.length }} / {{ store.users.length }} compte(s)
            </p>
          </div>
          <button type="button" class="secondary" @click="store.fetchUsers">Actualiser</button>
        </div>
        <div class="settings-user-filters">
          <input
            v-model="store.usersSearch"
            type="text"
            placeholder="Rechercher (nom, email, role, affectation)"
          />
          <div class="settings-filter-chips">
            <button
              v-for="item in store.userCategoryMenu"
              :key="item.key"
              type="button"
              class="ghost settings-filter-chip"
              :class="{ active: store.userCategory === item.key }"
              @click="store.userCategory = item.key"
            >
              {{ item.label }}
              <span class="settings-badge">{{ store.userCategoryCounts[item.key] || 0 }}</span>
            </button>
          </div>
        </div>
        <div class="table-wrap">
          <table class="users-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Role</th>
                <th>Affectation</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in store.paginatedUsers" :key="u.id">
                <td>{{ u.fullName }}</td>
                <td>{{ u.email }}</td>
                <td>{{ Array.isArray(u.roles) ? u.roles.join(", ") : u.role }}</td>
                <td>{{ store.formatUserScope(u) }}</td>
                <td>
                  {{ u.isActive === false ? "DESACTIVE" : (u.approvalStatus || "ACTIF") }}
                </td>
                <td>
                  <!-- Desktop actions -->
                  <div class="settings-actions-inline settings-actions-desktop">
                    <button
                      v-if="(u.role === 'ETABLISSEMENT' || u.role === 'CHEF_ETABLISSEMENT') && u.approvalStatus === 'PENDING'"
                      class="ghost"
                      @click="store.reviewChef(u.id, 'APPROVE')"
                    >
                      Approuver
                    </button>
                    <button
                      v-if="(u.role === 'ETABLISSEMENT' || u.role === 'CHEF_ETABLISSEMENT') && u.approvalStatus === 'PENDING'"
                      class="ghost danger"
                      @click="store.reviewChef(u.id, 'REJECT')"
                    >
                      Rejeter
                    </button>
                    <button class="ghost" @click="store.startEditUser(u)">Modifier</button>
                    <button
                      class="ghost"
                      :disabled="String(auth.state.user?.id) === String(u.id)"
                      @click="store.toggleUserActive(u)"
                    >
                      {{ u.isActive === false ? "Activer" : "Desactiver" }}
                    </button>
                    <button
                      class="ghost danger"
                      :disabled="String(auth.state.user?.id) === String(u.id)"
                      @click="store.deleteUser(u.id)"
                    >
                      Supprimer
                    </button>
                  </div>
                  <!-- Mobile actions -->
                  <details class="settings-actions-mobile">
                    <summary>Voir actions</summary>
                    <div class="settings-actions-inline">
                      <button
                        v-if="(u.role === 'ETABLISSEMENT' || u.role === 'CHEF_ETABLISSEMENT') && u.approvalStatus === 'PENDING'"
                        class="ghost"
                        @click="store.reviewChef(u.id, 'APPROVE')"
                      >
                        Approuver
                      </button>
                      <button
                        v-if="(u.role === 'ETABLISSEMENT' || u.role === 'CHEF_ETABLISSEMENT') && u.approvalStatus === 'PENDING'"
                        class="ghost danger"
                        @click="store.reviewChef(u.id, 'REJECT')"
                      >
                        Rejeter
                      </button>
                      <button class="ghost" @click="store.startEditUser(u)">Modifier</button>
                      <button
                        class="ghost"
                        :disabled="String(auth.state.user?.id) === String(u.id)"
                        @click="store.toggleUserActive(u)"
                      >
                        {{ u.isActive === false ? "Activer" : "Desactiver" }}
                      </button>
                      <button
                        class="ghost danger"
                        :disabled="String(auth.state.user?.id) === String(u.id)"
                        @click="store.deleteUser(u.id)"
                      >
                        Supprimer
                      </button>
                    </div>
                  </details>
                </td>
              </tr>
              <tr v-if="store.filteredUsers.length === 0">
                <td colspan="6" class="muted">Aucun utilisateur pour ce filtre.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="store.usersPageCount > 1" class="actions">
          <button
            class="ghost"
            :disabled="store.usersPage <= 1"
            @click="store.usersPage = Math.max(1, store.usersPage - 1)"
          >
            Precedent
          </button>
          <span class="muted">Page {{ store.usersPage }} / {{ store.usersPageCount }}</span>
          <button
            class="ghost"
            :disabled="store.usersPage >= store.usersPageCount"
            @click="store.usersPage = Math.min(store.usersPageCount, store.usersPage + 1)"
          >
            Suivant
          </button>
        </div>
      </article>
    </div>

    <!-- ── CENTERS ── -->
    <div v-else-if="store.settingsSection === 'pending-centers' && canSeeCentersTab" class="settings-grid settings-centers-layout">
      <article class="card settings-card settings-card-span-2">
        <div class="settings-table-header">
          <div>
            <h3 class="settings-card-title">Centres en attente par region et district</h3>
            <p class="muted settings-card-subtitle">
              Vue regroupee pour identifier rapidement les zones avec le plus de validations en attente.
            </p>
          </div>
        </div>
        <div class="card-list">
          <article
            v-for="regionGroup in pendingCentersByRegion"
            :key="regionGroup.regionCode"
            class="card"
          >
            <h4>
              {{ formatRegionLabel(regionGroup.regionCode) }} - {{ regionGroup.count }} centre(s)
            </h4>
            <div
              v-for="districtGroup in regionGroup.districts"
              :key="`${regionGroup.regionCode}_${districtGroup.districtCode}`"
              class="settings-pending-zone"
            >
              <strong>{{ formatDistrictLabel(districtGroup.districtCode) }}</strong>
              <span class="muted">{{ districtGroup.count }} centre(s)</span>
              <ul class="settings-pending-zone-list">
                <li
                  v-for="center in districtGroup.centers"
                  :key="center._id"
                >
                  <div class="settings-pending-center-line">
                    <span>
                      {{ center.name }}<span v-if="center.establishmentCode"> - {{ center.establishmentCode }}</span>
                    </span>
                    <span class="settings-pending-center-actions">
                      <button type="button" @click="store.reviewCenter(center._id, 'APPROVE')">Approuver</button>
                      <button type="button" class="ghost danger" @click="store.reviewCenter(center._id, 'REJECT')">Rejeter</button>
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </article>
          <p v-if="pendingCentersByRegion.length === 0" class="muted">
            Aucun centre en attente.
          </p>
        </div>
      </article>
    </div>

    <div v-else-if="canSeeCentersTab" class="settings-grid settings-centers-layout">
      <article class="card settings-card">
        <h3 class="settings-card-title">Regions et districts</h3>
        <p class="muted settings-card-subtitle">
          Maintenez a jour la structure territoriale officielle.
        </p>
        <form class="form-grid" @submit.prevent="store.createRegion">
          <strong>Creer une region</strong>
          <div class="grid2">
            <input v-model="store.regionForm.code" placeholder="Code region (ex: ABIDJAN)" required />
            <input v-model="store.regionForm.name" placeholder="Nom region" required />
          </div>
          <button type="submit">Creer la region</button>
        </form>
        <form class="form-grid" @submit.prevent="store.createDistrict">
          <strong>Creer un district lie a une region</strong>
          <select v-model="store.districtForm.regionCode" required>
            <option value="">Selectionner une region</option>
            <option
              v-for="region in store.regions"
              :key="region.code"
              :value="region.code"
            >
              {{ region.code }} - {{ region.name }}
            </option>
          </select>
          <div class="grid2">
            <input v-model="store.districtForm.code" placeholder="Code district" required />
            <input v-model="store.districtForm.name" placeholder="Nom district" required />
          </div>
          <button type="submit">Creer le district</button>
        </form>
        <p v-if="store.geoError" class="error">{{ store.geoError }}</p>
        <p v-if="store.geoSuccess" class="success">{{ store.geoSuccess }}</p>
      </article>

      <article class="card settings-card">
        <h3 class="settings-card-title">Creation d'un etablissement</h3>
        <p class="muted settings-card-subtitle">
          Creez un etablissement avec sa region, son district et ses coordonnees GPS.
        </p>
        <form class="form-grid" @submit.prevent="store.createCenterByRegulator">
          <input
            v-model="store.regulatorCenterForm.name"
            placeholder="Nom de l'etablissement"
            required
          />
          <input
            v-model="store.regulatorCenterForm.address"
            placeholder="Adresse"
            required
          />
          <input
            v-model="store.regulatorCenterForm.establishmentCode"
            placeholder="Code etablissement (optionnel)"
          />
          <select v-model="store.regulatorCenterForm.level" required>
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
          <select v-model="store.regulatorCenterForm.establishmentType" required>
            <option value="CONFESSIONNEL">Confessionnel</option>
            <option value="PRIVE">Prive</option>
            <option value="PUBLIQUE">Publique</option>
          </select>
          <select
            v-model="store.regulatorCenterForm.regionCode"
            required
            @change="store.onRegulatorRegionChange"
          >
            <option value="">Selectionner une region</option>
            <option
              v-for="region in store.regions"
              :key="region.code"
              :value="region.code"
            >
              {{ region.code }} - {{ region.name }}
            </option>
          </select>
          <select v-model="store.regulatorCenterForm.districtCode">
            <option value="">District (optionnel)</option>
            <option
              v-for="district in store.availableDistrictsForRegulatorCenter"
              :key="district.code"
              :value="district.code"
            >
              {{ district.code }} - {{ district.name }}
            </option>
          </select>
          <textarea
            v-model="store.regulatorCenterForm.technicalPlatform"
            placeholder="Plateau technique"
            required
          />
          <input
            v-model="store.regulatorCenterForm.servicesCsv"
            placeholder="Services (Urgences, Radiologie)"
          />
          <div class="grid2">
            <input
              v-model.number="store.regulatorCenterForm.latitude"
              type="number"
              step="any"
              placeholder="Latitude GPS"
              required
            />
            <input
              v-model.number="store.regulatorCenterForm.longitude"
              type="number"
              step="any"
              placeholder="Longitude GPS"
              required
            />
          </div>
          <div class="actions">
            <button type="button" class="secondary" @click="store.setRegulatorCurrentPosition">
              Utiliser ma position GPS
            </button>
            <button type="submit">Creer l'etablissement</button>
          </div>
        </form>
        <p v-if="store.regulatorCenterError" class="error">{{ store.regulatorCenterError }}</p>
        <p v-if="store.regulatorCenterSuccess" class="success">{{ store.regulatorCenterSuccess }}</p>
      </article>

      <article class="card settings-card settings-card-span-2">
        <h3 class="settings-card-title">Validation des centres en attente</h3>
        <p class="muted settings-card-subtitle">
          Approuvez ou rejetez les etablissements en attente de validation.
        </p>
        <div class="actions">
          <input
            v-model="store.pendingCenterSearch"
            placeholder="Rechercher un centre (nom/code)"
          />
          <button type="button" class="secondary" @click="store.fetchPendingCenters">
            Actualiser
          </button>
          <button
            type="button"
            @click="store.approveAllPendingCenters"
            :disabled="store.filteredPendingCenters.length === 0"
          >
            Approuver tous
          </button>
        </div>
        <div class="card-list">
          <article
            v-for="center in store.paginatedPendingCenters"
            :key="center._id"
            class="card"
          >
            <h4>{{ center.name }}</h4>
            <p><strong>Code:</strong> {{ center.establishmentCode || "-" }}</p>
            <p><strong>Niveau:</strong> {{ store.formatLevel(center.level) }}</p>
            <p><strong>Type:</strong> {{ store.formatType(center.establishmentType) }}</p>
            <p><strong>Region:</strong> {{ center.regionCode || "-" }}</p>
            <p><strong>District:</strong> {{ center.districtCode || "-" }}</p>
            <p><strong>Statut:</strong> {{ center.approvalStatus }}</p>
            <div class="actions">
              <button @click="store.reviewCenter(center._id, 'APPROVE')">Approuver</button>
              <button
                class="ghost danger"
                @click="store.reviewCenter(center._id, 'REJECT')"
              >
                Rejeter
              </button>
            </div>
          </article>
          <p v-if="store.filteredPendingCenters.length === 0" class="muted">
            Aucun centre en attente.
          </p>
        </div>
        <div v-if="store.pendingCentersPageCount > 1" class="actions">
          <button
            class="ghost"
            :disabled="store.pendingCentersPage <= 1"
            @click="store.pendingCentersPage = Math.max(1, store.pendingCentersPage - 1)"
          >
            Precedent
          </button>
          <span class="muted">
            Page {{ store.pendingCentersPage }} / {{ store.pendingCentersPageCount }}
          </span>
          <button
            class="ghost"
            :disabled="store.pendingCentersPage >= store.pendingCentersPageCount"
            @click="store.pendingCentersPage = Math.min(store.pendingCentersPageCount, store.pendingCentersPage + 1)"
          >
            Suivant
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useDashboardStore } from "../../stores/dashboard";
import UsersMgmtSection from "./UsersMgmtSection.vue";

const store = useDashboardStore();
const canSeeCentersTab = computed(() => store.isRegulator);

function formatRegionLabel(regionCode) {
  const code = String(regionCode || "").trim().toUpperCase();
  const match = (store.regions || []).find((region) => String(region.code || "").trim().toUpperCase() === code);
  if (match?.name && code) return `${match.name} (${code})`;
  return match?.name || code || "SANS_REGION";
}

function formatDistrictLabel(districtCode) {
  const code = String(districtCode || "").trim().toUpperCase();
  const match = (store.districts || []).find((district) => String(district.code || "").trim().toUpperCase() === code);
  if (match?.name && code) return `${match.name} (${code})`;
  return match?.name || code || "SANS_DISTRICT";
}

function openPendingCentersOverview() {
  store.settingsSection = "pending-centers";
}

const pendingCentersByRegion = computed(() => {
  const groups = new Map();

  for (const center of store.pendingCenters || []) {
    const regionCode = String(center?.regionCode || "SANS_REGION").trim().toUpperCase();
    const districtCode = String(center?.districtCode || "SANS_DISTRICT").trim().toUpperCase();

    if (!groups.has(regionCode)) {
      groups.set(regionCode, {
        regionCode,
        count: 0,
        districts: new Map(),
      });
    }

    const regionGroup = groups.get(regionCode);
    regionGroup.count += 1;

    if (!regionGroup.districts.has(districtCode)) {
      regionGroup.districts.set(districtCode, {
        districtCode,
        count: 0,
        centers: [],
      });
    }

    const districtGroup = regionGroup.districts.get(districtCode);
    districtGroup.count += 1;
    districtGroup.centers.push(center);
  }

  return Array.from(groups.values())
    .map((regionGroup) => ({
      regionCode: regionGroup.regionCode,
      count: regionGroup.count,
      districts: Array.from(regionGroup.districts.values()).sort((a, b) =>
        a.districtCode.localeCompare(b.districtCode)
      ),
    }))
    .sort((a, b) => a.regionCode.localeCompare(b.regionCode));
});
</script>

<style scoped>
.settings-switch-btn-alert {
  border-color: #f59e0b;
  background: #fff7ed;
  color: #9a3412;
}

.settings-switch-btn-alert:hover {
  background: #ffedd5;
}

.settings-pending-zone {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.settings-pending-zone:first-of-type {
  margin-top: 0;
  padding-top: 0;
  border-top: 0;
}

.settings-pending-zone-list {
  margin: 8px 0 0;
  padding-left: 18px;
  color: #475569;
}

.settings-pending-center-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.settings-pending-center-actions {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 960px) {
  .settings-switch {
    display: grid;
    grid-template-columns: 1fr;
  }

  .settings-switch-btn {
    width: 100%;
    justify-content: center;
  }

  .settings-centers-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .settings-kpi-row {
    grid-template-columns: 1fr 1fr;
  }

  .settings-table-header {
    flex-direction: column;
    align-items: stretch;
  }

  .settings-user-filters,
  .actions,
  .grid2,
  .form-grid {
    display: grid;
    grid-template-columns: 1fr;
  }

  .settings-panel .form-grid > input,
  .settings-panel .form-grid > select,
  .settings-panel .form-grid > textarea,
  .settings-panel .settings-user-filters > input,
  .settings-panel .actions > input {
    max-width: 100%;
    width: 100%;
    box-sizing: border-box;
  }

  .settings-pending-center-line {
    flex-direction: column;
    align-items: flex-start;
  }

  .settings-pending-center-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
  }

  .settings-pending-center-actions > button {
    width: 100%;
  }
}
</style>
