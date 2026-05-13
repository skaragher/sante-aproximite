<template>
  <div class="um-root">

    <!-- ═══ Toolbar ═══ -->
    <div class="um-toolbar">
      <button class="um-create-btn" style="background:#179657;color:#fff;border:none;" @click="openCreate">👤 Nouvel utilisateur</button>
      <div class="um-searchbox">
        <span class="um-search-icon">🔍</span>
        <input v-model="localSearch" class="um-search" placeholder="Rechercher par nom ou email..." />
      </div>
    </div>

    <div v-if="localError" class="um-msg um-msg-err">{{ localError }}</div>
    <div v-if="localSuccess" class="um-msg um-msg-ok">{{ localSuccess }}</div>

    <!-- ═══ Onglets ═══ -->
    <div class="um-tabs">
      <button
        class="um-tab"
        :class="{ 'um-tab--active': activeTab === 'professional' }"
        @click="switchTab('professional')"
      >
        👔 Comptes professionnels
        <span class="um-tab-count">{{ professionalUsers.length }}</span>
      </button>
      <button
        v-if="canManagePublicAccounts"
        class="um-tab"
        :class="{ 'um-tab--active': activeTab === 'public' }"
        @click="switchTab('public')"
      >
        👤 Comptes publics
        <span class="um-tab-count">{{ publicUsers.length }}</span>
      </button>
    </div>

    <!-- ═══ Table ═══ -->
    <div class="um-table-wrap">
      <table class="um-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Statut</th>
            <th>Affectation</th>
            <th>Rôles</th>
            <th>Mot de passe</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in displayedUsers" :key="user.id">

            <td class="um-cell-name">{{ user.fullName }}</td>
            <td class="um-cell-email">{{ user.email }}</td>

            <td class="um-cell-status">
              <span class="um-badge" :class="user.isActive ? 'um-on' : 'um-off'">
                {{ user.isActive ? 'Actif' : 'Inactif' }}
              </span>
            </td>

            <td class="um-cell-scope">
              <div v-if="user.centerName" class="um-scope-line">
                <span class="um-chip um-chip-ste">Ste</span>
                <span class="um-scope-text">{{ user.centerName }}</span>
              </div>
              <div v-if="user.districtCode" class="um-scope-line">
                <span class="um-chip um-chip-dir">Dir</span>
                <span class="um-scope-text">{{ districtName(user.districtCode) }}</span>
              </div>
              <div v-else-if="user.regionCode" class="um-scope-line">
                <span class="um-chip um-chip-reg">Rég</span>
                <span class="um-scope-text">{{ regionName(user.regionCode) }}</span>
              </div>
              <span v-if="!user.centerName && !user.districtCode && !user.regionCode" class="um-scope-none">-</span>
            </td>

            <td class="um-cell-roles">
              <template v-if="isDevUser(user)">
                <div class="um-dev-roles-locked">
                  <span class="um-dev-role-badge">🔒 Developer</span>
                  <span class="um-dev-roles-hint">Rôles verrouillés</span>
                </div>
              </template>
              <template v-else>
                <div class="um-roles-wrap">
                  <!-- Badges des rôles actifs + bouton modifier -->
                  <div class="um-active-roles">
                    <span
                      v-for="r in getLocalRoles(user.id)"
                      :key="r"
                      class="um-role-badge"
                    >{{ visibleRoles.find(x => x.value === r)?.label || r }}</span>
                    <button
                      class="um-roles-edit-btn"
                      :class="{ active: expandedRolesId === user.id }"
                      @click="expandedRolesId = expandedRolesId === user.id ? null : user.id"
                      title="Modifier les rôles"
                    >✏</button>
                  </div>
                  <!-- Éditeur déroulant -->
                  <div v-if="expandedRolesId === user.id" class="um-roles-dropdown">
                    <div class="um-listbox">
                      <div
                        v-for="r in visibleRoles"
                        :key="r.value"
                        class="um-lb-row"
                        :class="{ 'um-lb-sel': getLocalRoles(user.id).includes(r.value) }"
                        @click="toggleRole(user.id, r.value, user)"
                      >{{ r.label }}</div>
                    </div>
                    <button class="um-save-roles-btn" @click="saveRoles(user); expandedRolesId = null">
                      💾 Enregistrer les rôles
                    </button>
                  </div>
                </div>
              </template>
            </td>

            <td class="um-cell-pwd">
              <template v-if="pwdUserId === user.id">
                <input
                  v-model="pwdValue"
                  type="text"
                  class="um-pwd-input"
                  placeholder="Nouveau mot de passe"
                  @keyup.enter="confirmPwd(user)"
                />
                <div class="um-pwd-row">
                  <button class="um-btn-xs um-ok" @click="confirmPwd(user)">✔</button>
                  <button class="um-btn-xs um-cancel" @click="cancelPwd">✕</button>
                </div>
              </template>
              <button v-else class="um-pwd-btn" style="background:#ffbf10;color:#2a2100;border:1px solid #e0a300;" @click="startPwd(user.id)">
                🔑 Réinitialiser le mot de passe
              </button>
            </td>

            <td class="um-cell-actions">
              <div class="um-actions-wrap">
                <button
                  class="um-btn um-actions-toggle"
                  :class="{ active: expandedUserId === user.id }"
                  @click="expandedUserId = expandedUserId === user.id ? null : user.id"
                >Actions ▾</button>
                <div v-if="expandedUserId === user.id" class="um-actions-dropdown">
                  <button class="um-drop-btn um-drop-edit" @click="startEdit(user); expandedUserId = null">✏ Modifier</button>
                  <template v-if="isDevUser(user)">
                    <button class="um-drop-btn" disabled>🔒 Developer protégé</button>
                  </template>
                  <template v-else>
                    <button class="um-drop-btn um-drop-toggle" @click="store.toggleUserActive(user); expandedUserId = null">
                      {{ user.isActive ? '🚫 Désactiver' : '✅ Activer' }}
                    </button>
                    <button v-if="canManageRights" class="um-drop-btn um-drop-rights" @click="openRights(user); expandedUserId = null">🛡 Gérer les droits</button>
                    <button v-if="canViewActions" class="um-drop-btn um-drop-actions" @click="openUserActions(user); expandedUserId = null">📋 Voir les actions</button>
                    <button class="um-drop-btn um-drop-del" @click="askDelete(user); expandedUserId = null">🗑 Supprimer</button>
                  </template>
                </div>
              </div>
            </td>

          </tr>
          <tr v-if="!displayedUsers.length">
            <td colspan="7" class="um-empty">Aucun utilisateur trouvé.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="tabPageCount > 1" class="um-pagination">
      <button class="um-pg-btn" :disabled="store.usersPage <= 1" @click="store.usersPage--">‹</button>
      <span class="um-pg-info">Page {{ store.usersPage }} / {{ tabPageCount }}</span>
      <button class="um-pg-btn" :disabled="store.usersPage >= tabPageCount" @click="store.usersPage++">›</button>
    </div>

    <!-- ═══ Modal droits ═══ -->
    <Teleport to="body">
      <div v-if="rightsUser" class="um-overlay" @click.self="rightsUser = null">
        <div class="um-modal">
          <h3 class="um-modal-h">🛡 Droits - {{ rightsUser.fullName }}</h3>
          <p class="um-modal-sub">Permissions spéciales au-delà du rôle standard.</p>
          <div class="um-rights-list">
            <label class="um-rights-row">
              <input type="checkbox" v-model="rightsForm.managePublicUsers" class="um-rights-check" />
              <div>
                <div class="um-rights-name">Gérer les utilisateurs publics</div>
                <div class="um-rights-desc">
                  Permet de voir, créer et modifier les comptes de type Utilisateur standard (USER)
                  même pour les niveaux non-NATIONAL.
                </div>
              </div>
            </label>
          </div>
          <div class="um-modal-foot">
            <button class="um-btn um-edit" @click="saveRights">Sauvegarder</button>
            <button class="um-btn" @click="rightsUser = null">Annuler</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Modal suppression ═══ -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="um-overlay" @click.self="deleteTarget = null">
        <div class="um-modal">
          <h3 class="um-modal-h">🗑 Confirmer la suppression</h3>
          <p>Supprimer <strong>{{ deleteTarget.fullName }}</strong> ({{ deleteTarget.email }}) ?</p>
          <p class="um-modal-warn">Cette action est irréversible.</p>
          <div class="um-modal-foot">
            <button class="um-btn um-del" @click="confirmDelete">Supprimer définitivement</button>
            <button class="um-btn" @click="deleteTarget = null">Annuler</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Modal création / modification ═══ -->
    <Teleport to="body">
      <div v-if="editMode" class="um-overlay" @click.self="editMode = false">
        <div class="um-modal um-modal-lg">
          <h3 class="um-modal-h">{{ editTarget ? '✏ Modifier l\'utilisateur' : '👤 Nouvel utilisateur' }}</h3>
          <form class="um-form" @submit.prevent="submitEdit">
            <div class="um-form-2col">
              <div class="um-form-row">
                <label>Nom complet *</label>
                <input v-model="editForm.fullName" required placeholder="Prénom Nom" />
              </div>
              <div class="um-form-row">
                <label>Email *</label>
                <input v-model="editForm.email" type="email" required placeholder="email@exemple.com" />
              </div>
              <div class="um-form-row" v-if="!editTarget">
                <label>Mot de passe *</label>
                <input v-model="editForm.password" type="password" required placeholder="Min. 8 caractères" />
              </div>
              <div class="um-form-row">
                <label>Rôle principal *</label>
                <select v-model="editForm.role">
                  <option v-for="r in visibleRoles" :key="r.value" :value="r.value">{{ r.label }}</option>
                </select>
              </div>
              <div class="um-form-row" v-if="editFormNeedsRegion">
                <label>Région</label>
                <select v-model="editForm.regionCode">
                  <option value="">-- Choisir une région --</option>
                  <option v-for="r in store.regions" :key="r.code" :value="r.code">{{ r.name }} ({{ r.code }})</option>
                </select>
              </div>
              <div class="um-form-row" v-if="editFormNeedsDistrict">
                <label>District</label>
                <select v-model="editForm.districtCode">
                  <option value="">-- Choisir un district --</option>
                  <option v-for="d in filteredDistricts" :key="d.code" :value="d.code">{{ d.name }} ({{ d.code }})</option>
                </select>
              </div>
              <div class="um-form-row" v-if="editFormNeedsCenter">
                <label>Centre de santé</label>
                <select v-model="editForm.centerId">
                  <option value="">-- Choisir un centre --</option>
                  <option v-for="c in store.allCenters" :key="c._id || c.id" :value="c._id || c.id">{{ c.name }}</option>
                </select>
              </div>
            </div>
            <div class="um-modal-foot">
              <button type="submit" class="um-btn um-edit">
                {{ editTarget ? 'Sauvegarder les modifications' : 'Créer l\'utilisateur' }}
              </button>
              <button type="button" class="um-btn" @click="editMode = false">Annuler</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Modal actions utilisateur ═══ -->
    <Teleport to="body">
      <div v-if="actionsUser" class="um-overlay" @click.self="actionsUser = null">
        <div class="um-modal um-modal-xl">
          <div class="um-actions-modal-header">
            <div>
              <h3 class="um-modal-h">📋 Actions - {{ actionsUser.fullName }}</h3>
              <p class="um-modal-sub">{{ actionsUser.email }}</p>
            </div>
            <button class="um-close-btn" @click="actionsUser = null">✕</button>
          </div>

          <div v-if="actionsLoading" class="um-actions-loading">Chargement...</div>

          <template v-else-if="actionsData">
            <!-- Résumé -->
            <div class="um-actions-summary">
              <div class="um-actions-stat">
                <span class="um-actions-stat-val">{{ actionsData.events.length }}</span>
                <span class="um-actions-stat-lbl">Événements app</span>
              </div>
              <div class="um-actions-stat">
                <span class="um-actions-stat-val">{{ actionsData.complaints.length }}</span>
                <span class="um-actions-stat-lbl">Plaintes</span>
              </div>
              <div class="um-actions-stat">
                <span class="um-actions-stat-val">{{ actionsData.emergencies.length }}</span>
                <span class="um-actions-stat-lbl">Urgences</span>
              </div>
              <div class="um-actions-stat">
                <span class="um-actions-stat-val">{{ actionsData.securityAlerts.length }}</span>
                <span class="um-actions-stat-lbl">Alertes sécu.</span>
              </div>
            </div>

            <!-- Onglets détail -->
            <div class="um-actions-tabs">
              <button
                v-for="tab in actionsTabs"
                :key="tab.key"
                class="um-actions-tab"
                :class="{ 'um-actions-tab--active': actionsTab === tab.key }"
                @click="actionsTab = tab.key"
              >{{ tab.label }} <span class="um-actions-tab-count">{{ tab.count }}</span></button>
            </div>

            <!-- Événements -->
            <div v-if="actionsTab === 'events'" class="um-actions-list">
              <div v-if="!actionsData.events.length" class="um-actions-empty">Aucun événement enregistré.</div>
              <div v-for="(ev, i) in actionsData.events" :key="i" class="um-actions-row">
                <div class="um-actions-row-left">
                  <span class="um-actions-module">{{ ev.module }}</span>
                  <span class="um-actions-action">{{ ev.action }}</span>
                </div>
                <span class="um-actions-time">{{ formatDate(ev.createdAt) }}</span>
              </div>
            </div>

            <!-- Plaintes -->
            <div v-if="actionsTab === 'complaints'" class="um-actions-list">
              <div v-if="!actionsData.complaints.length" class="um-actions-empty">Aucune plainte soumise.</div>
              <div v-for="c in actionsData.complaints" :key="c.id" class="um-actions-row">
                <div class="um-actions-row-left">
                  <span class="um-actions-subject">{{ c.subject || '(sans sujet)' }}</span>
                  <span class="um-actions-status-badge" :class="'um-st-' + c.status">{{ c.status }}</span>
                </div>
                <span class="um-actions-time">{{ formatDate(c.createdAt) }}</span>
              </div>
            </div>

            <!-- Urgences -->
            <div v-if="actionsTab === 'emergencies'" class="um-actions-list">
              <div v-if="!actionsData.emergencies.length" class="um-actions-empty">Aucun rapport d'urgence soumis.</div>
              <div v-for="e in actionsData.emergencies" :key="e.id" class="um-actions-row">
                <div class="um-actions-row-left">
                  <span class="um-actions-subject">{{ e.service || 'Service inconnu' }}</span>
                  <span class="um-actions-status-badge" :class="'um-st-' + e.status">{{ e.status }}</span>
                </div>
                <span class="um-actions-time">{{ formatDate(e.createdAt) }}</span>
              </div>
            </div>

            <!-- Alertes sécurité -->
            <div v-if="actionsTab === 'security'" class="um-actions-list">
              <div v-if="!actionsData.securityAlerts.length" class="um-actions-empty">Aucune alerte de sécurité soumise.</div>
              <div v-for="a in actionsData.securityAlerts" :key="a.id" class="um-actions-row">
                <div class="um-actions-row-left">
                  <span class="um-actions-subject">{{ a.type || a.service || 'Alerte' }}</span>
                  <span class="um-actions-status-badge" :class="'um-st-' + a.status">{{ a.status }}</span>
                </div>
                <span class="um-actions-time">{{ formatDate(a.createdAt) }}</span>
              </div>
            </div>
          </template>

          <div class="um-modal-foot">
            <button class="um-btn" @click="actionsUser = null">Fermer</button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useDashboardStore } from "../../stores/dashboard";
