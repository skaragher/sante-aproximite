const FALLBACK_API_URL = "http://193.168.173.181:8081/api";
const API_URL = (import.meta.env.VITE_API_URL || FALLBACK_API_URL).replace(/\/+$/, "");

const TOKEN_KEY = "sante_web_token";
const USER_KEY = "sante_web_user";

function clearSessionAndRedirect() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export async function apiFetch(path, { token, method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
  } catch {
    throw new Error("Impossible de joindre l'API. Verifiez Internet et l'adresse du backend.");
  }

  const isJsonResponse = String(response.headers.get("content-type") || "").includes("application/json");
  const data = isJsonResponse ? await response.json().catch(() => ({})) : {};
  if (!response.ok) {
    let message = data.message;
    if (!message) {
      if (response.status === 404) {
        message = `Endpoint introuvable (${method.toUpperCase()} ${path}). Verifiez le deploiement du backend.`;
      } else if (response.status === 403) {
        message = "Acces refuse pour cette action.";
      } else if (response.status === 401) {
        message = "Session expiree. Reconnectez-vous.";
        clearSessionAndRedirect();
      } else if (response.status >= 500) {
        message = "Erreur serveur. Reessayez dans quelques instants.";
      } else {
        message = `Erreur API (${response.status})`;
      }
    }
    const error = new Error(message);
    error.data = data;
    error.status = response.status;
    error.path = path;
    throw error;
  }
  return data;
}
