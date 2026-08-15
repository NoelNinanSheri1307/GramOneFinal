import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getSchemes, SchemeCategory, SchemeResponse } from "../lib/api";
import { pageFade, staggerContainer, staggerItem } from "../lib/motion";
import { formatDate } from "../lib/formatters";
import { getLocalizedText } from "../lib/localize";
import { enrichSchemes } from "../lib/translations";
import { AlertCircle, ArrowRight, Landmark, Search } from "lucide-react";

const SCHEME_CATEGORY_OPTIONS: Array<{ value: SchemeCategory; label: string }> = [
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "agriculture", label: "Agriculture" },
  { value: "housing", label: "Housing" },
  { value: "livelihood", label: "Livelihood" },
  { value: "womens_empowerment", label: "Women's empowerment" },
  { value: "pension", label: "Pension" },
  { value: "water_sanitation", label: "Water & sanitation" },
  { value: "disaster_relief", label: "Disaster relief" },
  { value: "other", label: "Other" },
];

export const SchemesListPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [schemes, setSchemes] = useState<SchemeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SchemeCategory | "">("");
  const [targetGroup, setTargetGroup] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const rawSchemesRef = useRef<SchemeResponse[]>([]);

  const fetchSchemes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSchemes({
        q: query || undefined,
        category: category || undefined,
        target_group: targetGroup || undefined,
        limit: 50,
      });
      rawSchemesRef.current = res.items;
      setSchemes(await enrichSchemes(res.items, i18n.language));
    } catch (err: any) {
      setError(err?.message || "Failed to load schemes.");
    } finally {
      setLoading(false);
    }
  }, [query, category, targetGroup, i18n.language]);

  useEffect(() => {
    const timer = setTimeout(() => fetchSchemes(), 250);
    return () => clearTimeout(timer);
  }, [fetchSchemes]);

  useEffect(() => {
    let active = true;
    if (rawSchemesRef.current.length > 0) {
      enrichSchemes(rawSchemesRef.current, i18n.language).then((enriched) => {
        if (active) setSchemes(enriched);
      });
    }
    return () => {
      active = false;
    };
  }, [i18n.language]);

  const visibleSchemes = activeOnly
    ? schemes.filter((s) => s.status === "published" && (!s.deadline || new Date(s.deadline) >= new Date()))
    : schemes.filter((s) => s.status === "published");

  const categoryLabel = (cat: SchemeCategory) =>
    SCHEME_CATEGORY_OPTIONS.find((o) => o.value === cat)?.label ?? cat;

  return (
    <motion.div
      variants={pageFade}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", color: "var(--primary-950)", marginBottom: "0.2rem" }}>
            {t("community.schemes", { defaultValue: "Government schemes" })}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-subtle)", maxWidth: "620px", margin: 0 }}>
            {t("community.schemesDesc", {
              defaultValue: "Browse scheme eligibility, benefits, required documents, and how to apply.",
            })}
          </p>
        </div>
        <Link to="/community" className="btn btn-secondary btn-sm" aria-label={t("community.backToCommunity", { defaultValue: "Back to community" })}>
          {t("community.backToCommunity", { defaultValue: "Back to community" })}
        </Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "0.9rem 1rem", display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flex: "1 1 220px", minWidth: "200px" }}>
          <Search size={16} color="var(--text-faint)" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("community.searchPlaceholder", { defaultValue: "Search..." })}
            aria-label={t("community.searchPlaceholder", { defaultValue: "Search..." })}
            style={{ border: "none", outline: "none", flex: 1, fontSize: "0.9rem", background: "transparent", color: "var(--text-main)" }}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as SchemeCategory | "")}
          aria-label={t("community.categoryAll", { defaultValue: "All categories" })}
          className="form-select"
        >
          <option value="">{t("community.categoryAll", { defaultValue: "All categories" })}</option>
          {SCHEME_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={targetGroup}
          onChange={(e) => setTargetGroup(e.target.value)}
          aria-label={t("community.targetGroupAll", { defaultValue: "All target groups" })}
          className="form-select"
        >
          <option value="">{t("community.targetGroupAll", { defaultValue: "All target groups" })}</option>
          {["Women", "Farmers", "Students", "Senior citizens", "Youth", "All families"].map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--text-subtle)" }}>
          <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
          {t("community.activeOnly", { defaultValue: "Active schemes only" })}
        </label>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="card" style={{ height: "96px" }}>
              <div className="skeleton" style={{ height: "18px", width: "55%", marginBottom: "10px" }} />
              <div className="skeleton" style={{ height: "13px", width: "35%" }} />
            </div>
          ))}
        </div>
      )}

      {!loading && visibleSchemes.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem" }}>{t("community.noSchemesTitle", { defaultValue: "No schemes found" })}</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--text-subtle)", margin: "0.35rem 0 0 0" }}>
            {t("community.noSchemesDesc", { defaultValue: "No government schemes match your filters yet." })}
          </p>
        </div>
      )}

      {!loading && visibleSchemes.length > 0 && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {visibleSchemes.map((scheme) => {
            const title = getLocalizedText(scheme.title, i18n.language);
            const short = getLocalizedText(scheme.short_description, i18n.language);
            const villageName = scheme.village?.name ? getLocalizedText(scheme.village.name, i18n.language) : null;
            const isExpired = !!scheme.deadline && new Date(scheme.deadline) < new Date();
            return (
              <motion.div key={scheme.id} variants={staggerItem} whileHover={{ y: -1, boxShadow: "var(--shadow-md)" }} transition={{ duration: 0.12 }}>
                <Link
                  to={`/community/schemes/${scheme.id}`}
                  className="card card-hover"
                  style={{ textDecoration: "none", display: "block", padding: "1rem 1.25rem" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "240px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                        <span className="badge" style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", fontWeight: 700 }}>
                          <Landmark size={12} style={{ marginRight: "4px" }} />
                          {categoryLabel(scheme.category)}
                        </span>
                        {isExpired && (
                          <span className="badge" style={{ backgroundColor: "#fef2f2", color: "#b91c1c", fontWeight: 700 }}>
                            {t("community.includeExpired", { defaultValue: "Include expired" })}
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text-main)", margin: "0 0 0.35rem 0", lineHeight: 1.35 }}>
                        {title}
                      </h3>
                      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-subtle)", margin: "0 0 0.5rem 0", lineHeight: 1.5 }}>{short}</p>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-faint)", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {villageName && <span>{villageName}</span>}
                        {scheme.state && <span>{scheme.state}</span>}
                        {scheme.deadline && (
                          <span>
                            {t("community.deadline", { defaultValue: "Deadline:" })} {formatDate(scheme.deadline, i18n.language)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                      <ArrowRight size={16} color="var(--text-faint)" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
};