import { useAuthStore } from "../../stores/auth";
import { apiFetch } from "../../api/client";

const store = useDashboardStore();
const auth = useAuthStore();

// ─── Messages ─────────────────────────────────────────────────────────────────
const localError = ref("");
const localSuccess = ref("");
const expandedUserId = ref(null);
const expandedRolesId = ref(null);

function regionName(code) {
  if (!code) return code;
  const match = store.regions?.find(r => String(r.code).toUpperCase() === String(code).toUpperCase());
  return match?.name || code;
}
function districtName(code) {
  if (!code) return code;
  const match = store.districts?.find(d => String(d.code).toUpperCase() === String(code).toUpperCase());
  return match?.name || code;
}
function showErr(msg) { localError.value = msg; setTimeout(() => { localError.value = ""; }, 4500); }
function showOk(msg) { localSuccess.value = msg; setTimeout(() => { localSuccess.value = ""; }, 3000); }

// ─── Onglets pro / public ─────────────────────────────────────────────────────
const activeTab = ref("professional");

const isPublicUser = (u) => {
  const roles = Array.isArray(u.roles) ? u.roles : [u.role];
  return roles.every((r) => !r || r === "USER" || r === "MANAGE_PUBLIC_USERS");
};

const professionalUsers = computed(() => store.users.filter((u) => !isPublicUser(u)));
const publicUsers       = computed(() => store.users.filter((u) =>  isPublicUser(u)));

