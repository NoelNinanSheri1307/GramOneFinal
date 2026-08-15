import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getCSROpportunities, CSROpportunity } from "../lib/api";
import { CategoryBadge } from "../components/CategoryBadge";
import { pageFade, staggerContainer, staggerItem } from "../lib/motion";
import { getLocalizedText, LocalizedString } from "../lib/localize";
import { Search, ArrowRight, AlertCircle, MapPin, Users, ShieldCheck } from "lucide-react";

export const CSROpportunitiesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [opportunities, setOpportunities] = useState<CSROpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unfundedOnly, setUnfundedOnly] = useState(false);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [sort, setSort] = useState<"impact" | "recent">("impact");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCSROpportunities({
        q: q || undefined,
        category: category || undefined,
        state: stateFilter || undefined,
        sort,
        limit: 100,
      });
      setOpportunities(res.items);
    } catch (err: any) {
      setError(err?.message || "Failed to load opportunities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => fetchData();

  const states = Array.from(new Set(opportunities.map((o) => o.village?.state).filter(Boolean))) as string[];
  const label = (v: LocalizedValue) => getLocalizedText(v, i18n.language);

  return (
    <motion.div variants={pageFade} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <Link to="/csr" style={{ textDecoration: "none", color: "var(--text-subtle)", fontWeight: 600, fontSize: "0.85rem" }}>
            ← {t("csr.backToDashboard", { defaultValue: "Back to CSR dashboard" })}
          </Link>
          <h1 style={{ fontSize: "1.6rem", color: "var(--sdg-civic)", marginTop: "0.25rem" }}>
            {t("csr.opportunities", { defaultValue: "Opportunities" })}
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-subtle)" }}>
            {t("csr.opportunitiesSubtitle", { defaultValue: "Browse eligible Impact Cases and projects awaiting CSR sponsorship." })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "0.75rem 1rem" }}>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
            <input
              className="form-input"
              style={{ paddingLeft: "2.25rem" }}
              placeholder={t("csr.searchPlaceholder", { defaultValue: "Search by title or reference..." })}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              aria-label={t("csr.searchPlaceholder", { defaultValue: "Search by title or reference..." })}
            />
          </div>
          <select className="form-select" style={{ width: "auto" }} value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t("csr.filterCategory", { defaultValue: "Category" })}>
            <option value="">{t("csr.categoryAll", { defaultValue: "All categories" })}</option>
            <option value="water">Water & Sanitation</option>
            <option value="education">Education</option>
            <option value="civic">Civic</option>
            <option value="agriculture">Agriculture</option>
            <option value="health">Health</option>
            <option value="waste">Waste</option>
            <option value="environment">Environment</option>
            <option value="disaster">Disaster</option>
            <option value="other">Other</option>
          </select>
          <select className="form-select" style={{ width: "auto" }} value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} aria-label={t("csr.filterState", { defaultValue: "State" })}>
            <option value="">{t("csr.stateAll", { defaultValue: "All states" })}</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select className="form-select" style={{ width: "auto" }} value={sort} onChange={(e) => setSort(e.target.value as "impact" | "recent")} aria-label={t("csr.sortBy", { defaultValue: "Sort by" })}>
            <option value="impact">{t("csr.sortImpact", { defaultValue: "Highest impact" })}</option>
            <option value="recent">{t("csr.sortRecent", { defaultValue: "Most recent" })}</option>
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", cursor: "pointer", userSelect: "none" }}>
            <input type="checkbox" checked={unfundedOnly} onChange={(e) => setUnfundedOnly(e.target.checked)} />
            <span>{t("csr.unfundedOnly", { defaultValue: "Unfunded Only" })}</span>
          </label>
          <button onClick={applyFilters} disabled={loading} className="btn btn-primary btn-sm">
            <span>{t("dashboard.retry", { defaultValue: "Apply" })}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="card" style={{ height: "110px" }}>
              <div className="skeleton" style={{ height: "20px", width: "50%", marginBottom: "10px" }} />
              <div className="skeleton" style={{ height: "14px", width: "35%" }} />
            </div>
          ))}
        </div>
      )}

      {!loading && opportunities.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <div className="empty-state-title">{t("csr.noOpportunitiesTitle", { defaultValue: "No opportunities available" })}</div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-subtle)", margin: "0.35rem 0 0 0" }}>
            {t("csr.noOpportunitiesDesc", { defaultValue: "Impact Cases created by Panchayat administrations will appear here when they are ready for CSR sponsorship." })}
          </p>
        </div>
      )}

      {!loading && opportunities.length > 0 && (() => {
        const displayedOpportunities = unfundedOnly ? opportunities.filter((o) => !o.sponsored) : opportunities;
        if (displayedOpportunities.length === 0) {
          return (
            <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
              <div className="empty-state-title">{t("csr.noUnfundedTitle", { defaultValue: "No unfunded opportunities match your search" })}</div>
            </div>
          );
        }
        return (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {displayedOpportunities.map((o) => (
              <motion.div key={o.id} variants={staggerItem}>
                <Link
                  to={`/csr/opportunities/${o.id}`}
                  className="card card-hover"
                  style={{ textDecoration: "none", display: "block", padding: "1.1rem 1.25rem", borderLeft: "4px solid var(--sdg-civic)" }}
                >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "260px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                      <CategoryBadge category={o.category} />
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", fontWeight: 700 }}>{o.reference || `#${o.id}`}</span>
                      {o.sdg && (
                        <span className="badge" style={{ backgroundColor: "var(--sdg-water-light)", color: "var(--sdg-water)" }}>{o.sdg}</span>
                      )}
                      {o.matched_score != null && (
                        <span className="badge" style={{ backgroundColor: "var(--sdg-civic-light)", color: "var(--sdg-civic)", fontWeight: 700 }}>
                          {Math.round(o.matched_score)}% {t("csr.matchQuality", { defaultValue: "match" })}
                        </span>
                      )}
                      {o.sponsored && (
                        <span className="badge" style={{ backgroundColor: "#F0FDF4", color: "#166534", fontWeight: 700 }}>
                          {t("csr.alreadySponsored", { defaultValue: "Sponsored" })}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: "var(--text-base)", color: "var(--text-main)", fontWeight: 700 }}>{label(o.title)}</h3>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-subtle)", marginTop: "0.4rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <MapPin size={12} /> {o.village ? `${label(o.village.name)} · ${o.village.district}` : "—"}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <Users size={12} /> {o.affected_population ? `~${o.affected_population}` : "—"}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <ShieldCheck size={12} /> {t("csr.impactScore", { defaultValue: "Impact" })} {o.impact_score?.overall_score ?? 0}/100
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={18} color="var(--text-faint)" />
                </div>
              </Link>
            </motion.div>
            ))}
          </motion.div>
        );
      })()}
    </motion.div>
  );
};

type LocalizedValue = LocalizedString | string | null | undefined;