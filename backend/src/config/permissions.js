export const ALL_PERMISSIONS = [
  // ── GÉNÉRAL ────────────────────────────────────────────────────────────────
  { key: "DASHBOARD_ADMIN",       section: "GÉNÉRAL",              label: "Tableau de bord administrateur",          desc: "Accès au tableau de bord d'administration (statistiques globales, KPI)" },
  { key: "VIEW_OVERVIEW",         section: "GÉNÉRAL",              label: "Voir la vue d'ensemble",                  desc: "Afficher les statistiques générales : centres, utilisateurs, alertes" },
  { key: "VIEW_NEARBY",           section: "GÉNÉRAL",              label: "Carte des centres proches",               desc: "Accéder à la carte interactive des centres de santé autour de sa position" },

  // ── CENTRES ────────────────────────────────────────────────────────────────
  { key: "VIEW_ALL_CENTERS",      section: "CENTRES",              label: "Voir tous les centres",                   desc: "Accéder à la liste complète de tous les centres (toutes régions confondues)" },
  { key: "CREATE_CENTER",         section: "CENTRES",              label: "Créer un centre",                         desc: "Enregistrer un nouveau centre de santé dans le système" },
  { key: "EDIT_CENTER",           section: "CENTRES",              label: "Modifier un centre",                      desc: "Modifier les informations (nom, adresse, services) d'un centre existant" },
  { key: "APPROVE_CENTER",        section: "CENTRES",              label: "Approuver / Rejeter un centre",           desc: "Valider ou refuser l'enregistrement d'un centre en attente" },
  { key: "DELETE_CENTER",         section: "CENTRES",              label: "Supprimer un centre",                     desc: "Retirer définitivement un centre du système" },
  { key: "DELETE_ALL_CENTERS",    section: "CENTRES",              label: "Supprimer tous les centres",              desc: "Vider complètement la base des centres (action irréversible, confirmation requise)" },
  { key: "MANAGE_MY_CENTER",      section: "CENTRES",              label: "Gérer son propre centre",                 desc: "Modifier les informations de son centre de santé (chef d'établissement)" },
  { key: "EXPORT_CENTERS",        section: "CENTRES",              label: "Exporter les centres (CSV/Excel)",        desc: "Télécharger la liste des centres au format CSV ou Excel" },

  // ── UTILISATEURS ───────────────────────────────────────────────────────────
  { key: "VIEW_ADMIN_USERS",      section: "UTILISATEURS",         label: "Voir les utilisateurs administratifs",    desc: "Consulter la liste des comptes administratifs (NATIONAL, REGION, SAMU, etc.)" },
  { key: "VIEW_PUBLIC_USERS",     section: "UTILISATEURS",         label: "Voir les utilisateurs publics",           desc: "Consulter les comptes de type Utilisateur standard (public / mobile)" },
  { key: "CREATE_USER",           section: "UTILISATEURS",         label: "Créer un utilisateur",                    desc: "Ajouter un nouveau compte utilisateur dans le système" },
  { key: "EDIT_USER",             section: "UTILISATEURS",         label: "Modifier un utilisateur",                 desc: "Changer le nom, l'email, l'affectation ou le rôle d'un utilisateur" },
  { key: "DELETE_USER",           section: "UTILISATEURS",         label: "Supprimer un utilisateur",                desc: "Supprimer définitivement un compte utilisateur" },
  { key: "TOGGLE_USER_ACTIVE",    section: "UTILISATEURS",         label: "Activer / Désactiver un compte",          desc: "Suspendre ou réactiver l'accès d'un utilisateur" },
  { key: "RESET_USER_PASSWORD",   section: "UTILISATEURS",         label: "Réinitialiser un mot de passe",           desc: "Forcer la réinitialisation du mot de passe d'un utilisateur" },
  { key: "APPROVE_CHEF",          section: "UTILISATEURS",         label: "Approuver un chef d'établissement",       desc: "Valider ou rejeter la demande d'un chef d'établissement en attente" },

  // ── PLAINTES & ÉVALUATIONS ────────────────────────────────────────────────
  { key: "VIEW_COMPLAINTS",       section: "PLAINTES & ÉVALUATIONS", label: "Voir les plaintes",                    desc: "Accéder à la liste des plaintes et réclamations des usagers" },
  { key: "MANAGE_COMPLAINTS",     section: "PLAINTES & ÉVALUATIONS", label: "Traiter les plaintes",                 desc: "Changer le statut d'une plainte (en cours, résolue, rejetée)" },
  { key: "ADD_COMPLAINT_NOTE",    section: "PLAINTES & ÉVALUATIONS", label: "Ajouter une explication à une plainte",desc: "Rédiger une note ou explication sur une plainte" },
  { key: "VIEW_EVALUATIONS",      section: "PLAINTES & ÉVALUATIONS", label: "Voir les évaluations des centres",     desc: "Accéder aux notes de satisfaction et évaluations des centres" },
  { key: "SUBMIT_EVALUATION",     section: "PLAINTES & ÉVALUATIONS", label: "Soumettre une évaluation",             desc: "Déposer une note et un avis sur un centre de santé" },
  { key: "SUBMIT_COMPLAINT",      section: "PLAINTES & ÉVALUATIONS", label: "Déposer une plainte",                  desc: "Créer une nouvelle réclamation concernant un centre de santé" },

  // ── URGENCES ──────────────────────────────────────────────────────────────
  { key: "VIEW_EMERGENCY",        section: "URGENCES",             label: "Voir les alertes d'urgence",              desc: "Consulter la liste des alertes et interventions d'urgence" },
  { key: "CREATE_EMERGENCY",      section: "URGENCES",             label: "Créer un rapport d'urgence",              desc: "Soumettre un nouveau signalement d'urgence (SAMU, Pompiers)" },
  { key: "MANAGE_EMERGENCY",      section: "URGENCES",             label: "Gérer les alertes d'urgence",             desc: "Prendre en charge, mettre à jour la progression et clôturer les alertes" },
  { key: "VIEW_EMERGENCY_BASES",  section: "URGENCES",             label: "Voir les bases d'intervention",           desc: "Consulter les bases et postes d'intervention d'urgence" },
  { key: "MANAGE_EMERGENCY_BASES",section: "URGENCES",             label: "Gérer les bases d'intervention",          desc: "Créer et modifier les bases d'intervention d'urgence" },

  // ── ALERTES DE SÉCURITÉ ───────────────────────────────────────────────────
  { key: "VIEW_SECURITY_ALERTS",  section: "ALERTES DE SÉCURITÉ", label: "Voir les alertes de sécurité",            desc: "Consulter les alertes de sécurité (Police, Gendarmerie, Protection Civile)" },
  { key: "CREATE_SECURITY_ALERT", section: "ALERTES DE SÉCURITÉ", label: "Créer une alerte de sécurité",            desc: "Soumettre un nouveau signalement de sécurité" },
  { key: "MANAGE_SECURITY_ALERTS",section: "ALERTES DE SÉCURITÉ", label: "Gérer les alertes de sécurité",           desc: "Prendre en charge et mettre à jour les alertes de sécurité" },

  // ── GÉOGRAPHIE ────────────────────────────────────────────────────────────
  { key: "VIEW_GEO",              section: "GÉOGRAPHIE",           label: "Voir les régions et districts",           desc: "Consulter le référentiel géographique (régions, districts)" },
  { key: "MANAGE_GEO",            section: "GÉOGRAPHIE",           label: "Gérer les régions et districts",          desc: "Créer et modifier les régions et districts" },
  { key: "IMPORT_CENTERS",        section: "GÉOGRAPHIE",           label: "Importer des centres (Excel/CSV)",         desc: "Importer un fichier de centres de santé en masse" },
  { key: "IMPORT_GEO",            section: "GÉOGRAPHIE",           label: "Importer des données géographiques",      desc: "Importer des régions ou districts depuis un fichier Excel/CSV" },
  { key: "EXPORT_GEO",            section: "GÉOGRAPHIE",           label: "Exporter les données géographiques",      desc: "Télécharger les régions, districts ou ESPC au format CSV" },

  // ── ADMINISTRATION ────────────────────────────────────────────────────────
  { key: "MANAGE_RBAC",           section: "ADMINISTRATION",       label: "Gérer les rôles personnalisés (RBAC)",    desc: "Créer, modifier et supprimer des rôles RBAC personnalisés" },
  { key: "ASSIGN_RBAC_ROLES",     section: "ADMINISTRATION",       label: "Attribuer des rôles personnalisés",       desc: "Assigner des rôles RBAC personnalisés à des utilisateurs" },
  { key: "ACCESS_IMPORTS",        section: "ADMINISTRATION",       label: "Accès à la section Imports",              desc: "Accéder à l'onglet d'importation de données" },
  { key: "ACCESS_ROLES",          section: "ADMINISTRATION",       label: "Accès à la section Rôles",                desc: "Accéder à l'onglet de gestion des rôles et droits" },
];

