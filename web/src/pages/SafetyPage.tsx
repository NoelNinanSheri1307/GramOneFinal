import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getSafetyResources, SafetyResourceResponse, SafetySection } from "../lib/api";
import { pageFade, staggerContainer, staggerItem } from "../lib/motion";
import { formatDate } from "../lib/formatters";
import { getLocalizedText } from "../lib/localize";
import { enrichSafetyResources } from "../lib/translations";
import { AlertCircle, ExternalLink, Phone, ShieldCheck, Flag } from "lucide-react";

const SECTION_OPTIONS: Array<{ value: SafetySection; labelKey: string }> = [
  { value: "drug_awareness", labelKey: "community.safetySectionDrug" },
  { value: "community_safety", labelKey: "community.safetySectionCommunity" },
];

export const SafetyPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [resources, setResources] = useState<SafetyResourceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<SafetySection | "">("");
  const rawRef = useRef<SafetyResourceResponse[]>([]);

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSafetyResources({ section: section || undefined, limit: 50 });
      rawRef.current = res.items;
      setResources(await enrichSafetyResources(res.items, i18n.language));
    } catch (err: any) {
      setError(err?.message || "Failed to load safety resources.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [section]);

  useEffect(() => {
    let active = true;
    if (rawRef.current.length > 0) {
      enrichSafetyResources(rawRef.current, i18n.language).then((enriched) => {
        if (active) setResources(enriched);
      });
    }
    return () => {
      active = false;
    };
  }, [i18n.language]);

  const articles = resources.filter((r) => r.resource_type !== "help_resource");
  const helplines = resources.filter((r) => r.resource_type === "help_resource");

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
            {t("community.safety", { defaultValue: "Community safety" })}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-subtle)", maxWidth: "620px", margin: 0 }}>
            {t("community.safetyDesc", { defaultValue: "Drug awareness, prevention, warning signs, and where to seek help." })}
          </p>
        </div>
        <Link to="/community" className="btn btn-secondary btn-sm" aria-label={t("community.backToCommunity", { defaultValue: "Back to community" })}>
          {t("community.backToCommunity", { defaultValue: "Back to community" })}
        </Link>
      </div>

      <div className="card" style={{ padding: "0.9rem 1rem", display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center" }}>
        <select value={section} onChange={(e) => setSection(e.target.value as SafetySection | "")} className="form-select" aria-label="Section">
          <option value="">{t("community.categoryAll", { defaultValue: "All categories" })}</option>
          {SECTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey, { defaultValue: opt.value })}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {helplines.length > 0 && (
        <div>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.6rem", color: "var(--text-main)" }}>
            {t("community.helplines", { defaultValue: "Official support contacts" })}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
            {helplines.map((h) => (
              <div key={h.id} className="card" style={{ padding: "1rem 1.15rem", borderLeft: "4px solid var(--sdg-civic)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                  <Phone size={16} color="var(--sdg-civic)" />
                  <strong style={{ fontSize: "0.95rem" }}>{getLocalizedText(h.title, i18n.language)}</strong>
                </div>
                {h.contact_phone && (
                  <a href={`tel:${h.contact_phone}`} style={{ fontSize: "0.95rem", color: "var(--primary-700)", fontWeight: 700, textDecoration: "none" }}>
                    {t("community.call", { defaultValue: "Call" })} {h.contact_phone}
                  </a>
                )}
                {h.external_url && (
                  <div style={{ marginTop: "0.4rem" }}>
                    <a href={h.external_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
                      <ExternalLink size={13} />
                      {getLocalizedText(h.contact_label || h.summary || "More info", i18n.language)}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
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

      {!loading && articles.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <ShieldCheck size={28} color="var(--text-faint)" style={{ marginBottom: "0.5rem" }} />
          <h3 style={{ fontSize: "1.1rem" }}>{t("community.noSafetyTitle", { defaultValue: "No safety resources" })}</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--text-subtle)", margin: "0.35rem 0 0 0" }}>
            {t("community.noSafetyDesc", { defaultValue: "No safety resources have been published yet." })}
          </p>
        </div>
      )}

      {!loading && articles.length > 0 && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {articles.map((r) => {
            const title = getLocalizedText(r.title, i18n.language);
            const summary = getLocalizedText(r.summary, i18n.language);
            return (
              <motion.div key={r.id} variants={staggerItem} whileHover={{ y: -1, boxShadow: "var(--shadow-md)" }} transition={{ duration: 0.12 }}>
                <div className="card" style={{ padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "240px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                        <span className="badge" style={{ backgroundColor: "#f0fdf4", color: "#15803d", fontWeight: 700 }}>
                          {t(`community.safetySection${r.section.split("_").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("")}`, { defaultValue: r.section })}
                        </span>
                        {r.published_at && (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-faint)" }}>{formatDate(r.published_at, i18n.language)}</span>
                        )}
                      </div>
                      <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text-main)", margin: "0 0 0.35rem 0" }}>{title}</h3>
                      {summary && <p style={{ fontSize: "var(--text-sm)", color: "var(--text-subtle)", margin: 0, lineHeight: 1.5 }}>{summary}</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Privacy-conscious reporting callout */}
      <div className="card" style={{ padding: "1.1rem 1.25rem", borderLeft: "4px solid var(--sdg-water)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
          <Flag size={17} color="var(--sdg-water)" />
          <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
            {t("community.reportIssueTitle", { defaultValue: "Report a community safety concern" })}
          </h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-subtle)", lineHeight: 1.55, margin: "0 0 0.75rem 0" }}>
          {t("community.reportIssueDesc", {
            defaultValue: "Worried about substance or drug activity in your village? Report it through the normal issue flow — reports are private and go only to your Panchayat.",
          })}
        </p>
        <Link to="/report" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
          {t("community.reportBtn", { defaultValue: "Report a concern" })}
        </Link>
        <p style={{ fontSize: "0.75rem", color: "var(--text-faint)", margin: "0.6rem 0 0 0" }}>
          {t("community.privacyNote", {
            defaultValue: "Your report stays private and routes only to your Panchayat. No public accusations, no naming individuals.",
          })}
        </p>
      </div>
    </motion.div>
  );
};
