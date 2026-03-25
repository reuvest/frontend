const COOKIE_NAME = "auth_token";
const ROLE_COOKIE = "user_role";

/** Derive TTL from env; default 24 h */
function ttlMs() {
  const minutes = parseInt(process.env.NEXT_PUBLIC_JWT_TTL_MINUTES ?? "1440", 10);
  return (isNaN(minutes) ? 1440 : minutes) * 60 * 1000;
}

function write(name, value, ms) {
  const expires = new Date(Date.now() + ms).toUTCString();
  // SameSite=Lax is safe for same-origin SPAs; upgrade to Strict if you don't
  // need cross-site form-post flows.
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

function read(name) {
  if (typeof document === "undefined") return null; // SSR guard
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function erase(name) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getToken() {
  return read(COOKIE_NAME);
}

export function setToken(token, role = "user") {
  const ms = ttlMs();
  write(COOKIE_NAME, token, ms);
  write(ROLE_COOKIE, role, ms);
}

export function clearToken() {
  erase(COOKIE_NAME);
  erase(ROLE_COOKIE);
}

export function getRole() {
  return read(ROLE_COOKIE) ?? "user";
}