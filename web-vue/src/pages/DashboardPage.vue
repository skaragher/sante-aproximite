<template>
  <main class="dashboard">
    <section v-if="tab === 'overview' && !isChef" class="panel">
      <h2>Tableau de bord</h2>
      <div class="stats-grid">
        <article class="stat-card">
          <h3>{{ allCenters.length }}</h3>
          <p>Centres enregistres</p>
        </article>
        <article class="stat-card">
          <h3>{{ nearbyCenters.length }}</h3>
          <p>Centres proches ({{ Number(radiusKm) || 20 }} km)</p>
        </article>
        <article class="stat-card">
          <h3>{{ isRegulator ? users.length : "-" }}</h3>
          <p>Utilisateurs geres</p>
        </article>
        <article
          v-if="isEmergencyResponder"
          class="stat-card stat-card-emergency-new stat-card-clickable"
          role="button"
          tabindex="0"
          @click="openUnhandledEmergencyAlerts"
          @keydown.enter.prevent="openUnhandledEmergencyAlerts"
          @keydown.space.prevent="openUnhandledEmergencyAlerts"
        >
          <h3>{{ emergencyStats.nonTraite }}</h3>
          <p>Alertes non traitees</p>
        </article>
        <article v-if="isEmergencyResponder" class="stat-card stat-card-emergency-progress">
          <h3>{{ emergencyStats.enCours }}</h3>
          <p>Alertes en cours</p>
        </article>
        <article v-if="isEmergencyResponder" class="stat-card stat-card-emergency-done">
          <h3>{{ emergencyStats.traite }}</h3>
          <p>Alertes traitees</p>
        </article>
        <article v-if="isEmergencyResponder" class="stat-card stat-card-emergency-closed">
          <h3>{{ emergencyStats.rejete }}</h3>
          <p>Alertes rejetees</p>
        </article>
      </div>
      <div class="actions">
        <button @click="fetchAllCenters">Actualiser les centres</button>
        <button class="secondary" @click="fetchNearby">Actualiser les centres proches</button>
        <button v-if="isEmergencyResponder" class="secondary" @click="tab = 'emergency-alerts'">Voir les alertes</button>
      </div>
      <p v-if="info" class="muted">{{ info }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </section>

    <section v-show="tab === 'nearby' && !isChef" class="panel">
      <div class="toolbar">
        <label>Rayon (km)</label>
        <input v-model.number="radiusKm" type="number" min="1" max="5000" />
        <input
          v-model="nearbySearch"
          type="text"
          placeholder="Rechercher: nom, type, service, plateau technique"
        />
        <button class="secondary" @click="refreshCurrentPosition">Utiliser ma position actuelle</button>
        <button @click="fetchNearby">Rechercher</button>
      </div>
      <p v-if="info" class="muted">{{ info }}</p>
      <p v-if="error" class="error">{{ error }}</p>
      <div ref="mapEl" class="map"></div>
      <div class="card-list">
        <p v-if="filteredNearbyCenters.length === 0" class="muted">
          Aucun centre a afficher pour le moment.
        </p>
        <article
          v-for="center in filteredNearbyCenters"
          :key="center._id"
          class="card"
          :class="{ selected: selectedCenter?._id === center._id }"
        >
          <h3>{{ center.name }} - {{ center.distanceKm }} km</h3>
          <p><strong>Code:</strong> {{ center.establishmentCode || "-" }}</p>
          <p>{{ center.address }}</p>
          <p><strong>Niveau:</strong> {{ formatLevel(center.level) }}</p>
          <p><strong>Type:</strong> {{ formatType(center.establishmentType) }}</p>
          <p><strong>Plateau:</strong> {{ center.technicalPlatform }}</p>
          <p><strong>Services:</strong> {{ center.services.map((s) => s.name).join(", ") || "Aucun" }}</p>
          <div class="actions">
            <button @click="focusCenter(center)">Voir sur carte</button>
            <button class="secondary" @click="navigateTo(center)">Naviguer</button>
          </div>
        </article>
      </div>
    </section>

    <section v-if="tab === 'emergency-alerts' && isEmergencyResponder" class="panel">
      <h2>Alertes urgence</h2>
      <div class="toolbar">
        <button
          v-for="item in emergencyCategoryMenu"
          :key="item.key"
          :class="['ghost', { active: emergencyCategory === item.key }]"
          @click="emergencyCategory = item.key"
        >
          {{ item.label }}
        </button>
        <label>Du</label>
        <input v-model="emergencyPeriodFrom" type="date" />
        <label>Au</label>
        <input v-model="emergencyPeriodTo" type="date" />
        <button @click="fetchEmergencyAlerts">Actualiser</button>
      </div>
      <p v-if="emergencyAlertsError" class="error">{{ emergencyAlertsError }}</p>
      <p v-if="emergencyAlertsSuccess" class="success">{{ emergencyAlertsSuccess }}</p>
      <div class="card-list">
        <article
          v-for="item in filteredEmergencyAlerts"
          :key="item.id"
          class="card"
          :class="getEmergencyAlertCardClass(item.status)"
        >
          <h4>{{ item.emergencyType }}</h4>
          <p>
            <strong>Statut:</strong>
            <span class="emergency-status-badge" :class="getEmergencyStatusClass(item.status)">
              {{ formatEmergencyStatus(item.status) }}
            </span>
          </p>
          <p><strong>Service:</strong> {{ item.targetService }}</p>
          <p><strong>Demandeur:</strong> {{ item.reporterName || "-" }}</p>
          <p><strong>Telephone:</strong> {{ item.phoneNumber }}</p>
          <p><strong>Position:</strong> {{ item.latitude }}, {{ item.longitude }}</p>
          <p><strong>Point de prise en charge:</strong> {{ getEmergencyPlaceName(item) }}</p>
          <p><strong>Pays:</strong> {{ getEmergencyCountry(item) }}</p>
          <p><strong>Ville:</strong> {{ getEmergencyCity(item) }}</p>
          <p><strong>Localite:</strong> {{ getEmergencyLocality(item) }}</p>
          <div class="emergency-mini-map-wrap">
            <iframe
              class="emergency-mini-map"
              :src="buildEmergencyMapEmbedUrl(item.latitude, item.longitude)"
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
            v-model="emergencyStepNotes[item.id]"
            class="complaint-note-input"
            placeholder="Note d'avancement pour le demandeur"
            rows="3"
          />
          <div class="actions">
            <button v-if="item.status === 'NEW'" @click="takeEmergencyInCharge(item)">Prendre en compte</button>
            <button
              v-if="['ACKNOWLEDGED','EN_ROUTE','ON_SITE'].includes(item.status)"
              class="secondary"
              @click="setEmergencyProgress(item, 'EN_ROUTE')"
            >
              En route
            </button>
            <button
              v-if="['ACKNOWLEDGED','EN_ROUTE','ON_SITE'].includes(item.status)"
              class="secondary"
              @click="setEmergencyProgress(item, 'ON_SITE')"
            >
              Sur site
            </button>
            <button
              v-if="['ACKNOWLEDGED','EN_ROUTE','ON_SITE'].includes(item.status)"
              @click="setEmergencyProgress(item, 'COMPLETED')"
            >
              Terminer
            </button>
            <button class="secondary" @click="navigateToEmergency(item)">Naviguer vers l'alerte</button>
          </div>
        </article>
        <p v-if="filteredEmergencyAlerts.length === 0" class="muted">Aucune alerte pour ce filtre/periode.</p>
      </div>
    </section>

    <section v-if="tab === 'complaints' && canSeeComplaintsPanel" class="panel">
      <h2>Gestion des plaintes</h2>
      <div class="stats-grid" v-if="complaintSummary">
        <article class="stat-card">
          <h3>{{ complaintSummary.scope }}</h3>
          <p>Portee</p>
        </article>
        <article class="stat-card">
          <h3>{{ complaintSummary.centerCount }}</h3>
          <p>Centres du perimetre</p>
        </article>
        <article class="stat-card">
          <h3>{{ complaintSummary.ratingAverage ?? "-" }}</h3>
          <p>Note moyenne</p>
        </article>
        <article class="stat-card">
          <h3>{{ complaintSummary.satisfactionRate == null ? "-" : `${complaintSummary.satisfactionRate}%` }}</h3>
          <p>Taux de satisfaction</p>
        </article>
      </div>
      <div class="toolbar">
        <select v-model="complaintStatusFilter">
          <option value="">Toutes</option>
          <option value="NEW">Nouvelles</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="RESOLVED">Resolues</option>
          <option value="REJECTED">Rejetees</option>
        </select>
        <button @click="fetchComplaints">Actualiser</button>
        <button class="secondary" @click="fetchComplaintSummary">Actualiser synthese</button>
      </div>
      <p v-if="complaintAdminError" class="error">{{ complaintAdminError }}</p>
      <p v-if="complaintSuccess" class="success">{{ complaintSuccess }}</p>
      <div class="card-list">
        <article v-for="item in complaintsList" :key="item.id" class="card">
          <h4 :class="{ 'complaint-rejected-text': item.status === 'REJECTED' }">{{ item.subject }}</h4>
          <p><strong>Usager:</strong> Anonyme</p>
          <p><strong>Centre:</strong> {{ item.centerName || "Non specifie" }} ({{ item.centerCode || "-" }})</p>
          <p :class="{ 'complaint-rejected-text': item.status === 'REJECTED' }">
            <strong>Statut:</strong> {{ formatComplaintStatus(item.status) }}
          </p>
          <p>{{ item.message }}</p>
          <p><small>{{ formatDate(item.createdAt) }}</small></p>
          <textarea
            v-if="isRegulator"
            v-model="complaintStepNotes[item.id]"
            class="complaint-note-input"
            :placeholder="
              item.status === 'NEW'
                ? 'Commentaire pour la prise en charge'
                : 'Commentaire pour la resolution'
            "
            rows="3"
          />
          <div class="actions">
            <button
              v-if="isRegulator && item.status === 'NEW'"
              @click="setComplaintStatus(item, 'IN_PROGRESS')"
            >
              Prendre en compte
            </button>
            <button
              v-if="isRegulator && (item.status === 'NEW' || item.status === 'IN_PROGRESS')"
              class="ghost danger"
              @click="setComplaintStatus(item, 'REJECTED')"
            >
              Rejeter
            </button>
            <button
              v-if="isRegulator && item.status === 'IN_PROGRESS'"
              class="secondary"
              @click="setComplaintStatus(item, 'RESOLVED')"
            >
              Marquer resolue
            </button>
          </div>
        </article>
        <p v-if="complaintsList.length === 0" class="muted">Aucune plainte.</p>
      </div>
    </section>

    <section v-if="tab === 'evaluations' && canSeeComplaintsPanel" class="panel">
      <h2>Evaluations des centres</h2>
      <div class="toolbar">
        <input
          v-model="evaluationSearch"
          type="text"
          placeholder="Rechercher un centre (nom, code, ville)"
        />
        <button @click="fetchAllCenters">Actualiser</button>
        <button class="secondary" @click="fetchComplaintSummary">Actualiser synthese</button>
      </div>
      <div class="stats-grid" v-if="complaintSummary">
        <article class="stat-card">
          <h3>{{ complaintSummary.scope }}</h3>
          <p>Portee</p>
        </article>
        <article class="stat-card">
          <h3>{{ complaintSummary.centerCount }}</h3>
          <p>Centres du perimetre</p>
        </article>
        <article class="stat-card">
          <h3>{{ complaintSummary.ratingAverage ?? "-" }}</h3>
          <p>Note moyenne globale</p>
        </article>
        <article class="stat-card">
          <h3>{{ complaintSummary.satisfactionRate == null ? "-" : `${complaintSummary.satisfactionRate}%` }}</h3>
          <p>Satisfaction globale</p>
        </article>
        <article class="stat-card">
          <h3>{{ complaintSummary.centersWithoutEvaluation ?? 0 }}</h3>
          <p>Centres sans evaluation</p>
        </article>
      </div>
      <div class="evaluation-charts" v-if="complaintSummary">
        <article class="chart-card">
          <h3>Couverture des evaluations</h3>
          <div class="coverage-wrap">
            <div class="coverage-donut" :style="{ '--coverage': `${evaluationCoverage.percent}%` }"></div>
            <div>
              <p><strong>{{ evaluationCoverage.percent }}%</strong> de centres evalues</p>
              <p class="muted">{{ evaluationCoverage.withEvaluations }} / {{ evaluationCoverage.totalCenters }} centres</p>
              <p class="muted">{{ evaluationCoverage.withoutEvaluations }} centres sans evaluation</p>
            </div>
          </div>
        </article>
        <article class="chart-card">
          <h3>Satisfaction globale</h3>
          <div class="stack-bar">
            <span class="stack-satisfied" :style="{ width: `${satisfactionBreakdown.satisfied}%` }"></span>
            <span class="stack-unsatisfied" :style="{ width: `${satisfactionBreakdown.unsatisfied}%` }"></span>
          </div>
          <div class="legend-row">
            <span class="legend-chip legend-satisfied">Satisfaits: {{ satisfactionBreakdown.satisfied }}%</span>
            <span class="legend-chip legend-unsatisfied">Insatisfaits: {{ satisfactionBreakdown.unsatisfied }}%</span>
          </div>
        </article>
        <article class="chart-card">
          <h3>Top 5 centres (notation)</h3>
          <div class="bar-chart">
            <div v-for="center in topRatedCenters" :key="`top_${center._id}`" class="bar-row">
              <span class="bar-label">{{ center.name }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: `${Math.max(0, Math.min(100, (center.ratingAverage || 0) * 20))}%` }"></div>
              </div>
              <span class="bar-value">{{ center.ratingAverage == null ? "-" : center.ratingAverage }}</span>
            </div>
            <p v-if="topRatedCenters.length === 0" class="muted">Pas assez de donnees de notation.</p>
          </div>
        </article>
      </div>
      <p v-if="complaintAdminError" class="error">{{ complaintAdminError }}</p>
      <div class="card-list">
        <article v-for="center in filteredEvaluationCenters" :key="center._id" class="card">
          <h4>{{ center.name }}</h4>
          <p><strong>Code:</strong> {{ center.establishmentCode || "-" }}</p>
          <p><strong>Adresse:</strong> {{ center.address || "-" }}</p>
          <p><strong>Note moyenne:</strong> {{ center.ratingAverage == null ? "-" : center.ratingAverage }}</p>
          <p><strong>Taux de satisfaction:</strong> {{ center.satisfactionRate == null ? "-" : `${center.satisfactionRate}%` }}</p>
          <p><strong>Nombre d'evaluations:</strong> {{ center.ratingCount || 0 }}</p>
        </article>
        <p v-if="filteredEvaluationCenters.length === 0" class="muted">Aucune evaluation a afficher.</p>
      </div>
    </section>

    <section v-if="tab === 'my-center' && isChef" class="panel">
      <h2>Mon centre</h2>
      <form class="form-grid" @submit.prevent="saveMyCenter">
        <input v-model="chefForm.name" placeholder="Nom du centre" required />
        <input v-model="chefForm.address" placeholder="Adresse" required />
        <input v-model="chefForm.establishmentCode" placeholder="Code etablissement (optionnel)" />
        <select v-model="chefForm.level" required>
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
        <select v-model="chefForm.establishmentType" required>
          <option value="CONFESSIONNEL">Confessionnel</option>
          <option value="PRIVE">Prive</option>
          <option value="PUBLIQUE">Publique</option>
        </select>
        <input v-model="chefForm.regionCode" placeholder="Region (ex: ABIDJAN)" required />
        <input v-model="chefForm.districtCode" placeholder="District (optionnel)" />
        <textarea v-model="chefForm.technicalPlatform" placeholder="Plateau technique" required />
        <input v-model="chefForm.servicesCsv" placeholder="Services (Urgences, Radiologie)" />
        <div class="grid2">
          <input v-model.number="chefForm.latitude" type="number" step="any" placeholder="Latitude" required />
          <input v-model.number="chefForm.longitude" type="number" step="any" placeholder="Longitude" required />
        </div>
        <div class="actions">
          <button type="button" class="secondary" @click="setCurrentPosition">Utiliser ma position</button>
          <button type="submit">{{ myCenterId ? "Mettre a jour" : "Creer mon centre" }}</button>
        </div>
      </form>
      <p class="muted">Apres creation/modification, le centre passe en attente de validation.</p>
      <p v-if="chefError" class="error">{{ chefError }}</p>
      <p v-if="chefSuccess" class="success">{{ chefSuccess }}</p>
    </section>

    <section v-if="tab === 'settings' && isRegulator" class="panel">
      <h2>Parametres</h2>
      <template v-if="isRegulator">
        <div class="settings-switch">
          <button
            type="button"
            class="ghost"
            :class="{ active: settingsSection === 'users' }"
            @click="settingsSection = 'users'"
          >
            Gestion des utilisateurs
          </button>
          <button
            type="button"
            class="ghost"
            :class="{ active: settingsSection === 'centers' }"
            @click="settingsSection = 'centers'"
          >
            Gestion des centres
          </button>
        </div>

        <div v-if="settingsSection === 'users'" class="settings-grid">
          <article class="card">
            <h3>Gestion des utilisateurs</h3>
            <form class="form-grid" @submit.prevent="createUser">
              <input v-model="userForm.fullName" placeholder="Nom complet" required />
              <input v-model="userForm.email" type="email" placeholder="Email" required />
              <input v-model="userForm.password" type="password" :placeholder="editingUserId ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'" :required="!editingUserId" />
              <select v-model="userForm.primaryRole">
                <option value="USER">Role principal: Utilisateur</option>
                <option value="NATIONAL">Role principal: National</option>
                <option value="REGION">Role principal: Region</option>
                <option value="DISTRICT">Role principal: District</option>
                <option value="ETABLISSEMENT">Role principal: Etablissement</option>
                <option value="SAPEUR_POMPIER">Role principal: SAPEUR-POMPIER</option>
                <option value="SAMU">Role principal: SAMU</option>
                <option value="REGULATOR">Role principal: Regulateur (legacy)</option>
              </select>
              <label>Roles supplementaires</label>
              <div class="role-chip-group">
                <label v-for="roleOption in userRoleOptions" :key="roleOption" class="role-chip-item">
                  <input
                    type="checkbox"
                    :value="roleOption"
                    :checked="userForm.roles.includes(roleOption)"
                    @change="toggleUserRole(roleOption)"
                  />
                  <span>{{ formatUserRoleLabel(roleOption) }}</span>
                </label>
              </div>
              <input
                v-if="requiresEstablishmentCode"
                v-model="userForm.establishmentCode"
                placeholder="Code de l'etablissement"
                required
              />
              <select v-model="userForm.regionCode">
                <option value="">Affectation region (optionnel)</option>
                <option v-for="region in regions" :key="`user_region_${region.code}`" :value="region.code">
                  {{ region.code }} - {{ region.name }}
                </option>
              </select>
              <select v-model="userForm.districtCode">
                <option value="">Affectation district (optionnel)</option>
                <option v-for="district in availableDistrictsForUserAssignment" :key="`user_district_${district.code}`" :value="district.code">
                  {{ district.code }} - {{ district.name }}
                </option>
              </select>
              <select v-model="userForm.centerId">
                <option value="">Affectation centre (optionnel)</option>
                <option v-for="center in assignableCentersForUser" :key="`user_center_${center._id}`" :value="String(center._id)">
                  {{ center.name }} ({{ center.establishmentCode || "sans code" }})
                </option>
              </select>
              <div class="actions">
                <button type="submit">{{ editingUserId ? "Mettre a jour" : "Ajouter" }}</button>
                <button v-if="editingUserId" type="button" class="ghost" @click="resetUserForm">Annuler</button>
                <button type="button" class="secondary" @click="fetchUsers">Actualiser</button>
              </div>
            </form>
            <p v-if="usersError" class="error">{{ usersError }}</p>
            <p v-if="usersSuccess" class="success">{{ usersSuccess }}</p>
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
                  <tr v-for="u in users" :key="u.id">
                    <td>{{ u.fullName }}</td>
                    <td>{{ u.email }}</td>
                    <td>{{ Array.isArray(u.roles) ? u.roles.join(", ") : u.role }}</td>
                    <td>{{ formatUserScope(u) }}</td>
                    <td>{{ u.isActive === false ? "DESACTIVE" : (u.approvalStatus || "ACTIF") }}</td>
                    <td>
                      <button
                        v-if="(u.role === 'ETABLISSEMENT' || u.role === 'CHEF_ETABLISSEMENT') && u.approvalStatus === 'PENDING'"
                        class="ghost"
                        @click="reviewChef(u.id, 'APPROVE')"
                      >
                        Approuver
                      </button>
                      <button
                        v-if="(u.role === 'ETABLISSEMENT' || u.role === 'CHEF_ETABLISSEMENT') && u.approvalStatus === 'PENDING'"
                        class="ghost danger"
                        @click="reviewChef(u.id, 'REJECT')"
                      >
                        Rejeter
                      </button>
                      <button
                        class="ghost"
                        @click="startEditUser(u)"
                      >
                        Modifier
                      </button>
                      <button
                        class="ghost"
                        @click="toggleUserActive(u)"
                        :disabled="String(auth.state.user?.id) === String(u.id)"
                      >
                        {{ u.isActive === false ? "Activer" : "Desactiver" }}
                      </button>
                      <button
                        class="ghost danger"
                        @click="deleteUser(u.id)"
                        :disabled="String(auth.state.user?.id) === String(u.id)"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
        </div>

        <div v-else class="settings-grid">
          <article class="card">
            <h3>Regions et districts</h3>
            <form class="form-grid" @submit.prevent="createRegion">
              <strong>Creer une region</strong>
              <div class="grid2">
                <input v-model="regionForm.code" placeholder="Code region (ex: ABIDJAN)" required />
                <input v-model="regionForm.name" placeholder="Nom region" required />
              </div>
              <button type="submit">Creer la region</button>
            </form>

            <form class="form-grid" @submit.prevent="createDistrict">
              <strong>Creer un district lie a une region</strong>
              <select v-model="districtForm.regionCode" required>
                <option value="">Selectionner une region</option>
                <option v-for="region in regions" :key="region.code" :value="region.code">
                  {{ region.code }} - {{ region.name }}
                </option>
              </select>
              <div class="grid2">
                <input v-model="districtForm.code" placeholder="Code district" required />
                <input v-model="districtForm.name" placeholder="Nom district" required />
              </div>
              <button type="submit">Creer le district</button>
            </form>

            <p v-if="geoError" class="error">{{ geoError }}</p>
            <p v-if="geoSuccess" class="success">{{ geoSuccess }}</p>
          </article>

          <article class="card">
            <h3>Canevas d'importation</h3>
            <p class="muted">Import des centres, regions et districts depuis Excel.</p>
            <div class="actions">
              <a class="download-link" href="/imports/canevas_centres_sante.csv" download>
                Canevas centres (CSV avec regionCode/districtCode)
              </a>
              <a class="download-link" href="/imports/BD_ETS_SANITAIRES_import_sante_aproximite.xlsx" download>
                Fichier exemple centres (XLSX)
              </a>
              <a class="download-link" href="/imports/BD_ETS_SANITAIRES_import_sante_aproximite.csv" download>
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
              <input type="file" accept=".xlsx,.xls,.csv" @change="onRegionImportFileChange" />
              <p class="muted">Lignes valides regions: {{ regionImportPreviewCount }}</p>
              <button @click="importRegionsFromFile" :disabled="!parsedRegions.length || regionImportLoading">
                {{ regionImportLoading ? "Import..." : "Importer regions" }}
              </button>

              <label>Importer des districts</label>
              <input type="file" accept=".xlsx,.xls,.csv" @change="onDistrictImportFileChange" />
              <p class="muted">Lignes valides districts: {{ districtImportPreviewCount }}</p>
              <button @click="importDistrictsFromFile" :disabled="!parsedDistricts.length || districtImportLoading">
                {{ districtImportLoading ? "Import..." : "Importer districts" }}
              </button>
            </div>
            <p v-if="regionImportError || districtImportError" class="error">
              {{ regionImportError || districtImportError }}
            </p>
            <p v-if="regionImportSuccess || districtImportSuccess" class="success">
              {{ regionImportSuccess || districtImportSuccess }}
            </p>
          </article>

          <article class="card">
            <h3>Creation d'un centre de sante</h3>
            <form class="form-grid" @submit.prevent="createCenterByRegulator">
              <input v-model="regulatorCenterForm.name" placeholder="Nom du centre" required />
              <input v-model="regulatorCenterForm.address" placeholder="Adresse" required />
              <input v-model="regulatorCenterForm.establishmentCode" placeholder="Code etablissement (optionnel)" />
              <select v-model="regulatorCenterForm.level" required>
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
              <select v-model="regulatorCenterForm.establishmentType" required>
                <option value="CONFESSIONNEL">Confessionnel</option>
                <option value="PRIVE">Prive</option>
                <option value="PUBLIQUE">Publique</option>
              </select>
              <select v-model="regulatorCenterForm.regionCode" required @change="onRegulatorRegionChange">
                <option value="">Selectionner une region</option>
                <option v-for="region in regions" :key="region.code" :value="region.code">
                  {{ region.code }} - {{ region.name }}
                </option>
              </select>
              <select v-model="regulatorCenterForm.districtCode">
                <option value="">District (optionnel)</option>
                <option v-for="district in availableDistrictsForRegulatorCenter" :key="district.code" :value="district.code">
                  {{ district.code }} - {{ district.name }}
                </option>
              </select>
              <textarea v-model="regulatorCenterForm.technicalPlatform" placeholder="Plateau technique" required />
              <input v-model="regulatorCenterForm.servicesCsv" placeholder="Services (Urgences, Radiologie)" />
              <div class="grid2">
                <input
                  v-model.number="regulatorCenterForm.latitude"
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  required
                />
                <input
                  v-model.number="regulatorCenterForm.longitude"
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  required
                />
              </div>
              <div class="actions">
                <button type="button" class="secondary" @click="setRegulatorCurrentPosition">Utiliser ma position</button>
                <button type="submit">Creer le centre</button>
              </div>
            </form>
            <p class="muted">Le centre est cree puis passe en attente de validation.</p>
            <p v-if="regulatorCenterError" class="error">{{ regulatorCenterError }}</p>
            <p v-if="regulatorCenterSuccess" class="success">{{ regulatorCenterSuccess }}</p>
          </article>

          <article class="card">
            <h3>Validation des centres en attente</h3>
            <div class="actions">
              <input v-model="pendingCenterSearch" placeholder="Rechercher un centre (nom/code)" />
              <button type="button" class="secondary" @click="fetchPendingCenters">Actualiser</button>
              <button type="button" @click="approveAllPendingCenters" :disabled="filteredPendingCenters.length === 0">
                Approuver tous
              </button>
            </div>
            <div class="card-list">
              <article v-for="center in filteredPendingCenters" :key="center._id" class="card">
                <h4>{{ center.name }}</h4>
                <p><strong>Code:</strong> {{ center.establishmentCode || "-" }}</p>
                <p><strong>Niveau:</strong> {{ formatLevel(center.level) }}</p>
                <p><strong>Type:</strong> {{ formatType(center.establishmentType) }}</p>
                <p><strong>Statut:</strong> {{ center.approvalStatus }}</p>
                <div class="actions">
                  <button @click="reviewCenter(center._id, 'APPROVE')">Approuver</button>
                  <button class="ghost danger" @click="reviewCenter(center._id, 'REJECT')">Rejeter</button>
                </div>
              </article>
              <p v-if="filteredPendingCenters.length === 0" class="muted">Aucun centre en attente.</p>
            </div>
          </article>

          <article class="card">
            <h3>Suppression globale des centres</h3>
            <p class="muted">Action irreversible. Tous les centres de sante seront supprimes.</p>
            <input
              v-model="deleteCentersConfirm"
              placeholder="Tapez DELETE_ALL_CENTERS pour confirmer"
            />
            <div class="actions">
              <button
                class="ghost danger"
                @click="deleteAllCenters"
                :disabled="deleteCentersLoading || deleteCentersConfirm !== 'DELETE_ALL_CENTERS'"
              >
                {{ deleteCentersLoading ? "Suppression..." : "Supprimer tous les centres" }}
              </button>
            </div>
            <p v-if="deleteCentersError" class="error">{{ deleteCentersError }}</p>
            <p v-if="deleteCentersSuccess" class="success">{{ deleteCentersSuccess }}</p>
          </article>

          <article class="card">
            <h3>Importer des centres de sante (Excel)</h3>
            <p class="muted">Colonnes acceptees: name, address, latitude, longitude, technicalPlatform, level, establishmentType, establishmentCode, regionCode, districtCode, services</p>
            <p class="muted">Regle: regionCode doit exister. Si districtCode est renseigne, il doit appartenir a regionCode.</p>
            <div class="actions">
              <a class="download-link" href="/imports/canevas_centres_sante.csv" download>
                Canevas officiel (CSV avec regionCode/districtCode)
              </a>
              <a class="download-link" href="/imports/BD_ETS_SANITAIRES_import_sante_aproximite.xlsx" download>
                Fichier exemple (XLSX)
              </a>
              <a class="download-link" href="/imports/BD_ETS_SANITAIRES_import_sante_aproximite.csv" download>
                Fichier exemple (CSV)
              </a>
            </div>
            <input type="file" accept=".xlsx,.xls" @change="onImportFileChange" />
            <p class="muted">Lignes valides detectees: {{ importPreviewCount }}</p>
            <div class="actions">
              <button @click="importCentersFromFile" :disabled="!parsedCenters.length || importLoading">
                {{ importLoading ? "Import..." : "Importer" }}
              </button>
            </div>
            <p v-if="importError" class="error">{{ importError }}</p>
            <p v-if="importSuccess" class="success">{{ importSuccess }}</p>
          </article>
        </div>
      </template>
      <p v-else class="muted">Vous n'avez pas acces aux parametres avances.</p>
    </section>
  </main>
</template>

<script setup>
import L from "leaflet";
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { apiFetch } from "../api/client";
import { useAuthStore } from "../stores/auth";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

const auth = useAuthStore();
const route = useRoute();
const normalizeRole = (value) => String(value || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
const authRoles = computed(() => {
  const combined = [
    ...(Array.isArray(auth.state.user?.roles) ? auth.state.user.roles : []),
    auth.state.user?.role
  ]
    .map((value) => normalizeRole(value))
    .filter(Boolean);
  return [...new Set(combined)];
});
const hasAnyRole = (values) => values.some((value) => authRoles.value.includes(normalizeRole(value)));
const isChef = computed(() => hasAnyRole(["ETABLISSEMENT", "CHEF_ETABLISSEMENT"]));
const isRegulator = computed(() => hasAnyRole(["REGULATOR", "NATIONAL", "REGION", "DISTRICT"]));
const isEmergencyResponder = computed(() => hasAnyRole(["SAMU", "SAPPEUR_POMPIER", "SAPEUR_POMPIER"]));
const canSeeComplaintsPanel = computed(() => isRegulator.value || isChef.value);

const tab = ref("overview");
const error = ref("");
const info = ref("");
const radiusKm = ref(20);
const nearbySearch = ref("");
const coords = ref(null);
const nearbyCenters = ref([]);
const allCenters = ref([]);
const selectedCenter = ref(null);
const nearbyBootstrapped = ref(false);

const mapEl = ref(null);
let map = null;
let markersLayer = null;
let routeLine = null;
let XLSXModule = null;
let emergencyRefreshTimer = null;

const complaintType = ref("WITH_CENTER");
const complaintCenter = ref(null);
const centerSearch = ref("");
const complaint = reactive({ subject: "", message: "" });
const complaintError = ref("");
const complaintSuccess = ref("");
const complaintLoading = ref(false);
const complaintStatusFilter = ref("");
const evaluationSearch = ref("");
const complaintsList = ref([]);
const complaintSummary = ref(null);
const complaintStepNotes = reactive({});
const complaintCenterIdForAdmin = ref("");
const complaintAdminError = ref("");
const centerComplaints = ref([]);
const emergencyAlerts = ref([]);
const emergencyGeoDetails = reactive({});
const emergencyGeoCache = new Map();
const emergencyCategory = ref("IN_PROGRESS");
const emergencyPeriodTo = ref(new Date().toISOString().slice(0, 10));
const emergencyPeriodFrom = ref(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
const emergencyStepNotes = reactive({});
const emergencyAlertsError = ref("");
const emergencyAlertsSuccess = ref("");
const emergencyCategoryMenu = [
  { key: "UNHANDLED", label: "Non traite" },
  { key: "IN_PROGRESS", label: "En cours" },
  { key: "REJECTED", label: "Rejete" },
  { key: "COMPLETED", label: "Traite" },
  { key: "ALL", label: "Tous" }
];

const myCenterId = ref("");
const chefForm = reactive({
  name: "",
  address: "",
  establishmentCode: "",
  level: "CENTRE_SANTE",
  establishmentType: "PUBLIQUE",
  regionCode: "",
  districtCode: "",
  technicalPlatform: "",
  servicesCsv: "",
  latitude: "",
  longitude: ""
});
const chefError = ref("");
const chefSuccess = ref("");
const regulatorCenterForm = reactive({
  name: "",
  address: "",
  establishmentCode: "",
  level: "CENTRE_SANTE",
  establishmentType: "PUBLIQUE",
  regionCode: "",
  districtCode: "",
  technicalPlatform: "",
  servicesCsv: "",
  latitude: "",
  longitude: ""
});
const regulatorCenterError = ref("");
const regulatorCenterSuccess = ref("");

const users = ref([]);
const pendingCenters = ref([]);
const pendingCenterSearch = ref("");
const usersError = ref("");
const usersSuccess = ref("");
const settingsSection = ref("users");
const editingUserId = ref("");
const userRoleOptions = ["USER", "NATIONAL", "REGION", "DISTRICT", "ETABLISSEMENT", "SAPPEUR_POMPIER", "SAMU", "REGULATOR"];
const userForm = reactive({
  fullName: "",
  email: "",
  password: "",
  primaryRole: "USER",
  roles: ["USER"],
  establishmentCode: "",
  regionCode: "",
  districtCode: "",
  centerId: ""
});
const requiresEstablishmentCode = computed(() =>
  userForm.primaryRole === "ETABLISSEMENT" || userForm.roles.includes("ETABLISSEMENT")
);

const parsedCenters = ref([]);
const importPreviewCount = ref(0);
const importError = ref("");
const importSuccess = ref("");
const importLoading = ref(false);
const deleteCentersConfirm = ref("");
const deleteCentersLoading = ref(false);
const deleteCentersError = ref("");
const deleteCentersSuccess = ref("");
const regions = ref([]);
const districts = ref([]);
const regionForm = reactive({ code: "", name: "" });
const districtForm = reactive({ code: "", name: "", regionCode: "" });
const geoError = ref("");
const geoSuccess = ref("");
const parsedRegions = ref([]);
const parsedDistricts = ref([]);
const regionImportPreviewCount = ref(0);
const districtImportPreviewCount = ref(0);
const regionImportError = ref("");
const districtImportError = ref("");
const regionImportSuccess = ref("");
const districtImportSuccess = ref("");
const regionImportLoading = ref(false);
const districtImportLoading = ref(false);

const filteredComplaintCenters = computed(() => {
  const q = centerSearch.value.trim().toLowerCase();
  if (!q) return allCenters.value.slice(0, 30);
  return allCenters.value
    .filter((c) => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q))
    .slice(0, 30);
});

const filteredPendingCenters = computed(() => {
  const q = pendingCenterSearch.value.trim().toLowerCase();
  if (!q) return pendingCenters.value;
  return pendingCenters.value.filter((center) => {
    const name = String(center.name || "").toLowerCase();
    const code = String(center.establishmentCode || "").toLowerCase();
    return name.includes(q) || code.includes(q);
  });
});

const availableDistrictsForRegulatorCenter = computed(() => {
  const selectedRegion = String(regulatorCenterForm.regionCode || "").trim().toUpperCase();
  if (!selectedRegion) return [];
  return districts.value.filter((district) => String(district.regionCode || "").trim().toUpperCase() === selectedRegion);
});
const availableDistrictsForUserAssignment = computed(() => {
  const selectedRegion = String(userForm.regionCode || "").trim().toUpperCase();
  if (!selectedRegion) return districts.value;
  return districts.value.filter((district) => String(district.regionCode || "").trim().toUpperCase() === selectedRegion);
});
const assignableCentersForUser = computed(() => {
  const selectedRegion = String(userForm.regionCode || "").trim().toUpperCase();
  const selectedDistrict = String(userForm.districtCode || "").trim().toUpperCase();
  return allCenters.value
    .filter((center) => {
      const centerRegion = String(center.regionCode || "").trim().toUpperCase();
      const centerDistrict = String(center.districtCode || "").trim().toUpperCase();
      if (selectedDistrict) return centerDistrict === selectedDistrict;
      if (selectedRegion) return centerRegion === selectedRegion;
      return true;
    })
    .slice()
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
});

const filteredNearbyCenters = computed(() => {
  const q = String(nearbySearch.value || "").trim().toLowerCase();
  if (!q) return nearbyCenters.value;

  return nearbyCenters.value.filter((center) => {
    const name = String(center?.name || "").toLowerCase();
    const type = String(formatType(center?.establishmentType) || "").toLowerCase();
    const technicalPlatform = String(center?.technicalPlatform || "").toLowerCase();
    const services = Array.isArray(center?.services)
      ? center.services.map((s) => String(s?.name || "").toLowerCase()).join(" ")
      : "";
    return (
      name.includes(q) ||
      type.includes(q) ||
      technicalPlatform.includes(q) ||
      services.includes(q)
    );
  });
});

const filteredEvaluationCenters = computed(() => {
  const q = String(evaluationSearch.value || "").trim().toLowerCase();
  const centers = allCenters.value
    .map((center) => ({
      ...center,
      ratingAverage: center?.ratingAverage == null ? null : Number(center.ratingAverage),
      satisfactionRate: center?.satisfactionRate == null ? null : Number(center.satisfactionRate),
      ratingCount: Number(center?.ratingCount || 0)
    }))
    .sort((a, b) => {
      const aScore = a.ratingAverage == null ? -1 : a.ratingAverage;
      const bScore = b.ratingAverage == null ? -1 : b.ratingAverage;
      return bScore - aScore;
    });

  if (!q) return centers;
  return centers.filter((center) => {
    const name = String(center?.name || "").toLowerCase();
    const code = String(center?.establishmentCode || "").toLowerCase();
    const address = String(center?.address || "").toLowerCase();
    return name.includes(q) || code.includes(q) || address.includes(q);
  });
});

const evaluationCoverage = computed(() => {
  const totalCenters = Number(complaintSummary.value?.centerCount || filteredEvaluationCenters.value.length || 0);
  const withoutEvaluations = Number(complaintSummary.value?.centersWithoutEvaluation || 0);
  const withEvaluations = Math.max(totalCenters - withoutEvaluations, 0);
  const percent = totalCenters > 0 ? Math.round((withEvaluations * 100) / totalCenters) : 0;
  return { totalCenters, withEvaluations, withoutEvaluations, percent };
});

const satisfactionBreakdown = computed(() => {
  const satisfied = complaintSummary.value?.satisfactionRate == null
    ? 0
    : Math.max(0, Math.min(100, Number(complaintSummary.value.satisfactionRate)));
  return {
    satisfied: Math.round(satisfied),
    unsatisfied: Math.round(100 - satisfied)
  };
});

const topRatedCenters = computed(() =>
  filteredEvaluationCenters.value
    .filter((center) => center.ratingAverage != null)
    .slice(0, 5)
);

const filteredEmergencyAlerts = computed(() => {
  if (emergencyCategory.value === "ALL") return emergencyAlerts.value;
  if (emergencyCategory.value === "UNHANDLED") {
    return emergencyAlerts.value.filter((item) => item.status === "NEW");
  }
  if (emergencyCategory.value === "IN_PROGRESS") {
    return emergencyAlerts.value.filter((item) => ["ACKNOWLEDGED", "EN_ROUTE", "ON_SITE"].includes(item.status));
  }
  if (emergencyCategory.value === "REJECTED") {
    return emergencyAlerts.value.filter((item) => item.status === "CLOSED");
  }
  if (emergencyCategory.value === "COMPLETED") {
    return emergencyAlerts.value.filter((item) => item.status === "COMPLETED");
  }
  return emergencyAlerts.value;
});

const emergencyStats = computed(() => ({
  nonTraite: emergencyAlerts.value.filter((item) => item.status === "NEW").length,
  enCours: emergencyAlerts.value.filter((item) => ["ACKNOWLEDGED", "EN_ROUTE", "ON_SITE"].includes(item.status)).length,
  traite: emergencyAlerts.value.filter((item) => item.status === "COMPLETED").length,
  rejete: emergencyAlerts.value.filter((item) => item.status === "CLOSED").length
}));

function resolveTab(tabCandidate) {
  const requested = String(tabCandidate || "").trim();

  if (isChef.value) {
    if (requested === "evaluations") return "evaluations";
    if (requested === "complaints") return "complaints";
    return "my-center";
  }

  const allowed = ["overview", "nearby"];
  if (isEmergencyResponder.value) {
    allowed.push("emergency-alerts");
  }
  if (isRegulator.value) {
    allowed.push("complaints", "evaluations", "settings");
  }

  if (allowed.includes(requested)) {
    return requested;
  }

  if (isEmergencyResponder.value) {
    return "emergency-alerts";
  }

  return "overview";
}

function formatType(type) {
  if (type === "CONFESSIONNEL") return "Confessionnel";
  if (type === "PRIVE") return "Prive";
  if (type === "PUBLIQUE") return "Publique";
  return type || "-";
}

function formatLevel(level) {
  if (level === "CLINIQUE_PRIVEE") return "Clinique privee";
  if (level === "CENTRE_SANTE") return "Centre de sante";
  if (level === "EHPAD_USLD") return "EHPAD / USLD";
  if (level === "CENTRE_RADIOTHERAPIE") return "Centre de radiotherapie";
  if (level === "CENTRE_CARDIOLOGIE") return "Centre de cardiologie";
  return level || "-";
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function formatComplaintStatus(status) {
  if (status === "NEW") return "NOUVELLE";
  if (status === "IN_PROGRESS") return "EN COURS";
  if (status === "RESOLVED") return "RESOLUE";
  if (status === "REJECTED") return "REJETEE";
  return status || "-";
}

function formatEmergencyStatus(status) {
  if (status === "NEW") return "NOUVELLE";
  if (status === "ACKNOWLEDGED") return "PRISE EN CHARGE";
  if (status === "EN_ROUTE") return "EN ROUTE";
  if (status === "ON_SITE") return "SUR SITE";
  if (status === "COMPLETED") return "TERMINEE";
  if (status === "CLOSED") return "CLOTUREE";
  return status || "-";
}

function emergencyGeoKey(item) {
  const lat = Number(item?.latitude);
  const lon = Number(item?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return "";
  return `${lat.toFixed(5)},${lon.toFixed(5)}:v3`;
}

function emergencyGeoState(item) {
  const key = emergencyGeoKey(item);
  if (!key) return null;
  return emergencyGeoDetails[key] || null;
}

function getEmergencyCountry(item) {
  const state = emergencyGeoState(item);
  if (!state) return "-";
  if (state.loading) return "Recherche...";
  return state.country || "-";
}

function getEmergencyPlaceName(item) {
  const explicitPointName = String(item?.pickupPointName || "").trim();
  if (explicitPointName) return explicitPointName;
  const state = emergencyGeoState(item);
  if (!state) return "-";
  if (state.loading) return "Recherche...";
  return state.placeName || "-";
}

function getEmergencyCity(item) {
  const state = emergencyGeoState(item);
  if (!state) return "-";
  if (state.loading) return "Recherche...";
  return state.city || "-";
}

function getEmergencyLocality(item) {
  const state = emergencyGeoState(item);
  if (!state) return "-";
  if (state.loading) return "Recherche...";
  return state.locality || "-";
}

function normalizeAdminLabel(value) {
  return String(value || "").trim();
}

function includesAbidjan(value) {
  return /abidjan/i.test(String(value || ""));
}

function isCoteDivoire(address = {}) {
  return String(address.country_code || "").toLowerCase() === "ci";
}

function pickBestCity(address = {}, payload = {}) {
  const displayName = String(payload?.display_name || "");
  const inAbidjanDistrict =
    includesAbidjan(address.state) ||
    includesAbidjan(address.region) ||
    includesAbidjan(address.county) ||
    includesAbidjan(address.state_district) ||
    includesAbidjan(displayName);

  // Regle metier locale: pour le district d'Abidjan, la ville doit rester Abidjan.
  if (isCoteDivoire(address) && inAbidjanDistrict) {
    return "Abidjan";
  }

  return (
    normalizeAdminLabel(address.city) ||
    normalizeAdminLabel(address.town) ||
    normalizeAdminLabel(address.municipality) ||
    normalizeAdminLabel(address.state_district) ||
    normalizeAdminLabel(address.village) ||
    normalizeAdminLabel(address.suburb) ||
    normalizeAdminLabel(address.county) ||
    normalizeAdminLabel(address.state) ||
    ""
  );
}

function pickBestLocality(address = {}) {
  return (
    normalizeAdminLabel(address.city_district) ||
    normalizeAdminLabel(address.suburb) ||
    normalizeAdminLabel(address.neighbourhood) ||
    normalizeAdminLabel(address.residential) ||
    normalizeAdminLabel(address.allotments) ||
    normalizeAdminLabel(address.block) ||
    normalizeAdminLabel(address.road) ||
    normalizeAdminLabel(address.village) ||
    normalizeAdminLabel(address.hamlet) ||
    normalizeAdminLabel(address.quarter) ||
    normalizeAdminLabel(address.city) ||
    ""
  );
}

async function reverseGeocodeEmergency(lat, lon) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${encodeURIComponent(
      String(lat)
    )}&lon=${encodeURIComponent(String(lon))}`
  );
  if (!response.ok) {
    throw new Error(`Geocodage inverse impossible (${response.status})`);
  }
  const payload = await response.json();
  const address = payload?.address || {};
  const displayName = String(payload?.display_name || "").trim();
  const road = String(address.road || address.pedestrian || address.footway || "").trim();
  const amenity = String(address.amenity || address.tourism || address.shop || "").trim();
  const placeName = amenity || road || displayName.split(",")[0] || "";
  return {
    placeName,
    country: String(address.country || "").trim(),
    city: String(pickBestCity(address, payload) || "").trim(),
    locality: String(pickBestLocality(address) || "").trim()
  };
}

async function hydrateEmergencyGeoDetails() {
  const uniqueItems = [];
  const seen = new Set();
  for (const item of emergencyAlerts.value.slice(0, 80)) {
    const key = emergencyGeoKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    uniqueItems.push(item);
  }

  for (const item of uniqueItems) {
    const key = emergencyGeoKey(item);
    if (!key) continue;

    if (emergencyGeoCache.has(key)) {
      emergencyGeoDetails[key] = emergencyGeoCache.get(key);
      continue;
    }
    if (emergencyGeoDetails[key]?.loading) continue;

    emergencyGeoDetails[key] = { placeName: "", country: "", city: "", locality: "", loading: true };

    try {
      const details = await reverseGeocodeEmergency(item.latitude, item.longitude);
      const resolved = { ...details, loading: false };
      emergencyGeoCache.set(key, resolved);
      emergencyGeoDetails[key] = resolved;
    } catch {
      emergencyGeoDetails[key] = { placeName: "", country: "", city: "", locality: "", loading: false };
    }
  }
}

function buildEmergencyMapEmbedUrl(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return "";
  const delta = 0.01;
  const left = lon - delta;
  const right = lon + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
}

function getEmergencyStatusClass(status) {
  if (status === "NEW") return "is-new";
  if (["ACKNOWLEDGED", "EN_ROUTE", "ON_SITE"].includes(status)) return "is-progress";
  if (status === "COMPLETED") return "is-completed";
  if (status === "CLOSED") return "is-rejected";
  return "is-default";
}

function getEmergencyAlertCardClass(status) {
  if (status === "NEW") return "emergency-card-new";
  if (["ACKNOWLEDGED", "EN_ROUTE", "ON_SITE"].includes(status)) return "emergency-card-progress";
  if (status === "COMPLETED") return "emergency-card-completed";
  if (status === "CLOSED") return "emergency-card-rejected";
  return "";
}

function parseServicesCsv(csv) {
  if (typeof csv !== "string") return [];
  return csv
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

function parseNumeric(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const n = Number(value.replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}

function normalizeGeoCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function normalizeImportType(value) {
  const s = String(value || "").trim().toUpperCase();
  if (!s) return "PUBLIQUE";
  if (s === "CONFESSIONNEL") return "CONFESSIONNEL";
  if (s === "PRIVE") return "PRIVE";
  if (s === "PUBLIC" || s === "PUBLIQUE") return "PUBLIQUE";
  if (s === "ONG") return "PRIVE";
  if (s === "COMMUNAUTAIRE") return "PUBLIQUE";
  return "PUBLIQUE";
}

function normalizeImportLevel(value) {
  const s = String(value || "").trim().toUpperCase();
  if (!s) return "CENTRE_SANTE";
  if (s === "CHU") return "CHU";
  if (s === "CHR") return "CHR";
  if (s === "CHS") return "CHS";
  if (s === "HG") return "CH";
  if (
    [
      "CLINIQUE",
      "POLYCLINIQUE",
      "CABINET DENTAIRE",
      "CABINET OPTIQUE",
      "CABINET MEDICAL",
      "LABORATOIRE",
      "INSTITUT SPECIALISE"
    ].includes(s)
  ) {
    return "CLINIQUE_PRIVEE";
  }
  return "CENTRE_SANTE";
}

function getAny(row, keys) {
  for (const key of keys) {
    if (row[key] != null && String(row[key]).trim() !== "") {
      return row[key];
    }
  }
  return "";
}

function mapExcelRow(row) {
  const name = String(getAny(row, ["name", "Name", "nom", "Nom"])).trim();
  const addressRaw = String(getAny(row, ["address", "Address", "adresse", "Adresse"])).trim();
  const address = addressRaw || "Adresse non renseignee";
  const technicalPlatformRaw = String(
    getAny(row, ["technicalPlatform", "TechnicalPlatform", "plateau", "plateauTechnique"])
  ).trim();
  const technicalPlatform = technicalPlatformRaw || "Non renseigne";
  const latitude = parseNumeric(getAny(row, ["latitude", "Latitude", "lat", "Lat"]));
  const longitude = parseNumeric(getAny(row, ["longitude", "Longitude", "lon", "lng", "Long"]));
  const level = normalizeImportLevel(getAny(row, ["level", "Level", "niveau", "Niveau"]));
  const establishmentType = normalizeImportType(getAny(row, ["establishmentType", "type", "Type"]));
  const establishmentCode = String(
    getAny(row, ["establishmentCode", "codeEtablissement", "code", "Code"])
  ).trim();
  const regionCode = normalizeGeoCode(getAny(row, ["regionCode", "region", "region_code", "Region"]));
  const districtCode = normalizeGeoCode(getAny(row, ["districtCode", "district", "district_code", "District"]));
  const services = parseServicesCsv(String(getAny(row, ["services", "Services"])));

  if (!name || latitude == null || longitude == null) {
    return null;
  }

  return {
    name,
    address,
    technicalPlatform,
    latitude,
    longitude,
    level,
    establishmentType,
    ...(regionCode ? { regionCode } : {}),
    ...(districtCode ? { districtCode } : {}),
    ...(establishmentCode ? { establishmentCode } : {}),
    services
  };
}

function mapRegionExcelRow(row) {
  const code = normalizeGeoCode(getAny(row, ["code", "Code", "regionCode", "region_code"]));
  const name = String(getAny(row, ["name", "Name", "regionName", "region_name"])).trim();
  if (!code || !name) return null;
  return { code, name };
}

function mapDistrictExcelRow(row) {
  const code = normalizeGeoCode(getAny(row, ["code", "Code", "districtCode", "district_code"]));
  const name = String(getAny(row, ["name", "Name", "districtName", "district_name"])).trim();
  const regionCode = normalizeGeoCode(getAny(row, ["regionCode", "region_code", "region", "Region"]));
  if (!code || !name || !regionCode) return null;
  return { code, name, regionCode };
}

async function readFileRows(file) {
  const ext = String(file?.name || "").toLowerCase();
  if (ext.endsWith(".csv")) {
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) return [];
    const headers = lines[0].split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((value) => value.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ?? "";
      });
      return row;
    });
  }

  if (!XLSXModule) {
    XLSXModule = await import("xlsx");
  }
  const buffer = await file.arrayBuffer();
  const workbook = XLSXModule.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  return XLSXModule.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
}

function parseChefServices(csv) {
  return String(csv || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

function loadChefCenterFromList() {
  if (!isChef.value) return;
  const center = allCenters.value[0];
  if (!center) return;
  myCenterId.value = center._id;
  chefForm.name = center.name || "";
  chefForm.address = center.address || "";
  chefForm.establishmentCode = center.establishmentCode || "";
  chefForm.level = center.level || "CENTRE_SANTE";
  chefForm.establishmentType = center.establishmentType || "PUBLIQUE";
  chefForm.regionCode = center.regionCode || "";
  chefForm.districtCode = center.districtCode || "";
  chefForm.technicalPlatform = center.technicalPlatform || "";
  chefForm.servicesCsv = Array.isArray(center.services) ? center.services.map((s) => s.name).join(", ") : "";
  chefForm.latitude = Number(center.location?.coordinates?.[1]) || "";
  chefForm.longitude = Number(center.location?.coordinates?.[0]) || "";
}

function setCurrentPosition() {
  chefError.value = "";
  if (!navigator.geolocation) {
    chefError.value = "Geolocalisation non supportee";
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      chefForm.latitude = Number(position.coords.latitude);
      chefForm.longitude = Number(position.coords.longitude);
    },
    () => {
      chefError.value = "Impossible de recuperer votre position";
    }
  );
}

async function saveMyCenter() {
  chefError.value = "";
  chefSuccess.value = "";
  try {
    const body = {
      name: chefForm.name,
      address: chefForm.address,
      establishmentCode: chefForm.establishmentCode || null,
      level: chefForm.level,
      establishmentType: chefForm.establishmentType,
      regionCode: String(chefForm.regionCode || "").trim().toUpperCase(),
      districtCode: String(chefForm.districtCode || "").trim().toUpperCase() || null,
      technicalPlatform: chefForm.technicalPlatform,
      latitude: Number(chefForm.latitude),
      longitude: Number(chefForm.longitude),
      services: parseChefServices(chefForm.servicesCsv)
    };

    if (myCenterId.value) {
      await apiFetch(`/centers/${myCenterId.value}`, {
        token: auth.state.token,
        method: "PUT",
        body
      });
      chefSuccess.value = "Centre mis a jour et envoye en validation";
    } else {
      const created = await apiFetch("/centers", {
        token: auth.state.token,
        method: "POST",
        body
      });
      myCenterId.value = created._id;
      chefSuccess.value = "Centre cree et envoye en validation";
    }

    await fetchAllCenters();
    await fetchNearby();
  } catch (err) {
    chefError.value = err.message;
  }
}

function resetRegulatorCenterForm() {
  regulatorCenterForm.name = "";
  regulatorCenterForm.address = "";
  regulatorCenterForm.establishmentCode = "";
  regulatorCenterForm.level = "CENTRE_SANTE";
  regulatorCenterForm.establishmentType = "PUBLIQUE";
  regulatorCenterForm.regionCode = "";
  regulatorCenterForm.districtCode = "";
  regulatorCenterForm.technicalPlatform = "";
  regulatorCenterForm.servicesCsv = "";
  regulatorCenterForm.latitude = "";
  regulatorCenterForm.longitude = "";
}

async function setRegulatorCurrentPosition() {
  regulatorCenterError.value = "";
  try {
    const position = await getCurrentPositionDetailed();
    regulatorCenterForm.latitude = Number(position.lat);
    regulatorCenterForm.longitude = Number(position.lon);
  } catch (err) {
    regulatorCenterError.value = err.message;
  }
}

async function createCenterByRegulator() {
  regulatorCenterError.value = "";
  regulatorCenterSuccess.value = "";
  try {
    const body = {
      name: regulatorCenterForm.name,
      address: regulatorCenterForm.address,
      establishmentCode: regulatorCenterForm.establishmentCode || null,
      level: regulatorCenterForm.level,
      establishmentType: regulatorCenterForm.establishmentType,
      regionCode: normalizeGeoCode(regulatorCenterForm.regionCode),
      districtCode: normalizeGeoCode(regulatorCenterForm.districtCode) || null,
      technicalPlatform: regulatorCenterForm.technicalPlatform,
      latitude: Number(regulatorCenterForm.latitude),
      longitude: Number(regulatorCenterForm.longitude),
      services: parseChefServices(regulatorCenterForm.servicesCsv)
    };

    await apiFetch("/centers", {
      token: auth.state.token,
      method: "POST",
      body
    });

    regulatorCenterSuccess.value = "Centre cree et envoye en validation";
    resetRegulatorCenterForm();
    await fetchAllCenters();
    await fetchPendingCenters();
  } catch (err) {
    regulatorCenterError.value = err.message;
  }
}

function onRegulatorRegionChange() {
  regulatorCenterForm.districtCode = "";
}

async function fetchRegions() {
  geoError.value = "";
  try {
    regions.value = await apiFetch("/geo/regions", { token: auth.state.token });
  } catch (err) {
    geoError.value = err.message;
  }
}

async function fetchDistricts() {
  geoError.value = "";
  try {
    districts.value = await apiFetch("/geo/districts", { token: auth.state.token });
  } catch (err) {
    geoError.value = err.message;
  }
}

async function createRegion() {
  geoError.value = "";
  geoSuccess.value = "";
  try {
    await apiFetch("/geo/regions", {
      token: auth.state.token,
      method: "POST",
      body: {
        code: normalizeGeoCode(regionForm.code),
        name: String(regionForm.name || "").trim()
      }
    });
    geoSuccess.value = "Region creee";
    regionForm.code = "";
    regionForm.name = "";
    await fetchRegions();
  } catch (err) {
    geoError.value = err.message;
  }
}

async function createDistrict() {
  geoError.value = "";
  geoSuccess.value = "";
  try {
    await apiFetch("/geo/districts", {
      token: auth.state.token,
      method: "POST",
      body: {
        code: normalizeGeoCode(districtForm.code),
        name: String(districtForm.name || "").trim(),
        regionCode: normalizeGeoCode(districtForm.regionCode)
      }
    });
    geoSuccess.value = "District cree";
    districtForm.code = "";
    districtForm.name = "";
    await fetchDistricts();
    await fetchRegions();
  } catch (err) {
    geoError.value = err.message;
  }
}

async function onRegionImportFileChange(event) {
  regionImportError.value = "";
  regionImportSuccess.value = "";
  parsedRegions.value = [];
  regionImportPreviewCount.value = 0;
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const rows = await readFileRows(file);
    parsedRegions.value = rows.map(mapRegionExcelRow).filter(Boolean);
    regionImportPreviewCount.value = parsedRegions.value.length;
    if (parsedRegions.value.length === 0) {
      regionImportError.value = "Aucune ligne region valide detectee";
    }
  } catch (err) {
    regionImportError.value = err.message || "Lecture fichier impossible";
  }
}

async function onDistrictImportFileChange(event) {
  districtImportError.value = "";
  districtImportSuccess.value = "";
  parsedDistricts.value = [];
  districtImportPreviewCount.value = 0;
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const rows = await readFileRows(file);
    parsedDistricts.value = rows.map(mapDistrictExcelRow).filter(Boolean);
    districtImportPreviewCount.value = parsedDistricts.value.length;
    if (parsedDistricts.value.length === 0) {
      districtImportError.value = "Aucune ligne district valide detectee";
    }
  } catch (err) {
    districtImportError.value = err.message || "Lecture fichier impossible";
  }
}

async function importRegionsFromFile() {
  regionImportError.value = "";
  regionImportSuccess.value = "";
  regionImportLoading.value = true;
  try {
    const result = await apiFetch("/geo/regions/import", {
      token: auth.state.token,
      method: "POST",
      body: { regions: parsedRegions.value }
    });
    regionImportSuccess.value = `${Number(result.importedCount || 0)} region(s) importee(s)`;
    parsedRegions.value = [];
    regionImportPreviewCount.value = 0;
    await fetchRegions();
  } catch (err) {
    const firstError = err?.data?.errors?.[0];
    if (firstError) {
      regionImportError.value = `${err.message} (ligne ${Number(firstError.index) + 1}: ${firstError.message})`;
    } else {
      regionImportError.value = err.message;
    }
  } finally {
    regionImportLoading.value = false;
  }
}

async function importDistrictsFromFile() {
  districtImportError.value = "";
  districtImportSuccess.value = "";
  districtImportLoading.value = true;
  try {
    const result = await apiFetch("/geo/districts/import", {
      token: auth.state.token,
      method: "POST",
      body: { districts: parsedDistricts.value }
    });
    districtImportSuccess.value = `${Number(result.importedCount || 0)} district(s) importe(s)`;
    parsedDistricts.value = [];
    districtImportPreviewCount.value = 0;
    await fetchDistricts();
    await fetchRegions();
  } catch (err) {
    const firstError = err?.data?.errors?.[0];
    if (firstError) {
      districtImportError.value = `${err.message} (ligne ${Number(firstError.index) + 1}: ${firstError.message})`;
    } else {
      districtImportError.value = err.message;
    }
  } finally {
    districtImportLoading.value = false;
  }
}

async function onImportFileChange(event) {
  importError.value = "";
  importSuccess.value = "";
  parsedCenters.value = [];
  importPreviewCount.value = 0;

  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const rows = await readFileRows(file);
    if (!rows.length) {
      importError.value = "Fichier vide";
      return;
    }
    parsedCenters.value = rows.map(mapExcelRow).filter(Boolean);
    importPreviewCount.value = parsedCenters.value.length;
    if (parsedCenters.value.length === 0) {
      importError.value = "Aucune ligne valide detectee";
    }
  } catch (err) {
    importError.value = err.message || "Lecture Excel impossible";
  }
}

async function importCentersFromFile() {
  importError.value = "";
  importSuccess.value = "";
  importLoading.value = true;
  try {
    const chunkSize = 300;
    let totalImported = 0;

    for (let i = 0; i < parsedCenters.value.length; i += chunkSize) {
      const chunk = parsedCenters.value.slice(i, i + chunkSize);
      const result = await apiFetch("/centers/import", {
        token: auth.state.token,
        method: "POST",
        body: { centers: chunk }
      });
      totalImported += Number(result.importedCount || 0);
    }

    importSuccess.value = `${totalImported} centre(s) importes`;
    parsedCenters.value = [];
    importPreviewCount.value = 0;
    await fetchAllCenters();
    await fetchNearby();
  } catch (err) {
    const firstError = err?.data?.errors?.[0];
    if (firstError) {
      importError.value = `${err.message} (ligne ${Number(firstError.index) + 1}: ${firstError.message})`;
    } else {
      importError.value = err.message;
    }
  } finally {
    importLoading.value = false;
  }
}

async function fetchAllCenters() {
  try {
    allCenters.value = await apiFetch("/centers", { token: auth.state.token });
    loadChefCenterFromList();
  } catch (err) {
    error.value = err.message;
  }
}

async function fetchNearby({ expandIfEmpty = true } = {}) {
  if (!coords.value) {
    error.value = "Position indisponible. Cliquez sur 'Utiliser ma position actuelle'.";
    info.value = "";
    nearbyCenters.value = [];
    return;
  }
  error.value = "";
  info.value = "";

  try {
    const baseRadius = Number(radiusKm.value) || 20;
    nearbyCenters.value = await apiFetch(
      `/centers/nearby?latitude=${coords.value.lat}&longitude=${coords.value.lon}&radiusKm=${baseRadius}`,
      { token: auth.state.token }
    );

    if (expandIfEmpty && nearbyCenters.value.length === 0) {
      const fallbackRadii = [50, 100, 200, 500];
      for (const fallbackRadius of fallbackRadii) {
        if (fallbackRadius <= baseRadius) continue;
        const widened = await apiFetch(
          `/centers/nearby?latitude=${coords.value.lat}&longitude=${coords.value.lon}&radiusKm=${fallbackRadius}`,
          { token: auth.state.token }
        );
        if (Array.isArray(widened) && widened.length > 0) {
          nearbyCenters.value = widened;
          info.value = `Aucun centre dans ${baseRadius} km. Resultats elargis a ${fallbackRadius} km.`;
          break;
        }
      }
    }

    if (nearbyCenters.value.length === 0) {
      info.value = `Aucun centre trouve dans ${baseRadius} km.`;
    }

    if (!selectedCenter.value || !nearbyCenters.value.some((c) => c._id === selectedCenter.value._id)) {
      selectedCenter.value = null;
    }
    redrawMap();
  } catch (err) {
    error.value = err.message;
    info.value = "";
    nearbyCenters.value = [];
    redrawMap();
  }
}

function mapGeolocationError(errorObj) {
  const code = Number(errorObj?.code);
  if (code === 1) {
    return "Permission de localisation refusee. Autorisez la localisation pour ce site.";
  }
  if (code === 2) {
    return "Position indisponible. Verifiez le service de localisation de votre appareil.";
  }
  if (code === 3) {
    return "Delai de localisation depasse. Reessayez dans une zone avec meilleure precision reseau/GPS.";
  }
  return "Impossible de recuperer votre position.";
}

function getCurrentPositionDetailed() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalisation non supportee par ce navigateur"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ lat: position.coords.latitude, lon: position.coords.longitude });
      },
      (geoError) => {
        reject(new Error(mapGeolocationError(geoError)));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  });
}

async function refreshCurrentPosition() {
  error.value = "";
  info.value = "";
  try {
    const position = await getCurrentPositionDetailed();
    coords.value = position;
    ensureMap();
    if (map) {
      map.setView([coords.value.lat, coords.value.lon], 12);
    }
    await fetchNearby({ expandIfEmpty: true });
  } catch (err) {
    error.value = err.message;
    nearbyCenters.value = [];
    redrawMap();
  }
}

async function bootstrapNearbyIfNeeded() {
  if (nearbyBootstrapped.value || isChef.value) return;
  nearbyBootstrapped.value = true;
  await nextTick();
  ensureMap();
  await refreshCurrentPosition();
}

function ensureMap() {
  if (map || !mapEl.value) return;
  map = L.map(mapEl.value).setView([6.5244, 3.3792], 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
}

function getCenterLatLng(center) {
  const lat = Number(center?.location?.coordinates?.[1]);
  const lon = Number(center?.location?.coordinates?.[0]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return [lat, lon];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getCenterMarkerColor(center) {
  if (center?.establishmentType === "PUBLIQUE") return "#1d4ed8";
  if (center?.establishmentType === "PRIVE") return "#16a34a";
  if (center?.establishmentType === "CONFESSIONNEL") return "#d97706";
  return "#475569";
}

function createPinIcon({ color, symbol, size = 18 }) {
  const pinSize = size + 8;
  return L.divIcon({
    className: "custom-map-pin",
    html: `
      <div style="
        width:${pinSize}px;
        height:${pinSize}px;
        border-radius:999px;
        background:${color};
        border:2px solid #ffffff;
        box-shadow:0 3px 10px rgba(15,23,42,0.35);
        display:grid;
        place-items:center;
        color:#ffffff;
        font-size:${size - 6}px;
        font-weight:700;
      ">${symbol}</div>
    `,
    iconSize: [pinSize, pinSize],
    iconAnchor: [pinSize / 2, pinSize / 2]
  });
}

function buildCenterPopup(center) {
  const services = Array.isArray(center?.services)
    ? center.services.map((s) => s?.name).filter(Boolean).join(", ")
    : "";
  return `
    <div style="min-width:240px">
      <strong>${escapeHtml(center?.name || "Centre de sante")}</strong><br/>
      <small>${escapeHtml(center?.address || "-")}</small><br/>
      <small><b>Distance:</b> ${escapeHtml(center?.distanceKm ?? "-")} km</small><br/>
      <small><b>Niveau:</b> ${escapeHtml(formatLevel(center?.level))}</small><br/>
      <small><b>Type:</b> ${escapeHtml(formatType(center?.establishmentType))}</small><br/>
      <small><b>Plateau:</b> ${escapeHtml(center?.technicalPlatform || "-")}</small><br/>
      <small><b>Services:</b> ${escapeHtml(services || "Aucun")}</small>
    </div>
  `;
}

function redrawMap() {
  if (!map || !markersLayer) return;
  markersLayer.clearLayers();
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }

  if (coords.value) {
    L.marker([coords.value.lat, coords.value.lon], {
      icon: createPinIcon({ color: "#0ea5e9", symbol: "📍", size: 20 })
    })
      .addTo(markersLayer)
      .bindTooltip("Vous etes ici", { direction: "top" })
      .bindPopup("<strong>Votre position actuelle</strong>");
  }

  const validCenters = filteredNearbyCenters.value
    .map((center) => ({ center, latlng: getCenterLatLng(center) }))
    .filter((item) => Array.isArray(item.latlng));

  validCenters.forEach(({ center, latlng }) => {
    const marker = L.marker(latlng, {
      icon: createPinIcon({
        color: getCenterMarkerColor(center),
        symbol: "🏥",
        size: 18
      })
    }).addTo(markersLayer);

    marker.bindTooltip(
      `${center.name || "Centre"} - ${center.distanceKm ?? "?"} km`,
      { direction: "top", sticky: true, opacity: 0.95 }
    );
    marker.bindPopup(buildCenterPopup(center), { maxWidth: 320 });

    marker.on("mouseover", () => marker.openTooltip());
    marker.on("click", () => {
      marker.openPopup();
      focusCenter(center);
    });
  });

  if (selectedCenter.value && coords.value) {
    const selectedLatLng = getCenterLatLng(selectedCenter.value);
    if (!selectedLatLng) return;
    routeLine = L.polyline(
      [
        [coords.value.lat, coords.value.lon],
        selectedLatLng
      ],
      { color: "#0b7285", weight: 4 }
    ).addTo(map);
    return;
  }

  if (validCenters.length > 0 && !selectedCenter.value) {
    const points = [
      ...(coords.value ? [[coords.value.lat, coords.value.lon]] : []),
      ...validCenters.map((item) => item.latlng)
    ];
    if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] });
    } else if (points.length === 1) {
      map.setView(points[0], 12);
    }
    return;
  }

  if (validCenters.length === 0 && coords.value) {
    map.setView([coords.value.lat, coords.value.lon], 12);
  }
}

function focusCenter(center) {
  selectedCenter.value = center;
  if (!map) return;
  const latlng = getCenterLatLng(center);
  if (!latlng) {
    error.value = "Coordonnees du centre invalides";
    return;
  }

  if (coords.value) {
    const bounds = L.latLngBounds([
      [coords.value.lat, coords.value.lon],
      latlng
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });
  } else {
    map.setView(latlng, 14);
  }

  redrawMap();
}

function navigateTo(center) {
  const latlng = getCenterLatLng(center);
  if (!latlng) {
    error.value = "Coordonnees du centre invalides";
    return;
  }
  const [lat, lon] = latlng;
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, "_blank");
}

async function submitComplaint() {
  complaintError.value = "";
  complaintSuccess.value = "";
  complaintLoading.value = true;
  try {
    await apiFetch("/complaints", {
      token: auth.state.token,
      method: "POST",
      body: {
        centerId: complaintType.value === "WITH_CENTER" ? complaintCenter.value?._id || null : null,
        subject: complaint.subject,
        message: complaint.message
      }
    });
    complaintSuccess.value = "Plainte envoyee";
    complaint.subject = "";
    complaint.message = "";
  } catch (err) {
    complaintError.value = err.message;
  } finally {
    complaintLoading.value = false;
  }
}

async function fetchComplaints() {
  complaintAdminError.value = "";
  try {
    const q = complaintStatusFilter.value ? `?status=${complaintStatusFilter.value}` : "";
    complaintsList.value = await apiFetch(`/complaints${q}`, { token: auth.state.token });
  } catch (err) {
    complaintAdminError.value = err.message;
  }
}

async function fetchComplaintSummary() {
  complaintAdminError.value = "";
  try {
    complaintSummary.value = await apiFetch("/complaints/summary", { token: auth.state.token });
  } catch (err) {
    complaintAdminError.value = err.message;
  }
}

async function setComplaintStatus(item, status) {
  complaintAdminError.value = "";
  complaintSuccess.value = "";
  try {
    const note = String(complaintStepNotes[item.id] || "").trim();
    await apiFetch(`/complaints/${item.id}/status`, {
      token: auth.state.token,
      method: "PATCH",
      body: {
        status,
        ...(note ? { message: note } : {})
      }
    });
    complaintStepNotes[item.id] = "";
    complaintSuccess.value =
      status === "IN_PROGRESS"
        ? "Plainte prise en compte"
        : status === "RESOLVED"
          ? "Plainte marquee resolue"
          : "Plainte rejetee";
    await fetchComplaints();
  } catch (err) {
    complaintAdminError.value = err.message;
  }
}

async function fetchEmergencyAlerts() {
  emergencyAlertsError.value = "";
  emergencyAlertsSuccess.value = "";
  try {
    const params = new URLSearchParams();
    if (emergencyPeriodFrom.value) params.set("dateFrom", emergencyPeriodFrom.value);
    if (emergencyPeriodTo.value) params.set("dateTo", emergencyPeriodTo.value);
    const q = params.toString() ? `?${params.toString()}` : "";
    emergencyAlerts.value = await apiFetch(`/emergency-reports${q}`, { token: auth.state.token });
    await hydrateEmergencyGeoDetails();
  } catch (err) {
    emergencyAlertsError.value = err.message;
  }
}

function navigateToEmergency(item) {
  const lat = Number(item?.latitude);
  const lon = Number(item?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    emergencyAlertsError.value = "Coordonnees invalides pour cette alerte.";
    return;
  }
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, "_blank");
}

function startEmergencyAutoRefresh() {
  if (emergencyRefreshTimer || !isEmergencyResponder.value) return;
  emergencyRefreshTimer = setInterval(() => {
    fetchEmergencyAlerts().catch(() => {});
  }, 15000);
}

function stopEmergencyAutoRefresh() {
  if (!emergencyRefreshTimer) return;
  clearInterval(emergencyRefreshTimer);
  emergencyRefreshTimer = null;
}

async function openUnhandledEmergencyAlerts() {
  emergencyCategory.value = "UNHANDLED";
  tab.value = "emergency-alerts";
  await fetchEmergencyAlerts();
}

async function takeEmergencyInCharge(item) {
  emergencyAlertsError.value = "";
  emergencyAlertsSuccess.value = "";
  try {
    let position = null;
    try {
      position = await getCurrentPositionDetailed();
    } catch {
      position = null;
    }
    await apiFetch(`/emergency-reports/${item.id}/acknowledge`, {
      token: auth.state.token,
      method: "POST",
      body: {
        ...(position ? { teamLatitude: position.lat, teamLongitude: position.lon } : {})
      }
    });
    emergencyAlertsSuccess.value = "Alerte prise en compte";
    await fetchEmergencyAlerts();
  } catch (err) {
    emergencyAlertsError.value = err.message;
  }
}

async function setEmergencyProgress(item, status) {
  emergencyAlertsError.value = "";
  emergencyAlertsSuccess.value = "";
  try {
    const note = String(emergencyStepNotes[item.id] || "").trim();
    let position = null;
    try {
      position = await getCurrentPositionDetailed();
    } catch {
      position = null;
    }

    await apiFetch(`/emergency-reports/${item.id}/progress`, {
      token: auth.state.token,
      method: "PATCH",
      body: {
        status,
        ...(note ? { teamNote: note } : {}),
        ...(position ? { teamLatitude: position.lat, teamLongitude: position.lon } : {})
      }
    });

    emergencyAlertsSuccess.value = `Statut mis a jour: ${formatEmergencyStatus(status)}`;
    await fetchEmergencyAlerts();
  } catch (err) {
    emergencyAlertsError.value = err.message;
  }
}

async function fetchCenterComplaints() {
  complaintAdminError.value = "";
  centerComplaints.value = [];
  if (!complaintCenterIdForAdmin.value) return;
  try {
    centerComplaints.value = await apiFetch(`/centers/${complaintCenterIdForAdmin.value}/complaints`, {
      token: auth.state.token
    });
  } catch (err) {
    complaintAdminError.value = err.message;
  }
}

async function fetchUsers() {
  usersError.value = "";
  try {
    users.value = await apiFetch("/users", { token: auth.state.token });
  } catch (err) {
    usersError.value = err.message;
  }
}

async function reviewChef(id, action) {
  usersError.value = "";
  usersSuccess.value = "";
  try {
    await apiFetch(`/users/${id}/review`, {
      token: auth.state.token,
      method: "POST",
      body: { action }
    });
    usersSuccess.value = action === "APPROVE" ? "Chef approuve" : "Chef rejete";
    await fetchUsers();
  } catch (err) {
    usersError.value = err.message;
  }
}

async function fetchPendingCenters() {
  usersError.value = "";
  try {
    pendingCenters.value = await apiFetch("/centers/pending", { token: auth.state.token });
  } catch (err) {
    usersError.value = err.message;
  }
}

async function reviewCenter(id, action) {
  usersError.value = "";
  usersSuccess.value = "";
  try {
    await apiFetch(`/centers/${id}/review`, {
      token: auth.state.token,
      method: "POST",
      body: { action }
    });
    usersSuccess.value = action === "APPROVE" ? "Centre approuve" : "Centre rejete";
    await fetchPendingCenters();
    await fetchAllCenters();
    await fetchNearby();
  } catch (err) {
    usersError.value = err.message;
  }
}

async function approveAllPendingCenters() {
  usersError.value = "";
  usersSuccess.value = "";
  try {
    for (const center of filteredPendingCenters.value) {
      await apiFetch(`/centers/${center._id}/review`, {
        token: auth.state.token,
        method: "POST",
        body: { action: "APPROVE" }
      });
    }
    usersSuccess.value = "Tous les centres filtres ont ete approuves";
    await fetchPendingCenters();
    await fetchAllCenters();
    await fetchNearby();
  } catch (err) {
    usersError.value = err.message;
  }
}

async function deleteAllCenters() {
  deleteCentersError.value = "";
  deleteCentersSuccess.value = "";
  if (deleteCentersConfirm.value !== "DELETE_ALL_CENTERS") {
    deleteCentersError.value = "Confirmation invalide. Tapez exactement DELETE_ALL_CENTERS";
    return;
  }

  deleteCentersLoading.value = true;
  try {
    const result = await apiFetch("/centers/all", {
      token: auth.state.token,
      method: "DELETE",
      body: { confirm: deleteCentersConfirm.value }
    });
    const count = Number(result?.deletedCount || 0);
    deleteCentersSuccess.value = `${count} centre(s) supprime(s)`;
    deleteCentersConfirm.value = "";
    await fetchPendingCenters();
    await fetchAllCenters();
    if (!isChef.value) {
      await fetchNearby();
    }
  } catch (err) {
    deleteCentersError.value = err.message;
  } finally {
    deleteCentersLoading.value = false;
  }
}

async function createUser() {
  usersError.value = "";
  usersSuccess.value = "";
  try {
    const normalizedRoles = Array.from(new Set([userForm.primaryRole, ...userForm.roles]));
    const payload = {
      fullName: userForm.fullName,
      email: userForm.email,
      role: userForm.primaryRole,
      roles: normalizedRoles,
      establishmentCode: userForm.establishmentCode || null,
      regionCode: normalizeGeoCode(userForm.regionCode) || null,
      districtCode: normalizeGeoCode(userForm.districtCode) || null,
      centerId: userForm.centerId ? Number(userForm.centerId) : null
    };
    if (userForm.password.trim()) payload.password = userForm.password;

    if (editingUserId.value) {
      await apiFetch(`/users/${editingUserId.value}`, {
        token: auth.state.token,
        method: "PATCH",
        body: payload
      });
      usersSuccess.value = "Utilisateur mis a jour";
    } else {
      await apiFetch("/users", {
        token: auth.state.token,
        method: "POST",
        body: payload
      });
      usersSuccess.value = "Utilisateur cree";
    }
    resetUserForm();
    await fetchUsers();
  } catch (err) {
    usersError.value = err.message;
  }
}

function resetUserForm() {
  editingUserId.value = "";
  userForm.fullName = "";
  userForm.email = "";
  userForm.password = "";
  userForm.primaryRole = "USER";
  userForm.roles = ["USER"];
  userForm.establishmentCode = "";
  userForm.regionCode = "";
  userForm.districtCode = "";
  userForm.centerId = "";
}

function toggleUserRole(role) {
  const normalized = String(role || "").toUpperCase();
  if (userForm.roles.includes(normalized)) {
    userForm.roles = userForm.roles.filter((r) => r !== normalized);
  } else {
    userForm.roles = [...userForm.roles, normalized];
  }
}

function formatUserRoleLabel(role) {
  if (role === "SAPPEUR_POMPIER") return "SAPEUR-POMPIER";
  return role;
}

function formatUserScope(user) {
  if (user.centerName || user.centerId) {
    return user.centerName
      ? `Centre: ${user.centerName}`
      : `Centre #${user.centerId}`;
  }
  if (user.districtCode) return `District: ${user.districtCode}`;
  if (user.regionCode) return `Region: ${user.regionCode}`;
  if (user.establishmentCode) return `Code: ${user.establishmentCode}`;
  return "-";
}

function startEditUser(user) {
  editingUserId.value = String(user.id);
  userForm.fullName = user.fullName || "";
  userForm.email = user.email || "";
  userForm.password = "";
  const roles = Array.isArray(user.roles) && user.roles.length ? user.roles : [user.role || "USER"];
  userForm.primaryRole = roles[0];
  userForm.roles = [...new Set(roles)];
  userForm.establishmentCode = user.establishmentCode || "";
  userForm.regionCode = user.regionCode || "";
  userForm.districtCode = user.districtCode || "";
  userForm.centerId = user.centerId || "";
}

async function toggleUserActive(user) {
  usersError.value = "";
  usersSuccess.value = "";
  try {
    const nextIsActive = user.isActive === false;
    await apiFetch(`/users/${user.id}/active`, {
      token: auth.state.token,
      method: "PATCH",
      body: { isActive: nextIsActive }
    });
    usersSuccess.value = nextIsActive ? "Utilisateur active" : "Utilisateur desactive";
    await fetchUsers();
  } catch (err) {
    usersError.value = err.message;
  }
}

async function deleteUser(id) {
  usersError.value = "";
  usersSuccess.value = "";
  try {
    await apiFetch(`/users/${id}`, {
      token: auth.state.token,
      method: "DELETE"
    });
    usersSuccess.value = "Utilisateur supprime";
    await fetchUsers();
  } catch (err) {
    usersError.value = err.message;
  }
}

watch(
  () => userForm.regionCode,
  (value) => {
    const region = String(value || "").trim().toUpperCase();
    if (!region) {
      userForm.districtCode = "";
      return;
    }
    if (!userForm.districtCode) return;
    const selectedDistrict = districts.value.find((district) => String(district.code || "").toUpperCase() === String(userForm.districtCode || "").toUpperCase());
    if (!selectedDistrict) {
      userForm.districtCode = "";
      return;
    }
    const districtRegion = String(selectedDistrict.regionCode || "").toUpperCase();
    if (districtRegion !== region) {
      userForm.districtCode = "";
    }
  }
);

watch(
  () => userForm.districtCode,
  (value) => {
    if (!value) return;
    const selectedDistrict = districts.value.find((district) => String(district.code || "").toUpperCase() === String(value || "").toUpperCase());
    if (!selectedDistrict) return;
    userForm.regionCode = String(selectedDistrict.regionCode || "").toUpperCase();
  }
);

watch(
  () => userForm.centerId,
  (value) => {
    if (!value) return;
    const selectedCenter = allCenters.value.find((center) => String(center._id) === String(value));
    if (!selectedCenter) return;
    if (selectedCenter.regionCode) {
      userForm.regionCode = String(selectedCenter.regionCode || "").toUpperCase();
    }
    if (selectedCenter.districtCode) {
      userForm.districtCode = String(selectedCenter.districtCode || "").toUpperCase();
    }
    if (selectedCenter.establishmentCode && !userForm.establishmentCode) {
      userForm.establishmentCode = String(selectedCenter.establishmentCode || "").toUpperCase();
    }
  }
);

onMounted(() => {
  tab.value = resolveTab(route.query.tab);

  if (isEmergencyResponder.value) {
    fetchEmergencyAlerts();
  }

  if (isRegulator.value) {
    fetchUsers();
    fetchPendingCenters();
    fetchRegions();
    fetchDistricts();
    fetchComplaints();
    fetchComplaintSummary();
  }
  if (isChef.value) {
    fetchComplaints();
    fetchComplaintSummary();
  }

  if (isChef.value) {
    return;
  }

  if (isEmergencyResponder.value) {
    startEmergencyAutoRefresh();
  }
});

onBeforeUnmount(() => {
  stopEmergencyAutoRefresh();
  if (map) {
    map.remove();
    map = null;
  }
  markersLayer = null;
  routeLine = null;
});

watch(nearbyCenters, redrawMap);
watch(nearbySearch, () => {
  redrawMap();
});
watch(allCenters, redrawMap);
watch(
  tab,
  async (value) => {
    if (value === "emergency-alerts" && isEmergencyResponder.value) {
      await fetchEmergencyAlerts();
    }
    if (value === "complaints" && canSeeComplaintsPanel.value) {
      await fetchComplaints();
      await fetchComplaintSummary();
    }
    if ((value === "my-center" || value === "settings" || value === "evaluations") && allCenters.value.length === 0) {
      await fetchAllCenters();
    }
    if (value === "settings" && isRegulator.value) {
      if (regions.value.length === 0) await fetchRegions();
      if (districts.value.length === 0) await fetchDistricts();
    }
    if (value === "evaluations" && canSeeComplaintsPanel.value) {
      await fetchComplaintSummary();
    }
    if (value !== "nearby" || isChef.value) return;
    await bootstrapNearbyIfNeeded();
    await nextTick();
    ensureMap();
    if (map) {
      map.invalidateSize();
      if (coords.value) {
        map.setView([coords.value.lat, coords.value.lon], 12);
      }
    }
    redrawMap();
  }
);
watch(
  () => route.query.tab,
  (value) => {
    tab.value = resolveTab(value);
  }
);
watch([isChef, isRegulator, isEmergencyResponder], () => {
  tab.value = resolveTab(route.query.tab);
  if (isRegulator.value) {
    fetchRegions();
    fetchDistricts();
  }
});
watch(isEmergencyResponder, (value) => {
  if (value) {
    startEmergencyAutoRefresh();
    return;
  }
  stopEmergencyAutoRefresh();
});
</script>
