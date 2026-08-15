import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getSafetyResources, SafetyResourceResponse } from "../lib/api";
import { pageFade, staggerContainer, staggerItem } from "../lib/motion";
import { formatDate } from "../lib/formatters";
import { getLocalizedText } from "../lib/localize";
import { enrichSafetyResources } from "../lib/translations";
import { AlertCircle, ExternalLink, HeartHandshake, Info, Phone } from "lucide-react";

export const WomensSafetyPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [resources, setResources] = useState<SafetyResourceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rawRef = useRef<SafetyResourceResponse[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getSafetyResources({ section: "womens_safety", limit: 50 });
        rawRef.current = res.items;
        const enriched = await enrichSafetyResources(res.items, i18n.language);
        if (active) setResources(enriched);
      } catch (err: any) {
        if (active) setError(err?.message || "Failed to load safety resources.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

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

  const helplines = resources.filter((r) => r.resource_type === "help_resource");
  const articles = resources.filter((r) => r.resource_type !== "help_resource");

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
            {t("community.womensSafety", { defaultValue: "Women's safety" })}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-subtle)", maxWidth: "620px", margin: 0 }}>
            {t("community.womensSafetyDesc", { defaultValue: "Safety resources, emergency guidance, and official support contacts." })}
          </p>
        </div>
        <Link to="/community" className="btn btn-secondary btn-sm" aria-label={t("community.backToCommunity", { defaultValue: "Back to community" })}>
          {t("community.backToCommunity", { defaultValue: "Back to community" })}
        </Link>
      </div>

      {helplines.length > 0 && (
        <div>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.6rem", color: "var(--text-main)" }}>
            {t("community.helplines", { defaultValue: "Official support contacts" })}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
            {helplines.map((h) => (
              <div key={h.id} className="card" style={{ padding: "1rem 1.15rem", borderLeft: "4px solid #be185d" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                  <Phone size={16} color="#be185d" />
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

      {!loading && articles.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <HeartHandshake size={28} color="var(--text-faint)" style={{ marginBottom: "0.5rem" }} />
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
            const content = getLocalizedText(r.content, i18n.language);
            return (
              <motion.div key={r.id} variants={staggerItem} className="card" style={{ padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                  <span className="badge" style={{ backgroundColor: "#fdf2f8", color: "#be185d", fontWeight: 700 }}>
                    {r.resource_type === "notice"
                      ? t("community.safetyTypeNotice", { defaultValue: "Notice" })
                      : t("community.safetyTypeArticle", { defaultValue: "Article" })}
                  </span>
                  {r.published_at && <span style={{ fontSize: "0.75rem", color: "var(--text-faint)" }}>{formatDate(r.published_at, i18n.language)}</span>}
                </div>
                <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text-main)", margin: "0 0 0.35rem 0" }}>{title}</h3>
                {summary && <p style={{ fontSize: "var(--text-sm)", color: "var(--text-subtle)", margin: 0, lineHeight: 1.5 }}>{summary}</p>}
                {content && (
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--text-subtle)", margin: "0.5rem 0 0 0", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{content}</p>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Future emergency-button boundary note */}
      <div className="card" style={{ padding: "1.1rem 1.25rem", borderLeft: "4px solid #be185d", backgroundColor: "#fdf2f8" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
          <Info size={17} color="#be185d" />
          <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
            {t("community.emergencyPlanning", { defaultValue: "Emergency response: planned for a future milestone" })}
          </h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-subtle)", lineHeight: 1.55, margin: 0 }}>
          {t("community.emergencyPlanningDesc", {
            defaultValue: "Physical emergency devices and response tracking are planned. This section is designed so they can connect without redesigning the module.",
          })}
        </p>
      </div>
    </motion.div>
  );
};
