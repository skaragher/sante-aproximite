import { reactive } from "vue";

const TOKEN_KEY = "sante_web_token";
const USER_KEY = "sante_web_user";

const state = reactive({
  token: localStorage.getItem(TOKEN_KEY) || "",
  user: (() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  })()
});

export function useAuthStore() {
  function login(payload) {
    state.token = payload.token;
    state.user = payload.user;
    localStorage.setItem(TOKEN_KEY, payload.token);
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  }

  function logout() {
    state.token = "";
    state.user = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  return { state, login, logout };
}
