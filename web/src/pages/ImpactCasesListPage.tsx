import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getImpactCases, ImpactCaseResponse } from "../lib/api";
import { CategoryBadge } from "../components/CategoryBadge";
import { pageFade, staggerContainer, staggerItem } from "../lib/motion";
import { enrichImpactCaseList } from "../lib/translations";
import { getLocalizedText } from "../lib/localize";
import { ArrowRight, AlertCircle } from "lucide-react";

export const ImpactCasesListPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [impactCases, setImpactCases] = useState<ImpactCaseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rawCasesRef = useRef<ImpactCaseResponse[]>([]);

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getImpactCases({ limit: 50 });
      rawCasesRef.current = res.items;
      setImpactCases(await enrichImpactCaseList(res.items, i18n.language));
    } catch (err: any) {
      setError(err?.message || "Failed to load Impact Cases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCases(); }, []);

  useEffect(() => {
    let active = true;
    if (rawCasesRef.current.length > 0) {
      enrichImpactCaseList(rawCasesRef.current, i18n.language).then((enriched) => {
        if (active) setImpactCases(enriched);
      });
    }
    return () => {
      active = false;
    };
  }, [i18n.language]);

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
          <h1 style={{ color: "var(--sdg-civic)", fontSize: "1.65rem" }}>
            {t("impact.listTitle", { defaultValue: "Panchayat impact cases" })}
          </h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-subtle)", marginTop: "0.25rem" }}>
            {t("impact.listSubtitle", { defaultValue: "Aggregated infrastructure projects queued for CSR matching and village resolution." })}
          </p>
        </div>
        <Link
          to="/panchayat/create-impact-case"
          className="btn btn-primary"
          style={{ backgroundColor: "var(--sdg-civic)", borderColor: "var(--sdg-civic)" }}
          aria-label={t("impact.createBtn", { defaultValue: "Create impact case" })}
        >
          <span>{t("impact.createBtn", { defaultValue: "Create impact case" })}</span>
        </Link>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="card" style={{ height: "90px" }}>
              <div className="skeleton" style={{ height: "20px", width: "50%", marginBottom: "10px" }} />
              <div className="skeleton" style={{ height: "14px", width: "30%" }} />
            </div>
          ))}
        </div>
      )}

      {!loading && impactCases.length === 0 && (
        <motion.div
          variants={pageFade}
          initial="hidden"
          animate="visible"
          className="card"
        >
          <div className="empty-state" style={{ padding: "2.5rem 1.5rem" }}>
            <div className="empty-state-title">{t("impact.emptyTitle", { defaultValue: "No impact cases created yet" })}</div>
            <p className="empty-state-desc">
              {t("impact.emptyDesc", { defaultValue: "Aggregate multiple related citizen reports into an official Impact Case to unlock CSR partnership funding." })}
            </p>
            <Link
              to="/panchayat/create-impact-case"
              className="btn btn-primary btn-sm"
              style={{ backgroundColor: "var(--sdg-civic)", borderColor: "var(--sdg-civic)", marginTop: "0.5rem" }}
              aria-label={t("impact.createFirst", { defaultValue: "Create first impact case" })}
            >
              <span>{t("impact.createFirst", { defaultValue: "Create first impact case" })}</span>
            </Link>
          </div>
        </motion.div>
      )}

      {!loading && impactCases.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
        >
          {impactCases.map((c) => (
            <motion.div key={c.id} variants={staggerItem}>
              <motion.div
                whileHover={{ y: -2, boxShadow: "var(--shadow-md)", borderColor: "var(--border-color-mid)" }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  to={`/panchayat/impact-cases/${c.id}`}
                  className="card"
                  style={{
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1.25rem",
                    flexWrap: "wrap",
                    padding: "1.15rem 1.25rem",
                    borderLeft: "4px solid var(--sdg-civic)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "260px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                      <CategoryBadge category={c.category} />
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--sdg-civic)", fontWeight: 800 }}>
                        {c.reference || `#${c.id}`}
                      </span>
                      {c.sdg && (
                        <span className="badge" style={{ backgroundColor: "var(--sdg-water-light)", color: "var(--sdg-water)" }}>
                          {c.sdg}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: "var(--text-base)", color: "var(--text-main)", fontWeight: 700 }}>
                      {getLocalizedText(c.title, i18n.language)}
                    </h3>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-subtle)", marginTop: "0.35rem" }}>
                      {t("impact.statusLabel", { defaultValue: "Status:" })}{" "}
                      <strong>{t(`status.${c.status}`, { defaultValue: c.status.toUpperCase() })}</strong> ·{" "}
                      {t("impact.linkedReports", { defaultValue: "Linked reports:" })}{" "}
                      <strong>{c.issues.length}</strong>
                      {c.affected_population ? ` · ~${c.affected_population} ${t("impact.peopleImpacted", { defaultValue: "people impacted" })}` : ""}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span className="badge" style={{ backgroundColor: "var(--sdg-civic-light)", color: "var(--sdg-civic)", fontWeight: 700 }}>
                      {t(`status.${c.status}`, { defaultValue: c.status })}
                    </span>
                    <ArrowRight size={16} color="var(--text-faint)" />
                  </div>
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};