function switchTab(tab) {
  activeTab.value = tab;
  store.usersPage = 1;
}

// ─── Search ───────────────────────────────────────────────────────────────────
const localSearch = ref("");
const displayedUsers = computed(() => {
  const q = localSearch.value.trim().toLowerCase();
  const base = activeTab.value === "public" ? publicUsers.value : professionalUsers.value;
  const source = q
    ? base.filter((u) =>
        String(u.fullName || "").toLowerCase().includes(q) ||
        String(u.email || "").toLowerCase().includes(q)
      )
    : base;
  // pagination manuelle sur la liste filtrée par onglet
  const page = store.usersPage || 1;
  const size = 20;
  return source.slice((page - 1) * size, page * size);
});

const tabPageCount = computed(() => {
  const base = activeTab.value === "public" ? publicUsers.value : professionalUsers.value;
  return Math.max(1, Math.ceil(base.length / 20));
});

// ─── Role definitions ──────────────────────────────────────────────────────────
const ALL_ROLES = [
  { value: "DEVELOPER",      label: "Developer" },
  { value: "NATIONAL",       label: "National" },
  { value: "REGULATOR",      label: "Régulateur" },
  { value: "REGION",         label: "Région" },
  { value: "DISTRICT",       label: "District" },
  { value: "ETABLISSEMENT",  label: "Etablissement" },
  { value: "SAMU",           label: "SAMU" },
  { value: "SAPEUR_POMPIER", label: "Sapeur-Pompier" },
  { value: "POLICE",         label: "Police" },
  { value: "GENDARMERIE",    label: "Gendarmerie" },
  { value: "PROTECTION_CIVILE", label: "Protection Civile" },
  { value: "USER",           label: "Utilisateur public" },
];

