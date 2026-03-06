<template>
  <main class="auth-wrap">
    <section class="auth-card">
      <h1>Inscription</h1>

      <form @submit.prevent="submit" class="form-grid">
        <input v-model="form.fullName" type="text" placeholder="Nom complet" required />
        <input v-model="form.email" type="email" placeholder="Email" required />
        <input v-model="form.password" type="password" placeholder="Mot de passe" required />
        <select v-model="form.role">
          <option value="USER">Utilisateur</option>
          <option value="NATIONAL">National</option>
          <option value="REGION">Region</option>
          <option value="DISTRICT">District</option>
          <option value="ETABLISSEMENT">Etablissement</option>
          <option value="SAPEUR_POMPIER">SAPEUR-POMPIER</option>
          <option value="SAMU">SAMU</option>
        </select>
        <input
          v-if="form.role === 'ETABLISSEMENT'"
          v-model="form.establishmentCode"
          type="text"
          placeholder="Code de l'etablissement"
          required
        />
        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ success }}</p>
        <button :disabled="loading">{{ loading ? "Inscription..." : "S'inscrire" }}</button>
      </form>

      <router-link to="/login">Deja un compte</router-link>
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
