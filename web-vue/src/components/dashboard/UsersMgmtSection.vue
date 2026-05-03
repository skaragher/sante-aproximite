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

    <h3 class="um-heading">Liste des utilisateurs</h3>

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
                <span class="um-scope-text">{{ user.districtCode }}</span>
              </div>
              <div v-else-if="user.regionCode" class="um-scope-line">
                <span class="um-chip um-chip-reg">Rég</span>
                <span class="um-scope-text">{{ user.regionCode }}</span>
              </div>
              <span v-if="!user.centerName && !user.districtCode && !user.regionCode" class="um-scope-none">—</span>
            </td>

            <td class="um-cell-roles">
              <div class="um-listbox">
                <div
                  v-for="r in visibleRoles"
                  :key="r.value"
                  class="um-lb-row"
                  :class="{ 'um-lb-sel': getLocalRoles(user.id).includes(r.value) }"
                  @click="toggleRole(user.id, r.value, user)"
                >{{ r.label }}</div>
              </div>
              <button class="um-save-roles-btn" style="background:#fff;color:#2563eb;border:1px solid #3b82f6;" @click="saveRoles(user)">
                💾 Enregistrer les rôles
              </button>
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
              <button class="um-btn um-edit" style="background:#ffbf10;color:#2b2110;border:1px solid #e0a300;" @click="startEdit(user)">✏ Modifier</button>
              <button class="um-btn um-toggle" style="background:#f8f9fb;color:#6b7280;border:1px solid #9ca3af;" @click="store.toggleUserActive(user)">
                {{ user.isActive ? '🚫 Désactiver' : '✅ Activer' }}
              </button>
              <button v-if="canManageRights" class="um-btn um-rights" style="background:#7c3aed;color:#fff;border:1px solid #6d28d9;" @click="openRights(user)">🛡 Gérer les droits</button>
              <button class="um-btn um-del" style="background:#e33445;color:#fff;border:1px solid #c82333;" @click="askDelete(user)">🗑 Supprimer</button>
            </td>

          </tr>
          <tr v-if="!displayedUsers.length">
            <td colspan="7" class="um-empty">Aucun utilisateur trouvé.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="store.usersPageCount > 1" class="um-pagination">
      <button class="um-pg-btn" :disabled="store.usersPage <= 1" @click="store.usersPage--">‹</button>
      <span class="um-pg-info">Page {{ store.usersPage }} / {{ store.usersPageCount }}</span>
      <button class="um-pg-btn" :disabled="store.usersPage >= store.usersPageCount" @click="store.usersPage++">›</button>
    </div>

    <!-- ═══ Modal droits ═══ -->
    <Teleport to="body">
      <div v-if="rightsUser" class="um-overlay" @click.self="rightsUser = null">
        <div class="um-modal">
          <h3 class="um-modal-h">🛡 Droits — {{ rightsUser.fullName }}</h3>
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
function showErr(msg) { localError.value = msg; setTimeout(() => { localError.value = ""; }, 4500); }
function showOk(msg) { localSuccess.value = msg; setTimeout(() => { localSuccess.value = ""; }, 3000); }

// ─── Search ───────────────────────────────────────────────────────────────────
const localSearch = ref("");
const displayedUsers = computed(() => {
  const q = localSearch.value.trim().toLowerCase();
  const source = store.paginatedUsers || store.users;
  if (!q) return source;
  return store.users.filter((u) =>
    String(u.fullName || "").toLowerCase().includes(q) ||
    String(u.email || "").toLowerCase().includes(q)
  );
});

// ─── Role definitions ──────────────────────────────────────────────────────────
const ALL_ROLES = [
  { value: "NATIONAL",       label: "National" },
  { value: "REGULATOR",      label: "Régulateur" },
  { value: "REGION",         label: "Région" },
  { value: "DISTRICT",       label: "District" },
  { value: "ETABLISSEMENT",  label: "Etablissement" },
  { value: "SAMU",           label: "SAMU" },
  { value: "SAPEUR_POMPIER", label: "Sapeur-Pompier" },
  { value: "USER",           label: "Utilisateur public" },
];

const ROLE_PRIORITY = [
  "NATIONAL","REGULATOR","REGION","DISTRICT","ETABLISSEMENT","CHEF_ETABLISSEMENT","SAMU","SAPEUR_POMPIER"
];
const CREATABLE_MAP = {
  NATIONAL:          null,
  REGULATOR:         ["REGULATOR","REGION","DISTRICT","ETABLISSEMENT","SAMU","SAPEUR_POMPIER","USER"],
  REGION:            ["DISTRICT","ETABLISSEMENT","SAMU","SAPEUR_POMPIER"],
  DISTRICT:          ["ETABLISSEMENT","SAMU","SAPEUR_POMPIER"],
  ETABLISSEMENT:     ["ETABLISSEMENT"],
  CHEF_ETABLISSEMENT:["ETABLISSEMENT"],
  SAMU:              ["SAMU"],
  SAPEUR_POMPIER:    ["SAPEUR_POMPIER"],
};

const myLevel = computed(() => ROLE_PRIORITY.find((r) => store.authRoles.includes(r)) || "USER");
const canManagePublicUsers = computed(() => store.authRoles.includes("MANAGE_PUBLIC_USERS"));
const canManageRights = computed(() => ["NATIONAL","REGULATOR"].includes(myLevel.value));
const visibleRoles = computed(() => {
  const allowed = CREATABLE_MAP[myLevel.value];
  const visible = !allowed ? [...ALL_ROLES] : ALL_ROLES.filter((r) => allowed.includes(r.value));
  if (canManagePublicUsers.value && !visible.some((r) => r.value === "USER")) {
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
  localError.value = "";
  try {
    const roles = getLocalRoles(user.id).filter((r) => r !== "MANAGE_PUBLIC_USERS");
    if (!roles.length) { showErr("Sélectionnez au moins un rôle."); return; }
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
  Object.assign(editForm, {
    fullName: "", email: "", password: "",
    role: visibleRoles.value[0]?.value || "USER",
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
.um-cell-roles { min-width: 200px; }
.um-cell-pwd   { min-width: 185px; }
.um-cell-actions { min-width: 155px; }

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