const ROLE_PRIORITY = [
  "DEVELOPER","NATIONAL","REGULATOR","REGION","DISTRICT","ETABLISSEMENT","CHEF_ETABLISSEMENT","SAMU","SAPEUR_POMPIER"
];
const CREATABLE_MAP = {
  DEVELOPER:         null,
  NATIONAL:          null,
  REGULATOR:         ["REGULATOR","REGION","DISTRICT","ETABLISSEMENT","SAMU","SAPEUR_POMPIER"],
  REGION:            ["DISTRICT","ETABLISSEMENT","SAMU","SAPEUR_POMPIER"],
  DISTRICT:          ["ETABLISSEMENT","SAMU","SAPEUR_POMPIER"],
  ETABLISSEMENT:     ["ETABLISSEMENT"],
  CHEF_ETABLISSEMENT:["ETABLISSEMENT"],
  SAMU:              ["SAMU"],
  SAPEUR_POMPIER:    ["SAPEUR_POMPIER"],
};

const myLevel = computed(() => ROLE_PRIORITY.find((r) => store.authRoles.includes(r)) || "USER");
const isDevUser = (user) => (Array.isArray(user.roles) ? user.roles : [user.role]).includes("DEVELOPER");
const canManagePublicUsers = computed(() => store.authRoles.includes("MANAGE_PUBLIC_USERS"));
const canManagePublicAccounts = computed(() =>
  ["DEVELOPER", "NATIONAL"].includes(myLevel.value) || canManagePublicUsers.value
);
const canManageRights = computed(() => ["DEVELOPER","NATIONAL","REGULATOR"].includes(myLevel.value));
const visibleRoles = computed(() => {
  const allowed = CREATABLE_MAP[myLevel.value];
  let visible = !allowed ? [...ALL_ROLES] : ALL_ROLES.filter((r) => allowed.includes(r.value));
  // DEVELOPER role visible and assignable only by another DEVELOPER
  if (myLevel.value !== "DEVELOPER") {
    visible = visible.filter((r) => r.value !== "DEVELOPER");
  }
  if (!canManagePublicAccounts.value) {
    visible = visible.filter((r) => r.value !== "USER");
  } else if (!visible.some((r) => r.value === "USER")) {
    visible.push(ALL_ROLES.find((r) => r.value === "USER"));
  }
  return visible.filter(Boolean);
});

// ─── Local roles map (per-user, pending save) ──────────────────────────────────
const localRolesMap = reactive({});

watch(() => store.users, (users) => {
  for (const u of users) {
    localRolesMap[u.id] = [
      ...(Array.isArray(u.roles) ? u.roles : [u.role]).filter(Boolean)
    ];
  }
}, { immediate: true });

function getLocalRoles(userId) {
  return localRolesMap[userId] || [];
}

function toggleRole(userId, roleValue, user) {
  if (isDevUser(user)) return;
  if (!localRolesMap[userId]) {
    localRolesMap[userId] = [
      ...(Array.isArray(user.roles) ? user.roles : [user.role]).filter(Boolean)
    ];
  }
  const idx = localRolesMap[userId].indexOf(roleValue);
  if (idx >= 0) localRolesMap[userId].splice(idx, 1);
  else localRolesMap[userId].push(roleValue);
}

async function saveRoles(user) {
  if (isDevUser(user)) { showErr("Les rôles d'un compte Developer sont verrouillés."); return; }
  localError.value = "";
  try {
    const roles = getLocalRoles(user.id).filter((r) => r !== "MANAGE_PUBLIC_USERS");
    if (!roles.length) { showErr("Sélectionnez au moins un rôle."); return; }
    if (roles.includes("USER") && !canManagePublicAccounts.value) {
      showErr("Vous devez disposer du droit de gestion des utilisateurs publics pour créer ou modifier un compte USER.");
      return;
    }
    await apiFetch(`/users/${user.id}`, {
      token: auth.state.token, method: "PATCH", body: { roles },
    });
    showOk(`Rôles de ${user.fullName} mis à jour`);
    await store.fetchUsers();
  } catch (err) {
    showErr(err.message);
  }
}

