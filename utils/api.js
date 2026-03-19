import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Track whether a refresh is already in progress to avoid parallel refresh calls
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
};

const SKIP_REFRESH_URLS = ["/me", "/login", "/refresh", "/logout"];

const shouldSkipRefresh = (url = "") =>
  SKIP_REFRESH_URLS.some((path) => url.includes(path));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !originalRequest._retry &&
      !shouldSkipRefresh(originalRequest.url)
    ) {
      const token = localStorage.getItem("token");

      // No token at all — not logged in
      if (!token) {
        window.location.href = "/login";
        return Promise.reject(error);
      }

      // Queue parallel requests while refresh is in progress
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/refresh`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000,
          }
        );

        const newToken = res.data?.access_token || res.data?.token;
        if (!newToken) throw new Error("No token in refresh response");

        localStorage.setItem("token", newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear everything and force re-login
        processQueue(refreshError, null);
        localStorage.removeItem("token");
        delete api.defaults.headers.common.Authorization;
        // Use replace so the user can't go "back" to the broken state
        window.location.replace("/login");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;