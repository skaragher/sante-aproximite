<template>
  <div class="panel about-section">

    <!-- ══════════════════════════════════════════════
         HERO
    ══════════════════════════════════════════════ -->
    <div class="ab-hero">
      <div class="ab-hero-left">
        <div class="ab-logo-wrap">
          <img src="/logo-web.png" alt="logo" class="ab-logo" />
        </div>
        <div>
          <h1 class="ab-hero-title">Santé Aproxmite</h1>
          <p class="ab-hero-sub">Plateforme nationale de gestion sanitaire et d'urgences</p>
          <div class="ab-badges">
            <span class="ab-badge ab-badge-blue">v1.0.0</span>
            <span class="ab-badge ab-badge-green">Actif</span>
            <span class="ab-badge ab-badge-gray">Web + Mobile</span>
            <span class="ab-badge ab-badge-gray">Hors ligne</span>
          </div>
        </div>
      </div>
      <div class="ab-hero-kpis">
        <div class="ab-hero-kpi" v-for="k in heroKpis" :key="k.label">
          <span class="ab-hero-kpi-icon">{{ k.icon }}</span>
          <strong>{{ k.value }}</strong>
          <p>{{ k.label }}</p>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         MISSION & VISION
    ══════════════════════════════════════════════ -->
    <div class="ab-grid-2 ab-mt">
      <div class="ab-mv-card ab-mv-blue">
        <div class="ab-mv-icon">🎯</div>
        <h3>Mission</h3>
        <p>
          Rapprocher les citoyens des services de santé grâce à une plateforme numérique centralisée :
          localiser les centres, coordonner les urgences sanitaires et sécuritaires, et garantir
          la transparence et la qualité des soins à travers tout le territoire national.
        </p>
      </div>
      <div class="ab-mv-card ab-mv-green">
        <div class="ab-mv-icon">🌍</div>
        <h3>Vision</h3>
        <p>
          Devenir le système de référence numérique pour la gestion sanitaire nationale —
          réduire les délais de prise en charge, améliorer la coordination entre les services
          d'urgence, et donner à chaque niveau administratif les outils pour piloter la santé publique.
        </p>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         FONCTIONNALITÉS
    ══════════════════════════════════════════════ -->
    <div class="ab-block ab-mt">
      <div class="ab-block-head">
        <h2 class="ab-block-title">Fonctionnalités de la plateforme</h2>
        <span class="ab-block-count">{{ features.length }} modules</span>
      </div>
      <div class="ab-features-grid">
        <div class="ab-feature-card" v-for="f in features" :key="f.label">
          <div class="ab-feature-top">
            <span class="ab-feature-icon">{{ f.icon }}</span>
            <span class="ab-feature-tag" :style="{ background: f.tagBg, color: f.tagColor }">{{ f.tag }}</span>
          </div>
          <strong>{{ f.label }}</strong>
          <p>{{ f.desc }}</p>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         RÔLES & NIVEAUX
    ══════════════════════════════════════════════ -->
    <div class="ab-block ab-mt">
      <div class="ab-block-head">
        <h2 class="ab-block-title">Niveaux d'accès & Rôles</h2>
        <span class="ab-block-count">{{ roles.length }} rôles</span>
      </div>
      <div class="ab-roles-grid">
        <div class="ab-role-row" v-for="r in roles" :key="r.role">
          <div class="ab-role-dot" :style="{ background: r.color }"></div>
          <div class="ab-role-info">
            <strong>{{ r.role }}</strong>
            <p>{{ r.desc }}</p>
          </div>
          <div class="ab-role-perms">{{ r.perms }} droits</div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         ARCHITECTURE
    ══════════════════════════════════════════════ -->
    <div class="ab-grid-2 ab-mt">
      <div class="ab-block">
        <h2 class="ab-block-title">Architecture technique</h2>
        <div class="ab-tech-list">
          <div class="ab-tech-item" v-for="t in techStack" :key="t.name">
            <div class="ab-tech-dot" :style="{ background: t.color }"></div>
            <div>
              <strong>{{ t.name }}</strong>
              <p>{{ t.tech }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="ab-block">
        <h2 class="ab-block-title">Déploiement & Sécurité</h2>
        <div class="ab-tech-list">
          <div class="ab-tech-item" v-for="d in deployment" :key="d.name">
            <div class="ab-tech-dot" :style="{ background: d.color }"></div>
            <div>
              <strong>{{ d.name }}</strong>
              <p>{{ d.detail }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         DÉVELOPPEUR & CONTACT
    ══════════════════════════════════════════════ -->
    <div class="ab-block ab-mt">
      <h2 class="ab-block-title">Développeur & Contact</h2>
      <div class="ab-contacts-grid">
        <div class="ab-contact-card ab-contact-primary">
          <div class="ab-contact-badge">YT</div>
          <div>
            <strong>YEFA TECHNOLOGIE</strong>
            <p>Développeur & Mainteneur de la plateforme</p>
            <a href="mailto:yefa.technologie@gmail.com" class="ab-contact-link">
              📧 yefa.technologie@gmail.com
            </a>
          </div>
        </div>
        <div class="ab-contact-card ab-contact-gray">
          <div class="ab-contact-icon">🏥</div>
          <div>
            <strong>Ministère de la Santé</strong>
            <p>Direction des Systèmes d'Information Sanitaire</p>
            <p class="ab-contact-sub">Commanditaire institutionnel de la plateforme</p>
          </div>
        </div>
        <div class="ab-contact-card ab-contact-gray">
          <div class="ab-contact-icon">🛡</div>
          <div>
            <strong>Administration de la plateforme</strong>
            <p>Pour les accès, droits et rôles :</p>
            <p class="ab-contact-sub">Contactez votre administrateur de niveau NATIONAL ou REGULATOR</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         FOOTER LÉGAL
    ══════════════════════════════════════════════ -->
    <div class="ab-legal">
      <span>© {{ currentYear }} Ministère de la Santé · Santé Aproxmite</span>
      <span class="ab-legal-dot">·</span>
      <span>Version 1.0.0</span>
      <span class="ab-legal-dot">·</span>
      <span>Développé par YEFA TECHNOLOGIE</span>
      <span class="ab-legal-dot">·</span>
      <span>Données protégées · Usage réservé aux agents autorisés</span>
    </div>

  </div>
</template>

<script setup>
const currentYear = new Date().getFullYear();

const heroKpis = [
  { icon: "🏥", value: "Multi-niveaux",    label: "Régions & Districts" },
  { icon: "👥", value: "12 rôles",          label: "Profils utilisateurs" },
  { icon: "⚡", value: "Temps réel",        label: "Alertes urgences" },
  { icon: "📡", value: "Hors ligne",         label: "Sync automatique" },
];

const features = [
  { icon: "📍", label: "Carte des centres",         tag: "Santé",      tagBg: "#dbeafe", tagColor: "#1d4ed8", desc: "Localisation interactive des centres de santé sur carte avec filtres par région, district et type d'établissement." },
  { icon: "🚨", label: "Urgences sanitaires",       tag: "SAMU",       tagBg: "#fee2e2", tagColor: "#dc2626", desc: "Gestion des alertes d'urgence SAMU et Sapeurs-Pompiers avec suivi en temps réel et cartographie des bases d'intervention." },
  { icon: "🛡", label: "Urgences sécuritaires",     tag: "Sécurité",   tagBg: "#ede9fe", tagColor: "#7c3aed", desc: "Gestion des alertes de sécurité pour la Police, la Gendarmerie et la Protection Civile avec tableau de bord dédié." },
  { icon: "📝", label: "Plaintes & Réclamations",   tag: "Qualité",    tagBg: "#fef3c7", tagColor: "#d97706", desc: "Canal officiel pour soumettre, traiter et suivre les plaintes des usagers envers les centres de santé." },
  { icon: "⭐", label: "Évaluations des centres",   tag: "Qualité",    tagBg: "#fef3c7", tagColor: "#d97706", desc: "Notation et avis des patients pour mesurer et améliorer la satisfaction des usagers des centres de santé." },
  { icon: "📊", label: "Statistiques & KPI",        tag: "Analyse",    tagBg: "#d1fae5", tagColor: "#059669", desc: "Tableaux de bord analytiques : taux d'utilisation, suivi des plaintes, urgences sanitaires et sécuritaires." },
  { icon: "👥", label: "Gestion des utilisateurs",  tag: "Admin",      tagBg: "#e0e7ff", tagColor: "#4338ca", desc: "Administration centralisée des comptes, rôles et droits par niveau hiérarchique (RBAC complet)." },
  { icon: "📥", label: "Importation en masse",      tag: "Données",    tagBg: "#f0fdf4", tagColor: "#16a34a", desc: "Import Excel/CSV pour les centres de santé et les données géographiques (régions, districts)." },
  { icon: "🏥", label: "Espace chef d'établissement", tag: "Centre",  tagBg: "#dbeafe", tagColor: "#1d4ed8", desc: "Interface dédiée aux chefs d'établissement pour gérer leur centre, répondre aux plaintes et consulter les évaluations." },
  { icon: "🗺", label: "Gestion géographique",      tag: "Territoire", tagBg: "#ecfdf5", tagColor: "#059669", desc: "Référentiel complet des régions et districts avec import/export et liaison aux centres de santé." },
];

const roles = [
  { role: "NATIONAL",           desc: "Accès total à toutes les fonctions de la plateforme",                   color: "#1d4ed8", perms: "34" },
  { role: "REGULATOR",          desc: "Autorité de régulation : gestion complète sans administration RBAC",    color: "#2563eb", perms: "32" },
  { role: "REGION",             desc: "Gestion des centres et utilisateurs au niveau régional",                 color: "#0891b2", perms: "16" },
  { role: "DISTRICT",           desc: "Gestion des centres et utilisateurs au niveau du district",              color: "#0d9488", perms: "16" },
  { role: "CHEF_ETABLISSEMENT", desc: "Gestion de son propre centre, plaintes et équipe",                      color: "#059669", perms: "11" },
  { role: "ETABLISSEMENT",      desc: "Accès à son centre et gestion des membres de l'établissement",          color: "#16a34a", perms: "10" },
  { role: "SAMU",               desc: "Gestion des alertes sanitaires et bases d'intervention",                 color: "#dc2626", perms: "10" },
  { role: "SAPEUR_POMPIER",     desc: "Gestion des urgences incendie et interventions d'urgence",              color: "#ea580c", perms: "10" },
  { role: "POLICE",             desc: "Gestion des alertes de sécurité et incidents",                           color: "#7c3aed", perms: "7"  },
  { role: "GENDARMERIE",        desc: "Gestion des alertes territoriales et forces de l'ordre",                color: "#6d28d9", perms: "7"  },
  { role: "PROTECTION_CIVILE",  desc: "Coordination des interventions civiles et sécuritaires",                color: "#5b21b6", perms: "7"  },
  { role: "USER",               desc: "Citoyen : carte des centres, évaluations et signalement de plaintes",   color: "#64748b", perms: "3"  },
];

const techStack = [
  { name: "API Backend",        tech: "Node.js 20 · Express · PostgreSQL 15",   color: "#059669" },
  { name: "Application Web",   tech: "Vue 3 · Vite · CSS natif (sans framework)", color: "#2563eb" },
  { name: "Application Mobile",tech: "React Native · Expo (Android & iOS)",      color: "#7c3aed" },
  { name: "Cartographie",      tech: "Leaflet.js · OpenStreetMap (tuiles libres)",color: "#d97706" },
];

const deployment = [
  { name: "Authentification",  detail: "JWT + Refresh Tokens · Sessions sécurisées",   color: "#dc2626" },
  { name: "Contrôle d'accès",  detail: "RBAC granulaire · Permissions par ressource",   color: "#ea580c" },
  { name: "Hébergement",       detail: "Serveur dédié Linux · Nginx · HTTPS",           color: "#475569" },
  { name: "Hors ligne mobile", detail: "File d'attente locale · Synchronisation auto",  color: "#0891b2" },
];
</script>

<style scoped>
.about-section { max-width: 960px; margin: 0 auto; }
.ab-mt { margin-top: 20px; }

/* ── Hero ── */
.ab-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%);
  border-radius: var(--r-xl);
  padding: 28px 30px;
  flex-wrap: wrap;
}
.ab-hero-left { display: flex; align-items: center; gap: 18px; }
.ab-logo-wrap {
  width: 72px; height: 72px;
  border-radius: 18px;
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.2);
  display: grid; place-items: center;
  flex-shrink: 0;
}
.ab-logo { width: 50px; height: 50px; }
.ab-hero-title { margin: 0 0 4px; font-size: 24px; font-weight: 900; color: #fff; letter-spacing: -.4px; }
.ab-hero-sub   { margin: 0 0 10px; font-size: 13px; color: rgba(186,210,255,.8); }
.ab-badges { display: flex; flex-wrap: wrap; gap: 6px; }
.ab-badge {
  display: inline-flex; align-items: center;
  font-size: 11px; font-weight: 700;
  padding: 3px 10px; border-radius: var(--r-full);
  letter-spacing: .3px;
}
.ab-badge-blue  { background: rgba(59,130,246,.3); color: #93c5fd; border: 1px solid rgba(59,130,246,.4); }
.ab-badge-green { background: rgba(5,150,105,.3);  color: #6ee7b7; border: 1px solid rgba(5,150,105,.4); }
.ab-badge-gray  { background: rgba(255,255,255,.1); color: rgba(203,213,225,.8); border: 1px solid rgba(255,255,255,.12); }

.ab-hero-kpis { display: flex; gap: 16px; flex-wrap: wrap; }
.ab-hero-kpi {
  display: flex; flex-direction: column; align-items: center; text-align: center;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: var(--r-md);
  padding: 14px 16px;
  min-width: 90px;
  gap: 3px;
}
.ab-hero-kpi-icon { font-size: 20px; }
.ab-hero-kpi strong { font-size: 13.5px; font-weight: 900; color: #fff; }
.ab-hero-kpi p { margin: 0; font-size: 10.5px; color: rgba(186,210,255,.75); font-weight: 600; }

/* ── Block header ── */
.ab-block { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 20px 22px; }
.ab-block-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.ab-block-title { margin: 0; font-size: 15px; font-weight: 800; color: var(--gray-900); letter-spacing: -.2px; }
.ab-block-count { font-size: 11px; font-weight: 700; color: var(--blue-600); background: var(--blue-50); border: 1px solid var(--blue-100); padding: 3px 10px; border-radius: var(--r-full); }

/* ── Grid 2 ── */
.ab-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

/* ── Mission/Vision cards ── */
.ab-mv-card { border: 1px solid; border-radius: var(--r-lg); padding: 22px; }
.ab-mv-blue  { background: var(--blue-50);  border-color: var(--blue-100); }
.ab-mv-green { background: var(--green-50); border-color: var(--green-100); }
.ab-mv-icon { font-size: 28px; margin-bottom: 10px; }
.ab-mv-card h3 { margin: 0 0 10px; font-size: 16px; font-weight: 800; color: var(--gray-900); }
.ab-mv-card p  { margin: 0; font-size: 13.5px; color: var(--gray-600); line-height: 1.65; }

/* ── Features ── */
.ab-features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.ab-feature-card {
  background: var(--gray-50); border: 1px solid var(--border);
  border-radius: var(--r-md); padding: 14px;
  transition: box-shadow .15s, transform .15s;
}
.ab-feature-card:hover { box-shadow: var(--shadow-sm); transform: translateY(-1px); }
.ab-feature-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.ab-feature-icon { font-size: 22px; }
.ab-feature-tag { font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: var(--r-full); }
.ab-feature-card strong { display: block; font-size: 13px; font-weight: 800; color: var(--gray-800); margin-bottom: 4px; }
.ab-feature-card p { margin: 0; font-size: 12px; color: var(--gray-500); line-height: 1.55; }

/* ── Roles ── */
.ab-roles-grid { display: grid; gap: 8px; }
.ab-role-row {
  display: flex; align-items: center; gap: 12px;
  background: var(--gray-50); border: 1px solid var(--border);
  border-radius: var(--r-md); padding: 10px 14px;
}
.ab-role-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.ab-role-info { flex: 1; min-width: 0; }
.ab-role-info strong { display: block; font-size: 13px; font-weight: 800; color: var(--gray-800); }
.ab-role-info p { margin: 2px 0 0; font-size: 12px; color: var(--gray-500); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ab-role-perms { font-size: 11.5px; font-weight: 700; color: var(--blue-600); background: var(--blue-50); border: 1px solid var(--blue-100); border-radius: var(--r-full); padding: 2px 9px; flex-shrink: 0; white-space: nowrap; }

/* ── Tech stack ── */
.ab-tech-list { display: grid; gap: 8px; }
.ab-tech-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--gray-50); border: 1px solid var(--border); border-radius: var(--r-md); }
.ab-tech-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.ab-tech-item strong { display: block; font-size: 13px; color: var(--gray-800); font-weight: 700; }
.ab-tech-item p { margin: 2px 0 0; font-size: 11.5px; color: var(--gray-500); }

/* ── Contact ── */
.ab-contacts-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.ab-contact-card { display: flex; align-items: flex-start; gap: 14px; border: 1px solid var(--border); border-radius: var(--r-md); padding: 16px; }
.ab-contact-primary { background: var(--blue-50); border-color: var(--blue-100); }
.ab-contact-gray    { background: var(--gray-50); }
.ab-contact-badge {
  width: 46px; height: 46px; border-radius: var(--r-md);
  background: linear-gradient(135deg, var(--blue-700), var(--blue-900));
  color: #fff; font-weight: 900; font-size: 16px;
  display: grid; place-items: center; flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(37,99,235,.3);
}
.ab-contact-icon { font-size: 30px; flex-shrink: 0; }
.ab-contact-card strong { display: block; font-size: 13px; font-weight: 800; color: var(--gray-900); margin-bottom: 4px; }
.ab-contact-card p { margin: 0 0 4px; font-size: 12.5px; color: var(--gray-600); }
.ab-contact-sub { color: var(--gray-400) !important; font-size: 11.5px !important; }
.ab-contact-link { font-size: 12.5px; font-weight: 700; color: var(--blue-700); text-decoration: none; }
.ab-contact-link:hover { text-decoration: underline; }

/* ── Legal ── */
.ab-legal {
  margin-top: 22px; padding-top: 18px;
  border-top: 1px solid var(--border);
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  font-size: 11.5px; color: var(--gray-400);
}
.ab-legal-dot { color: var(--gray-300); }

@media (max-width: 768px) {
  .ab-hero { flex-direction: column; }
  .ab-hero-kpis { width: 100%; justify-content: space-between; }
  .ab-grid-2, .ab-features-grid, .ab-contacts-grid { grid-template-columns: 1fr; }
}
</style>
