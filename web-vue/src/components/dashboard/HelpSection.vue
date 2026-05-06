<template>
  <div class="panel help-section">

    <!-- ══════════════════════════════════════════════
         HEADER
    ══════════════════════════════════════════════ -->
    <div class="hp-header">
      <div class="hp-header-left">
        <h2 class="hp-title">Centre d'aide</h2>
        <p class="hp-subtitle">Guides, FAQ et ressources pour utiliser la plateforme web</p>
      </div>
      <div class="hp-search-wrap">
        <span class="hp-search-icon">🔍</span>
        <input v-model="search" class="hp-search" placeholder="Rechercher dans l'aide..." type="text" />
        <button v-if="search" class="hp-search-clear" @click="search = ''">✕</button>
      </div>
    </div>

    <!-- Résultats de recherche -->
    <template v-if="search.trim()">
      <div class="hp-block">
        <h3 class="hp-block-title">Résultats pour "{{ search }}" — {{ filteredAll.length }} résultat(s)</h3>
        <div v-if="filteredAll.length === 0" class="hp-empty">
          <span>🔍</span><p>Aucun résultat. Essayez d'autres mots-clés.</p>
        </div>
        <div class="hp-faq-list" v-else>
          <div
            class="hp-faq-item"
            v-for="item in filteredAll" :key="item.q"
            :class="{ open: openQ === item.q }"
          >
            <button class="hp-faq-q" @click="openQ = openQ === item.q ? null : item.q">
              <span class="hp-faq-icon">{{ item.icon }}</span>
              <span>{{ item.q }}</span>
              <span class="hp-faq-arr">{{ openQ === item.q ? '▾' : '›' }}</span>
            </button>
            <div class="hp-faq-a" v-if="openQ === item.q">
              <p v-html="item.a"></p>
              <div v-if="item.steps" class="hp-steps">
                <div class="hp-step" v-for="(s, i) in item.steps" :key="i">
                  <span class="hp-step-num">{{ i + 1 }}</span><span>{{ s }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>

      <!-- ══════════════════════════════════════════════
           ACCÈS RAPIDE PAR RÔLE
      ══════════════════════════════════════════════ -->
      <div class="hp-block hp-quickstart">
        <h3 class="hp-block-title">Démarrage rapide par rôle</h3>
        <div class="hp-roles-tabs">
          <button
            v-for="r in roleGuides" :key="r.role"
            class="hp-role-tab"
            :class="{ active: activeRole === r.role }"
            @click="activeRole = r.role"
          >
            <span>{{ r.icon }}</span> {{ r.label }}
          </button>
        </div>
        <div class="hp-role-content" v-if="activeRoleGuide">
          <div class="hp-role-steps">
            <div class="hp-role-step" v-for="(step, i) in activeRoleGuide.steps" :key="i">
              <div class="hp-role-step-num">{{ i + 1 }}</div>
              <div>
                <strong>{{ step.title }}</strong>
                <p>{{ step.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════
           FAQ PAR CATÉGORIE
      ══════════════════════════════════════════════ -->
      <div class="hp-block">
        <div class="hp-cats-header">
          <h3 class="hp-block-title">Questions fréquentes</h3>
          <div class="hp-cats">
            <button
              v-for="cat in categories" :key="cat.id"
              class="hp-cat-btn"
              :class="{ active: activeCat === cat.id }"
              @click="activeCat = cat.id"
            >
              {{ cat.icon }} {{ cat.label }}
              <span class="hp-cat-count">{{ faqByCat(cat.id).length }}</span>
            </button>
          </div>
        </div>

        <div class="hp-faq-list">
          <div
            class="hp-faq-item"
            v-for="item in faqByCat(activeCat)" :key="item.q"
            :class="{ open: openQ === item.q }"
          >
            <button class="hp-faq-q" @click="openQ = openQ === item.q ? null : item.q">
              <span class="hp-faq-icon">{{ item.icon }}</span>
              <span>{{ item.q }}</span>
              <span class="hp-faq-arr">{{ openQ === item.q ? '▾' : '›' }}</span>
            </button>
            <div class="hp-faq-a" v-if="openQ === item.q">
              <p v-html="item.a"></p>
              <div v-if="item.steps" class="hp-steps">
                <div class="hp-step" v-for="(s, i) in item.steps" :key="i">
                  <span class="hp-step-num">{{ i + 1 }}</span><span>{{ s }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- ══════════════════════════════════════════════
         CONTACT SUPPORT
    ══════════════════════════════════════════════ -->
    <div class="hp-support">
      <div class="hp-support-title">Vous n'avez pas trouvé votre réponse ?</div>
      <div class="hp-support-cards">
        <a href="mailto:yefa.technologie@gmail.com" class="hp-support-card hp-support-primary">
          <span class="hp-support-icon">📧</span>
          <div>
            <strong>Support technique</strong>
            <p>yefa.technologie@gmail.com</p>
          </div>
        </a>
        <div class="hp-support-card">
          <span class="hp-support-icon">👤</span>
          <div>
            <strong>Administrateur de votre structure</strong>
            <p>Pour les questions de droits d'accès ou de rôles</p>
          </div>
        </div>
        <div class="hp-support-card">
          <span class="hp-support-icon">📋</span>
          <div>
            <strong>Signaler un bug</strong>
            <p>Indiquez la section, l'action et le message d'erreur</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const search    = ref("");
const openQ     = ref(null);
const activeCat = ref("connexion");
const activeRole = ref("NATIONAL");

const categories = [
  { id: "connexion",  icon: "🔑", label: "Connexion & Compte" },
  { id: "centres",    icon: "🏥", label: "Centres de santé" },
  { id: "users",      icon: "👥", label: "Utilisateurs & Droits" },
  { id: "urgences",   icon: "🚨", label: "Urgences" },
  { id: "plaintes",   icon: "📝", label: "Plaintes & Évaluations" },
  { id: "stats",      icon: "📊", label: "Statistiques" },
  { id: "imports",    icon: "📥", label: "Imports & Exports" },
];

const roleGuides = [
  {
    role: "NATIONAL", label: "National", icon: "🏛",
    steps: [
      { title: "Accéder au Dashboard",         desc: "Consultez les KPI globaux : centres, utilisateurs, alertes d'urgences et de sécurité sur la vue d'ensemble." },
      { title: "Gérer les centres",            desc: "Dans Paramètres → Centres : créer, modifier, approuver ou supprimer des centres sur tout le territoire." },
      { title: "Administrer les utilisateurs", desc: "Créer des comptes pour tous les rôles (Région, District, SAMU, Police...) et gérer leurs droits individuels." },
      { title: "Consulter les statistiques",   desc: "Section Statistiques : taux d'utilisation, plaintes, urgences sanitaires et sécuritaires avec graphiques." },
      { title: "Gérer les rôles RBAC",         desc: "Dans Gestion des rôles : créer des rôles personnalisés et assigner des permissions granulaires aux utilisateurs." },
    ],
  },
  {
    role: "REGULATOR", label: "Régulateur", icon: "⚖",
    steps: [
      { title: "Tableau de bord",              desc: "Vue d'ensemble des indicateurs nationaux : centres actifs, utilisateurs, alertes en cours." },
      { title: "Gérer les centres",            desc: "Créer, modifier et approuver les centres sur tout le territoire. Exporter la liste en CSV/Excel." },
      { title: "Importer des données",         desc: "Section Importations : charger des fichiers Excel pour créer des centres ou des données géographiques en masse." },
      { title: "Statistiques",                 desc: "Accéder à l'analyse complète des plaintes, urgences et taux d'utilisation par région." },
      { title: "Attribuer des rôles RBAC",     desc: "Assigner des rôles personnalisés aux utilisateurs sans pouvoir créer de nouveaux rôles (réservé au NATIONAL)." },
    ],
  },
  {
    role: "REGION", label: "Région", icon: "🗺",
    steps: [
      { title: "Dashboard régional",           desc: "Consultez les statistiques de votre région : centres, utilisateurs, plaintes locales." },
      { title: "Gérer les centres régionaux",  desc: "Créer et valider les centres de votre région. Approuver les demandes en attente." },
      { title: "Gérer les agents régionaux",   desc: "Créer des comptes pour les niveaux District et Établissement de votre région." },
      { title: "Suivre les plaintes",           desc: "Consulter et annoter les plaintes déposées sur les centres de votre région." },
    ],
  },
  {
    role: "CHEF", label: "Chef d'ét.", icon: "🏥",
    steps: [
      { title: "Gérer mon centre",             desc: "Section Mon Centre : mettre à jour les informations, services et contacts de votre établissement." },
      { title: "Répondre aux plaintes",        desc: "Consultez les plaintes de vos usagers et ajoutez des notes pour les traiter." },
      { title: "Voir les évaluations",         desc: "Consultez les notes de satisfaction et les avis des patients sur votre centre." },
      { title: "Gérer l'équipe",               desc: "Créer et gérer les comptes des agents de votre établissement." },
    ],
  },
  {
    role: "SAMU", label: "SAMU/Pompiers", icon: "🚑",
    steps: [
      { title: "Tableau d'urgences",           desc: "Consultez en temps réel les alertes sanitaires actives sur votre zone d'intervention." },
      { title: "Créer une alerte",             desc: "Soumettre un nouveau rapport d'urgence avec localisation GPS, type et niveau de gravité." },
      { title: "Mettre à jour le statut",      desc: "Passer une alerte en cours → résolue une fois l'intervention terminée." },
      { title: "Gérer les bases",              desc: "Créer et modifier les bases d'intervention avec leurs coordonnées GPS." },
    ],
  },
  {
    role: "POLICE", label: "Police/Gendarmerie", icon: "🛡",
    steps: [
      { title: "Tableau des alertes sécurité", desc: "Consultez les alertes sécuritaires soumises sur votre territoire." },
      { title: "Créer une alerte sécurité",    desc: "Signaler un incident de sécurité avec localisation, description et niveau d'urgence." },
      { title: "Traiter les alertes",          desc: "Prendre en charge et clôturer les alertes de sécurité." },
    ],
  },
];

const allFaq = [
  // CONNEXION
  { cat: "connexion", icon: "🔑", q: "Comment me connecter à la plateforme ?", a: "Sur la page de connexion, saisissez votre email et le mot de passe fourni par votre administrateur. Si c'est votre première connexion, changez votre mot de passe immédiatement.", steps: ["Accéder à la page de connexion", "Saisir email et mot de passe", "Cliquer Se connecter", "Changer le mot de passe à la première connexion"] },
  { cat: "connexion", icon: "🔒", q: "Ma session a expiré, que faire ?", a: "La plateforme utilise des sessions sécurisées avec expiration automatique. Si votre session expire, vous êtes automatiquement redirigé vers la page de connexion. Reconnectez-vous normalement." },
  { cat: "connexion", icon: "❓", q: "J'ai oublié mon mot de passe.", a: "Contactez l'administrateur de votre structure (Région, District ou NATIONAL). Il peut réinitialiser votre mot de passe depuis <strong>Paramètres → Utilisateurs → Actions ▾ → Réinitialiser le mot de passe</strong>." },
  { cat: "connexion", icon: "👁", q: "Je ne vois pas certaines sections du menu, pourquoi ?", a: "L'accès aux sections est contrôlé par votre rôle et vos permissions. Certaines sections (Importations, Rôles, Statistiques) sont réservées à certains niveaux. Contactez votre administrateur si une section vous manque." },
  { cat: "connexion", icon: "📱", q: "La plateforme est-elle accessible sur mobile ?", a: "Oui. Une application mobile (Android / iOS) est disponible. Cette interface web s'adapte aussi aux tablettes. Sur mobile, la barre latérale se masque automatiquement." },

  // CENTRES
  { cat: "centres", icon: "➕", q: "Comment créer un nouveau centre de santé ?", a: "Dans <strong>Paramètres → Centres</strong>, cliquez sur « Nouveau centre ». Remplissez nom, adresse, services disponibles et coordonnées GPS. Le centre sera en attente d'approbation.", steps: ["Aller dans Paramètres", "Onglet Centres", "Cliquer Nouveau centre", "Remplir le formulaire complet", "Soumettre — le centre passe en attente"] },
  { cat: "centres", icon: "✅", q: "Comment approuver un centre en attente ?", a: "Dans Paramètres → Centres, filtrez les centres avec le statut <strong>En attente</strong>. Cliquez sur le centre puis sur le bouton <strong>Approuver</strong>." },
  { cat: "centres", icon: "✏", q: "Comment modifier les informations d'un centre ?", a: "Dans la liste des centres, cliquez sur le bouton <strong>Modifier</strong> à côté du centre. Mettez à jour les champs souhaités et enregistrez." },
  { cat: "centres", icon: "🗺", q: "Comment voir les centres sur la carte ?", a: "Cliquez sur <strong>Centres de santé</strong> dans le menu. La carte interactive affiche tous les centres avec filtres par région, district et type. Cliquez sur un marqueur pour voir les détails." },
  { cat: "centres", icon: "📁", q: "Comment exporter la liste des centres ?", a: "Dans Paramètres → Centres, cliquez sur le bouton <strong>Exporter CSV</strong> ou <strong>Exporter Excel</strong> disponible dans la barre d'outils." },

  // UTILISATEURS
  { cat: "users", icon: "➕", q: "Comment créer un utilisateur ?", a: "Dans <strong>Paramètres → Utilisateurs</strong>, cliquez sur « Nouvel utilisateur ». Renseignez nom, email, rôle et affectation géographique.", steps: ["Aller dans Paramètres", "Onglet Utilisateurs", "Cliquer Nouvel utilisateur", "Remplir le formulaire", "Valider — l'utilisateur reçoit ses identifiants"] },
  { cat: "users", icon: "🔐", q: "Comment modifier les droits d'un utilisateur ?", a: "Dans la liste des utilisateurs, cliquez sur <strong>Actions ▾ → Gérer les droits</strong>. Vous pouvez activer/désactiver des permissions individuelles ou assigner un rôle RBAC personnalisé." },
  { cat: "users", icon: "🚫", q: "Comment désactiver un compte utilisateur ?", a: "Dans la liste des utilisateurs, cliquez sur <strong>Actions ▾ → Désactiver</strong>. L'utilisateur ne peut plus se connecter. Réactivez-le à tout moment de la même façon." },
  { cat: "users", icon: "🛡", q: "Comment créer un rôle RBAC personnalisé ?", a: "Dans <strong>Gestion des rôles → Rôles personnalisés</strong>, cliquez sur « Créer un rôle », donnez-lui un nom et sélectionnez les permissions. Ce rôle peut ensuite être assigné à des utilisateurs.", steps: ["Aller dans Gestion des rôles", "Onglet Rôles personnalisés", "Cliquer Créer un rôle", "Nommer le rôle", "Cocher les permissions souhaitées", "Enregistrer"] },
  { cat: "users", icon: "👁", q: "Quelle est la différence entre Utilisateurs admin et publics ?", a: "<strong>Utilisateurs administratifs</strong> : NATIONAL, REGULATOR, REGION, DISTRICT, ETABLISSEMENT, CHEF, SAMU, POLICE, etc. — ils gèrent la plateforme.<br><strong>Utilisateurs publics</strong> : citoyens qui utilisent l'app mobile pour localiser des centres et déposer des plaintes." },

  // URGENCES
  { cat: "urgences", icon: "🚨", q: "Comment créer une alerte d'urgence sanitaire ?", a: "Dans <strong>Alertes urgence</strong>, cliquez sur « Nouvelle alerte ». Renseignez le type, la localisation GPS, la description et le niveau de gravité.", steps: ["Aller dans Alertes urgence", "Cliquer Nouvelle alerte", "Saisir les informations de l'urgence", "Confirmer — l'alerte est visible immédiatement"] },
  { cat: "urgences", icon: "🔄", q: "Comment mettre à jour le statut d'une intervention ?", a: "Dans la liste des alertes, cliquez sur l'alerte concernée. Changez le statut : <strong>En cours</strong> pour signaler la prise en charge, <strong>Résolue</strong> une fois l'intervention terminée." },
  { cat: "urgences", icon: "📍", q: "Comment gérer les bases d'intervention ?", a: "Dans <strong>Alertes urgence → Bases d'intervention</strong>, vous pouvez ajouter une base avec son nom, ses coordonnées GPS et sa capacité." },
  { cat: "urgences", icon: "🛡", q: "Comment créer une alerte de sécurité ?", a: "Dans <strong>Alertes sécurité</strong> (menu SÉCURITÉ), cliquez sur « Nouvelle alerte sécuritaire ». Décrivez l'incident, la localisation et le niveau d'urgence." },

  // PLAINTES
  { cat: "plaintes", icon: "📋", q: "Comment consulter les plaintes reçues ?", a: "Dans la section <strong>Plaintes</strong> du menu, vous voyez toutes les plaintes selon votre niveau d'accès (national, régional ou par centre). Filtrez par statut, centre ou date." },
  { cat: "plaintes", icon: "📝", q: "Comment traiter une plainte ?", a: "Cliquez sur une plainte pour voir ses détails. Changez le statut (<strong>En cours, Résolue, Rejetée</strong>) et ajoutez une note explicative pour informer l'usager.", steps: ["Aller dans Plaintes", "Cliquer sur la plainte", "Lire le détail", "Changer le statut", "Ajouter une note", "Enregistrer"] },
  { cat: "plaintes", icon: "⭐", q: "Comment consulter les évaluations des centres ?", a: "Dans la section <strong>Évaluations</strong>, vous trouverez les notes de satisfaction par centre, les avis détaillés et les taux de réponse aux plaintes." },

  // STATISTIQUES
  { cat: "stats", icon: "📊", q: "Comment accéder aux statistiques ?", a: "Cliquez sur <strong>Statistiques</strong> dans la section ANALYTIQUE du menu. La section est disponible pour les rôles NATIONAL et REGULATOR. Quatre catégories sont disponibles." },
  { cat: "stats", icon: "📈", q: "Que contient le taux d'utilisation ?", a: "Le taux d'utilisation montre combien de centres de santé ont été visités et utilisés par les citoyens via l'application mobile, avec répartition par région et par type d'établissement." },
  { cat: "stats", icon: "🚨", q: "Que contiennent les statistiques d'urgences ?", a: "Les statistiques d'urgences présentent le nombre total d'alertes sanitaires (SAMU/Pompiers) avec répartition par service, par statut (nouvelles, en cours, résolues) et taux de prise en charge." },
  { cat: "stats", icon: "🛡", q: "Que contiennent les statistiques de sécurité ?", a: "Les statistiques de sécurité présentent le nombre d'alertes sécuritaires (Police, Gendarmerie, Protection Civile) avec répartition par service et taux de résolution." },

  // IMPORTS
  { cat: "imports", icon: "📥", q: "Comment importer des centres en masse ?", a: "Dans <strong>Importations → Centres</strong>, téléchargez le modèle Excel fourni, remplissez-le et importez le fichier. Les erreurs sont signalées ligne par ligne.", steps: ["Aller dans Importations", "Télécharger le modèle Excel", "Remplir le fichier avec vos données", "Importer le fichier", "Vérifier le rapport d'importation"] },
  { cat: "imports", icon: "🗺", q: "Comment importer des données géographiques ?", a: "Dans <strong>Importations → Géographie</strong>, importez un fichier Excel contenant les régions ou districts. Utilisez le modèle fourni pour respecter le format attendu." },
  { cat: "imports", icon: "📁", q: "Comment exporter les données géographiques ?", a: "Dans <strong>Importations → Géographie</strong>, cliquez sur les boutons d'export disponibles pour télécharger les régions, districts ou ESPC au format CSV." },
];

const activeRoleGuide = computed(() => roleGuides.find(r => r.role === activeRole.value));

function faqByCat(catId) {
  return allFaq.filter(f => f.cat === catId);
}

const filteredAll = computed(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return [];
  return allFaq.filter(f =>
    f.q.toLowerCase().includes(q) ||
    (typeof f.a === "string" && f.a.replace(/<[^>]+>/g, "").toLowerCase().includes(q))
  );
});
</script>

<style scoped>
.help-section { max-width: 960px; margin: 0 auto; }

/* Header */
.hp-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 20px; margin-bottom: 20px; flex-wrap: wrap;
}
.hp-title    { margin: 0 0 4px; font-size: 22px; font-weight: 900; color: var(--gray-900); }
.hp-subtitle { margin: 0; font-size: 13.5px; color: var(--gray-500); }
.hp-search-wrap { position: relative; display: flex; align-items: center; }
.hp-search-icon {
  position: absolute; left: 11px; font-size: 14px; pointer-events: none;
}
.hp-search {
  padding-left: 34px; padding-right: 30px;
  width: 280px; font-size: 13px;
  border-radius: var(--r-full);
  border: 1.5px solid var(--border);
  background: var(--gray-50);
}
.hp-search-clear {
  position: absolute; right: 8px;
  background: none; border: none; color: var(--gray-400);
  font-size: 12px; cursor: pointer; padding: 2px 4px;
  border-radius: 50%;
}
.hp-search-clear:hover { color: var(--gray-600); background: var(--gray-100); }

/* Block */
.hp-block { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 20px 22px; margin-bottom: 16px; }
.hp-block-title { margin: 0 0 14px; font-size: 15px; font-weight: 800; color: var(--gray-900); padding-bottom: 10px; border-bottom: 2px solid var(--blue-100); }

/* Quick start */
.hp-quickstart { background: var(--blue-50); border-color: var(--blue-100); }
.hp-roles-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.hp-role-tab {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 13px; border-radius: var(--r-full);
  border: 1.5px solid var(--border);
  background: var(--surface); color: var(--gray-600);
  font-size: 12.5px; font-weight: 600; cursor: pointer;
  transition: all .15s;
}
.hp-role-tab:hover { background: var(--gray-50); border-color: var(--gray-300); }
.hp-role-tab.active {
  background: var(--blue-700); border-color: var(--blue-700);
  color: #fff;
}
.hp-role-steps { display: grid; gap: 10px; }
.hp-role-step { display: flex; align-items: flex-start; gap: 12px; }
.hp-role-step-num {
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--blue-700); color: #fff;
  font-size: 12px; font-weight: 800;
  display: grid; place-items: center; flex-shrink: 0;
}
.hp-role-step strong { display: block; font-size: 13.5px; color: var(--gray-800); margin-bottom: 2px; }
.hp-role-step p { margin: 0; font-size: 12.5px; color: var(--gray-500); line-height: 1.5; }

/* Category tabs */
.hp-cats-header { margin-bottom: 14px; }
.hp-cats { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
.hp-cat-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 12px; border-radius: var(--r-sm);
  border: 1.5px solid var(--border);
  background: var(--gray-50); color: var(--gray-600);
  font-size: 12.5px; font-weight: 600; cursor: pointer;
  transition: all .15s;
}
.hp-cat-btn:hover { background: var(--surface); border-color: var(--gray-300); }
.hp-cat-btn.active { background: var(--blue-700); border-color: var(--blue-700); color: #fff; }
.hp-cat-count {
  min-width: 18px; height: 18px;
  border-radius: var(--r-full);
  background: rgba(255,255,255,.25);
  font-size: 10.5px; font-weight: 800;
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0 4px;
}
.hp-cat-btn:not(.active) .hp-cat-count { background: var(--gray-200); color: var(--gray-600); }

/* FAQ accordion */
.hp-faq-list { display: grid; gap: 8px; }
.hp-faq-item { border: 1.5px solid var(--border); border-radius: var(--r-md); overflow: hidden; background: var(--surface); }
.hp-faq-item.open { border-color: var(--blue-200); }
.hp-faq-q {
  width: 100%; display: flex; align-items: center; gap: 10px;
  padding: 13px 16px; background: transparent;
  border: none; border-radius: 0; text-align: left;
  font-size: 13.5px; font-weight: 600; color: var(--gray-800);
  cursor: pointer; transition: background .15s; box-shadow: none;
}
.hp-faq-q:hover { background: var(--gray-50); }
.hp-faq-item.open .hp-faq-q { background: var(--blue-50); color: var(--blue-800); }
.hp-faq-icon { font-size: 16px; flex-shrink: 0; }
.hp-faq-q span:nth-child(2) { flex: 1; text-align: left; }
.hp-faq-arr { margin-left: auto; font-size: 14px; color: var(--gray-400); flex-shrink: 0; }
.hp-faq-item.open .hp-faq-arr { color: var(--blue-600); }
.hp-faq-a { padding: 12px 16px 16px 42px; background: var(--blue-50); border-top: 1px solid var(--blue-100); }
.hp-faq-a p { margin: 0 0 10px; font-size: 13.5px; color: var(--gray-700); line-height: 1.65; }

/* Steps */
.hp-steps { display: grid; gap: 6px; margin-top: 8px; }
.hp-step { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--gray-700); }
.hp-step-num {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--blue-700); color: #fff;
  font-size: 11px; font-weight: 800;
  display: grid; place-items: center; flex-shrink: 0;
}

