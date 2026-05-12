import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_URL;
const isDev = import.meta.env.DEV;

if (!rawBaseUrl && !isDev) {
  throw new Error(
    "Missing VITE_API_URL. Set it in your hosting provider (e.g., Vercel) so the frontend can reach the backend.",
  );
}

const baseURL = String(rawBaseUrl || "http://localhost:8000").replace(
  /\/+$/,
  "",
);

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// INTERCEPTOR DE PETICIÓN (Lo que ya tienes)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    const url = String(config.url || "");
    const isAuthEndpoint =
      url.startsWith("/usuarios/login/") ||
      url.startsWith("/usuarios/registro/") ||
      url.startsWith("/usuarios/token/");

    if (token && token !== "null" && token !== "undefined" && !isAuthEndpoint) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// INTERCEPTOR DE RESPUESTA (Lo que te falta para evitar el 401 infinito)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el servidor responde 401, significa que el token de localStorage ya no sirve
    if (error.response && error.response.status === 401) {
      console.warn("Token expirado o inválido. Limpiando sesión...");

      localStorage.removeItem("access_token"); // Borra el token culpable

      // Opcional: Redirigir al usuario al login automáticamente
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
