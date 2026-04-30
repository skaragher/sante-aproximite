<template>
  <main class="auth-wrap">
    <!-- Left brand panel -->
    <section class="auth-brand">
      <div class="auth-brand-logo">
        <img src="/logo-web.svg" alt="logo" />
      </div>
      <h1>Sante Aproximite</h1>
      <p>Plateforme de gestion et de pilotage des etablissements sanitaires.</p>
      <div class="auth-brand-features">
        <div class="auth-feature">
          <span class="auth-feature-icon">🏥</span>
          Localisation des centres de sante
        </div>
        <div class="auth-feature">
          <span class="auth-feature-icon">🚨</span>
          Gestion des alertes d'urgence
        </div>
        <div class="auth-feature">
          <span class="auth-feature-icon">📊</span>
          Suivi des performances sanitaires
        </div>
        <div class="auth-feature">
          <span class="auth-feature-icon">📝</span>
          Gestion des plaintes et evaluations
        </div>
      </div>
    </section>

    <!-- Right form panel -->
    <section class="auth-form-panel">
      <div class="auth-card">
        <div class="auth-card-header">
          <h2>Connexion</h2>
          <p>Entrez vos identifiants pour acceder a la plateforme.</p>
        </div>

        <form @submit.prevent="submit" class="form-grid">
          <div class="form-field">
            <label for="login-email">Adresse email</label>
            <input
              id="login-email"
              v-model="form.email"
              type="email"
              placeholder="vous@exemple.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-field">
            <label for="login-password">Mot de passe</label>
            <input
              id="login-password"
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
          </div>

          <p v-if="error" class="error">{{ error }}</p>

          <div class="form-actions">
            <button class="btn-full" :disabled="loading">
              {{ loading ? "Connexion en cours..." : "Se connecter" }}
            </button>
          </div>
        </form>

        <div class="auth-footer">
          Pas encore de compte ?
          <router-link to="/register">Creer un compte</router-link>
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

const form = reactive({ email: "", password: "" });
const error = ref("");
const loading = ref(false);

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    const data = await apiFetch("/auth/login", { method: "POST", body: form });
    login(data);
    router.push("/");
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>
