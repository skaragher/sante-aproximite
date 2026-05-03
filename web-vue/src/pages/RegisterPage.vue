<template>
  <main class="auth-wrap">
    <!-- Left brand panel -->
    <section class="auth-brand">
      <div class="auth-brand-logo">
        <img src="/logo-web.svg" alt="logo" />
      </div>
      <h1>Sante Aproximite</h1>
      <p>Rejoignez la plateforme nationale de gestion et de pilotage des etablissements sanitaires.</p>
      <div class="auth-brand-features">
        <div class="auth-feature">
          <span class="auth-feature-icon">🏥</span>
          Acces aux centres de sante proches
        </div>
        <div class="auth-feature">
          <span class="auth-feature-icon">🚨</span>
          Coordination des urgences medicales
        </div>
        <div class="auth-feature">
          <span class="auth-feature-icon">📊</span>
          Pilotage des indicateurs sanitaires
        </div>
        <div class="auth-feature">
          <span class="auth-feature-icon">🔒</span>
          Acces securise par profil de role
        </div>
      </div>
    </section>

    <!-- Right form panel -->
    <section class="auth-form-panel">
      <div class="auth-card">
        <div class="auth-card-header">
          <h2>Creer un compte</h2>
          <p>Remplissez le formulaire pour demander votre acces a la plateforme.</p>
        </div>

        <form @submit.prevent="submit" class="form-grid">
          <div class="form-field">
            <label for="reg-name">Nom complet</label>
            <input
              id="reg-name"
              v-model="form.fullName"
              type="text"
              placeholder="Prenom Nom"
              required
              autocomplete="name"
            />
          </div>

          <div class="form-field">
            <label for="reg-email">Adresse email</label>
            <input
              id="reg-email"
              v-model="form.email"
              type="email"
              placeholder="vous@exemple.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-field">
            <label for="reg-password">Mot de passe</label>
            <input
              id="reg-password"
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              required
              autocomplete="new-password"
            />
          </div>

          <div class="form-field">
            <label for="reg-role">Role</label>
            <select id="reg-role" v-model="form.role">
              <option value="USER">Utilisateur</option>
              <option value="NATIONAL">National</option>
              <option value="REGION">Region</option>
              <option value="DISTRICT">District</option>
              <option value="ETABLISSEMENT">Etablissement</option>
              <option value="SAPEUR_POMPIER">Sapeur-Pompier</option>
              <option value="SAMU">SAMU</option>
              <option value="POLICE">Police</option>
              <option value="GENDARMERIE">Gendarmerie</option>
              <option value="PROTECTION_CIVILE">Protection Civile</option>
              <option value="DEVELOPER">Développeur</option>
            </select>
          </div>

          <div v-if="form.role === 'ETABLISSEMENT'" class="form-field">
            <label for="reg-code">Code de l'etablissement</label>
            <input
              id="reg-code"
              v-model="form.establishmentCode"
              type="text"
              placeholder="Ex: ETB-001"
              required
            />
          </div>

          <p v-if="error" class="error">{{ error }}</p>
          <p v-if="success" class="success">{{ success }}</p>

          <div class="form-actions">
            <button class="btn-full" :disabled="loading">
              {{ loading ? "Inscription en cours..." : "S'inscrire" }}
            </button>
          </div>
        </form>

        <div class="auth-footer">
          Deja un compte ?
          <router-link to="/login">Se connecter</router-link>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { apiFetch } from "../api/client";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const { login } = useAuthStore();

const form = reactive({ fullName: "", email: "", password: "", role: "USER", establishmentCode: "" });
const error = ref("");
const success = ref("");
const loading = ref(false);

async function submit() {
  error.value = "";
  success.value = "";
  loading.value = true;
  try {
    const data = await apiFetch("/auth/register", { method: "POST", body: form });
    if (data.pendingApproval) {
      success.value = data.message || "Compte en attente de validation";
      form.fullName = "";
      form.email = "";
      form.password = "";
      form.role = "USER";
      form.establishmentCode = "";
      return;
    }
    login(data);
    router.push("/");
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>