// ─── Password reset ────────────────────────────────────────────────────────────
const pwdUserId = ref(null);
const pwdValue = ref("");

function startPwd(userId) { pwdUserId.value = userId; pwdValue.value = ""; }
function cancelPwd() { pwdUserId.value = null; pwdValue.value = ""; }

async function confirmPwd(user) {
  if (!pwdValue.value.trim()) return;
  localError.value = "";
  try {
    await apiFetch(`/users/${user.id}`, {
      token: auth.state.token, method: "PATCH",
      body: { password: pwdValue.value.trim() },
    });
    showOk(`Mot de passe réinitialisé pour ${user.fullName}`);
    cancelPwd();
  } catch (err) {
    showErr(err.message);
  }
}

// ─── Gérer les droits (MANAGE_PUBLIC_USERS) ───────────────────────────────────
const rightsUser = ref(null);
const rightsForm = reactive({ managePublicUsers: false });

function openRights(user) {
  rightsUser.value = user;
  rightsForm.managePublicUsers = (Array.isArray(user.roles) ? user.roles : []).includes("MANAGE_PUBLIC_USERS");
}

async function saveRights() {
  if (!rightsUser.value) return;
  const user = rightsUser.value;
  const baseRoles = (Array.isArray(user.roles) ? user.roles : [user.role])
    .filter((r) => r && r !== "MANAGE_PUBLIC_USERS");
  const newRoles = rightsForm.managePublicUsers
    ? [...baseRoles, "MANAGE_PUBLIC_USERS"]
    : baseRoles;
  localError.value = "";
  try {
    await apiFetch(`/users/${user.id}`, {
      token: auth.state.token, method: "PATCH", body: { roles: newRoles },
    });
    showOk(`Droits de ${user.fullName} mis à jour`);
    rightsUser.value = null;
    await store.fetchUsers();
  } catch (err) {
    showErr(err.message);
  }
}

// ─── Suppression ──────────────────────────────────────────────────────────────
const deleteTarget = ref(null);
function askDelete(user) { deleteTarget.value = user; }
async function confirmDelete() {
  if (!deleteTarget.value) return;
  localError.value = "";
  try {
    await store.deleteUser(deleteTarget.value.id);
    showOk("Utilisateur supprimé");
    deleteTarget.value = null;
  } catch (err) {
    showErr(err.message);
    deleteTarget.value = null;
  }
}

// ─── Création / Modification ──────────────────────────────────────────────────
const editMode = ref(false);
const editTarget = ref(null);
const editForm = reactive({
  fullName: "", email: "", password: "",
  role: "", regionCode: "", districtCode: "", centerId: "",
});

const editFormNeedsRegion = computed(() =>
  ["REGION","DISTRICT","ETABLISSEMENT","SAMU","SAPEUR_POMPIER"].includes(editForm.role)
);
const editFormNeedsDistrict = computed(() =>
  ["DISTRICT","ETABLISSEMENT"].includes(editForm.role)
);
const editFormNeedsCenter = computed(() => editForm.role === "ETABLISSEMENT");

const filteredDistricts = computed(() => {
  const region = String(editForm.regionCode || "").trim().toUpperCase();
  if (!region || !store.districts?.length) return store.districts || [];
  return store.districts.filter((d) =>
    String(d.regionCode || "").toUpperCase() === region
  );
});

function openCreate() {
  editTarget.value = null;
  const defaultRole = activeTab.value === "public"
    ? "USER"
    : (visibleRoles.value.find((r) => r.value !== "USER")?.value || visibleRoles.value[0]?.value || "USER");
  Object.assign(editForm, {
    fullName: "", email: "", password: "",
    role: defaultRole,
    regionCode: "", districtCode: "", centerId: "",
  });
  editMode.value = true;
}

function startEdit(user) {
  editTarget.value = user;
  Object.assign(editForm, {
    fullName: user.fullName || "",
    email: user.email || "",
    password: "",
    role: user.role || visibleRoles.value[0]?.value || "USER",
    regionCode: user.regionCode || "",
    districtCode: user.districtCode || "",
    centerId: user.centerId || "",
  });
  editMode.value = true;
}

async function submitEdit() {
  localError.value = "";
  try {
    if (editForm.role === "USER" && !canManagePublicAccounts.value) {
      showErr("Vous devez disposer du droit de gestion des utilisateurs publics pour créer ou modifier un compte USER.");
      return;
    }
    const body = {
      fullName: editForm.fullName,
      email: editForm.email,
      role: editForm.role,
      roles: [editForm.role],
      regionCode: editForm.regionCode || null,
      districtCode: editForm.districtCode || null,
      centerId: editForm.centerId || null,
    };
    if (editForm.password) body.password = editForm.password;

    if (editTarget.value) {
      await apiFetch(`/users/${editTarget.value.id}`, {
        token: auth.state.token, method: "PATCH", body,
      });
      showOk(`Utilisateur ${editForm.fullName} modifié`);
    } else {
      await apiFetch("/users", {
        token: auth.state.token, method: "POST", body,
      });
      showOk(`Utilisateur ${editForm.fullName} créé`);
    }
    editMode.value = false;
    await store.fetchUsers();
  } catch (err) {
    showErr(err.message);
  }
}

// ─── Actions utilisateur ──────────────────────────────────────────────────────
const actionsUser = ref(null);
const actionsData = ref(null);
const actionsLoading = ref(false);
const actionsTab = ref("events");

const canViewActions = computed(() => ["DEVELOPER", "NATIONAL", "REGULATOR"].includes(myLevel.value));

