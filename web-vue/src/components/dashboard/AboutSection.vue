<template>
  <div class="panel about-section">

    <!-- Hero -->
    <div class="about-hero">
      <div class="about-hero-logo">
        <img src="/logo-web.png" alt="logo" style="width:52px;height:52px;" />
      </div>
      <div class="about-hero-text">
        <h1 class="about-title">Santé Aproxmite</h1>
        <p class="about-version">Version 1.0.0 — Plateforme nationale de gestion sanitaire</p>
        <p class="about-tagline">
          Système intégré de pilotage des centres de santé, de gestion des urgences
          et de suivi de la qualité des soins.
        </p>
      </div>
    </div>

    <!-- Mission & Vision -->
    <div class="about-grid-2">
      <div class="about-card about-card-blue">
        <div class="about-card-icon">🎯</div>
        <h3>Mission</h3>
        <p>
          Rapprocher les citoyens des services de santé en fournissant une plateforme
          numérique centralisée permettant de localiser, évaluer et interagir avec
          les centres de santé à travers tout le territoire national.
        </p>
      </div>
      <div class="about-card about-card-green">
        <div class="about-card-icon">🌍</div>
        <h3>Vision</h3>
        <p>
          Devenir le système de référence pour la gestion sanitaire nationale —
          réduire les délais de prise en charge, améliorer la coordination entre
          les services d'urgence et garantir la transparence des soins.
        </p>
      </div>
    </div>

    <!-- Fonctionnalités clés -->
    <div class="about-block">
      <h2 class="about-block-title">Fonctionnalités principales</h2>
      <div class="about-features-grid">
        <div class="about-feature" v-for="f in features" :key="f.label">
          <span class="about-feature-icon">{{ f.icon }}</span>
          <div>
            <strong>{{ f.label }}</strong>
            <p>{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modules système -->
    <div class="about-block">
      <h2 class="about-block-title">Architecture du système</h2>
      <div class="about-modules">
        <div class="about-module" v-for="m in modules" :key="m.name">
          <span class="about-module-dot" :style="{ background: m.color }"></span>
          <div>
            <strong>{{ m.name }}</strong>
            <span class="about-module-tech">{{ m.tech }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Couverture territoriale -->
    <div class="about-block">
      <h2 class="about-block-title">Couverture territoriale</h2>
      <div class="about-grid-3">
        <div class="about-stat-mini" v-for="s in coverage" :key="s.label">
          <span class="about-stat-mini-icon">{{ s.icon }}</span>
          <strong>{{ s.value }}</strong>
          <p>{{ s.label }}</p>
        </div>
      </div>
    </div>

    <!-- Contacts & Support -->
    <div class="about-block">
      <h2 class="about-block-title">Contact & Support</h2>
      <div class="about-grid-2">
        <div class="about-contact-card">
          <div class="about-contact-icon">📧</div>
          <div>
            <strong>Support technique</strong>
            <p>yefa.technologie@gmail.com</p>
          </div>
        </div>
        <div class="about-contact-card">
          <div class="about-contact-icon">🏥</div>
          <div>
            <strong>Ministère de la Santé</strong>
            <p>Direction des Systèmes d'Information Sanitaire</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer légal -->
    <div class="about-legal">
      <span>© {{ currentYear }} Ministère de la Santé — Santé Aproxmite</span>
      <span class="about-legal-sep">·</span>
      <span>Tous droits réservés</span>
      <span class="about-legal-sep">·</span>
      <span>Données protégées selon la réglementation en vigueur</span>
    </div>

  </div>
</template>

<script setup>
const currentYear = new Date().getFullYear();

const features = [
  { icon: "📍", label: "Géolocalisation des centres",      desc: "Carte interactive pour localiser les centres de santé les plus proches." },
  { icon: "🚨", label: "Gestion des urgences",             desc: "Coordination SAMU et Sapeurs-Pompiers avec suivi en temps réel." },
  { icon: "🛡",  label: "Alertes de sécurité",             desc: "Gestion des incidents par la Police, Gendarmerie et Protection Civile." },
  { icon: "📝", label: "Plaintes & Réclamations",          desc: "Canal officiel pour déposer et traiter les plaintes des usagers." },
  { icon: "⭐", label: "Évaluations des centres",          desc: "Notation et avis des patients pour améliorer la qualité des soins." },
  { icon: "📊", label: "Statistiques & Analytique",        desc: "Tableaux de bord et indicateurs de performance pour les décideurs." },
  { icon: "👥", label: "Gestion des utilisateurs",         desc: "Administration centralisée des accès et des rôles par niveau hiérarchique." },
  { icon: "📥", label: "Importation de données",           desc: "Chargement en masse des centres et données géographiques via Excel/CSV." },
];

const modules = [
  { name: "Backend API",       tech: "Node.js · Express · PostgreSQL",        color: "#059669" },
  { name: "Application Web",  tech: "Vue 3 · Vite · CSS natif",              color: "#2563eb" },
  { name: "Application Mobile", tech: "React Native · Expo",                 color: "#7c3aed" },
  { name: "Cartographie",     tech: "Leaflet · OpenStreetMap",               color: "#d97706" },
  { name: "Authentification", tech: "JWT · Refresh Tokens · RBAC",           color: "#dc2626" },
  { name: "Hébergement",      tech: "Serveur dédié Linux · Nginx",           color: "#475569" },
];

const coverage = [
  { icon: "🗺", value: "Nationale",   label: "Couverture territoriale" },
  { icon: "🏥", value: "Multi-niveaux", label: "Régions & Districts" },
  { icon: "📱", value: "Web + Mobile", label: "Plateformes supportées" },
  { icon: "🔐", value: "RBAC",         label: "Contrôle d'accès par rôle" },
  { icon: "🚑", value: "SAMU · Pompiers", label: "Services d'urgence intégrés" },
  { icon: "🛡", value: "Police · Gendarmerie", label: "Forces de sécurité" },
];
</script>

<style scoped>
.about-section { max-width: 900px; margin: 0 auto; }

/* Hero */
.about-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 28px;
}
.about-hero-logo {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: linear-gradient(135deg, #1d4ed8, #0f172a);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(37,99,235,.3);
  border: 1px solid rgba(255,255,255,.1);
}
.about-title {
  margin: 0 0 4px;
  font-size: 28px;
  font-weight: 900;
  color: var(--gray-900);
  letter-spacing: -.5px;
}
.about-version {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--blue-600);
  text-transform: uppercase;
  letter-spacing: .5px;
}
.about-tagline {
  margin: 0;
  font-size: 14px;
  color: var(--gray-600);
  line-height: 1.6;
  max-width: 560px;
}

/* Blocks */
.about-block { margin-bottom: 28px; }
.about-block-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--gray-900);
  margin: 0 0 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--blue-100);
  letter-spacing: -.2px;
}

