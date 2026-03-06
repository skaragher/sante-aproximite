const FALLBACK_API_URL = "http://127.0.0.1:5000/api";
const API_URL = (import.meta.env.VITE_API_URL || FALLBACK_API_URL).replace(/\/+$/, "");

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

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Erreur API");
    error.data = data;
    throw error;
  }
  return data;
}
