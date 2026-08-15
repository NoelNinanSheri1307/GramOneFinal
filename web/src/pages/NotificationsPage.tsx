import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, Check, Inbox, CheckSquare, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NotificationResponse,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";

export const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(15);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const isReadParam = filter === "unread" ? false : undefined;
      const data = await getNotifications({
        limit,
        offset,
        is_read: isReadParam,
      });
      setNotifications(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
      setError(t("notifications.fetchError", { defaultValue: "Failed to load notifications. Please try again." }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [offset, filter]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (item: NotificationResponse) => {
    if (!item.is_read) {
      markNotificationAsRead(item.id).catch(console.error);
    }

    if (!item.payload || !item.payload.target_id || !item.payload.target_type) {
      return;
    }

    const { target_id, target_type } = item.payload;

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

  const renderMessage = (item: NotificationResponse) => {
    if (item.payload && item.payload.i18nKey) {
      return t(item.payload.i18nKey, {
        defaultValue: item.message || item.title,
        ...item.payload.i18nParams,
      });
    }
    return item.message || item.title;
  };

  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ maxWidth: "768px", margin: "1.5rem auto", padding: "0 1rem" }}>
      {/* Title & Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Bell size={24} style={{ color: "var(--primary-600)" }} />
            {t("notifications.title", { defaultValue: "Notifications" })}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted, #64748b)", margin: "4px 0 0 0" }}>
            {t("notifications.subtitle", { defaultValue: "Central notification center for GramOne events." })}
          </p>
        </div>

        {notifications.some(n => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="btn btn-secondary btn-sm"
            style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            <CheckSquare size={15} />
            <span>{t("notifications.markAllRead", { defaultValue: "Mark all as read" })}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border-color)",
          marginBottom: "1rem",
          gap: "1rem",
        }}
      >
        <button
          onClick={() => {
            setFilter("all");
            setOffset(0);
          }}
          style={{
            padding: "0.5rem 0.25rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            background: "none",
            border: "none",
            borderBottom: filter === "all" ? "2px solid var(--primary-600)" : "2px solid transparent",
            color: filter === "all" ? "var(--primary-600)" : "var(--text-muted, #64748b)",
            cursor: "pointer",
          }}
        >
          {t("notifications.tabs.all", { defaultValue: "All" })}
        </button>
        <button
          onClick={() => {
            setFilter("unread");
            setOffset(0);
          }}
          style={{
            padding: "0.5rem 0.25rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            background: "none",
            border: "none",
            borderBottom: filter === "unread" ? "2px solid var(--primary-600)" : "2px solid transparent",
            color: filter === "unread" ? "var(--primary-600)" : "var(--text-muted, #64748b)",
            cursor: "pointer",
          }}
        >
          {t("notifications.tabs.unread", { defaultValue: "Unread" })}
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <span className="skeleton" style={{ display: "inline-block", width: "100%", height: "20px", marginBottom: "12px" }} />
            <span className="skeleton" style={{ display: "inline-block", width: "90%", height: "20px", marginBottom: "12px" }} />
            <span className="skeleton" style={{ display: "inline-block", width: "70%", height: "20px" }} />
          </div>
        ) : error ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#dc2626" }}>
            <p>{error}</p>
            <button onClick={fetchNotifications} className="btn btn-secondary btn-sm" style={{ marginTop: "1rem" }}>
              {t("dashboard.retry", { defaultValue: "Retry" })}
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              padding: "4rem 2rem",
              textAlign: "center",
              color: "var(--text-muted, #64748b)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <Inbox size={36} strokeWidth={1.5} />
            <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>
              {t("notifications.emptyState", { defaultValue: "No notifications yet" })}
            </span>
          </div>
        ) : (
          <div>
            {notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                style={{
                  padding: "1rem 1.25rem",
                  borderBottom: "1px solid var(--border-color)",
                  backgroundColor: item.is_read ? "#ffffff" : "var(--primary-25, #f0f9ff)",
                  cursor: "pointer",
                  display: "flex",
                  gap: "1rem",
                  transition: "background-color 0.15s ease",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: item.is_read ? 600 : 700,
                      color: "var(--text-color)",
                      marginBottom: "4px",
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: "0.825rem",
                      color: "var(--text-muted, #475569)",
                      lineHeight: 1.4,
                    }}
                  >
                    {renderMessage(item)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#94a3b8",
                      marginTop: "6px",
                    }}
                  >
                    {new Date(item.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {!item.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(item.id);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                      title={t("notifications.markAsRead", { defaultValue: "Mark as read" })}
                    >
                      <Check size={14} />
                    </button>
                  )}
                  {item.payload && item.payload.target_id && (
                    <ExternalLink size={14} style={{ color: "#cbd5e1" }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "1.5rem",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted, #64748b)" }}>
            Showing page {page} of {totalPages} ({total} total)
          </span>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="btn btn-secondary btn-sm"
              style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="btn btn-secondary btn-sm"
              style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
