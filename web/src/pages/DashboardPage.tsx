import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  getIssues,
  getNotifications,
  getNotices,
  getSchemes,
  getSafetyResources,
  IssueResponse,
  NotificationResponse,
  CommunityNoticeResponse,
  SchemeResponse,
  SafetyResourceResponse,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { CategoryBadge } from "../components/CategoryBadge";
import { seedDemoData } from "../lib/demoSeed";
import { pageFade, fadeUp, staggerContainer, staggerItem, buttonTap } from "../lib/motion";
import { formatDate } from "../lib/formatters";
import { getLocalizedText } from "../lib/localize";
import {
  enrichIssueList,
  enrichNotices,
  enrichSchemes,
  enrichSafetyResources,
} from "../lib/translations";
import {
  Clock,
  Wrench,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Bell,
  Newspaper,
  Landmark,
  ShieldCheck,
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [issues, setIssues] = useState<IssueResponse[]>([]);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [notices, setNotices] = useState<CommunityNoticeResponse[]>([]);
  const [schemes, setSchemes] = useState<SchemeResponse[]>([]);
  const [safetyResources, setSafetyResources] = useState<SafetyResourceResponse[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);

  const rawIssuesRef = useRef<IssueResponse[]>([]);
  const rawNotificationsRef = useRef<NotificationResponse[]>([]);
  const rawNoticesRef = useRef<CommunityNoticeResponse[]>([]);
  const rawSchemesRef = useRef<SchemeResponse[]>([]);
  const rawSafetyRef = useRef<SafetyResourceResponse[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [issuesRes, notifRes, noticesRes, schemesRes, safetyRes] = await Promise.all([
        getIssues({ limit: 5 }),
        getNotifications({ limit: 3 }).catch(() => ({ items: [], total: 0, limit: 3, offset: 0 })),
        getNotices({ limit: 2 }).catch(() => ({ items: [], total: 0, limit: 2, offset: 0 })),
        getSchemes({ limit: 2, status: "published" }).catch(() => ({ items: [], total: 0, limit: 2, offset: 0 })),
        getSafetyResources({ limit: 2 }).catch(() => ({ items: [], total: 0, limit: 2, offset: 0 })),
      ]);

      rawIssuesRef.current = issuesRes.items;
      rawNotificationsRef.current = notifRes.items;
      rawNoticesRef.current = noticesRes.items;
      rawSchemesRef.current = schemesRes.items;
      rawSafetyRef.current = safetyRes.items;

      setIssues(await enrichIssueList(issuesRes.items, i18n.language));
      setNotifications(notifRes.items);
      setNotices(await enrichNotices(noticesRes.items, i18n.language));
      setSchemes(await enrichSchemes(schemesRes.items, i18n.language));
      setSafetyResources(await enrichSafetyResources(safetyRes.items, i18n.language));
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Re-enrich (no reload) when the UI language changes.
  useEffect(() => {
    let active = true;
    if (rawIssuesRef.current.length > 0) {
      enrichIssueList(rawIssuesRef.current, i18n.language).then((enriched) => {
        if (active) setIssues(enriched);
      });
    }
    if (rawNoticesRef.current.length > 0) {
      enrichNotices(rawNoticesRef.current, i18n.language).then((enriched) => {
        if (active) setNotices(enriched);
      });
    }
    if (rawSchemesRef.current.length > 0) {
      enrichSchemes(rawSchemesRef.current, i18n.language).then((enriched) => {
        if (active) setSchemes(enriched);
      });
    }
    if (rawSafetyRef.current.length > 0) {
      enrichSafetyResources(rawSafetyRef.current, i18n.language).then((enriched) => {
        if (active) setSafetyResources(enriched);
      });
    }
    return () => {
      active = false;
    };
  }, [i18n.language]);

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

  return (
    <motion.div
      variants={pageFade}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      {/* ── Hero Welcome Banner ── */}
      <motion.div
        variants={fadeUp}
        className="hero-gradient hero-pattern card"
        style={{
          padding: "1.1rem 1.25rem",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1.25rem",
          borderRadius: "var(--radius-lg)",
          border: "none",
        }}
      >
        <div style={{ position: "relative", zIndex: 1, flex: 1, minWidth: "280px" }}>
          <span
            style={{
              backgroundColor: "rgba(255,255,255,0.12)",
              color: "#ffffff",
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              padding: "4px 12px",
              borderRadius: "var(--radius-full)",
              display: "inline-block",
              marginBottom: "0.4rem",
              letterSpacing: "0.04em",
            }}
          >
            {t("hero.greeting", { name: user?.name || (user?.role === "panchayat" ? "Panchayat Officer" : user?.role === "panchayat_employee" ? "Field Employee" : user?.role === "csr" ? "CSR Partner" : "Citizen") })}
          </span>
          <h1 style={{ color: "#ffffff", fontSize: "1.75rem", marginBottom: "0.35rem", letterSpacing: "-0.03em" }}>
            {user?.role === "panchayat"
              ? t("nav.rolePanchayatPortal", { defaultValue: "GramOne Panchayat Admin Portal" })
              : user?.role === "panchayat_employee"
                ? t("nav.roleEmployeePortal", { defaultValue: "GramOne Field Worker Portal" })
                : user?.role === "csr"
                  ? t("nav.roleCsrPortal", { defaultValue: "GramOne CSR Partner Portal" })
                  : t("hero.title", { defaultValue: "GramOne Citizen Portal" })}
          </h1>
          <p style={{ color: "#e2e8f0", fontSize: "var(--text-sm)", maxWidth: "560px", lineHeight: 1.55 }}>
            {user?.role === "panchayat"
              ? t("panchayat.subtitle", { defaultValue: "Review citizen problem reports, monitor IoT physical water telemetry, update status timelines, and aggregate correlated issues into Impact Cases." })
              : user?.role === "panchayat_employee"
                ? t("employee.subtitle", { defaultValue: "Manage assigned field work tasks, upload before/after evidence, and record attendance scans." })
                : user?.role === "csr"
                  ? t("csr.subtitle", { defaultValue: "Discover verified rural needs, match corporate CSR sponsorships, and track project impact." })
                  : t("hero.subtitle", {
                      defaultValue:
                        "Report rural problems in plain language. AI interprets your report, Panchayat acts, and you track every step transparently.",
                    })}
          </p>

          {/* Text-Only SDG Badges */}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
            {[
              { label: t("hero.sdg6", { defaultValue: "SDG 6 · Clean Water" }), bg: "rgba(3,105,161,0.35)", color: "#bae6fd" },
              { label: t("hero.sdg4", { defaultValue: "SDG 4 · Quality Education" }), bg: "rgba(194,65,12,0.3)", color: "#fdba74" },
              { label: t("hero.sdg11", { defaultValue: "SDG 11 · Sustainable Communities" }), bg: "rgba(109,40,217,0.3)", color: "#c4b5fd" },
              { label: t("hero.sdg13", { defaultValue: "SDG 13 · Climate Action" }), bg: "rgba(16,185,129,0.3)", color: "#a7f3d0" },
            ].map((sdg) => (
              <span
                key={sdg.label}
                className="badge"
                style={{ backgroundColor: sdg.bg, color: sdg.color, fontSize: "0.7rem", fontWeight: 700 }}
              >
                {sdg.label}
              </span>
            ))}
          </div>
        </div>

        <motion.div whileTap={buttonTap} style={{ position: "relative", zIndex: 1, marginTop: "0.2rem" }}>
          <Link
            to="/report"
            aria-label={t("hero.cta", { defaultValue: "Report problem" })}
            className="btn btn-accent"
            style={{
              minHeight: "52px",
              padding: "0.65rem 1.25rem",
              fontSize: "var(--text-base)",
              boxShadow: "var(--shadow-amber)",
            }}
          >
            <span>{t("hero.cta", { defaultValue: "Report problem" })}</span>
          </Link>
        </motion.div>
      </motion.div>

      {/* ── Stat Counter Row ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}
      >
        {[
          { icon: Clock, count: loading ? "…" : totalOpen, label: t("dashboard.openIssues", { defaultValue: "Open Issues" }), iconBg: "#eff6ff", iconColor: "#1d4ed8" },
          { icon: Wrench, count: loading ? "…" : inProgress, label: t("dashboard.inProgress", { defaultValue: "In Progress" }), iconBg: "#fefce8", iconColor: "#a16207" },
          { icon: CheckCircle2, count: loading ? "…" : resolved, label: t("dashboard.resolved", { defaultValue: "Resolved" }), iconBg: "#f0fdf4", iconColor: "#15803d" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            variants={staggerItem}
            whileHover={{ y: -1, boxShadow: "var(--shadow-md)" }}
            transition={{ duration: 0.12 }}
            className="card"
            style={{ borderColor: "#e2e8f0" }}
          >
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: stat.iconBg, color: stat.iconColor }}>
                <stat.icon size={22} />
              </div>
              <div>
                <div className="stat-value">{stat.count}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Error Alert ── */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="alert alert-error"
          role="alert"
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{error}</span>
          <motion.button whileTap={buttonTap} onClick={fetchDashboardData} className="btn btn-secondary btn-sm" aria-label={t("dashboard.retry", { defaultValue: "Retry" })}>
            {t("dashboard.retry", { defaultValue: "Retry" })}
          </motion.button>
        </motion.div>
      )}

      {/* ── Two-Column Responsive Layout ── */}
      <div className="citizen-dashboard-grid">
        
        {/* LEFT COLUMN: ISSUES */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <div>
                <h2 style={{ marginBottom: "0.15rem", fontSize: "1.25rem" }}>
                  {t("dashboard.recentTitle", { defaultValue: "Recent reported issues" })}
                </h2>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--text-subtle)" }}>
                  {t("dashboard.recentSubtitle", { defaultValue: "Your latest submissions and their Panchayat resolution status." })}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <motion.button
                  whileTap={buttonTap}
                  onClick={handleSeedDemo}
                  disabled={seedLoading}
                  className="btn btn-secondary btn-sm"
                  aria-label={t("dashboard.seedDemo", { defaultValue: "Seed demo issues" })}
                >
                  {seedLoading ? t("dashboard.seeding", { defaultValue: "Seeding…" }) : t("dashboard.seedDemo", { defaultValue: "Seed demo issues" })}
                </motion.button>
                <Link
                  to="/issues"
                  className="btn btn-secondary btn-sm"
                  aria-label={t("dashboard.viewAll", { defaultValue: "View all" })}
                >
                  {t("dashboard.viewAll", { defaultValue: "View all" })}
                </Link>
              </div>
            </div>

            {/* Skeleton Loading State */}
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

            {/* Empty State */}
            {!loading && issues.length === 0 && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card">
                <div className="empty-state" style={{ padding: "2.5rem 1.5rem" }}>
                  <div className="empty-state-title">{t("dashboard.emptyTitle", { defaultValue: "No issues reported yet" })}</div>
                  <p className="empty-state-desc">
                    {t("dashboard.emptyDesc", { defaultValue: "Be the first to report a drinking water, classroom, or road issue in your village — in plain language." })}
                  </p>
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                    <motion.div whileTap={buttonTap}>
                      <Link to="/report" className="btn btn-primary btn-sm" aria-label={t("dashboard.reportFirst", { defaultValue: "Report first issue" })}>
                        {t("dashboard.reportFirst", { defaultValue: "Report first issue" })}
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Issues List */}
            {!loading && issues.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {issues.map((issue) => {
                  const localizedTitle = getLocalizedText(issue.title, i18n.language);
                  const villageName = issue.village?.name ? getLocalizedText(issue.village.name, i18n.language) : "Rampur";
                  const formattedDate = formatDate(issue.updated_at || issue.created_at, i18n.language);
                  const evCount = issue.evidence_count || 1;
                  const villageStr = `${villageName} ${t("dashboard.panchayatSuffix", { defaultValue: "Panchayat" })}`;
                  const evStr = `${evCount} ${evCount === 1 ? t("dashboard.evidenceItem", { defaultValue: "evidence item" }) : t("dashboard.evidenceItems", { defaultValue: "evidence items" })}`;

                  return (
                    <motion.div key={issue.id} whileHover={{ y: -1, boxShadow: "var(--shadow-md)" }} transition={{ duration: 0.12 }}>
                      <Link
                        to={`/issues/${issue.id}`}
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
                        <div style={{ flex: 1, minWidth: "200px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                            <CategoryBadge category={issue.category} />
                            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", fontWeight: 700, letterSpacing: "0.03em" }}>
                              {issue.reference || `#${issue.id}`}
                            </span>
                          </div>
                          <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text-main)", lineHeight: 1.35 }}>
                            {localizedTitle}
                          </h3>
                          <div style={{ fontSize: "var(--text-sm)", color: "var(--text-subtle)", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                            <span>{villageStr}</span>
                            <span style={{ opacity: 0.5 }}>•</span>
                            <span>{t("dashboard.updated", { defaultValue: "Updated" })} {formattedDate}</span>
                            <span style={{ opacity: 0.5 }}>•</span>
                            <span>{evStr}</span>
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
        </div>

        {/* RIGHT COLUMN: NOTIFICATIONS & COMMUNITY FEED */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Recent Notifications Widget */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Bell size={18} color="var(--primary-600)" />
                <h2 style={{ fontSize: "1.1rem", margin: 0 }}>{t("dashboard.notifications", { defaultValue: "Alerts & updates" })}</h2>
              </div>
              <Link to="/notifications" style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary-600)", textDecoration: "none" }}>
                {t("dashboard.viewAll", { defaultValue: "View all" })}
              </Link>
            </div>
            
            {loading ? (
              <div className="skeleton" style={{ height: "60px", width: "100%" }} />
            ) : notifications.length === 0 ? (
              <p style={{ fontSize: "0.85rem", color: "var(--text-subtle)", fontStyle: "italic", margin: 0 }}>
                {t("dashboard.noNotifications", { defaultValue: "No recent status alerts." })}
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {notifications.map((n) => (
                  <div key={n.id} style={{ fontSize: "0.85rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{n.title}</div>
                    <div style={{ color: "var(--text-subtle)", fontSize: "0.8rem", marginTop: "2px" }}>{n.message}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-faint)", marginTop: "4px" }}>{formatDate(n.created_at, i18n.language)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panchayat Notices & Announcements Widget */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Newspaper size={18} color="#a16207" />
                <h2 style={{ fontSize: "1.1rem", margin: 0 }}>{t("dashboard.notices", { defaultValue: "Panchayat Notices" })}</h2>
              </div>
              <Link to="/community/news" style={{ fontSize: "0.8rem", fontWeight: 700, color: "#a16207", textDecoration: "none" }}>
                {t("dashboard.viewAll", { defaultValue: "View all" })}
              </Link>
            </div>

            {loading ? (
              <div className="skeleton" style={{ height: "60px", width: "100%" }} />
            ) : notices.length === 0 ? (
              <p style={{ fontSize: "0.85rem", color: "var(--text-subtle)", fontStyle: "italic", margin: 0 }}>
                {t("dashboard.noNotices", { defaultValue: "No recent local announcements." })}
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {notices.map((notice) => (
                  <Link key={notice.id} to={`/community/news/${notice.id}`} style={{ textDecoration: "none", display: "block" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>
                      {getLocalizedText(notice.title, i18n.language)}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-subtle)" }}>
                      {getLocalizedText(notice.summary || "", i18n.language)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Government Schemes & Support Widget */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Landmark size={18} color="#1d4ed8" />
                <h2 style={{ fontSize: "1.1rem", margin: 0 }}>{t("dashboard.schemes", { defaultValue: "Government Schemes" })}</h2>
              </div>
              <Link to="/community/schemes" style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1d4ed8", textDecoration: "none" }}>
                {t("dashboard.viewAll", { defaultValue: "View all" })}
              </Link>
            </div>

            {loading ? (
              <div className="skeleton" style={{ height: "60px", width: "100%" }} />
            ) : schemes.length === 0 ? (
              <p style={{ fontSize: "0.85rem", color: "var(--text-subtle)", fontStyle: "italic", margin: 0 }}>
                {t("dashboard.noSchemes", { defaultValue: "No active schemes found." })}
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {schemes.map((scheme) => (
                  <Link key={scheme.id} to={`/community/schemes/${scheme.id}`} style={{ textDecoration: "none", display: "block" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>
                      {getLocalizedText(scheme.title, i18n.language)}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-subtle)" }}>
                      {getLocalizedText(scheme.short_description, i18n.language)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Safety & Help Guides Widget */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ShieldCheck size={18} color="#15803d" />
                <h2 style={{ fontSize: "1.1rem", margin: 0 }}>{t("dashboard.safety", { defaultValue: "Safety & Support" })}</h2>
              </div>
              <Link to="/community/safety" style={{ fontSize: "0.8rem", fontWeight: 700, color: "#15803d", textDecoration: "none" }}>
                {t("dashboard.viewAll", { defaultValue: "View all" })}
              </Link>
            </div>

            {loading ? (
              <div className="skeleton" style={{ height: "60px", width: "100%" }} />
            ) : safetyResources.length === 0 ? (
              <p style={{ fontSize: "0.85rem", color: "var(--text-subtle)", fontStyle: "italic", margin: 0 }}>
                {t("dashboard.noSafety", { defaultValue: "No safety guides published." })}
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {safetyResources.map((res) => (
                  <Link key={res.id} to={res.section === "womens_safety" ? "/community/womens-safety" : "/community/safety"} style={{ textDecoration: "none", display: "block" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>
                      {getLocalizedText(res.title, i18n.language)}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-subtle)" }}>
                      {getLocalizedText(res.summary || "", i18n.language)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </motion.div>
  );
};
