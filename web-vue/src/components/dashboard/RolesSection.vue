<template>
  <section class="roles-root">

    <!-- ═══ En-tête ═══ -->
    <div class="roles-header">
      <div>
        <h2 class="roles-title">Gestion des droits par rôle</h2>
        <p class="roles-subtitle">
          Configurez les permissions de chaque rôle. Vous êtes connecté en tant que
          <strong>{{ currentRoleLabel }}</strong>.
        </p>
      </div>
      <div class="roles-header-badge">
        <span class="roles-superadmin-badge">👑 Super Admin — NATIONAL</span>
      </div>
    </div>

    <!-- ═══ Légende des rôles ═══ -->
    <div class="roles-legend">
      <div v-for="role in ROLES" :key="role.key" class="roles-legend-item" :style="`--rc:${role.color}`">
        <span class="roles-legend-icon">{{ role.icon }}</span>
        <div>
          <div class="roles-legend-name">{{ role.label }}</div>
          <div class="roles-legend-desc">{{ role.desc }}</div>
        </div>
      </div>
    </div>

    <!-- ═══ Matrice des permissions ═══ -->
    <div class="roles-table-wrap">
      <table class="roles-table">
        <thead>
          <tr>
            <th class="roles-th-perm">Permissions</th>
            <th v-for="role in ROLES" :key="role.key" class="roles-th-role">
              <div class="roles-col-header" :style="`color:${role.color}`">
                <span>{{ role.icon }}</span>
                <span>{{ role.label }}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-for="section in permissions" :key="section.section">
            <!-- Ligne de section -->
            <tr class="roles-section-row">
              <td :colspan="ROLES.length + 1" :style="`background:${section.color}18;color:${section.color}`">
                <span class="roles-section-icon">{{ section.icon }}</span>
                {{ section.section }}
              </td>
            </tr>
            <!-- Lignes de permissions -->
            <tr v-for="perm in section.items" :key="perm.id" class="roles-perm-row">
              <td class="roles-perm-cell">
                <div class="roles-perm-id">{{ perm.id }}</div>
                <div class="roles-perm-label">{{ perm.label }}</div>
                <div class="roles-perm-desc">{{ perm.desc }}</div>
              </td>
              <td
                v-for="role in ROLES"
                :key="role.key"
                class="roles-check-cell"
                :class="perm.roles[role.key] ? 'roles-has' : 'roles-no'"
              >
                <span v-if="perm.roles[role.key]" class="roles-check-yes" :style="`color:${role.color}`">✔</span>
                <span v-else class="roles-check-no">○</span>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- ═══ Gestion des utilisateurs par rôle (réservé NATIONAL) ═══ -->
    <div class="roles-mgmt-section" v-if="isNational">
      <div class="roles-mgmt-header">
        <span class="roles-mgmt-title">👥 Gestion des comptes par rôle</span>
        <span class="roles-mgmt-badge">Accès réservé — NATIONAL</span>
      </div>

      <div class="roles-mgmt-tabs">
        <button
          v-for="role in ROLES" :key="role.key"
          class="roles-mgmt-tab"
          :class="{ active: selectedRoleFilter === role.key }"
          @click="selectedRoleFilter = role.key"
        >
          {{ role.icon }} {{ role.label }}
          <span class="roles-mgmt-count">{{ countByRole(role.key) }}</span>
        </button>
      </div>

      <div class="roles-mgmt-list" v-if="filteredByRole.length">
        <div v-for="user in filteredByRole" :key="user.id" class="roles-user-row">
          <div class="roles-user-info">
            <span class="roles-user-avatar">{{ initials(user.fullName) }}</span>
            <div>
              <div class="roles-user-name">{{ user.fullName }}</div>
              <div class="roles-user-email">{{ user.email }}</div>
            </div>
          </div>
          <div class="roles-user-meta">
            <span class="roles-user-role-badge" :style="`background:${roleColor(user.role)}22;color:${roleColor(user.role)}`">
              {{ store.formatUserRoleLabel(user.role) }}
            </span>
            <span v-if="user.regionCode" class="roles-user-scope">📍 {{ user.regionCode }}</span>
            <span v-else-if="user.districtCode" class="roles-user-scope">📍 {{ user.districtCode }}</span>
          </div>
          <div class="roles-user-actions">
            <button class="ghost roles-edit-btn" @click="store.startEditUser(user); store.settingsSection = 'users'; store.tab = 'settings'">
              ✏ Modifier
            </button>
            <button
              class="ghost roles-toggle-btn"
              :class="user.isActive ? 'roles-btn-disable' : 'roles-btn-enable'"
              @click="store.toggleUserActive(user)"
            >
              {{ user.isActive ? '🔒 Désactiver' : '✅ Activer' }}
            </button>
          </div>
        </div>
      </div>
      <p v-else class="roles-empty">Aucun utilisateur avec ce rôle.</p>
    </div>

    <!-- ═══ Message pour les non-NATIONAL ═══ -->
    <div class="roles-restricted" v-else>
      <span class="roles-restricted-icon">🔒</span>
      <div>
        <div class="roles-restricted-title">Accès restreint</div>
        <div class="roles-restricted-desc">
          La gestion des comptes utilisateurs et des droits est réservée au rôle <strong>NATIONAL</strong>.
          Contactez votre administrateur national pour toute modification.
        </div>
      </div>
    </div>

  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useDashboardStore } from "../../stores/dashboard";
