"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  fetchNotifications,
  fetchUnreadNotifications,
  markAllNotificationsRead,
} from "../../services/notificationService";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const router = useRouter();
notificatiiiii
  const loadNotifications = async () => {
    setLoading(true);

    try {
      const [unreadList, allList] = await Promise.all([
        fetchUnreadNotifications(),
        fetchNotifications(),
      ]);

      setUnreadCount(unreadList.length);
      setNotifications(allList);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsRead();
    setUnreadCount(0);
    loadNotifications();
  };

  const handleBellClick = () => {
    if (window.innerWidth < 768) {
      router.push("/notifications");
    } else {
      setOpen((prev) => !prev);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" style={{ isolation: "isolate" }}>
      {/* Bell */}
      <button
        ref={buttonRef}
        onClick={handleBellClick}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
      >
        <Bell size={16} />

        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-[#0D1F1A]"
            style={{
              background:
                "linear-gradient(135deg, #C8873A, #E8A850)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden shadow-2xl bg-[#0f2820] border border-white/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-amber-500" />
              <span className="font-bold text-white text-sm">
                Notifications
              </span>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-xs text-white/30 hover:text-emerald-400 transition-colors"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-10 flex justify-center">
                <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-white/30 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications
                .slice(0, 10)
                .map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                      !n.read_at
                        ? "border-l-2 border-l-amber-500/60"
                        : ""
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        !n.read_at
                          ? "font-semibold text-white"
                          : "text-white/50"
                      }`}
                    >
                      {n.data?.message || "New activity"}
                    </p>

                    <p className="text-[11px] text-white/25 mt-1">
                      {new Date(n.created_at).toLocaleString(
                        "en-NG",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }
                      )}
                    </p>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}