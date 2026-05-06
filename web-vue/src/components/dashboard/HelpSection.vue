<template>
  <div class="panel help-section">

    <div class="help-header">
      <div>
        <h2 class="help-title">Centre d'aide</h2>
        <p class="help-subtitle">Guides, FAQ et ressources pour utiliser la plateforme</p>
      </div>
      <div class="help-search-wrap">
        <span class="help-search-icon">🔍</span>
        <input
          v-model="search"
          class="help-search"
          placeholder="Rechercher une question..."
          type="text"
        />
      </div>
    </div>

    <!-- Catégories rapides -->
    <div class="help-cats">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="help-cat-btn"
        :class="{ active: activeCategory === cat.id }"
        @click="activeCategory = cat.id"
      >
        <span>{{ cat.icon }}</span>
        {{ cat.label }}
      </button>
    </div>

    <!-- Guide rapide par rôle -->
    <div v-if="activeCategory === 'start' && !search" class="help-block">
      <h3 class="help-block-title">Guide de démarrage rapide par rôle</h3>
      <div class="help-roles-grid">
        <div class="help-role-card" v-for="r in roleGuides" :key="r.role">
          <div class="help-role-icon">{{ r.icon }}</div>
          <strong>{{ r.role }}</strong>
          <ul>
            <li v-for="step in r.steps" :key="step">{{ step }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- FAQ -->
    <div class="help-block">
      <h3 class="help-block-title">
        {{ search ? `Résultats pour "${search}"` : (categories.find(c=>c.id===activeCategory)?.label || 'FAQ') }}
      </h3>

      <div v-if="filteredFaq.length === 0" class="help-empty">
        <span>🔍</span>
        <p>Aucun résultat trouvé pour cette recherche.</p>
      </div>

      <div class="help-faq" v-else>
        <div
          class="help-faq-item"
          v-for="item in filteredFaq"
          :key="item.q"
          :class="{ open: openFaq === item.q }"
        >
          <button class="help-faq-q" @click="openFaq = openFaq === item.q ? null : item.q">
            <span class="help-faq-icon">{{ item.icon }}</span>
            <span>{{ item.q }}</span>
            <span class="help-faq-arrow">{{ openFaq === item.q ? '▾' : '›' }}</span>
          </button>
          <div class="help-faq-a" v-if="openFaq === item.q">
            <p v-html="item.a"></p>
            <div v-if="item.steps" class="help-faq-steps">
              <div v-for="(step, i) in item.steps" :key="i" class="help-faq-step">
                <span class="help-step-num">{{ i + 1 }}</span>
                <span>{{ step }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contact support -->
    <div class="help-block help-support-block">
      <h3 class="help-block-title">Vous n'avez pas trouvé votre réponse ?</h3>
      <div class="help-support-grid">
        <div class="help-support-card">
          <span class="help-support-icon">📧</span>
          <div>
            <strong>Contacter le support</strong>
            <p>Envoyez vos questions techniques à l'équipe de développement.</p>
            <a href="mailto:yefa.technologie@gmail.com" class="help-support-link">
              yefa.technologie@gmail.com
            </a>
          </div>
        </div>
        <div class="help-support-card">
          <span class="help-support-icon">🏥</span>
          <div>
            <strong>Administrateur de votre structure</strong>
            <p>Pour les questions d'accès, de rôles ou de droits, contactez l'administrateur de votre niveau (Région, District ou Établissement).</p>
          </div>
        </div>
        <div class="help-support-card">
          <span class="help-support-icon">📋</span>
          <div>
            <strong>Signaler un problème</strong>
            <p>Si vous constatez une anomalie dans le système, mentionnez : la section concernée, l'action effectuée, et le message d'erreur éventuel.</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const search = ref("");
const openFaq = ref(null);
const activeCategory = ref("start");

const categories = [
  { id: "start",    icon: "🚀", label: "Démarrage" },
  { id: "centers",  icon: "🏥", label: "Centres de santé" },
  { id: "users",    icon: "👥", label: "Utilisateurs" },
  { id: "emergency",icon: "🚨", label: "Urgences" },
  { id: "complaints",icon:"📝", label: "Plaintes" },
  { id: "account",  icon: "🔐", label: "Compte & Sécurité" },
];

const roleGuides = [
  {
    role: "Niveau National / Régulateur",
    icon: "🏛",
    steps: [
      "Accéder au Dashboard pour les KPI globaux",
      "Gérer les centres via la section Paramètres",
      "Importer des centres en masse via Importations",
      "Consulter les statistiques dans Analytique",
      "Administrer les rôles et droits via Gestion des rôles",
    ],
  },
  {
    role: "Niveau Région / District",
    icon: "🗺",
    steps: [
      "Consulter le Dashboard territorial",
      "Créer et approuver les centres de sa zone",
      "Gérer les utilisateurs de sa région/district",
      "Suivre et annoter les plaintes locales",
      "Visualiser les évaluations des centres",
    ],
  },
  {
    role: "Chef d'Établissement",
    icon: "🏥",
    steps: [
      "Gérer les informations de son centre (Mon Centre)",
      "Consulter les plaintes déposées sur son établissement",
      "Répondre aux plaintes en ajoutant des notes",
      "Suivre les évaluations de son centre",
      "Gérer les agents de son établissement",
    ],
  },
  {
    role: "SAMU / Sapeurs-Pompiers",
    icon: "🚑",
    steps: [
      "Consulter les alertes d'urgence actives",
      "Créer un nouveau rapport d'urgence",
      "Mettre à jour le statut d'une intervention",
      "Gérer les bases d'intervention",
      "Utiliser la carte pour localiser les centres proches",
    ],
  },
];

const allFaq = [
  // Démarrage
  { cat: "start", icon: "🔑", q: "Comment me connecter à la plateforme ?", a: "Rendez-vous sur la page de connexion, saisissez votre email et mot de passe fournis par votre administrateur. Si c'est votre première connexion, changez votre mot de passe dès que possible.", steps: ["Accéder à la page de connexion", "Saisir votre email et mot de passe", "Cliquer sur « Se connecter »", "Changer votre mot de passe si c'est une première connexion"] },
  { cat: "start", icon: "🗺", q: "Comment naviguer entre les sections ?", a: "Utilisez le menu de navigation à gauche pour passer d'une section à l'autre. Les sections disponibles dépendent de votre rôle. Cliquez sur le bouton ☰ en haut à gauche pour masquer ou afficher la barre latérale." },
  { cat: "start", icon: "👀", q: "Je ne vois pas certaines sections du menu, pourquoi ?", a: "L'accès aux sections est contrôlé par votre rôle et vos droits. Par exemple, la gestion des importations n'est disponible que pour les niveaux National et Régulateur. Contactez votre administrateur si vous pensez qu'une section devrait vous être accessible." },

  // Centres
  { cat: "centers", icon: "➕", q: "Comment créer un nouveau centre de santé ?", a: "Depuis la section <strong>Paramètres → Centres</strong>, cliquez sur « Nouveau centre ». Remplissez le formulaire avec le nom, l'adresse, les coordonnées GPS et les services disponibles.", steps: ["Aller dans Paramètres", "Onglet Centres", "Cliquer « Nouveau centre »", "Remplir le formulaire", "Soumettre — le centre sera en attente d'approbation"] },
  { cat: "centers", icon: "✅", q: "Comment approuver un centre en attente ?", a: "Dans la section Paramètres, filtrez les centres avec le statut <strong>« En attente »</strong>. Cliquez sur le centre concerné puis sur le bouton <strong>« Approuver »</strong>. Un centre rejeté peut être supprimé." },
  { cat: "centers", icon: "📥", q: "Comment importer plusieurs centres en une fois ?", a: "Rendez-vous dans la section <strong>Importations</strong>. Téléchargez le modèle Excel fourni, remplissez-le avec vos données, puis importez le fichier. Les erreurs de format sont signalées ligne par ligne.", steps: ["Aller dans Importations", "Télécharger le modèle Excel", "Remplir le fichier", "Importer le fichier via le bouton prévu", "Vérifier le rapport d'importation"] },
  { cat: "centers", icon: "🗺", q: "Comment voir les centres sur la carte ?", a: "Cliquez sur <strong>Centres de santé</strong> dans le menu pour accéder à la carte interactive. Vous pouvez filtrer par région, district, type de service ou statut." },

  // Utilisateurs
  { cat: "users", icon: "➕", q: "Comment créer un utilisateur ?", a: "Dans <strong>Paramètres → Utilisateurs</strong>, cliquez sur « Nouvel utilisateur ». Renseignez le nom, l'email, le rôle et l'affectation géographique. L'utilisateur recevra ses identifiants par email.", steps: ["Aller dans Paramètres", "Onglet Utilisateurs", "Cliquer « Nouvel utilisateur »", "Remplir le formulaire", "Valider"] },
  { cat: "users", icon: "🔐", q: "Comment modifier les droits d'un utilisateur ?", a: "Dans la liste des utilisateurs, cliquez sur le bouton <strong>Actions ▾</strong> puis <strong>« Gérer les droits »</strong>. Vous pouvez activer ou désactiver des permissions individuelles ou assigner un rôle RBAC personnalisé." },
  { cat: "users", icon: "🚫", q: "Comment désactiver un compte utilisateur ?", a: "Dans la liste des utilisateurs, cliquez sur <strong>Actions ▾ → Désactiver</strong>. L'utilisateur ne pourra plus se connecter. Vous pouvez réactiver le compte à tout moment." },
  { cat: "users", icon: "🛡", q: "Comment créer un rôle personnalisé (RBAC) ?", a: "Allez dans <strong>Gestion des rôles</strong>, onglet <strong>Rôles personnalisés</strong>. Cliquez sur « Créer un rôle », donnez-lui un nom et sélectionnez les permissions à accorder. Ce rôle peut ensuite être assigné à des utilisateurs." },

  // Urgences
  { cat: "emergency", icon: "🚨", q: "Comment signaler une urgence ?", a: "Dans la section <strong>Alertes urgence</strong>, cliquez sur <strong>« Nouvelle alerte »</strong>. Renseignez le type d'urgence, la localisation (lat/lng), la description et le niveau de gravité.", steps: ["Aller dans Alertes urgence", "Cliquer « Nouvelle alerte »", "Remplir le formulaire", "Confirmer — l'alerte est visible immédiatement"] },
  { cat: "emergency", icon: "🔄", q: "Comment mettre à jour le statut d'une intervention ?", a: "Dans la liste des alertes, cliquez sur l'alerte concernée. Vous pouvez la passer en <strong>« En cours »</strong> pour indiquer une prise en charge, ou <strong>« Résolue »</strong> une fois l'intervention terminée." },
  { cat: "emergency", icon: "📍", q: "Comment gérer les bases d'intervention ?", a: "Dans la section <strong>Alertes urgence</strong>, accédez à l'onglet <strong>Bases d'intervention</strong>. Vous pouvez ajouter une base avec ses coordonnées GPS, son nom et sa capacité." },

  // Plaintes
  { cat: "complaints", icon: "📝", q: "Comment traiter une plainte ?", a: "Dans la section <strong>Plaintes</strong>, cliquez sur une plainte pour voir ses détails. Changez son statut (En cours, Résolue, Rejetée) et ajoutez une note explicative pour informer l'usager.", steps: ["Aller dans Plaintes", "Cliquer sur la plainte", "Lire le détail", "Changer le statut", "Ajouter une note", "Enregistrer"] },
  { cat: "complaints", icon: "📊", q: "Comment consulter les évaluations des centres ?", a: "Accédez à la section <strong>Évaluations</strong>. Vous y trouverez les notes de satisfaction par centre, les avis des usagers et les taux de réponse aux plaintes." },

  // Compte
  { cat: "account", icon: "🔑", q: "Comment changer mon mot de passe ?", a: "Pour l'instant, la modification du mot de passe est effectuée par un administrateur via la fonction <strong>« Réinitialiser le mot de passe »</strong>. Contactez votre administrateur de niveau supérieur." },
  { cat: "account", icon: "🔒", q: "Ma session a expiré, que faire ?", a: "La plateforme utilise des sessions sécurisées avec expiration automatique. Si votre session expire, vous serez automatiquement redirigé vers la page de connexion. Reconnectez-vous avec vos identifiants." },
  { cat: "account", icon: "❓", q: "J'ai oublié mon mot de passe, comment faire ?", a: "Contactez l'administrateur de votre structure (Région, District ou National). Il pourra réinitialiser votre mot de passe depuis la section Utilisateurs." },
];

const filteredFaq = computed(() => {
  let list = allFaq;
  if (search.value.trim()) {
    const q = search.value.toLowerCase();
    list = allFaq.filter(
      (item) =>
        item.q.toLowerCase().includes(q) ||
        (typeof item.a === "string" && item.a.toLowerCase().includes(q))
    );
  } else {
    list = allFaq.filter((item) => item.cat === activeCategory.value);
  }
  return list;
});
</script>

<style scoped>
.help-section { max-width: 900px; margin: 0 auto; }

/* Header */
.help-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}
.help-title { margin: 0 0 4px; font-size: 22px; font-weight: 900; color: var(--gray-900); }
.help-subtitle { margin: 0; font-size: 13.5px; color: var(--gray-500); }
.help-search-wrap {
  position: relative;
  flex-shrink: 0;
}
.help-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  pointer-events: none;
}
.help-search {
  padding-left: 34px;
  width: 260px;
  font-size: 13px;
  border-radius: var(--r-full);
  border: 1.5px solid var(--border);
  background: var(--gray-50);
}