export const DEFAULT_PERMISSIONS = {
  NATIONAL: [
    "DASHBOARD_ADMIN", "VIEW_OVERVIEW",
    "VIEW_ALL_CENTERS", "CREATE_CENTER", "EDIT_CENTER", "APPROVE_CENTER", "DELETE_CENTER", "DELETE_ALL_CENTERS", "EXPORT_CENTERS",
    "VIEW_ADMIN_USERS", "VIEW_PUBLIC_USERS", "CREATE_USER", "EDIT_USER", "DELETE_USER", "TOGGLE_USER_ACTIVE", "RESET_USER_PASSWORD", "APPROVE_CHEF",
    "VIEW_COMPLAINTS", "MANAGE_COMPLAINTS", "ADD_COMPLAINT_NOTE", "VIEW_EVALUATIONS",
    "VIEW_GEO", "MANAGE_GEO", "IMPORT_CENTERS", "IMPORT_GEO", "EXPORT_GEO",
    "MANAGE_RBAC", "ASSIGN_RBAC_ROLES", "ACCESS_IMPORTS", "ACCESS_ROLES",
  ],
  REGULATOR: [
    "DASHBOARD_ADMIN", "VIEW_OVERVIEW",
    "VIEW_ALL_CENTERS", "CREATE_CENTER", "EDIT_CENTER", "APPROVE_CENTER", "DELETE_CENTER", "DELETE_ALL_CENTERS", "EXPORT_CENTERS",
    "VIEW_ADMIN_USERS", "VIEW_PUBLIC_USERS", "CREATE_USER", "EDIT_USER", "DELETE_USER", "TOGGLE_USER_ACTIVE", "RESET_USER_PASSWORD", "APPROVE_CHEF",
    "VIEW_COMPLAINTS", "MANAGE_COMPLAINTS", "ADD_COMPLAINT_NOTE", "VIEW_EVALUATIONS",
    "VIEW_GEO", "MANAGE_GEO", "IMPORT_CENTERS", "IMPORT_GEO", "EXPORT_GEO",
    "ASSIGN_RBAC_ROLES", "ACCESS_IMPORTS", "ACCESS_ROLES",
  ],
  REGION: [
    "DASHBOARD_ADMIN", "VIEW_OVERVIEW",
    "VIEW_ALL_CENTERS", "CREATE_CENTER", "EDIT_CENTER", "APPROVE_CENTER", "EXPORT_CENTERS",
    "VIEW_ADMIN_USERS", "CREATE_USER", "EDIT_USER", "TOGGLE_USER_ACTIVE", "RESET_USER_PASSWORD", "APPROVE_CHEF",
    "VIEW_COMPLAINTS", "ADD_COMPLAINT_NOTE", "VIEW_EVALUATIONS",
    "VIEW_GEO",
  ],
  DISTRICT: [
    "DASHBOARD_ADMIN", "VIEW_OVERVIEW",
    "VIEW_ALL_CENTERS", "CREATE_CENTER", "EDIT_CENTER", "APPROVE_CENTER", "EXPORT_CENTERS",
    "VIEW_ADMIN_USERS", "CREATE_USER", "EDIT_USER", "TOGGLE_USER_ACTIVE", "RESET_USER_PASSWORD", "APPROVE_CHEF",
    "VIEW_COMPLAINTS", "ADD_COMPLAINT_NOTE", "VIEW_EVALUATIONS",
    "VIEW_GEO",
  ],
  ETABLISSEMENT: [
    "DASHBOARD_ADMIN", "VIEW_OVERVIEW", "VIEW_NEARBY",
    "VIEW_ALL_CENTERS", "MANAGE_MY_CENTER",
    "VIEW_ADMIN_USERS", "CREATE_USER", "EDIT_USER", "TOGGLE_USER_ACTIVE", "RESET_USER_PASSWORD",
    "VIEW_EVALUATIONS",
  ],
  CHEF_ETABLISSEMENT: [
    "DASHBOARD_ADMIN", "VIEW_OVERVIEW", "VIEW_NEARBY",
    "VIEW_ALL_CENTERS", "MANAGE_MY_CENTER",
    "VIEW_ADMIN_USERS", "CREATE_USER", "EDIT_USER", "TOGGLE_USER_ACTIVE", "RESET_USER_PASSWORD",
    "VIEW_COMPLAINTS", "ADD_COMPLAINT_NOTE", "VIEW_EVALUATIONS",
  ],
  SAMU: [
    "DASHBOARD_ADMIN", "VIEW_OVERVIEW", "VIEW_NEARBY",
    "VIEW_EMERGENCY", "CREATE_EMERGENCY", "MANAGE_EMERGENCY", "VIEW_EMERGENCY_BASES", "MANAGE_EMERGENCY_BASES",
    "VIEW_ADMIN_USERS", "CREATE_USER", "EDIT_USER", "TOGGLE_USER_ACTIVE", "RESET_USER_PASSWORD",
  ],
  SAPEUR_POMPIER: [
    "DASHBOARD_ADMIN", "VIEW_OVERVIEW", "VIEW_NEARBY",
    "VIEW_EMERGENCY", "CREATE_EMERGENCY", "MANAGE_EMERGENCY", "VIEW_EMERGENCY_BASES", "MANAGE_EMERGENCY_BASES",
    "VIEW_ADMIN_USERS", "CREATE_USER", "EDIT_USER", "TOGGLE_USER_ACTIVE", "RESET_USER_PASSWORD",
  ],
  POLICE: [
    "DASHBOARD_ADMIN", "VIEW_OVERVIEW", "VIEW_NEARBY",
    "VIEW_SECURITY_ALERTS", "CREATE_SECURITY_ALERT", "MANAGE_SECURITY_ALERTS",
    "VIEW_ADMIN_USERS",
  ],
  GENDARMERIE: [
    "DASHBOARD_ADMIN", "VIEW_OVERVIEW", "VIEW_NEARBY",
    "VIEW_SECURITY_ALERTS", "CREATE_SECURITY_ALERT", "MANAGE_SECURITY_ALERTS",
    "VIEW_ADMIN_USERS",
  ],
  PROTECTION_CIVILE: [
    "DASHBOARD_ADMIN", "VIEW_OVERVIEW", "VIEW_NEARBY",
    "VIEW_SECURITY_ALERTS", "CREATE_SECURITY_ALERT", "MANAGE_SECURITY_ALERTS",
    "VIEW_ADMIN_USERS",
  ],
  USER: [
    "VIEW_NEARBY", "SUBMIT_EVALUATION", "SUBMIT_COMPLAINT",
  ],
};

const ALL_PERMISSION_KEYS = ALL_PERMISSIONS.map((p) => p.key);

// DEVELOPER a toutes les permissions sans exception
DEFAULT_PERMISSIONS.DEVELOPER = ALL_PERMISSION_KEYS;

export function getDefaultPermissions(roles = []) {
  // DEVELOPER court-circuite : retourne immédiatement toutes les permissions
  if (roles.some((r) => String(r || "").trim().toUpperCase() === "DEVELOPER")) {
    return ALL_PERMISSION_KEYS;
  }
  const perms = new Set();
  for (const role of roles) {
    const r = String(role || "").trim().toUpperCase();
    const defaults = DEFAULT_PERMISSIONS[r] || [];
    for (const p of defaults) perms.add(p);
  }
  return [...perms];
}
