import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getNotice, CommunityNoticeResponse } from "../lib/api";
import { pageFade } from "../lib/motion";
import { formatDate } from "../lib/formatters";
import { getLocalizedText } from "../lib/localize";
import { enrichNotices } from "../lib/translations";
import { AlertCircle, ArrowLeft, Newspaper } from "lucide-react";

const noticeTypeLabel = (type: string): string =>
  `community.noticeType${type.charAt(0).toUpperCase()}${type.slice(1)}`;

export const NewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const [notice, setNotice] = useState<CommunityNoticeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rawRef = useRef<CommunityNoticeResponse | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getNotice(Number(id));
        rawRef.current = res;
        const [enriched] = await enrichNotices([res], i18n.language);
        if (active) setNotice(enriched);
      } catch (err: any) {
        if (active) setError(err?.message || "Failed to load notice.");
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
      enrichNotices([rawRef.current], i18n.language).then(([enriched]) => {
        if (active) setNotice(enriched);
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
        <div className="card" style={{ height: "140px" }}>
          <div className="skeleton" style={{ height: "14px", width: "90%" }} />
        </div>
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
        <AlertCircle size={28} color="#b91c1c" style={{ marginBottom: "0.5rem" }} />
        <p style={{ color: "var(--text-subtle)" }}>{error || "Notice not found."}</p>
        <Link to="/community/news" className="btn btn-secondary btn-sm" style={{ marginTop: "0.75rem" }}>
          {t("community.backToNews", { defaultValue: "Back to news" })}
        </Link>
      </div>
    );
  }

  const title = getLocalizedText(notice.title, i18n.language);
  const villageName = notice.village?.name ? getLocalizedText(notice.village.name, i18n.language) : null;
  const isExternal = notice.source_type === "external";

  return (
    <motion.div variants={pageFade} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <Link to="/community/news" className="btn btn-secondary btn-sm" aria-label={t("community.backToNews", { defaultValue: "Back to news" })}>
          <ArrowLeft size={15} />
          {t("community.backToNews", { defaultValue: "Back to news" })}
        </Link>
        <Link to="/community" className="btn btn-secondary btn-sm" aria-label={t("community.backToCommunity", { defaultValue: "Back to community" })}>
          {t("community.backToCommunity", { defaultValue: "Back to community" })}
        </Link>
      </div>

      <article className="card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          <span className="badge" style={{ backgroundColor: "#f0fdf4", color: "#15803d", fontWeight: 700 }}>
            <Newspaper size={12} style={{ marginRight: "4px" }} />
            {t(noticeTypeLabel(notice.notice_type), { defaultValue: notice.notice_type })}
          </span>
          {isExternal && (
            <span className="badge" style={{ backgroundColor: "#f8fafc", color: "#475569", fontWeight: 700 }}>
              {t("community.sourceExternal", { defaultValue: "External news" })}
            </span>
          )}
          {notice.is_featured && (
            <span className="badge" style={{ backgroundColor: "#fdf2f8", color: "#be185d", fontWeight: 700 }}>
              {t("community.featured", { defaultValue: "Featured" })}
            </span>
          )}
        </div>

        <h1 style={{ fontSize: "1.5rem", color: "var(--primary-950)", margin: "0 0 0.5rem 0", lineHeight: 1.3 }}>{title}</h1>

        <div style={{ fontSize: "0.8rem", color: "var(--text-faint)", display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          {notice.published_at && (
            <span>
              {t("community.publishedOn", { defaultValue: "Published:" })} {formatDate(notice.published_at, i18n.language)}
            </span>
          )}
          {notice.expires_at && (
            <span>
              {t("community.expiresOn", { defaultValue: "Expires:" })} {formatDate(notice.expires_at, i18n.language)}
            </span>
          )}
          {villageName && <span>{villageName}</span>}
          {notice.state && <span>{notice.state}</span>}
          {notice.category && <span>{notice.category}</span>}
        </div>

        {notice.summary && (
          <p style={{ fontSize: "1rem", color: "var(--text-main)", fontWeight: 600, lineHeight: 1.6, margin: "0 0 0.75rem 0" }}>
            {getLocalizedText(notice.summary, i18n.language)}
          </p>
        )}
        {notice.content && (
          <div style={{ fontSize: "0.95rem", color: "var(--text-subtle)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {getLocalizedText(notice.content, i18n.language)}
          </div>
        )}

        {isExternal && (
          <p style={{ fontSize: "0.78rem", color: "var(--text-faint)", marginTop: "1.25rem", borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem" }}>
            {t("community.referenceNote", { defaultValue: "Reference link: always verify details on the official source." })}
          </p>
        )}
      </article>
    </motion.div>
  );
};