/* Categories */
.help-cats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 22px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}
.help-cat-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--r-full);
  border: 1.5px solid var(--border);
  background: var(--surface);
  color: var(--gray-600);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
}
.help-cat-btn:hover { background: var(--gray-50); border-color: var(--gray-300); }
.help-cat-btn.active {
  background: linear-gradient(180deg, var(--blue-700), var(--blue-800));
  border-color: var(--blue-800);
  color: #fff;
}

/* Blocks */
.help-block { margin-bottom: 28px; }
.help-block-title {
  font-size: 15px;
  font-weight: 800;
  color: var(--gray-900);
  margin: 0 0 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--blue-100);
}

/* Role guides */
.help-roles-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.help-role-card {
  background: var(--gray-50);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 16px 18px;
}
.help-role-icon { font-size: 26px; margin-bottom: 6px; }
.help-role-card strong { display: block; font-size: 13.5px; color: var(--gray-800); margin-bottom: 8px; }
.help-role-card ul { margin: 0; padding-left: 16px; }
.help-role-card li { font-size: 12.5px; color: var(--gray-600); line-height: 1.7; }

/* FAQ */
.help-faq { display: grid; gap: 8px; }
.help-faq-item {
  border: 1.5px solid var(--border);
  border-radius: var(--r-md);
  overflow: hidden;
  background: var(--surface);
  transition: border-color .15s;
}
.help-faq-item.open { border-color: var(--blue-200); }
.help-faq-q {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: transparent;
  border: none;
  border-radius: 0;
  text-align: left;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--gray-800);
  cursor: pointer;
  transition: background .15s;
  box-shadow: none;
}
.help-faq-q:hover { background: var(--gray-50); }
.help-faq-item.open .help-faq-q { background: var(--blue-50); color: var(--blue-800); }
.help-faq-icon { font-size: 16px; flex-shrink: 0; }
.help-faq-arrow { margin-left: auto; font-size: 14px; color: var(--gray-400); flex-shrink: 0; }
.help-faq-item.open .help-faq-arrow { color: var(--blue-600); }