const actionsTabs = computed(() => [
  { key: "events",      label: "Événements",    count: actionsData.value?.events.length ?? 0 },
  { key: "complaints",  label: "Plaintes",      count: actionsData.value?.complaints.length ?? 0 },
  { key: "emergencies", label: "Urgences",      count: actionsData.value?.emergencies.length ?? 0 },
  { key: "security",    label: "Alertes sécu.", count: actionsData.value?.securityAlerts.length ?? 0 },
]);

async function openUserActions(user) {
  actionsUser.value = user;
  actionsTab.value = "events";
  actionsData.value = null;
  actionsLoading.value = true;
  try {
    actionsData.value = await apiFetch(`/analytics/user/${user.id}`, { token: auth.state.token });
  } catch (err) {
    showErr(err.message);
    actionsUser.value = null;
  } finally {
    actionsLoading.value = false;
  }
}

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
    + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

onMounted(async () => {
  if (store.users.length === 0) await store.fetchUsers();
  if (store.regions.length === 0) await store.fetchRegions();
  if (store.districts.length === 0) await store.fetchDistricts();
  if (store.allCenters.length === 0) await store.fetchAllCenters();
});
</script>

<style scoped>
.um-root {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 0 0;
  --um-green: #179657;
  --um-green-dark: #127746;
  --um-yellow: #ffbf10;
  --um-yellow-dark: #e0a300;
  --um-purple: #7c3aed;
  --um-purple-dark: #6d28d9;
  --um-red: #e33445;
  --um-red-dark: #c82333;
  --um-gray: #f3f4f6;
  --um-gray-dark: #d1d5db;
  --um-gray-text: #6b7280;
  --um-text-dark: #1f2937;
}