/* Grids */
.about-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 28px;
}
.about-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

/* Cards mission/vision */
.about-card {
  border-radius: var(--r-lg);
  padding: 22px;
  border: 1px solid;
}
.about-card-blue {
  background: var(--blue-50);
  border-color: var(--blue-100);
}
.about-card-green {
  background: var(--green-50);
  border-color: var(--green-100);
}
.about-card-icon { font-size: 28px; margin-bottom: 10px; }
.about-card h3 {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 800;
  color: var(--gray-900);
}
.about-card p {
  margin: 0;
  font-size: 13.5px;
  color: var(--gray-600);
  line-height: 1.65;
}

/* Features */
.about-features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.about-feature {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: var(--gray-50);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
}
.about-feature-icon { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
.about-feature strong { display: block; font-size: 13.5px; color: var(--gray-800); margin-bottom: 3px; }
.about-feature p { margin: 0; font-size: 12.5px; color: var(--gray-500); line-height: 1.5; }

/* Modules */
.about-modules {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}
.about-module {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
}
.about-module-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.about-module strong { display: block; font-size: 13px; color: var(--gray-800); }
.about-module-tech { font-size: 11.5px; color: var(--gray-500); }

/* Coverage stats */
.about-stat-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px 12px;
  background: var(--gray-50);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  gap: 4px;
}
.about-stat-mini-icon { font-size: 24px; }
.about-stat-mini strong { font-size: 13px; font-weight: 800; color: var(--gray-900); }
.about-stat-mini p { margin: 0; font-size: 11.5px; color: var(--gray-500); }

/* Contact */
.about-contact-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: var(--gray-50);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
}
.about-contact-icon { font-size: 28px; flex-shrink: 0; }
.about-contact-card strong { display: block; font-size: 13.5px; color: var(--gray-800); margin-bottom: 2px; }
.about-contact-card p { margin: 0; font-size: 13px; color: var(--gray-500); }

/* Legal */
.about-legal {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--gray-400);
}
.about-legal-sep { color: var(--gray-300); }

@media (max-width: 768px) {
  .about-hero { flex-direction: column; text-align: center; }
  .about-grid-2, .about-features-grid, .about-modules { grid-template-columns: 1fr; }
  .about-grid-3 { grid-template-columns: 1fr 1fr; }
}
</style>