.help-faq-a {
  padding: 0 16px 16px 42px;
  background: var(--blue-50);
  border-top: 1px solid var(--blue-100);
}
.help-faq-a p {
  margin: 12px 0 0;
  font-size: 13.5px;
  color: var(--gray-700);
  line-height: 1.65;
}

/* Steps */
.help-faq-steps { margin-top: 12px; display: grid; gap: 6px; }
.help-faq-step {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--gray-700);
}
.help-step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--blue-700);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

/* Empty */
.help-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--gray-400);
}
.help-empty span { font-size: 36px; display: block; margin-bottom: 10px; }
.help-empty p { margin: 0; font-size: 14px; }

/* Support */
.help-support-block {
  background: var(--gray-50);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 22px;
}
.help-support-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
.help-support-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 16px;
}
.help-support-icon { font-size: 26px; flex-shrink: 0; }
.help-support-card strong { display: block; font-size: 13px; color: var(--gray-800); margin-bottom: 4px; }
.help-support-card p { margin: 0 0 8px; font-size: 12.5px; color: var(--gray-500); line-height: 1.5; }
.help-support-link {
  font-size: 12.5px;
  color: var(--blue-700);
  font-weight: 700;
  text-decoration: none;
}
.help-support-link:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .help-header { flex-direction: column; }
  .help-search { width: 100%; }
  .help-roles-grid, .help-support-grid { grid-template-columns: 1fr; }
  .help-faq-a { padding-left: 16px; }
}
</style>