import { useAuthStore } from "../../stores/auth";

const store = useDashboardStore();
const auth = useAuthStore();

onMounted(async () => {
  if (store.users.length === 0) await store.fetchUsers();
});

// ─── Rôle courant ─────────────────────────────────────────────────────────────
const normalizeRole = (v) => String(v || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
const currentRole = computed(() => normalizeRole(auth.state.user?.role));
const isNational = computed(() =>
  [auth.state.user?.role, ...(auth.state.user?.roles || [])]
    .map(normalizeRole)
    .some((r) => ["NATIONAL", "REGULATOR"].includes(r))
);
const currentRoleLabel = computed(() => store.formatUserRoleLabel(currentRole.value) || currentRole.value);

// ─── Définition des rôles ─────────────────────────────────────────────────────
const ROLES = [
  { key: "NATIONAL",         label: "National",       icon: "👑", color: "#7c3aed", desc: "Super admin — accès total, non restreint." },
  { key: "REGULATOR",        label: "Régulateur",     icon: "⚙",  color: "#1d4ed8", desc: "Administrateur — gestion complète sauf paramètres système." },
  { key: "REGION",           label: "Région",         icon: "🗺",  color: "#0891b2", desc: "Gestionnaire régional — données de sa région uniquement." },
  { key: "DISTRICT",         label: "District",       icon: "📍",  color: "#059669", desc: "Gestionnaire de district — données de son district uniquement." },
  { key: "ETABLISSEMENT",    label: "Etablissement",  icon: "🏥",  color: "#d97706", desc: "Chef d'établissement — gestion de son centre uniquement." },
  { key: "SAMU",             label: "SAMU",           icon: "🚑",  color: "#dc2626", desc: "Service médical d'urgence — alertes SAMU uniquement." },
  { key: "SAPEUR_POMPIER",   label: "Pompiers",       icon: "🚒",  color: "#ea580c", desc: "Sapeurs-pompiers — alertes incendie/secours uniquement." },
  { key: "USER",             label: "Utilisateur",    icon: "👤",  color: "#64748b", desc: "Utilisateur public — lecture et évaluation uniquement." },
];

// ─── Matrice des permissions ───────────────────────────────────────────────────
const permissions = [
  {
    section: "ADMINISTRATION",
    icon: "🔴",
    color: "#dc2626",
    items: [
      {
        id: "1.1",
        label: "Tableau de bord administrateur",
        desc: "Accès au tableau de bord d'administration (statistiques, suivi).",
        roles: { NATIONAL: true,  REGULATOR: true,  REGION: true,  DISTRICT: true,  ETABLISSEMENT: true,  SAMU: true,  SAPEUR_POMPIER: true,  USER: false }
      },
      {
        id: "1.2",
        label: "Gestion des droits utilisateurs",
        desc: "Accorder ou retirer les permissions et rôles d'un utilisateur.",
        roles: { NATIONAL: true,  REGULATOR: false, REGION: false, DISTRICT: false, ETABLISSEMENT: false, SAMU: false, SAPEUR_POMPIER: false, USER: false }
      },
      {
        id: "1.3",
        label: "Accès au panneau de paramètres",
        desc: "Accéder à la section paramètres et administration.",
        roles: { NATIONAL: true,  REGULATOR: true,  REGION: true,  DISTRICT: true,  ETABLISSEMENT: false, SAMU: false, SAPEUR_POMPIER: false, USER: false }
      },
    ]
  },
  {
    section: "LECTURE",
    icon: "📖",
    color: "#1d4ed8",
    items: [
      {
        id: "2.1",
        label: "Voir tous les centres de santé",
        desc: "Accéder à la liste complète de tous les centres (toutes régions).",
        roles: { NATIONAL: true,  REGULATOR: true,  REGION: false, DISTRICT: false, ETABLISSEMENT: false, SAMU: false, SAPEUR_POMPIER: false, USER: false }
      },
      {
        id: "2.2",
        label: "Voir les centres de sa région/district",
        desc: "Accéder aux centres de la région ou district assigné.",
        roles: { NATIONAL: true,  REGULATOR: true,  REGION: true,  DISTRICT: true,  ETABLISSEMENT: true,  SAMU: false, SAPEUR_POMPIER: false, USER: false }
      },
      {
        id: "2.3",
        label: "Voir les centres proches (carte)",
        desc: "Consulter la carte des centres de santé autour de sa position.",
        roles: { NATIONAL: true,  REGULATOR: true,  REGION: true,  DISTRICT: true,  ETABLISSEMENT: true,  SAMU: true,  SAPEUR_POMPIER: true,  USER: true  }
      },
      {
        id: "2.4",
        label: "Voir les utilisateurs administratifs",
        desc: "Consulter la liste des comptes utilisateurs administratifs.",
        roles: { NATIONAL: true,  REGULATOR: true,  REGION: true,  DISTRICT: true,  ETABLISSEMENT: false, SAMU: false, SAPEUR_POMPIER: false, USER: false }
      },
      {
        id: "2.5",
        label: "Voir les utilisateurs publics",
        desc: "Consulter les comptes de type Utilisateur standard.",
        roles: { NATIONAL: true,  REGULATOR: true,  REGION: false, DISTRICT: false, ETABLISSEMENT: false, SAMU: false, SAPEUR_POMPIER: false, USER: false }
      },
      {
        id: "2.6",
        label: "Voir les plaintes & évaluations",
        desc: "Accéder aux plaintes et évaluations des centres.",
        roles: { NATIONAL: true,  REGULATOR: true,  REGION: true,  DISTRICT: true,  ETABLISSEMENT: true,  SAMU: false, SAPEUR_POMPIER: false, USER: false }
      },
      {
        id: "2.7",
        label: "Voir les alertes d'urgence",
        desc: "Consulter les alertes et interventions d'urgence.",
        roles: { NATIONAL: true,  REGULATOR: true,  REGION: false, DISTRICT: false, ETABLISSEMENT: false, SAMU: true,  SAPEUR_POMPIER: true,  USER: false }
      },
      {
        id: "2.8",
        label: "Voir les régions et districts",
        desc: "Consulter le référentiel territorial.",
        roles: { NATIONAL: true,  REGULATOR: true,  REGION: true,  DISTRICT: true,  ETABLISSEMENT: false, SAMU: false, SAPEUR_POMPIER: false, USER: false }
      },
    ]
  },
  {
    section: "GESTION",
    icon: "✏",
    color: "#059669",
    items: [
      {
        id: "3.1",
        label: "Créer un centre de santé",
        desc: "Enregistrer un nouveau centre dans le système.",
        roles: { NATIONAL: true,  REGULATOR: true,  REGION: true,  DISTRICT: true,  ETABLISSEMENT: true,  SAMU: false, SAPEUR_POMPIER: false, USER: false }
      },
      {
        id: "3.2",
        label: "Modifier un centre de santé",
        desc: "Modifier les informations d'un centre existant.",
        roles: { NATIONAL: true,  REGULATOR: true,  REGION: true,  DISTRICT: true,  ETABLISSEMENT: true,  SAMU: false, SAPEUR_POMPIER: false, USER: false }
      },
      {
        id: "3.3",
        label: "Approuver / Rejeter un centre",
        desc: "Valider ou refuser l'enregistrement d'un centre.",
        roles: { NATIONAL: true,  REGULATOR: true,  REGION: true,  DISTRICT: true,  ETABLISSEMENT: false, SAMU: false, SAPEUR_POMPIER: false, USER: false }
      },
      {
        id: "3.4",
        label: "Créer un utilisateur",
        desc: "Ajouter un nouveau compte utilisateur.",
        roles: { NATIONAL: true,  REGULATOR: true,  REGION: true,  DISTRICT: true,  ETABLISSEMENT: false, SAMU: false, SAPEUR_POMPIER: false, USER: false }
      },
      {
        id: "3.5",
        label: "Modifier un utilisateur",
        desc: "Changer le nom, l'email, l'affectation ou le rôle d'un utilisateur.",
        roles: { NATIONAL: true,  REGULATOR: true,  REGION: true,  DISTRICT: true,  ETABLISSEMENT: false, SAMU: false, SAPEUR_POMPIER: false, USER: false }
      },
      {
        id: "3.6",
        label: "Activer / Désactiver un compte",
        desc: "Suspendre ou réactiver l'accès d'un utilisateur.",
        roles: { NATIONAL: true,  REGULATOR: true,  REGION: true,  DISTRICT: true,  ETABLISSEMENT: false, SAMU: false, SAPEUR_POMPIER: false, USER: false }
      },
      {
        id: "3.7",
        label: "Importer des centres (Excel/CSV)",
        desc: "Importer un fichier de centres en masse.",
        roles: { NATIONAL: true,  REGULATOR: true,  REGION: true,  DISTRICT: true,  ETABLISSEMENT: false, SAMU: false, SAPEUR_POMPIER: false, USER: false }
      },
      {
        id: "3.8",
        label: "Gérer les alertes d'urgence",
        desc: "Prendre en charge, mettre à jour et clôturer les alertes.",
        roles: { NATIONAL: true,  REGULATOR: false, REGION: false, DISTRICT: false, ETABLISSEMENT: false, SAMU: true,  SAPEUR_POMPIER: true,  USER: false }
      },
      {
        id: "3.9",
        label: "Évaluer / noter un centre",
        desc: "Déposer un avis ou une note de satisfaction.",
        roles: { NATIONAL: false, REGULATOR: false, REGION: false, DISTRICT: false, ETABLISSEMENT: false, SAMU: false, SAPEUR_POMPIER: false, USER: true  }
      },
    ]
  },
  {
    section: "SUPPRESSION",
    icon: "🗑",
    color: "#dc2626",
    items: [
      {
        id: "4.1",
        label: "Supprimer un centre de santé",
        desc: "Retirer définitivement un centre du système.",
        roles: { NATIONAL: true,  REGULATOR: true,  REGION: true,  DISTRICT: true,  ETABLISSEMENT: true,  SAMU: false, SAPEUR_POMPIER: false, USER: false }
      },
      {
        id: "4.2",
        label: "Supprimer tous les centres",
        desc: "Vider complètement la base des centres (action irréversible).",
        roles: { NATIONAL: true,  REGULATOR: true,  REGION: true,  DISTRICT: true,  ETABLISSEMENT: false, SAMU: false, SAPEUR_POMPIER: false, USER: false }
      },
      {
        id: "4.3",
        label: "Supprimer un utilisateur",
        desc: "Supprimer définitivement un compte utilisateur.",
        roles: { NATIONAL: true,  REGULATOR: true,  REGION: false, DISTRICT: false, ETABLISSEMENT: false, SAMU: false, SAPEUR_POMPIER: false, USER: false }
      },
    ]
  },
];

// ─── Gestion utilisateurs par rôle ────────────────────────────────────────────
const selectedRoleFilter = ref("NATIONAL");

const filteredByRole = computed(() =>
  store.users.filter((u) => {
    const roles = Array.isArray(u.roles) ? u.roles : [u.role];
    return roles.some((r) => String(r || "").toUpperCase() === selectedRoleFilter.value);
  })
);

function countByRole(roleKey) {
  return store.users.filter((u) => {
    const roles = Array.isArray(u.roles) ? u.roles : [u.role];
    return roles.some((r) => String(r || "").toUpperCase() === roleKey);
  }).length;
}

function initials(name) {
  return String(name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

function roleColor(role) {
  const found = ROLES.find((r) => r.key === String(role || "").toUpperCase());
  return found?.color || "#64748b";
}
</script>

<style scoped>
.roles-root { padding: 24px 28px; display: flex; flex-direction: column; gap: 24px; }

/* ── En-tête ── */
.roles-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.roles-title { font-size: 1.6rem; font-weight: 700; color: #0f172a; margin: 0; }
.roles-subtitle { font-size: 0.85rem; color: #64748b; margin: 4px 0 0; }
.roles-superadmin-badge { background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #fff; padding: 8px 16px; border-radius: 10px; font-size: 0.82rem; font-weight: 700; }

/* ── Légende ── */
.roles-legend { display: flex; flex-wrap: wrap; gap: 10px; }
.roles-legend-item {
  display: flex; align-items: center; gap: 10px;
  background: #fff; border: 1px solid #e2e8f0; border-left: 4px solid var(--rc);
  border-radius: 10px; padding: 8px 14px; flex: 1; min-width: 180px; max-width: 280px;
}
.roles-legend-icon { font-size: 1.2rem; }
.roles-legend-name { font-size: 0.85rem; font-weight: 700; color: var(--rc); }
.roles-legend-desc { font-size: 0.72rem; color: #64748b; }

/* ── Tableau ── */
.roles-table-wrap { background: #fff; border-radius: 14px; overflow-x: auto; box-shadow: 0 2px 8px rgba(0,0,0,.07); }
.roles-table { width: 100%; border-collapse: collapse; min-width: 720px; }

.roles-th-perm {
  text-align: left; padding: 14px 20px;
  background: #0f172a; color: #fff; font-size: 0.8rem; font-weight: 700;
  position: sticky; left: 0; z-index: 2; min-width: 260px;
}
.roles-th-role {
  padding: 10px 8px; background: #0f172a; text-align: center; min-width: 90px;
}
.roles-col-header { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 0.75rem; font-weight: 700; }

.roles-section-row td {
  padding: 10px 20px; font-size: 0.8rem; font-weight: 800;
  letter-spacing: .06em; text-transform: uppercase;
}
.roles-section-icon { margin-right: 8px; }

.roles-perm-row { border-bottom: 1px solid #f1f5f9; }
.roles-perm-row:hover { background: #f8fafc; }

.roles-perm-cell {
  padding: 10px 20px; background: #fff;
  position: sticky; left: 0; z-index: 1;
  border-right: 1px solid #e2e8f0;
}
.roles-perm-id { font-size: 0.68rem; color: #94a3b8; font-weight: 600; }
.roles-perm-label { font-size: 0.85rem; font-weight: 600; color: #1e293b; }
.roles-perm-desc { font-size: 0.72rem; color: #64748b; margin-top: 2px; }

.roles-check-cell { text-align: center; padding: 10px 8px; }
.roles-has { background: #f0fdf4; }
.roles-check-yes { font-size: 1rem; font-weight: 700; }
.roles-check-no { font-size: 1rem; color: #d1d5db; }

/* ── Gestion utilisateurs ── */
.roles-mgmt-section { background: #fff; border-radius: 14px; padding: 20px 24px; box-shadow: 0 2px 8px rgba(0,0,0,.07); display: flex; flex-direction: column; gap: 16px; }
.roles-mgmt-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.roles-mgmt-title { font-size: 1rem; font-weight: 700; color: #1e293b; }
.roles-mgmt-badge { background: linear-gradient(135deg, #7c3aed22, #6d28d922); color: #6d28d9; border: 1px solid #c4b5fd; border-radius: 20px; padding: 3px 12px; font-size: 0.75rem; font-weight: 700; }

.roles-mgmt-tabs { display: flex; flex-wrap: wrap; gap: 8px; }
.roles-mgmt-tab {
  background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 7px 14px; font-size: 0.8rem; font-weight: 600; cursor: pointer;
  transition: all .15s; display: flex; align-items: center; gap: 6px;
}
.roles-mgmt-tab:hover { background: #e2e8f0; }
.roles-mgmt-tab.active { background: #0f172a; color: #fff; border-color: #0f172a; }
.roles-mgmt-count { background: rgba(255,255,255,.2); border-radius: 20px; padding: 1px 6px; font-size: 0.72rem; }
.roles-mgmt-tab:not(.active) .roles-mgmt-count { background: #e2e8f0; color: #475569; }

.roles-mgmt-list { display: flex; flex-direction: column; gap: 8px; }
.roles-user-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; }
.roles-user-info { display: flex; align-items: center; gap: 12px; min-width: 200px; }
.roles-user-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #e0e7ff, #c7d2fe); color: #3730a3; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.roles-user-name { font-size: 0.88rem; font-weight: 700; color: #1e293b; }
.roles-user-email { font-size: 0.75rem; color: #64748b; }
.roles-user-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.roles-user-role-badge { padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; }
.roles-user-scope { font-size: 0.75rem; color: #64748b; }
.roles-user-actions { display: flex; gap: 8px; }
.roles-edit-btn { font-size: 0.78rem; padding: 5px 12px; }
.roles-toggle-btn { font-size: 0.78rem; padding: 5px 12px; }
.roles-btn-disable { color: #dc2626 !important; border-color: #fecaca !important; }
.roles-btn-enable { color: #059669 !important; border-color: #a7f3d0 !important; }
.roles-empty { color: #94a3b8; font-size: 0.85rem; text-align: center; padding: 20px; }

/* ── Accès restreint ── */
.roles-restricted { background: #fef2f2; border: 1px solid #fecaca; border-radius: 14px; padding: 24px; display: flex; align-items: flex-start; gap: 16px; }
.roles-restricted-icon { font-size: 2rem; }
.roles-restricted-title { font-size: 1rem; font-weight: 700; color: #991b1b; margin-bottom: 4px; }
.roles-restricted-desc { font-size: 0.85rem; color: #7f1d1d; }
</style>
