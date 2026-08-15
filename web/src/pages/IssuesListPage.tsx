import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getIssues, IssueResponse } from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";
import { CategoryBadge } from "../components/CategoryBadge";
import { seedDemoData } from "../lib/demoSeed";
import { pageFade, staggerContainer, staggerItem, buttonTap } from "../lib/motion";
import { formatDate } from "../lib/formatters";
import { getLocalizedText, searchMatches } from "../lib/localize";
import { enrichIssueList } from "../lib/translations";
import { Search, ArrowRight, AlertCircle } from "lucide-react";

export const IssuesListPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [issues, setIssues] = useState<IssueResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rawIssuesRef = useRef<IssueResponse[]>([]);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [seedLoading, setSeedLoading] = useState(false);

  const fetchIssuesList = async () => {
    setLoading(true);
    setError(null);
    try {
      const categoryParam = selectedCategory !== "all" ? selectedCategory : undefined;
      const statusParam = selectedStatus !== "all" ? selectedStatus : undefined;
      const res = await getIssues({ category: categoryParam, status: statusParam, limit: 50 });
      rawIssuesRef.current = res.items;
      setIssues(await enrichIssueList(res.items, i18n.language));
    } catch (err: any) {
      setError(err?.message || "Failed to load issues.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssuesList();
  }, [selectedCategory, selectedStatus]);

  // On-demand enrichment when the UI language changes (no reload needed).
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

  const handleSeedDemo = async () => {
    setSeedLoading(true);
    try {
      await seedDemoData();
      await fetchIssuesList();
    } catch (err: any) {
      setError("Failed to seed demo data: " + (err?.message || "Unknown error"));
    } finally {
      setSeedLoading(false);
    }
  };

  // Part 8: Multilingual normalized Unicode search
  const filteredIssues = issues.filter((issue) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim();
    const titleMatch = searchMatches(issue.title, q);
    const refMatch = issue.reference ? issue.reference.toLowerCase().includes(q.toLowerCase()) : false;
    const villageMatch = issue.village?.name ? searchMatches(issue.village.name, q) : false;
    return titleMatch || refMatch || villageMatch;
  });

  return (
    <motion.div
      variants={pageFade}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.65rem" }}>{t("issuesList.title", { defaultValue: "Track village issues" })}</h1>
          <p style={{ fontSize: "0.95rem", color: "var(--text-subtle)" }}>
            {t("issuesList.subtitle", { defaultValue: "Transparent status timeline for all drinking water, school, and civic reports." })}
          </p>
        </div>
        <motion.div whileTap={buttonTap}>
          <Link to="/report" className="btn btn-primary" aria-label={t("issuesList.reportNew", { defaultValue: "Report new problem" })}>
            <span>{t("issuesList.reportNew", { defaultValue: "Report new problem" })}</span>
          </Link>
        </motion.div>
      </div>

      {/* Filters Bar */}
      <div
        className="card"
        style={{
          padding: "1rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* Functional Multilingual Search Box */}
          <div style={{ flex: 2, minWidth: "240px", position: "relative" }}>
            <Search
              size={18}
              color="var(--text-subtle)"
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: "2.35rem" }}
              placeholder={t("issuesList.searchPlaceholder", { defaultValue: "Search by title, reference or village..." })}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={t("issuesList.searchPlaceholder", { defaultValue: "Search by title, reference or village..." })}
            />
          </div>

          {/* Category Dropdown */}
          <div style={{ flex: 1, minWidth: "160px" }}>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">{t("issuesList.categoryAll", { defaultValue: "All categories" })}</option>
              <option value="water">{t("issuesList.catWater", { defaultValue: "Water & Sanitation" })}</option>
              <option value="education">{t("issuesList.catEducation", { defaultValue: "Education Infrastructure" })}</option>
              <option value="civic">{t("issuesList.catCivic", { defaultValue: "Civic Infrastructure" })}</option>
              <option value="other">{t("issuesList.catOther", { defaultValue: "Other" })}</option>
            </select>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", marginRight: "0.25rem" }}>
            {t("issuesList.statusLabel", { defaultValue: "Status:" })}
          </span>
          {[
            { id: "all", label: t("issuesList.statusAll", { defaultValue: "All statuses" }) },
            { id: "reported", label: t("issuesList.statusReported", { defaultValue: "Reported" }) },
            { id: "in_progress", label: t("issuesList.statusInProgress", { defaultValue: "In progress" }) },
            { id: "resolved", label: t("issuesList.statusResolved", { defaultValue: "Resolved" }) },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              className={`btn btn-sm ${selectedStatus === st.id ? "btn-primary" : "btn-secondary"}`}
              aria-label={`Filter status: ${st.label}`}
              aria-pressed={selectedStatus === st.id}
              style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="card" style={{ height: "96px" }}>
              <div className="skeleton" style={{ height: "20px", width: "50%", marginBottom: "10px" }} />
              <div className="skeleton" style={{ height: "14px", width: "30%" }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredIssues.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>{t("issuesList.noIssuesTitle", { defaultValue: "No issues found matching filters" })}</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--text-subtle)", maxWidth: "420px", margin: "0 auto 1.5rem auto" }}>
            {t("issuesList.noIssuesDesc", { defaultValue: "Try adjusting your search criteria or seed sample demo issues to preview the timeline." })}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link to="/report" className="btn btn-primary btn-sm" aria-label={t("issuesList.reportNew", { defaultValue: "Report new issue" })}>
              <span>{t("issuesList.reportNew", { defaultValue: "Report new issue" })}</span>
            </Link>
            <button onClick={handleSeedDemo} disabled={seedLoading} className="btn btn-secondary btn-sm" aria-label={t("dashboard.seedDemo", { defaultValue: "Seed demo issues" })}>
              <span>{seedLoading ? t("dashboard.seeding", { defaultValue: "Seeding…" }) : t("dashboard.seedDemo", { defaultValue: "Seed demo issues" })}</span>
            </button>
          </div>
        </div>
      )}

      {/* Multilingual Issues Grid / List */}
      {!loading && filteredIssues.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
        >
          {filteredIssues.map((issue) => {
            const localizedTitle = getLocalizedText(issue.title, i18n.language);
            const villageName = issue.village?.name ? getLocalizedText(issue.village.name, i18n.language) : "Rampur";
            const formattedDate = formatDate(issue.updated_at || issue.created_at, i18n.language);
            const evCount = issue.evidence_count || 1;
            const villageStr = `${villageName} ${t("dashboard.panchayatSuffix", { defaultValue: "Panchayat" })}`;
            const evStr = `${evCount} ${evCount === 1 ? t("dashboard.evidenceItem", { defaultValue: "evidence item" }) : t("dashboard.evidenceItems", { defaultValue: "evidence items" })}`;

            return (
              <motion.div key={issue.id} variants={staggerItem}>
                <motion.div
                  whileHover={{ y: -1, boxShadow: "var(--shadow-md)" }}
                  transition={{ duration: 0.12 }}
                >
                  <Link
                    to={`/issues/${issue.id}`}
                    className="card card-hover card-issue-row"
                    style={{
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1.25rem",
                      flexWrap: "wrap",
                      padding: "1.15rem 1.25rem",
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
                      {/* Fully Localized Metadata Density Row */}
                      <div
                        style={{
                          fontSize: "var(--text-sm)",
                          color: "var(--text-subtle)",
                          marginTop: "0.5rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <span>{villageStr}</span>
                        <span style={{ opacity: 0.6 }}>•</span>
                        <span>{t("dashboard.updated", { defaultValue: "Updated" })} {formattedDate}</span>
                        <span style={{ opacity: 0.6 }}>•</span>
                        <span>{evStr}</span>
                      </div>
                    </div>

                    <div className="status-pill-container" style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                      <StatusBadge status={issue.status} />
                      <ArrowRight size={16} color="var(--text-faint)" />
                    </div>
                  </Link>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
};
