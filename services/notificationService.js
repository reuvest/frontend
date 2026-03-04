import api from "../utils/api";

let unreadCache = null;
let allCache = null;
let unreadPromise = null;
let allPromise = null;

/* ================================
   Fetch ALL notifications 
================================ */
export function fetchNotifications(force = false) {
  if (allCache && !force) return Promise.resolve(allCache);
  if (allPromise && !force) return allPromise;

  allPromise = api
    .get("/notifications")
    .then((res) => {
      // Laravel paginator → notifications.data
      const list = res?.data?.notifications?.data ?? [];

      allCache = Array.isArray(list) ? list : [];
      allPromise = null;

      return allCache;
    })
    .catch((err) => {
      allPromise = null;
      throw err;
    });

  return allPromise;
}

/* ================================
   Fetch UNREAD notifications
================================ */
export function fetchUnreadNotifications(force = false) {
  if (unreadCache && !force) return Promise.resolve(unreadCache);
  if (unreadPromise && !force) return unreadPromise;

  unreadPromise = api
    .get("/notifications/unread")
    .then((res) => {
      const list = res?.data?.unread_notifications ?? [];

      unreadCache = Array.isArray(list) ? list : [];
      unreadPromise = null;

      return unreadCache;
    })
    .catch((err) => {
      unreadPromise = null;
      throw err;
    });

  return unreadPromise;
}

/* ================================
   Mark all read
================================ */
export async function markAllNotificationsRead() {
  await api.post("/notifications/read");
  resetNotificationCache();
  return true;
}

/* ================================
   Mark single read
================================ */
export async function markNotificationRead(notificationId) {
  await api.post(`/notifications/${notificationId}/read`);
  resetNotificationCache();
  return true;
}

/* ================================
   Reset cache
================================ */
export function resetNotificationCache() {
  unreadCache = null;
  allCache = null;
  unreadPromise = null;
  allPromise = null;
}