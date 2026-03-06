<template>
  <main class="auth-wrap">
    <section class="auth-card">
      <h1>Sante Aproximite</h1>
      <p>Connexion</p>

      <form @submit.prevent="submit" class="form-grid">
        <input v-model="form.email" type="email" placeholder="Email" required />
        <input v-model="form.password" type="password" placeholder="Mot de passe" required />
        <p v-if="error" class="error">{{ error }}</p>
        <button :disabled="loading">{{ loading ? "Connexion..." : "Se connecter" }}</button>
      </form>

      <router-link to="/register">Creer un compte</router-link>
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
