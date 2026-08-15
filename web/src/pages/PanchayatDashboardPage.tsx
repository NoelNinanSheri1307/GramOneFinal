import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  getIssues,
  getImpactCases,
  fetchEmployeesList,
  fetchAttendanceHistory,
  IssueResponse,
  ImpactCaseResponse,
  EmployeeItem,
  AttendanceRecord,
} from "../lib/api";
import { seedDemoData } from "../lib/demoSeed";
import { StatusBadge } from "../components/StatusBadge";
import { CategoryBadge } from "../components/CategoryBadge";
import { pageFade, buttonTap } from "../lib/motion";
import { formatDate } from "../lib/formatters";
import { getLocalizedText } from "../lib/localize";
import { enrichIssueList } from "../lib/translations";
import {
  Clock,
  Wrench,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Award,
  Users,
} from "lucide-react";

export const PanchayatDashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [issues, setIssues] = useState<IssueResponse[]>([]);
  const [impactCases, setImpactCases] = useState<ImpactCaseResponse[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterQueue, setFilterQueue] = useState("");
  const rawIssuesRef = useRef<IssueResponse[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [issuesRes, impactRes, empRes, attRes] = await Promise.all([
        getIssues({ limit: 50 }),
        getImpactCases({ limit: 10 }),
        fetchEmployeesList().catch(() => []),
        fetchAttendanceHistory().catch(() => []),
      ]);
      rawIssuesRef.current = issuesRes.items;
      setIssues(await enrichIssueList(issuesRes.items, i18n.language));
      setImpactCases(impactRes.items);
      setEmployees(empRes);
      setAttendance(attRes);
    } catch (err: any) {
      setError(err?.message || "Failed to load Panchayat dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  // Re-enrich issues (no reload) when the UI language changes.
  useEffect(() => {
    let active = true;
    if (rawIssuesRef.current.length > 0) {
      enrichIssueList(rawIssuesRef.current, i18n.language).then((enriched) => {
        if (active) setIssues(enriched);
      });
    }
    return () => {
      active = false;
    };
  }, [i18n.language]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSeedDemo = async () => {
    setSeedLoading(true);
    try {
      await seedDemoData();
      await fetchDashboardData();
    } catch (err: any) {
      setError("Failed to seed demo data: " + (err?.message || "Unknown error"));
    } finally {
      setSeedLoading(false);
    }
  };

  const totalOpen = issues.filter((i) =>
    ["reported", "ai_processed", "correlated", "open"].includes(i.status)
  ).length;
  const inProgress = issues.filter((i) =>
    ["prioritized", "assigned", "in_progress"].includes(i.status)
  ).length;
  const resolved = issues.filter((i) =>
    ["resolved", "impact_verified"].includes(i.status)
  ).length;

  const filteredIssues = issues.filter((issue) => {
    if (filterCategory && issue.category !== filterCategory) return false;
    if (filterStatus && issue.status !== filterStatus) return false;
    
    if (filterQueue) {
      if (filterQueue === "immediate") {
        const isUrgent = issue.category === "disaster" || issue.source === "hardware" || issue.status === "reported";
        if (!isUrgent) return false;
      } else if (filterQueue === "assignment") {
        if (issue.assigned_to) return false;
        if (!["reported", "ai_processed", "open"].includes(issue.status)) return false;
      } else if (filterQueue === "verification") {
        if (issue.status !== "field_completed" && issue.status !== "resolved") return false;
      } else if (filterQueue === "awaiting") {
        if (!["assigned", "in_progress"].includes(issue.status)) return false;
      } else if (filterQueue === "resolved") {
        if (issue.status !== "resolved" && issue.status !== "impact_verified") return false;
      }
    }
    return true;
  });

  return (
    <motion.div
      variants={pageFade}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      {/* ── Panchayat Header Banner ── */}
      <div
        className="card hero-pattern"
        style={{
          background: "linear-gradient(135deg, var(--sdg-civic-glow) 0%, var(--bg-card) 100%)",
          borderColor: "rgba(109,40,217,0.2)",
          padding: "1.25rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <span
            className="badge"
            style={{
              backgroundColor: "var(--sdg-civic-light)",
              color: "var(--sdg-civic)",
              fontWeight: 800,
              fontSize: "0.75rem",
              marginBottom: "0.35rem",
            }}
          >
            {t("panchayat.portalBadge", { defaultValue: "Panchayat Official Portal" })}
          </span>
          <h1 style={{ fontSize: "1.65rem", color: "var(--text-main)", marginBottom: "0.2rem" }}>
            {t("panchayat.title", { defaultValue: "Gram Panchayat Administration" })}
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-subtle)", maxWidth: "620px" }}>
            {t("panchayat.subtitle", { defaultValue: "Review citizen problem reports, monitor IoT physical water telemetry, update status timelines, and aggregate correlated issues into Impact Cases." })}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <motion.div whileTap={buttonTap}>
            <Link
              to="/panchayat/community"
              className="btn btn-secondary btn-sm"
              aria-label={t("nav.communityManage", { defaultValue: "Community management" })}
            >
              <span>{t("nav.communityManage", { defaultValue: "Community management" })}</span>
            </Link>
          </motion.div>
          <motion.div whileTap={buttonTap}>
            <Link
              to="/panchayat/create-impact-case"
              className="btn btn-primary btn-sm"
              aria-label={t("panchayat.createImpactBtn", { defaultValue: "Create impact case" })}
              style={{ backgroundColor: "var(--sdg-civic)", borderColor: "var(--sdg-civic)" }}
            >
              <Award size={16} />
              <span>{t("panchayat.createImpactBtn", { defaultValue: "Create impact case" })}</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* ── Panchayat Stat Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {[
          { icon: Clock, count: loading ? "…" : totalOpen, label: t("dashboard.openIssues", { defaultValue: "Open Issues" }), iconBg: "#eff6ff", iconColor: "#1d4ed8" },
          { icon: Wrench, count: loading ? "…" : inProgress, label: t("dashboard.inProgress", { defaultValue: "In Progress" }), iconBg: "#fefce8", iconColor: "#a16207" },
          { icon: CheckCircle2, count: loading ? "…" : resolved, label: t("dashboard.resolved", { defaultValue: "Resolved" }), iconBg: "#f0fdf4", iconColor: "#15803d" },
          { icon: Award, count: loading ? "…" : impactCases.length, label: t("nav.impactCases", { defaultValue: "Impact Cases" }), iconBg: "var(--sdg-civic-light)", iconColor: "var(--sdg-civic)" },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: stat.iconBg, color: stat.iconColor }}>
                <stat.icon size={22} />
              </div>
              <div>
                <div className="stat-value">{stat.count}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Citizen Reports for Review ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "0.15rem" }}>
              {t("panchayat.reportsTitle", { defaultValue: "Citizen problem reports for review" })}
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-subtle)" }}>
              {t("panchayat.reportsSubtitle", { defaultValue: "Select a report to verify, assign Panchayat officers, or update resolution progress." })}
            </p>
          </div>
          <button
            onClick={handleSeedDemo}
            disabled={seedLoading}
            className="btn btn-secondary btn-sm"
            aria-label={t("panchayat.seedReports", { defaultValue: "Seed demo reports" })}
          >
            <span>{seedLoading ? t("dashboard.seeding", { defaultValue: "Seeding…" }) : t("panchayat.seedReports", { defaultValue: "Seed demo reports" })}</span>
          </button>
        </div>

        {/* Queue and Category Filters */}
        <div className="card" style={{ padding: "0.75rem 1rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
            <select
              className="form-select"
              style={{ width: "auto", flex: 1, minWidth: "160px" }}
              value={filterQueue}
              onChange={(e) => setFilterQueue(e.target.value)}
              aria-label="Queue Filter"
            >
              <option value="">All Action Queues</option>
              <option value="immediate">Needs Immediate Attention</option>
              <option value="assignment">Needs Assignment</option>
              <option value="verification">Field Verification Required</option>
              <option value="awaiting">Awaiting Resolution</option>
              <option value="resolved">Recently Resolved</option>
            </select>

            <select
              className="form-select"
              style={{ width: "auto", flex: 1, minWidth: "160px" }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              aria-label="Category Filter"
            >
              <option value="">All Categories</option>
              <option value="water">Water & Sanitation</option>
              <option value="education">Education</option>
              <option value="civic">Civic / Infrastructure</option>
              <option value="agriculture">Agriculture</option>
              <option value="health">Healthcare</option>
              <option value="waste">Waste Management</option>
              <option value="environment">Environment / Climate</option>
              <option value="disaster">Disaster Management</option>
              <option value="safety">Women's Safety</option>
            </select>

            <select
              className="form-select"
              style={{ width: "auto", flex: 1, minWidth: "160px" }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Status Filter"
            >
              <option value="">All Statuses</option>
              <option value="reported">Reported</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="card" style={{ height: "88px" }}>
                <div className="skeleton" style={{ height: "18px", width: "55%", marginBottom: "10px" }} />
                <div className="skeleton" style={{ height: "13px", width: "35%" }} />
              </div>
            ))}
          </div>
        )}

        {!loading && filteredIssues.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem" }}>{t("panchayat.noReportsTitle", { defaultValue: "No reports match selected filters" })}</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-subtle)", margin: "0.35rem 0 1rem 0" }}>
              {t("panchayat.noReportsFilterDesc", { defaultValue: "Try changing or clearing your filters to see more reports." })}
            </p>
          </div>
        )}

        {!loading && filteredIssues.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filteredIssues.map((issue) => {
              const localizedTitle = getLocalizedText(issue.title, i18n.language);
              const villageName = issue.village?.name ? getLocalizedText(issue.village.name, i18n.language) : "Rampur";
              const villageStr = `${villageName} ${t("dashboard.panchayatSuffix", { defaultValue: "Panchayat" })}`;

              return (
                <motion.div key={issue.id} whileHover={{ y: -1, boxShadow: "var(--shadow-md)" }} transition={{ duration: 0.12 }}>
                  <Link
                    to={`/panchayat/issues/${issue.id}`}
                    className="card card-hover card-issue-row"
                    style={{
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                      flexWrap: "wrap",
                      padding: "1rem 1.25rem",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "260px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                        <CategoryBadge category={issue.category} />
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", fontWeight: 700 }}>
                          {issue.reference || `#${issue.id}`}
                        </span>
                      </div>
                      <h3 style={{ fontSize: "var(--text-base)", color: "var(--text-main)", fontWeight: 700 }}>
                        {localizedTitle}
                      </h3>
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--text-subtle)", marginTop: "0.5rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        <span>{villageStr}</span>
                        <span style={{ opacity: 0.5 }}>•</span>
                        <span>{t("dashboard.updated", { defaultValue: "Updated" })} {formatDate(issue.updated_at || issue.created_at, i18n.language)}</span>
                        {issue.assigned_to && (
                          <>
                            <span style={{ opacity: 0.5 }}>•</span>
                            <span>{t("panchayat.officer", { defaultValue: "Assigned:" })} {issue.assigned_to.name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="status-pill-container" style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                      <StatusBadge status={issue.status} />
                      <ArrowRight size={16} color="var(--text-faint)" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Employee Roster & RFID Attendance Widget Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        
        {/* Left Column: Panchayat Field Employee Roster */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Users size={20} color="var(--primary-600)" />
            <h2 style={{ fontSize: "1.15rem", margin: 0 }}>
              {t("panchayat.employeesTitle", { defaultValue: "Field Employee Roster" })}
            </h2>
          </div>
          {employees.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "var(--text-subtle)", fontStyle: "italic", margin: 0 }}>
              {t("panchayat.noEmployees", { defaultValue: "No registered field workers found." })}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {employees.map((emp) => (
                <div key={emp.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-main)" }}>{emp.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)" }}>{emp.email}</div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      backgroundColor: emp.last_attendance_status === "SIGNED_IN" ? "var(--primary-50)" : "var(--bg-muted)",
                      color: emp.last_attendance_status === "SIGNED_IN" ? "var(--primary-700)" : "var(--text-muted)",
                    }}
                  >
                    {emp.last_attendance_status === "SIGNED_IN" ? "SIGNED IN" : "OFFLINE"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent RFID Attendance Log */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Clock size={20} color="var(--sdg-civic)" />
            <h2 style={{ fontSize: "1.15rem", margin: 0 }}>
              {t("panchayat.attendanceTitle", { defaultValue: "RFID Live Attendance Log" })}
            </h2>
          </div>
          {attendance.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "var(--text-subtle)", fontStyle: "italic", margin: 0 }}>
              {t("panchayat.noAttendance", { defaultValue: "No RFID clock-in events recorded today." })}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {attendance.slice(0, 5).map((att) => (
                <div key={att.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "start", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", fontSize: "0.85rem" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{att.user_name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", marginTop: "2px" }}>
                      Card ID: <code style={{ backgroundColor: "var(--bg-subtle)", padding: "1px 4px", borderRadius: "3px" }}>{att.rfid_card_id}</code>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "0.75rem" }}>
                    <div style={{ color: "var(--primary-700)", fontWeight: 600 }}>
                      IN: {formatDate(att.sign_in_time, i18n.language)}
                    </div>
                    {att.sign_out_time ? (
                      <div style={{ color: "var(--text-muted)", marginTop: "2px" }}>
                        OUT: {formatDate(att.sign_out_time, i18n.language)}
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#d97706", backgroundColor: "#fefce8", padding: "1px 6px", borderRadius: "3px", display: "inline-block", marginTop: "2px" }}>
                        ON DUTY
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Operational Analytics & Trends ── */}
      <div className="card" style={{ padding: "1.25rem", marginTop: "0.5rem" }}>
        <h2 style={{ fontSize: "1.15rem", marginBottom: "0.75rem", color: "var(--primary-900)" }}>
          {t("panchayat.analyticsTitle", { defaultValue: "Village Operational Analytics & SDG Trends" })}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          
          {/* Resolution & Volume */}
          <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", fontWeight: 700, textTransform: "uppercase" }}>Resolution Performance</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0.25rem 0", color: "var(--primary-700)" }}>
              {issues.length > 0 ? `${Math.round((resolved / issues.length) * 100)}%` : "0%"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-main)" }}>
              {resolved} resolved out of {issues.length} total reports.
            </div>
          </div>

          {/* Affected Population */}
          <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", fontWeight: 700, textTransform: "uppercase" }}>Affected Population Impact</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0.25rem 0", color: "var(--sdg-edu)" }}>
              {impactCases.reduce((sum, c) => sum + (c.affected_population || 0), 0).toLocaleString()}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-main)" }}>
              Total citizens with improved utility access.
            </div>
          </div>

          {/* Category Distribution */}
          <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", fontWeight: 700, textTransform: "uppercase" }}>Category Distribution</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "0.4rem" }}>
              {["water", "education", "civic", "safety"].map((cat) => {
                const count = issues.filter((i) => i.category === cat).length;
                return (
                  <div key={cat} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                    <span style={{ textTransform: "capitalize" }}>{cat}</span>
                    <span style={{ fontWeight: 700 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SDG Alignment */}
          <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", fontWeight: 700, textTransform: "uppercase" }}>SDG Impact Alignment</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "0.4rem" }}>
              {[
                { sdg: "SDG 6 (Water)", key: "SDG 6" },
                { sdg: "SDG 4 (Education)", key: "SDG 4" },
                { sdg: "SDG 11 (Civic)", key: "SDG 11" },
                { sdg: "SDG 13 (Climate)", key: "SDG 13" },
              ].map((item) => {
                const count = issues.filter((i) =>
                  (item.key === "SDG 6" && i.category === "water") ||
                  (item.key === "SDG 4" && i.category === "education") ||
                  (item.key === "SDG 11" && (i.category === "civic" || i.category === "sanitation" || i.category === "waste")) ||
                  (item.key === "SDG 13" && (i.category === "environment" || i.category === "disaster"))
                ).length;
                return (
                  <div key={item.key} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                    <span>{item.sdg}</span>
                    <span style={{ fontWeight: 700 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

    </motion.div>
  );
};
