import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { pageFade } from "../lib/motion";
import {
  getCurrentUserProfile,
  getIssues,
  fetchAttendanceHistory,
  UserProfileResponse,
  IssueResponse,
  AttendanceRecord,
} from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";
import { CategoryBadge } from "../components/CategoryBadge";
import { formatDate } from "../lib/formatters";
import { getLocalizedText } from "../lib/localize";
import {
  UserCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  QrCode,
} from "lucide-react";

export const EmployeeDashboardPage: React.FC = () => {
  const { i18n } = useTranslation();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [assignedIssues, setAssignedIssues] = useState<IssueResponse[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profRes, issuesRes, attRes] = await Promise.all([
        getCurrentUserProfile().catch(() => null),
        getIssues({ limit: 50 }),
        fetchAttendanceHistory().catch(() => []),
      ]);
      setProfile(profRes);
      setAssignedIssues(issuesRes.items);
      setAttendanceList(attRes);
    } catch (err: any) {
      setError(err?.message || "Failed to load employee dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const latestAttendance = attendanceList.length > 0 ? attendanceList[0] : null;
  const isSignedIn = latestAttendance && !latestAttendance.sign_out_time;

  const pendingInspections = assignedIssues.filter((i) => i.status === "assigned");
  const inProgressIssues = assignedIssues.filter((i) => i.status === "in_progress");
  const completedIssues = assignedIssues.filter((i) => i.status === "field_completed" || i.status === "resolved");

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "1024px", margin: "0 auto" }}>
        <div className="skeleton" style={{ height: "120px", width: "100%" }} />
        <div className="skeleton" style={{ height: "240px", width: "100%" }} />
      </div>
    );
  }

  return (
    <motion.div
      variants={pageFade}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: "1024px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      {/* Employee Identity Header Banner */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          color: "#ffffff",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <UserCheck size={24} color="#38bdf8" />
            <h1 style={{ fontSize: "1.4rem", margin: 0, color: "#ffffff" }}>
              {profile?.name || "Panchayat Field Employee"}
            </h1>
          </div>
          <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
            Role: Panchayat Field Worker • {profile?.email}
          </div>
        </div>

        {/* Attendance Status Pill */}
        <div
          style={{
            backgroundColor: isSignedIn ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${isSignedIn ? "#10b981" : "#ef4444"}`,
            padding: "0.5rem 1rem",
            borderRadius: "9999px",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <QrCode size={18} color={isSignedIn ? "#34d399" : "#f87171"} />
          <div>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#94a3b8" }}>
              RFID Sign-In Status
            </div>
            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: isSignedIn ? "#34d399" : "#f87171" }}>
              {isSignedIn ? "SIGNED IN (Active Duty)" : "OFFLINE / Signed Out"}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Summary Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-700)" }}>{assignedIssues.length}</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-subtle)" }}>Total Assigned Tasks</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#d97706" }}>{pendingInspections.length}</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-subtle)" }}>Pending Accept/Inspect</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#2563eb" }}>{inProgressIssues.length}</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-subtle)" }}>In Field Work</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#059669" }}>{completedIssues.length}</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-subtle)" }}>Field Completed</div>
        </div>
      </div>

      {/* Main Issues Queue */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Assigned Field Work Orders</h2>
          <button type="button" onClick={loadData} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Refresh Workload
          </button>
        </div>

        {assignedIssues.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-subtle)" }}>
            <CheckCircle size={36} color="#059669" style={{ marginBottom: "0.5rem" }} />
            <p>No active field tasks assigned to you currently.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {assignedIssues.map((issue) => {
              const localizedTitle = getLocalizedText(issue.title, i18n.language);
              return (
                <div
                  key={issue.id}
                  style={{
                    padding: "1rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-card)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <CategoryBadge category={issue.category} />
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-subtle)" }}>
                        {issue.reference || `#${issue.id}`}
                      </span>
                    </div>
                    <StatusBadge status={issue.status} />
                  </div>

                  <Link
                    to={`/employee/issues/${issue.id}`}
                    style={{ textDecoration: "none", color: "var(--text-main)", fontSize: "1.05rem", fontWeight: 700 }}
                  >
                    {localizedTitle}
                  </Link>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-subtle)", marginTop: "0.25rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <Clock size={14} /> {formatDate(issue.created_at, i18n.language)}
                    </span>
                    <Link to={`/employee/issues/${issue.id}`} className="btn btn-primary btn-sm">
                      Inspect & Action →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};