/* Toolbar */
.um-toolbar { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.um-create-btn {
  background: var(--um-green); color: #fff; border: none;
  border-radius: 8px; padding: 9px 20px; font-weight: 700;
  font-size: 0.88rem; cursor: pointer; white-space: nowrap;
}
.um-create-btn:hover { background: var(--um-green-dark); }
.um-searchbox {
  display: flex; align-items: center; gap: 8px;
  background: #fff; border: 1px solid #d6d9df; border-radius: 4px;
  padding: 6px 10px; flex: 1; max-width: 338px;
  box-shadow: inset 0 1px 1px rgba(0,0,0,.03);
}
.um-search-icon { color: #94a3b8; }
.um-search { border: none; outline: none; font-size: 0.88rem; width: 100%; background: transparent; }

/* Messages */
.um-msg { padding: 10px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; }
.um-msg-err { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
.um-msg-ok  { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }

/* Tabs */
.um-tabs {
  display: flex;
  gap: 6px;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 12px;
}

.um-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  font-size: 0.88rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  margin-bottom: -2px;
  border-radius: 6px 6px 0 0;
  transition: color .15s, border-color .15s;
}

.um-tab:hover { color: #111827; background: #f9fafb; }

.um-tab--active {
  color: #1d4ed8;
  border-bottom-color: #1d4ed8;
  background: #eff6ff;
}

.um-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  background: #e5e7eb;
  color: #374151;
}

.um-tab--active .um-tab-count {
  background: #bfdbfe;
  color: #1e40af;
}

.um-heading { font-size: 1rem; font-weight: 700; color: #111827; margin: 4px 0 0; }

/* Table */
.um-table-wrap {
  background: #fff; border-radius: 0; overflow-x: auto;
  box-shadow: none; border: 1px solid #d9dde4;
}
.um-table { width: 100%; border-collapse: collapse; min-width: 980px; }
.um-table thead th {
  padding: 10px 8px; background: #fff; border: 1px solid #d9dde4;
  font-size: 0.82rem; font-weight: 700; color: #111827;
  text-align: left; white-space: nowrap;
}
.um-table tbody tr { border-bottom: 1px solid #e5e7eb; transition: background .12s; }
.um-table tbody tr:last-child { border-bottom: none; }
.um-table tbody tr:hover { background: #fff; }
.um-table td {
  padding: 10px 8px;
  vertical-align: middle;
  border: 1px solid #e1e5eb;
  background: #fff;
 }

/* Cells */
.um-cell-name  { font-weight: 700; color: #111827; min-width: 120px; white-space: nowrap; }
.um-cell-email { color: #475569; font-size: 0.84rem; min-width: 160px; }
.um-cell-status { white-space: nowrap; }
.um-cell-scope { font-size: 0.8rem; min-width: 170px; }
.um-cell-roles { min-width: 140px; }
.um-roles-wrap { position: relative; }
.um-active-roles { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.um-role-badge {
  background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE;
  border-radius: 20px; padding: 2px 8px; font-size: 0.72rem; font-weight: 700;
}
.um-roles-edit-btn {
  background: #F1F5F9; color: #64748B; border: 1px solid #CBD5E1;
  border-radius: 6px; padding: 2px 7px; font-size: 0.75rem;
  cursor: pointer; flex-shrink: 0;
}
.um-roles-edit-btn.active { background: #EFF6FF; border-color: #1A56DB; color: #1A56DB; }
.um-roles-dropdown {
  position: absolute; left: 0; top: calc(100% + 4px); z-index: 200;
  background: #fff; border: 1px solid #E2E8F0; border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,.14);
  padding: 8px; min-width: 200px;
}
.um-cell-pwd   { min-width: 185px; }
.um-cell-actions { min-width: 120px; }
.um-actions-wrap { position: relative; display: inline-block; }
.um-actions-toggle {
  background: #1A56DB; color: #fff; border: none;
  border-radius: 8px; padding: 6px 12px;
  font-size: 0.8rem; font-weight: 700; cursor: pointer; white-space: nowrap;
}
.um-actions-toggle.active { background: #1337A4; }
.um-actions-dropdown {
  position: absolute; right: 0; top: calc(100% + 4px); z-index: 200;
  background: #fff; border: 1px solid #E2E8F0; border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,.14);
  display: flex; flex-direction: column; gap: 2px;
  padding: 6px; min-width: 170px;
}
.um-drop-btn {
  text-align: left; border: none; background: transparent;
  border-radius: 8px; padding: 8px 12px; font-size: 0.82rem;
  font-weight: 600; cursor: pointer; white-space: nowrap; width: 100%;
  transition: background .1s;
}
.um-drop-btn:hover:not(:disabled) { background: #F1F5F9; }
.um-drop-btn:disabled { opacity: 0.5; cursor: default; }
.um-drop-edit   { color: #92400E; background: #FFFBEB; }
.um-drop-edit:hover { background: #FEF3C7; }
.um-drop-toggle { color: #374151; }
.um-drop-rights { color: #5B21B6; }
.um-drop-rights:hover { background: #F5F3FF; }
.um-drop-del    { color: #DC2626; }
.um-drop-del:hover { background: #FEF2F2; }

/* Status badge */
.um-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
.um-on  { background: #159669; color: #fff; border: 1px solid #159669; }
.um-off { background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; }

/* Affectation chips */
.um-scope-line { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.um-chip { display: inline-block; padding: 1px 6px; border-radius: 8px; font-size: 0.62rem; font-weight: 700; line-height: 1.2; }
.um-chip-ste { background: #6b7280; color: #fff; }
.um-chip-dir { background: #fff; color: #111827; border: 1px solid #d1d5db; }
.um-chip-reg { background: #eef2ff; color: #3730a3; }
.um-scope-text { font-size: 0.79rem; color: #1f2937; }
.um-scope-none { color: #94a3b8; font-size: 0.8rem; }

/* Role listbox */
.um-listbox {
  border: 1px solid #d1d5db; border-radius: 2px;
  overflow-y: auto; max-height: 96px; background: #fff; margin-bottom: 6px;
}
.um-lb-row {
  padding: 2px 8px; font-size: 0.8rem; cursor: pointer;
  border-bottom: none; user-select: none;
}
.um-lb-row:last-child { border-bottom: none; }
.um-lb-row:hover { background: #f3f4f6; }
.um-lb-sel { background: #808080 !important; color: #fff; font-weight: 600; }
.um-dev-roles-locked {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 6px 10px;
  background: #f1f5f9;
  border: 1.5px dashed #cbd5e1;
  border-radius: 6px;
}
.um-dev-role-badge { font-size: 0.78rem; font-weight: 700; color: #475569; }
.um-dev-roles-hint { font-size: 0.7rem; color: #94a3b8; font-style: italic; }

.um-save-roles-btn {
  width: 100%; background: #ffffff; border: 1px solid #3b82f6;
  color: #2563eb; border-radius: 4px; padding: 5px 10px;
  font-size: 0.78rem; font-weight: 600; cursor: pointer;
}
.um-save-roles-btn:hover { background: #eff6ff; }

/* Password */
.um-pwd-btn {
  width: 100%; background: var(--um-yellow); border: 1px solid var(--um-yellow-dark);
  color: #2a2100; border-radius: 4px; padding: 6px 10px;
  font-size: 0.78rem; font-weight: 600; cursor: pointer;
}
.um-pwd-btn:hover { background: #f5b301; }
.um-pwd-input {
  border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px;
  font-size: 0.8rem; width: 100%; box-sizing: border-box; margin-bottom: 4px;
}
.um-pwd-row { display: flex; gap: 4px; }
.um-btn-xs { border-radius: 4px; border: none; padding: 4px 12px; cursor: pointer; font-weight: 700; font-size: 0.78rem; }
.um-ok     { background: #22c55e; color: #fff; }
.um-cancel { background: #f1f5f9; color: #475569; }

/* Action buttons */
.um-btn {
  display: block; width: 100%; margin-bottom: 4px; padding: 6px 10px;
  border-radius: 4px; border: 1px solid transparent; cursor: pointer;
  font-size: 0.78rem; font-weight: 700; text-align: center;
  background: #ffffff; color: #475569; border-color: #cbd5e1;
}
.um-btn:last-child { margin-bottom: 0; }
.um-edit   { background: var(--um-yellow); border-color: var(--um-yellow-dark); color: #2b2110; }
.um-edit:hover { background: #f5b301; }
.um-toggle { background: #f8f9fb; border-color: #9ca3af; color: #6b7280; }
.um-toggle:hover { background: #eef2f7; }
.um-rights { background: var(--um-purple); border-color: var(--um-purple-dark); color: #fff; }
.um-rights:hover { background: var(--um-purple-dark); }
.um-del    { background: var(--um-red); border-color: var(--um-red-dark); color: #fff; }
.um-del:hover { background: var(--um-red-dark); }
.um-dev-protected { background: #f1f5f9; border-color: #cbd5e1; color: #94a3b8; cursor: not-allowed; opacity: .8; }
.um-dev-protected:hover { background: #f1f5f9; }

/* Pagination */
.um-pagination { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 8px; }
.um-pg-btn { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 14px; cursor: pointer; font-weight: 700; }
.um-pg-btn:disabled { opacity: .4; cursor: default; }
.um-pg-info { font-size: 0.84rem; color: #64748b; }

/* Empty */
.um-empty { text-align: center; color: #94a3b8; padding: 32px; font-size: 0.9rem; }

/* Overlay / Modal */
.um-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; backdrop-filter: blur(3px);
}
.um-modal {
  background: #fff; border-radius: 16px; padding: 28px 32px;
  width: 100%; max-width: 480px; box-shadow: 0 24px 64px rgba(0,0,0,.22);
  max-height: 90vh; overflow-y: auto;
}
.um-modal-lg { max-width: 580px; }
.um-modal-h   { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
.um-modal-sub { font-size: 0.83rem; color: #64748b; margin: 0 0 18px; }
.um-modal-warn { color: #dc2626; font-size: 0.83rem; margin-top: 6px; }
.um-modal-foot { display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
.um-modal-foot .um-btn { width: auto; }

/* Rights */
.um-rights-list { display: flex; flex-direction: column; gap: 10px; }
.um-rights-row {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer;
}
.um-rights-row:hover { background: #f8fafc; }
.um-rights-check { margin-top: 3px; width: 16px; height: 16px; flex-shrink: 0; accent-color: #7c3aed; }
.um-rights-name { font-weight: 700; font-size: 0.88rem; color: #1e293b; }
.um-rights-desc { font-size: 0.78rem; color: #64748b; margin-top: 2px; line-height: 1.4; }

/* Form */
.um-form { display: flex; flex-direction: column; gap: 14px; }
.um-form-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.um-form-row { display: flex; flex-direction: column; gap: 4px; }
.um-form-row label { font-size: 0.82rem; font-weight: 600; color: #475569; }
.um-form-row input,
.um-form-row select {
  border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px;
  font-size: 0.88rem; background: #fff; outline: none;
}
.um-form-row input:focus,
.um-form-row select:focus { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(147,197,253,.25); }

/* Actions dropdown button */
.um-drop-actions { color: #0e7490; }
.um-drop-actions:hover { background: #ecfeff; }

/* Actions modal */
.um-modal-xl { max-width: 680px; }
.um-actions-modal-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 16px;
}
.um-close-btn {
  background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 4px 10px; font-size: 0.9rem; cursor: pointer; color: #64748b;
  flex-shrink: 0;
}
.um-close-btn:hover { background: #e2e8f0; }

.um-actions-loading { text-align: center; padding: 24px; color: #64748b; font-size: 0.88rem; }

.um-actions-summary {
  display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap;
}
.um-actions-stat {
  flex: 1; min-width: 100px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
  padding: 12px 14px; display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.um-actions-stat-val { font-size: 1.4rem; font-weight: 800; color: #1e293b; }
.um-actions-stat-lbl { font-size: 0.7rem; color: #64748b; font-weight: 600; text-align: center; }

.um-actions-tabs {
  display: flex; gap: 4px; border-bottom: 2px solid #e5e7eb; margin-bottom: 12px;
}
.um-actions-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; border: none; border-bottom: 2px solid transparent;
  background: transparent; font-size: 0.82rem; font-weight: 600;
  color: #6b7280; cursor: pointer; margin-bottom: -2px;
  border-radius: 6px 6px 0 0; transition: color .15s, border-color .15s;
}
.um-actions-tab:hover { color: #111827; background: #f9fafb; }
.um-actions-tab--active { color: #0e7490; border-bottom-color: #0e7490; background: #ecfeff; }
.um-actions-tab-count {
  background: #e5e7eb; color: #374151; border-radius: 999px;
  padding: 0 6px; font-size: 0.68rem; font-weight: 700;
}
.um-actions-tab--active .um-actions-tab-count { background: #cffafe; color: #0e7490; }

.um-actions-list { max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.um-actions-empty { text-align: center; color: #94a3b8; padding: 24px; font-size: 0.85rem; }
.um-actions-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 10px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0;
  gap: 10px;
}
.um-actions-row:hover { background: #f1f5f9; }
.um-actions-row-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }
.um-actions-module {
  background: #dbeafe; color: #1d4ed8; border-radius: 20px;
  padding: 1px 8px; font-size: 0.68rem; font-weight: 700; white-space: nowrap;
}
.um-actions-action { font-size: 0.82rem; color: #1e293b; font-weight: 600; }
.um-actions-subject { font-size: 0.82rem; color: #1e293b; font-weight: 600; word-break: break-word; }
.um-actions-time { font-size: 0.72rem; color: #94a3b8; white-space: nowrap; flex-shrink: 0; }

/* Status badges dans la modal */
.um-actions-status-badge {
  border-radius: 20px; padding: 1px 8px; font-size: 0.68rem; font-weight: 700; white-space: nowrap;
}
.um-st-NEW          { background: #dbeafe; color: #1d4ed8; }
.um-st-IN_PROGRESS  { background: #fef9c3; color: #854d0e; }
.um-st-ACKNOWLEDGED { background: #fef9c3; color: #854d0e; }
.um-st-EN_ROUTE     { background: #ede9fe; color: #6d28d9; }
.um-st-ON_SITE      { background: #ede9fe; color: #6d28d9; }
.um-st-RESOLVED     { background: #dcfce7; color: #15803d; }
.um-st-COMPLETED    { background: #dcfce7; color: #15803d; }
.um-st-CLOSED       { background: #f1f5f9; color: #475569; }
.um-st-REJECTED     { background: #fee2e2; color: #b91c1c; }

@media (max-width: 640px) {
  .um-toolbar {
    align-items: stretch;
  }

  .um-create-btn,
  .um-searchbox {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .um-form-2col { grid-template-columns: 1fr; }

  .um-table {
    min-width: 0;
  }

  .um-table thead {
    display: none;
  }

  .um-table,
  .um-table tbody,
  .um-table tr,
  .um-table td {
    display: block;
    width: 100%;
    box-sizing: border-box;
  }

  .um-table tr {
    border-bottom: 1px solid #d9dde4;
    padding: 10px 0;
  }

  .um-table td {
    border: 0;
    padding: 6px 0;
  }

  .um-cell-name,
  .um-cell-email,
  .um-cell-status,
  .um-cell-scope,
  .um-cell-roles,
  .um-cell-pwd,
  .um-cell-actions {
    min-width: 0;
  }

  .um-btn,
  .um-pwd-btn,
  .um-save-roles-btn {
    width: 100%;
  }
}
</style>
