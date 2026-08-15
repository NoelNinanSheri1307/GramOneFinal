import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getScheme, SchemeResponse } from "../lib/api";
import { pageFade } from "../lib/motion";
import { formatDate } from "../lib/formatters";
import { getLocalizedText } from "../lib/localize";
import { enrichSchemes } from "../lib/translations";
import { AlertCircle, ArrowLeft, ExternalLink, Landmark } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  education: "Education",
  health: "Health",
  agriculture: "Agriculture",
  housing: "Housing",
  livelihood: "Livelihood",
  womens_empowerment: "Women's empowerment",
  pension: "Pension",
  water_sanitation: "Water & sanitation",
  disaster_relief: "Disaster relief",
  other: "Other",
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="card" style={{ padding: "1rem 1.25rem" }}>
    <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)", margin: "0 0 0.5rem 0" }}>{title}</h2>
    <div style={{ fontSize: "0.9rem", color: "var(--text-subtle)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{children}</div>
  </div>
);

export const SchemeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const [scheme, setScheme] = useState<SchemeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rawRef = useRef<SchemeResponse | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getScheme(Number(id));
        rawRef.current = res;
        const [enriched] = await enrichSchemes([res], i18n.language);
        if (active) setScheme(enriched);
      } catch (err: any) {
        if (active) setError(err?.message || "Failed to load scheme.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    if (rawRef.current) {
      enrichSchemes([rawRef.current], i18n.language).then(([enriched]) => {
        if (active) setScheme(enriched);
      });
    }
    return () => {
      active = false;
    };
  }, [i18n.language]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div className="card" style={{ height: "120px" }}>
          <div className="skeleton" style={{ height: "20px", width: "60%", marginBottom: "10px" }} />
          <div className="skeleton" style={{ height: "14px", width: "40%" }} />
        </div>
        <div className="card" style={{ height: "120px" }}>
          <div className="skeleton" style={{ height: "14px", width: "90%" }} />
        </div>
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
        <AlertCircle size={28} color="#b91c1c" style={{ marginBottom: "0.5rem" }} />
        <p style={{ color: "var(--text-subtle)" }}>{error || "Scheme not found."}</p>
        <Link to="/community/schemes" className="btn btn-secondary btn-sm" style={{ marginTop: "0.75rem" }}>
          {t("community.backToSchemes", { defaultValue: "Back to schemes" })}
        </Link>
      </div>
    );
  }

  const title = getLocalizedText(scheme.title, i18n.language);
  const villageName = scheme.village?.name ? getLocalizedText(scheme.village.name, i18n.language) : null;
  const isExpired = !!scheme.deadline && new Date(scheme.deadline) < new Date();

  return (
    <motion.div variants={pageFade} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <Link to="/community/schemes" className="btn btn-secondary btn-sm" aria-label={t("community.backToSchemes", { defaultValue: "Back to schemes" })}>
          <ArrowLeft size={15} />
          {t("community.backToSchemes", { defaultValue: "Back to schemes" })}
        </Link>
        <Link to="/community" className="btn btn-secondary btn-sm" aria-label={t("community.backToCommunity", { defaultValue: "Back to community" })}>
          {t("community.backToCommunity", { defaultValue: "Back to community" })}
        </Link>
      </div>

      <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
          <span className="badge" style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", fontWeight: 700 }}>
            <Landmark size={12} style={{ marginRight: "4px" }} />
            {CATEGORY_LABELS[scheme.category] ?? scheme.category}
          </span>
          {isExpired && (
            <span className="badge" style={{ backgroundColor: "#fef2f2", color: "#b91c1c", fontWeight: 700 }}>
              {t("community.includeExpired", { defaultValue: "Include expired" })}
            </span>
          )}
        </div>
        <h1 style={{ fontSize: "1.5rem", color: "var(--primary-950)", margin: "0 0 0.5rem 0", lineHeight: 1.3 }}>
          {title}
        </h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-subtle)", margin: 0 }}>{getLocalizedText(scheme.short_description, i18n.language)}</p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "1rem", fontSize: "0.8rem", color: "var(--text-faint)" }}>
          {villageName && <span>{villageName}</span>}
          {scheme.state && <span>{scheme.state}</span>}
          {scheme.district && <span>{scheme.district}</span>}
          {scheme.published_at && (
            <span>
              {t("community.publishedOn", { defaultValue: "Published:" })} {formatDate(scheme.published_at, i18n.language)}
            </span>
          )}
          {scheme.deadline && (
            <span>
              {t("community.deadline", { defaultValue: "Deadline:" })} {formatDate(scheme.deadline, i18n.language)}
            </span>
          )}
        </div>
      </div>

      {scheme.detailed_description && (
        <Section title={t("community.detailedDescLabel", { defaultValue: "Detailed description" })}>
          {getLocalizedText(scheme.detailed_description, i18n.language)}
        </Section>
      )}
      {scheme.eligibility && (
        <Section title={t("community.eligible", { defaultValue: "Who can apply" })}>
          {getLocalizedText(scheme.eligibility, i18n.language)}
        </Section>
      )}
      {scheme.benefits && (
        <Section title={t("community.benefits", { defaultValue: "Benefits" })}>
          {getLocalizedText(scheme.benefits, i18n.language)}
        </Section>
      )}
      {scheme.required_documents && (
        <Section title={t("community.requiredDocuments", { defaultValue: "Required documents" })}>
          {scheme.required_documents.split(/\n+/).filter(Boolean).map((line, idx) => (
            <div key={idx}>• {line}</div>
          ))}
        </Section>
      )}
      {scheme.application_instructions && (
        <Section title={t("community.howToApply", { defaultValue: "How to apply" })}>
          {getLocalizedText(scheme.application_instructions, i18n.language)}
        </Section>
      )}

      {scheme.official_url && (
        <div className="card" style={{ padding: "1rem 1.25rem", borderLeft: "4px solid var(--sdg-water)" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>
            {t("community.officialLink", { defaultValue: "Official application link" })}
          </h2>
          <a
            href={scheme.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
            style={{ textDecoration: "none" }}
          >
            <ExternalLink size={15} />
            {scheme.official_url}
          </a>
          <p style={{ fontSize: "0.78rem", color: "var(--text-faint)", margin: "0.6rem 0 0 0" }}>
            {t("community.referenceNote", { defaultValue: "Reference link: always verify details on the official source." })}
          </p>
        </div>
      )}
    </motion.div>
  );
};