/* Empty */
.hp-empty { text-align: center; padding: 40px; color: var(--gray-400); }
.hp-empty span { font-size: 34px; display: block; margin-bottom: 10px; }
.hp-empty p { margin: 0; font-size: 14px; }

/* Support */
.hp-support { background: linear-gradient(135deg, #0f172a, #1e3a8a); border-radius: var(--r-lg); padding: 22px; margin-top: 16px; }
.hp-support-title { font-size: 15px; font-weight: 800; color: #fff; margin-bottom: 14px; }
.hp-support-cards { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.hp-support-card {
  display: flex; align-items: flex-start; gap: 12px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: var(--r-md); padding: 14px;
  text-decoration: none;
  transition: background .15s;
}
.hp-support-card:hover { background: rgba(255,255,255,.14); }
.hp-support-primary { background: rgba(59,130,246,.25); border-color: rgba(59,130,246,.4); }
.hp-support-icon { font-size: 24px; flex-shrink: 0; }
.hp-support-card strong { display: block; font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.hp-support-card p { margin: 0; font-size: 12px; color: rgba(203,213,225,.8); line-height: 1.5; }

@media (max-width: 768px) {
  .hp-header { flex-direction: column; }
  .hp-search { width: 100%; }
  .hp-support-cards { grid-template-columns: 1fr; }
}
</style>
