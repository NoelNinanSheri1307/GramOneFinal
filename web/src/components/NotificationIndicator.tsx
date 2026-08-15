import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, Check, ExternalLink, Inbox } from "lucide-react";
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NotificationResponse,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";

export const NotificationIndicator: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const data = await getUnreadNotificationsCount();
      setUnreadCount(data.count);
    } catch (err) {
      console.error("Failed to fetch unread notification count", err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications({ limit: 8 });
      setNotifications(data.items);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  // Poll for unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch list when dropdown is opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleNotificationClick = (item: NotificationResponse) => {
    setIsOpen(false);
    
    // Mark as read automatically when clicked
    if (!item.is_read) {
      markNotificationAsRead(item.id).then(() => {
        setUnreadCount((c) => Math.max(0, c - 1));
      }).catch(console.error);
    }

    if (!item.payload || !item.payload.target_id || !item.payload.target_type) {
      return;
    }

    const { target_id, target_type } = item.payload;

    // Direct routing based on target type
    if (target_type === "issue") {
      if (user?.role === "panchayat") {
        navigate(`/panchayat/issues/${target_id}`);
      } else if (user?.role === "panchayat_employee") {
        navigate(`/employee/issues/${target_id}`);
      } else {
        navigate(`/issues/${target_id}`);
      }
    } else if (target_type === "project") {
      if (user?.role === "csr") {
        navigate(`/csr/opportunities/${target_id}`);
      } else if (user?.role === "panchayat") {
        navigate("/panchayat/community");
      } else {
        navigate(`/community/schemes`);
      }
    } else if (target_type === "sponsorship") {
      if (user?.role === "csr") {
        navigate("/csr/sponsorships");
      } else {
        navigate("/panchayat");
      }
    } else if (target_type === "notice") {
      navigate(user?.role === "panchayat" ? "/panchayat/community" : `/community`);
    } else if (target_type === "scheme") {
      navigate(user?.role === "panchayat" ? "/panchayat/community" : `/community/schemes/${target_id}`);
    } else if (target_type === "safety_resource") {
      navigate(user?.role === "panchayat" ? "/panchayat/community" : `/community/safety`);
    }
  };

  // Render notification message using i18n keys or fallback message
  const renderNotificationMessage = (item: NotificationResponse) => {
    if (item.payload && item.payload.i18nKey) {
      // Dynamic interpolation using translation key
      return t(item.payload.i18nKey, {
        defaultValue: item.message || item.title,
        ...item.payload.i18nParams,
      });
    }
    return item.message || item.title;
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t("notifications.title", { defaultValue: "Notifications" })}
        className="btn btn-secondary btn-sm"
        style={{
          padding: "0.35rem 0.55rem",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "6px",
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              backgroundColor: "var(--primary-600)",
              color: "#ffffff",
              fontSize: "0.65rem",
              fontWeight: "bold",
              borderRadius: "50%",
              width: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: "320px",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "0.75rem 1rem",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "var(--primary-50, #f8fafc)",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-color)" }}>
              {t("notifications.title", { defaultValue: "Notifications" })}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary-600)",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {t("notifications.markAllRead", { defaultValue: "Mark all as read" })}
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: "320px", overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted, #64748b)" }}>
                <span className="skeleton" style={{ display: "inline-block", width: "100%", height: "20px", marginBottom: "8px" }} />
                <span className="skeleton" style={{ display: "inline-block", width: "80%", height: "20px" }} />
              </div>
            ) : notifications.length === 0 ? (
              <div
                style={{
                  padding: "2rem 1.5rem",
                  textAlign: "center",
                  color: "var(--text-muted, #64748b)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Inbox size={24} strokeWidth={1.5} />
                <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>
                  {t("notifications.emptyState", { defaultValue: "No notifications yet" })}
                </span>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid var(--border-color)",
                    backgroundColor: item.is_read ? "#ffffff" : "var(--primary-25, #f0f9ff)",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                    display: "flex",
                    gap: "0.75rem",
                    position: "relative",
                  }}
                  className="notification-item"
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: item.is_read ? 500 : 700,
                        color: "var(--text-color)",
                        marginBottom: "2px",
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted, #475569)",
                        lineHeight: 1.3,
                      }}
                    >
                      {renderNotificationMessage(item)}
                    </div>
                    <div
                      style={{
                        fontSize: "0.65rem",
                        color: "#94a3b8",
                        marginTop: "4px",
                      }}
                    >
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                    }}
                  >
                    {!item.is_read && (
                      <button
                        onClick={(e) => handleMarkAsRead(item.id, e)}
                        title={t("notifications.markAsRead", { defaultValue: "Mark as read" })}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--primary-600)",
                          cursor: "pointer",
                          padding: "2px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Check size={14} />
                      </button>
                    )}
                    {item.payload && item.payload.target_id && (
                      <ExternalLink size={10} style={{ color: "#cbd5e1", marginTop: "auto" }} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Link */}
          <Link
            to="/notifications"
            onClick={() => setIsOpen(false)}
            style={{
              display: "block",
              padding: "0.6rem",
              textAlign: "center",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--primary-700)",
              borderTop: "1px solid var(--border-color)",
              textDecoration: "none",
              backgroundColor: "var(--primary-50, #f8fafc)",
            }}
          >
            {t("notifications.viewAll", { defaultValue: "View all notifications" })}
          </Link>
        </div>
      )}
    </div>
  );
};
