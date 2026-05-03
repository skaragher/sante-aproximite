<template>
  <section class="roles-root">

    <!-- ═══ En-tête ═══ -->
    <div class="roles-header">
      <div>
        <h2 class="roles-title">Gestion des rôles et droits</h2>
        <p class="roles-subtitle">
          Créez des rôles personnalisés, assignez-leur des permissions, puis attribuez des utilisateurs.
          Connecté en tant que <strong>{{ currentRoleLabel }}</strong>.
        </p>
      </div>
      <div class="roles-header-actions">
        <span v-if="store.rbacSuccess" class="roles-save-notice">✔ {{ store.rbacSuccess }}</span>
        <span v-if="store.rbacError" class="roles-err-notice">⚠ {{ store.rbacError }}</span>
      </div>
    </div>

    <!-- ═══ Onglets ═══ -->
    <div class="roles-tabs">
      <button :class="['roles-tab', { active: activeTab === 'custom' }]" @click="activeTab = 'custom'">
        🛡 Rôles personnalisés
        <span class="roles-tab-count">{{ store.rbacRoles.length }}</span>
      </button>
      <button :class="['roles-tab', { active: activeTab === 'matrix' }]" @click="activeTab = 'matrix'">
        📋 Matrice de référence
      </button>
    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- TAB : Rôles personnalisés                                  -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'custom'">

      <!-- Barre d'actions -->
      <div class="rbac-toolbar" v-if="canEdit">
        <button class="rbac-btn-create" @click="openCreateModal">
          + Nouveau rôle
        </button>
        <p class="rbac-help">
          Chaque rôle peut regrouper des permissions précises. Un utilisateur hérité aussi des droits de son rôle système de base.
        </p>
      </div>

      <!-- Liste des rôles -->
      <div v-if="store.rbacRoles.length === 0" class="rbac-empty">
        <span class="rbac-empty-icon">🛡</span>
        <div>
          <div class="rbac-empty-title">Aucun rôle personnalisé</div>
          <div class="rbac-empty-desc">Créez votre premier rôle pour commencer à gérer des permissions personnalisées.</div>
        </div>
      </div>

      <div class="rbac-roles-list">
        <div v-for="role in store.rbacRoles" :key="role.id" class="rbac-role-card">
          <div class="rbac-role-card-header">
            <div class="rbac-role-info">
              <span class="rbac-role-name">{{ role.name }}</span>
              <span class="rbac-role-desc" v-if="role.description">{{ role.description }}</span>
            </div>
            <div class="rbac-role-meta">
              <span class="rbac-perm-count">{{ role.permissions.length }} permission{{ role.permissions.length !== 1 ? 's' : '' }}</span>
              <span class="rbac-user-count">{{ role.user_ids.length }} utilisateur{{ role.user_ids.length !== 1 ? 's' : '' }}</span>
            </div>
            <div class="rbac-role-actions" v-if="canEdit">
              <button class="ghost rbac-btn-edit" @click="openEditModal(role)">✏ Modifier</button>
              <button class="ghost rbac-btn-users" @click="openUsersModal(role)">👥 Utilisateurs</button>
              <button class="ghost rbac-btn-delete" @click="confirmDelete(role)">🗑</button>
            </div>
          </div>

          <!-- Badges de permissions -->
          <div class="rbac-perm-tags" v-if="role.permissions.length > 0">
            <span
              v-for="pkey in role.permissions.slice(0, 8)"
              :key="pkey"
              class="rbac-perm-tag"
              :title="labelForPerm(pkey)"
            >{{ labelForPerm(pkey) }}</span>
            <span v-if="role.permissions.length > 8" class="rbac-perm-tag rbac-perm-more">
              +{{ role.permissions.length - 8 }} autres
            </span>
          </div>
          <div class="rbac-perm-tags" v-else>
            <span class="rbac-perm-tag rbac-perm-empty">Aucune permission assignée</span>
          </div>

          <!-- Utilisateurs assignés -->
          <div class="rbac-assigned-users" v-if="role.user_ids.length > 0">
            <span
              v-for="uid in role.user_ids"
              :key="uid"
              class="rbac-user-chip"
            >{{ userName(uid) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- TAB : Matrice de référence                                 -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'matrix'">

      <!-- Légende -->
      <div class="roles-legend">
        <div v-for="role in ROLES" :key="role.key" class="roles-legend-item" :style="`--rc:${role.color}`">
          <span class="roles-legend-icon">{{ role.icon }}</span>
          <div>
            <div class="roles-legend-name">{{ role.label }}</div>
            <div class="roles-legend-desc">{{ role.desc }}</div>
          </div>
        </div>
      </div>

      <!-- Matrice -->
      <div class="roles-table-wrap">
        <table class="roles-table">
          <thead>
            <tr>
              <th class="roles-th-perm">Permission</th>
              <th v-for="role in ROLES" :key="role.key" class="roles-th-role">
                <div class="roles-col-header" :style="`color:${role.color}`">
                  <span>{{ role.icon }}</span>
                  <span>{{ role.label }}</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="section in permissionsBySection" :key="section.section">
              <tr class="roles-section-row">
                <td :colspan="ROLES.length + 1" :style="`background:${section.color}18;color:${section.color}`">
                  {{ section.section }}
                </td>
              </tr>
              <tr v-for="perm in section.items" :key="perm.key" class="roles-perm-row">
                <td class="roles-perm-cell">
                  <div class="roles-perm-label">{{ perm.label }}</div>
                  <div class="roles-perm-desc">{{ perm.desc }}</div>
                </td>
                <td
                  v-for="role in ROLES"
                  :key="role.key"
                  class="roles-check-cell"
                  :class="[matrixPerms[role.key]?.has(perm.key) ? 'roles-has' : 'roles-no']"
                >
                  <span v-if="matrixPerms[role.key]?.has(perm.key)" class="roles-check-yes" :style="`color:${role.color}`">✔</span>
                  <span v-else class="roles-check-no">○</span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- MODAL : Créer / Modifier un rôle                          -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showRoleModal" class="rbac-overlay" @click.self="showRoleModal = false">
        <div class="rbac-modal">
          <div class="rbac-modal-header">
            <h3>{{ editingRole ? 'Modifier le rôle' : 'Nouveau rôle' }}</h3>
            <button class="ghost rbac-modal-close" @click="showRoleModal = false">✕</button>
          </div>

          <div class="rbac-modal-body rbac-modal-body-role">
            <!-- Panneau gauche : infos du rôle -->
            <div class="rbac-role-panel-left">
              <div class="rbac-panel-title">Informations</div>
              <div class="rbac-field">
                <label>Nom du rôle *</label>
                <input v-model="roleForm.name" placeholder="Ex: Superviseur Régional" maxlength="100" />
              </div>
              <div class="rbac-field">
                <label>Description</label>
                <textarea v-model="roleForm.description" placeholder="Description optionnelle" maxlength="255" rows="4" />
              </div>
              <div class="rbac-sel-summary">
                <span class="rbac-sel-count-badge">{{ roleForm.permissions.length }}</span>
                permission{{ roleForm.permissions.length !== 1 ? 's' : '' }} sélectionnée{{ roleForm.permissions.length !== 1 ? 's' : '' }}
              </div>
            </div>

            <!-- Panneau droit : permissions -->
            <div class="rbac-role-panel-right">
              <div class="rbac-panel-title">Permissions</div>
              <template v-for="section in permissionsBySection" :key="section.section">
                <div class="rbac-perm-section-label" :style="`color:${section.color};border-left-color:${section.color}`">
                  {{ section.section }}
                </div>
                <div class="rbac-perm-grid">
                  <label
                    v-for="perm in section.items"
                    :key="perm.key"
                    class="rbac-perm-checkbox"
                    :class="{ checked: roleForm.permissions.includes(perm.key) }"
                  >
                    <input
                      type="checkbox"
                      :checked="roleForm.permissions.includes(perm.key)"
                      @change="toggleFormPerm(perm.key)"
                    />
                    <span class="rbac-perm-texts">
                      <span class="rbac-perm-checkbox-label">{{ perm.label }}</span>
                      <span class="rbac-perm-checkbox-desc">{{ perm.desc }}</span>
                    </span>
                  </label>
                </div>
              </template>
            </div>
          </div>

          <div class="rbac-modal-footer">
            <button class="ghost" @click="showRoleModal = false">Annuler</button>
            <button class="rbac-btn-save" @click="saveRole" :disabled="!roleForm.name.trim()">
              {{ editingRole ? 'Enregistrer' : 'Créer le rôle' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- MODAL : Assigner des utilisateurs                         -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showUsersModal" class="rbac-overlay" @click.self="showUsersModal = false">
        <div class="rbac-modal rbac-modal-sm">
          <div class="rbac-modal-header">
            <h3>Utilisateurs - {{ usersModalRole?.name }}</h3>
            <button class="ghost rbac-modal-close" @click="showUsersModal = false">✕</button>
          </div>

          <div class="rbac-modal-body">
            <p class="rbac-users-help">Cochez les utilisateurs qui doivent avoir ce rôle.</p>
            <input v-model="usersSearch" class="rbac-users-search" placeholder="Rechercher un utilisateur..." />
            <div class="rbac-users-list">
              <label
                v-for="user in filteredUsersForModal"
                :key="user.id"
                class="rbac-user-checkbox"
                :class="{ checked: usersSelection.includes(Number(user.id)) }"
              >
                <input
                  type="checkbox"
                  :checked="usersSelection.includes(Number(user.id))"
                  @change="toggleUserSelection(Number(user.id))"
                />
                <span class="rbac-user-chk-name">{{ user.fullName }}</span>
                <span class="rbac-user-chk-email">{{ user.email }}</span>
              </label>
            </div>
          </div>

          <div class="rbac-modal-footer">
            <span class="rbac-sel-count">{{ usersSelection.length }} sélectionné(s)</span>
            <button class="ghost" @click="showUsersModal = false">Annuler</button>
            <button class="rbac-btn-save" @click="saveUsers">Enregistrer</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- MODAL : Confirmer suppression                             -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="rbac-overlay" @click.self="showDeleteModal = false">
        <div class="rbac-modal rbac-modal-xs">
          <div class="rbac-modal-header">
            <h3>Supprimer le rôle</h3>
            <button class="ghost rbac-modal-close" @click="showDeleteModal = false">✕</button>
          </div>
          <div class="rbac-modal-body">
            <p>Supprimer <strong>{{ deletingRole?.name }}</strong> ? Cette action est irréversible.
            Les utilisateurs assignés perdront les droits associés.</p>
          </div>
          <div class="rbac-modal-footer">
            <button class="ghost" @click="showDeleteModal = false">Annuler</button>
            <button class="rbac-btn-danger" @click="doDelete">Supprimer</button>
          </div>
        </div>
      </div>
    </Teleport>

  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useDashboardStore } from "../../stores/dashboard";
import { useAuthStore } from "../../stores/auth";
import { DEFAULT_PERMISSIONS } from "../../config/permissions.js";

const store = useDashboardStore();
const auth = useAuthStore();

// ─── Accès ────────────────────────────────────────────────────────────────────
const normalizeRole = (v) => String(v || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
const currentRole = computed(() => normalizeRole(auth.state.user?.role));
const canEdit = computed(() =>
  [auth.state.user?.role, ...(auth.state.user?.roles || [])]
    .map(normalizeRole)
    .some((r) => ["NATIONAL", "REGULATOR"].includes(r))
);
const currentRoleLabel = computed(() => store.formatUserRoleLabel(currentRole.value) || currentRole.value);

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([
    store.fetchRbacRoles(),
    store.fetchRbacPermissions(),
    store.users.length === 0 ? store.fetchUsers() : Promise.resolve(),
  ]);
});

// ─── Onglets ──────────────────────────────────────────────────────────────────
const activeTab = ref("custom");

// ─── Permissions reference ────────────────────────────────────────────────────
const SECTION_COLORS = {
  "GÉNÉRAL":               "#0f172a",
  "CENTRES":               "#1d4ed8",
  "UTILISATEURS":          "#059669",
  "PLAINTES & ÉVALUATIONS":"#d97706",
  "URGENCES":              "#dc2626",
  "ALERTES DE SÉCURITÉ":  "#7f1d1d",
  "GÉOGRAPHIE":            "#0891b2",
  "ADMINISTRATION":        "#7c3aed",
};

const permissionsBySection = computed(() => {
  const perms = store.rbacPermissions.length > 0 ? store.rbacPermissions : [];
  const sections = {};
  for (const p of perms) {
    if (!sections[p.section]) sections[p.section] = { section: p.section, color: SECTION_COLORS[p.section] || "#64748b", items: [] };
    sections[p.section].items.push(p);
  }
  return Object.values(sections);
});

function labelForPerm(key) {
  const found = store.rbacPermissions.find((p) => p.key === key);
  return found?.label || key;
}

// ─── Matrice de référence ─────────────────────────────────────────────────────
const ROLES = [
  { key: "NATIONAL",          label: "National",          icon: "👑", color: "#7c3aed", desc: "Super admin - accès total" },
  { key: "REGULATOR",         label: "Régulateur",        icon: "⚙",  color: "#1d4ed8", desc: "Administrateur général" },
  { key: "REGION",            label: "Région",            icon: "🗺", color: "#0891b2", desc: "Gestionnaire régional" },
  { key: "DISTRICT",          label: "District",          icon: "📍", color: "#059669", desc: "Gestionnaire de district" },
  { key: "ETABLISSEMENT",     label: "Etablissement",     icon: "🏥", color: "#d97706", desc: "Chef d'établissement" },
  { key: "SAMU",              label: "SAMU",              icon: "🚑", color: "#dc2626", desc: "Service médical d'urgence" },
  { key: "SAPEUR_POMPIER",    label: "Pompiers",          icon: "🚒", color: "#ea580c", desc: "Sapeurs-pompiers" },
  { key: "POLICE",            label: "Police",            icon: "🚔", color: "#1e40af", desc: "Police nationale" },
  { key: "GENDARMERIE",       label: "Gendarmerie",       icon: "🎖",  color: "#166534", desc: "Gendarmerie nationale" },
  { key: "PROTECTION_CIVILE", label: "Protection Civile", icon: "🛡",  color: "#b45309", desc: "Protection civile" },
  { key: "USER",              label: "Utilisateur",       icon: "👤", color: "#64748b", desc: "Utilisateur public" },
];

const matrixPerms = computed(() => {
  const result = {};
  for (const role of ROLES) {
    const defaultPerms = DEFAULT_PERMISSIONS[role.key] || [];
    result[role.key] = new Set(defaultPerms);
  }
  return result;
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function userName(userId) {
  const user = store.users.find((u) => Number(u.id) === Number(userId));
  return user ? (user.fullName || user.email) : `#${userId}`;
}

// ─── Modal : Créer / Modifier un rôle ────────────────────────────────────────
const showRoleModal = ref(false);
const editingRole = ref(null);
const roleForm = reactive({ name: "", description: "", permissions: [] });

function openCreateModal() {
  editingRole.value = null;
  roleForm.name = "";
  roleForm.description = "";
  roleForm.permissions = [];
  store.rbacSuccess = "";
  store.rbacError = "";
  showRoleModal.value = true;
}

function openEditModal(role) {
  editingRole.value = role;
  roleForm.name = role.name;
  roleForm.description = role.description || "";
  roleForm.permissions = [...(role.permissions || [])];
  store.rbacSuccess = "";
  store.rbacError = "";
  showRoleModal.value = true;
}

function toggleFormPerm(key) {
  const idx = roleForm.permissions.indexOf(key);
  if (idx >= 0) roleForm.permissions.splice(idx, 1);
  else roleForm.permissions.push(key);
}

async function saveRole() {
  if (editingRole.value) {
    await store.updateRbacRole(editingRole.value.id, roleForm.name, roleForm.description, roleForm.permissions);
  } else {
    await store.createRbacRole(roleForm.name, roleForm.description, roleForm.permissions);
  }
  if (!store.rbacError) showRoleModal.value = false;
}

// ─── Modal : Utilisateurs ─────────────────────────────────────────────────────
const showUsersModal = ref(false);
const usersModalRole = ref(null);
const usersSelection = ref([]);
const usersSearch = ref("");

const filteredUsersForModal = computed(() => {
  const q = usersSearch.value.trim().toLowerCase();
  return store.users.filter((u) => {
    if (!q) return true;
    return (
      String(u.fullName || "").toLowerCase().includes(q) ||
      String(u.email || "").toLowerCase().includes(q)
    );
  });
});

function openUsersModal(role) {
  usersModalRole.value = role;
  usersSelection.value = (role.user_ids || []).map(Number);
  usersSearch.value = "";
  store.rbacSuccess = "";
  store.rbacError = "";
  showUsersModal.value = true;
}

function toggleUserSelection(userId) {
  const idx = usersSelection.value.indexOf(userId);
  if (idx >= 0) usersSelection.value.splice(idx, 1);
  else usersSelection.value.push(userId);
}

async function saveUsers() {
  if (!usersModalRole.value) return;
  await store.assignRbacUsers(usersModalRole.value.id, usersSelection.value);
  if (!store.rbacError) showUsersModal.value = false;
}

// ─── Modal : Supprimer ────────────────────────────────────────────────────────
const showDeleteModal = ref(false);
const deletingRole = ref(null);

function confirmDelete(role) {
  deletingRole.value = role;
  showDeleteModal.value = true;
}

async function doDelete() {
  if (!deletingRole.value) return;
  await store.deleteRbacRole(deletingRole.value.id);
  showDeleteModal.value = false;
  deletingRole.value = null;
}
</script>

<style scoped>
.roles-root { padding: 24px 28px; display: flex; flex-direction: column; gap: 24px; }

/* ── En-tête ── */
.roles-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.roles-title { font-size: 1.6rem; font-weight: 700; color: #0f172a; margin: 0; }
.roles-subtitle { font-size: 0.85rem; color: #64748b; margin: 4px 0 0; }
.roles-header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.roles-save-notice { background: #dcfce7; color: #15803d; border: 1px solid #86efac; border-radius: 8px; padding: 5px 12px; font-size: 0.78rem; font-weight: 700; }
.roles-err-notice { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; border-radius: 8px; padding: 5px 12px; font-size: 0.78rem; font-weight: 700; }

/* ── Onglets ── */
.roles-tabs { display: flex; gap: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 0; }
.roles-tab {
  background: none; border: none; padding: 10px 18px;
  font-size: 0.88rem; font-weight: 600; color: #64748b;
  cursor: pointer; border-bottom: 3px solid transparent; margin-bottom: -2px;
  transition: all .15s; display: flex; align-items: center; gap: 6px;
}
.roles-tab:hover { color: #1e293b; }
.roles-tab.active { color: #7c3aed; border-bottom-color: #7c3aed; }
.roles-tab-count { background: #e0e7ff; color: #3730a3; border-radius: 20px; padding: 1px 8px; font-size: 0.72rem; }

/* ── Toolbar ── */
.rbac-toolbar { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.rbac-btn-create {
  background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #fff;
  border: none; border-radius: 10px; padding: 10px 20px;
  font-size: 0.88rem; font-weight: 700; cursor: pointer; white-space: nowrap;
  transition: opacity .15s;
}
.rbac-btn-create:hover { opacity: .88; }
.rbac-help { font-size: 0.78rem; color: #64748b; margin: 0; }

/* ── Empty state ── */
.rbac-empty { background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 14px; padding: 32px 24px; display: flex; align-items: center; gap: 20px; }
.rbac-empty-icon { font-size: 2.5rem; }
.rbac-empty-title { font-size: 1rem; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
.rbac-empty-desc { font-size: 0.82rem; color: #64748b; }

/* ── Role cards ── */
.rbac-roles-list { display: flex; flex-direction: column; gap: 14px; }
.rbac-role-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 2px 6px rgba(0,0,0,.05); }
.rbac-role-card-header { display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.rbac-role-info { flex: 1; min-width: 0; }
.rbac-role-name { font-size: 1rem; font-weight: 800; color: #1e293b; display: block; }
.rbac-role-desc { font-size: 0.78rem; color: #64748b; display: block; margin-top: 2px; }
.rbac-role-meta { display: flex; gap: 8px; flex-shrink: 0; }
.rbac-perm-count, .rbac-user-count {
  background: #f1f5f9; color: #475569; border-radius: 20px;
  padding: 3px 10px; font-size: 0.75rem; font-weight: 600;
}
.rbac-role-actions { display: flex; gap: 6px; flex-shrink: 0; }
.rbac-btn-edit { font-size: 0.78rem; padding: 5px 12px; }
.rbac-btn-users { font-size: 0.78rem; padding: 5px 12px; }
.rbac-btn-delete { font-size: 0.78rem; padding: 5px 10px; color: #dc2626 !important; border-color: #fecaca !important; }

/* ── Permission tags ── */
.rbac-perm-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.rbac-perm-tag {
  background: #ede9fe; color: #5b21b6; border-radius: 20px;
  padding: 2px 10px; font-size: 0.72rem; font-weight: 600;
}
.rbac-perm-more { background: #f1f5f9; color: #64748b; }
.rbac-perm-empty { background: #f1f5f9; color: #94a3b8; font-style: italic; }

/* ── Assigned users ── */
.rbac-assigned-users { display: flex; flex-wrap: wrap; gap: 6px; }
.rbac-user-chip {
  background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;
  border-radius: 20px; padding: 2px 10px; font-size: 0.72rem; font-weight: 600;
}

/* ── Matrice de référence ── */
.roles-legend { display: flex; flex-wrap: wrap; gap: 10px; }
.roles-legend-item {
  display: flex; align-items: center; gap: 10px;
  background: #fff; border: 1px solid #e2e8f0; border-left: 4px solid var(--rc);
  border-radius: 10px; padding: 8px 14px; flex: 1; min-width: 180px; max-width: 260px;
}
.roles-legend-icon { font-size: 1.2rem; }
.roles-legend-name { font-size: 0.85rem; font-weight: 700; color: var(--rc); }
.roles-legend-desc { font-size: 0.72rem; color: #64748b; }

.roles-table-wrap { background: #fff; border-radius: 14px; overflow-x: auto; box-shadow: 0 2px 8px rgba(0,0,0,.07); }
.roles-table { width: 100%; border-collapse: collapse; min-width: 720px; }
.roles-th-perm { text-align: left; padding: 14px 20px; background: #0f172a; color: #fff; font-size: 0.8rem; font-weight: 700; position: sticky; left: 0; z-index: 2; min-width: 260px; }
.roles-th-role { padding: 10px 8px; background: #0f172a; text-align: center; min-width: 90px; }
.roles-col-header { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 0.75rem; font-weight: 700; }
.roles-section-row td { padding: 8px 20px; font-size: 0.75rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
.roles-perm-row { border-bottom: 1px solid #f1f5f9; }
.roles-perm-row:hover { background: #f8fafc; }
.roles-perm-cell { padding: 10px 20px; background: #fff; position: sticky; left: 0; z-index: 1; border-right: 1px solid #e2e8f0; }
.roles-perm-label { font-size: 0.83rem; font-weight: 600; color: #1e293b; }
.roles-perm-desc { font-size: 0.72rem; color: #64748b; margin-top: 2px; }
.roles-check-cell { text-align: center; padding: 10px 8px; }
.roles-has { background: #f0fdf4; }
.roles-check-yes { font-size: 1rem; font-weight: 700; }
.roles-check-no { font-size: 1rem; color: #d1d5db; }

/* ── Overlay / Modals ── */
.rbac-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 9000; padding: 16px;
}
.rbac-modal {
  background: #fff; border-radius: 18px; width: 100%; max-width: 980px;
  max-height: 92vh; display: flex; flex-direction: column;
  box-shadow: 0 24px 80px rgba(0,0,0,.22);
}
.rbac-modal-sm { max-width: 500px; }
.rbac-modal-xs { max-width: 380px; }

.rbac-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 28px; border-bottom: 1px solid #e2e8f0; flex-shrink: 0;
}
.rbac-modal-header h3 { font-size: 1.2rem; font-weight: 800; color: #0f172a; margin: 0; }
.rbac-modal-close { font-size: 1.1rem; padding: 4px 10px; }

/* Corps en deux colonnes pour la modale de rôle */
.rbac-modal-body { padding: 0; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 0; }
.rbac-modal-body-role { flex-direction: row; overflow: hidden; }

.rbac-role-panel-left {
  width: 280px; flex-shrink: 0;
  padding: 24px 20px; border-right: 1px solid #e2e8f0;
  display: flex; flex-direction: column; gap: 18px;
  background: #f8fafc; overflow-y: auto;
}
.rbac-role-panel-right {
  flex: 1; overflow-y: auto; padding: 24px 24px;
  display: flex; flex-direction: column; gap: 0;
}

.rbac-panel-title { font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: .07em; color: #94a3b8; margin-bottom: 4px; }

.rbac-modal-footer { padding: 16px 28px; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: flex-end; gap: 10px; flex-shrink: 0; }

/* ── Form fields ── */
.rbac-field { display: flex; flex-direction: column; gap: 6px; }
.rbac-field label { font-size: 0.82rem; font-weight: 700; color: #374151; }
.rbac-field input, .rbac-field textarea {
  border: 1px solid #d1d5db; border-radius: 9px; padding: 9px 13px;
  font-size: 0.9rem; outline: none; font-family: inherit; resize: vertical;
}
.rbac-field input:focus, .rbac-field textarea:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px #ede9fe; }

.rbac-sel-summary { margin-top: auto; padding: 10px 12px; background: #ede9fe; border-radius: 10px; font-size: 0.82rem; color: #5b21b6; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.rbac-sel-count-badge { background: #7c3aed; color: #fff; border-radius: 20px; padding: 2px 9px; font-size: 0.85rem; font-weight: 800; }

/* ── Permission editor ── */
.rbac-perm-section-label {
  font-size: 0.75rem; font-weight: 800; letter-spacing: .07em; text-transform: uppercase;
  margin: 16px 0 8px; padding: 5px 10px;
  border-left: 3px solid; background: #f8fafc; border-radius: 0 6px 6px 0;
}
.rbac-perm-section-label:first-child { margin-top: 0; }

.rbac-perm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 4px; }

.rbac-perm-checkbox {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 12px; border-radius: 10px; cursor: pointer;
  border: 1.5px solid #e2e8f0; transition: background .12s, border-color .12s;
}
.rbac-perm-checkbox:hover { background: #faf5ff; border-color: #c4b5fd; }
.rbac-perm-checkbox.checked { background: #ede9fe; border-color: #7c3aed; }
.rbac-perm-checkbox input { margin-top: 3px; accent-color: #7c3aed; flex-shrink: 0; width: 15px; height: 15px; }
.rbac-perm-texts { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.rbac-perm-checkbox-label { font-size: 0.88rem; font-weight: 700; color: #1e293b; line-height: 1.3; }
.rbac-perm-checkbox-desc { font-size: 0.76rem; color: #64748b; line-height: 1.35; }

/* ── Users modal ── */
.rbac-users-help { font-size: 0.82rem; color: #64748b; margin: 0; }
.rbac-users-search { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px; font-size: 0.88rem; outline: none; box-sizing: border-box; }
.rbac-users-search:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px #ede9fe; }
.rbac-users-list { display: flex; flex-direction: column; gap: 4px; max-height: 340px; overflow-y: auto; }
.rbac-user-checkbox {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 8px; cursor: pointer;
  border: 1px solid #f1f5f9; transition: background .12s;
}
.rbac-user-checkbox:hover { background: #faf5ff; }
.rbac-user-checkbox.checked { background: #ede9fe; border-color: #c4b5fd; }
.rbac-user-checkbox input { accent-color: #7c3aed; flex-shrink: 0; }
.rbac-user-chk-name { font-size: 0.85rem; font-weight: 700; color: #1e293b; flex: 1; }
.rbac-user-chk-email { font-size: 0.72rem; color: #64748b; }
.rbac-sel-count { font-size: 0.78rem; color: #64748b; margin-right: auto; }

/* ── Buttons ── */
.rbac-btn-save {
  background: #7c3aed; color: #fff; border: none; border-radius: 8px;
  padding: 9px 20px; font-size: 0.85rem; font-weight: 700; cursor: pointer;
  transition: opacity .15s;
}
.rbac-btn-save:hover:not(:disabled) { opacity: .88; }
.rbac-btn-save:disabled { opacity: .45; cursor: default; }
.rbac-btn-danger {
  background: #dc2626; color: #fff; border: none; border-radius: 8px;
  padding: 9px 20px; font-size: 0.85rem; font-weight: 700; cursor: pointer;
  transition: opacity .15s;
}
.rbac-btn-danger:hover { opacity: .88; }
</style>
