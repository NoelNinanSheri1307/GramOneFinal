import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getNotices, getExternalNews, CommunityNoticeResponse, ExternalNewsArticle, NoticeType, NoticeSource } from "../lib/api";
import { pageFade, staggerContainer, staggerItem } from "../lib/motion";
import { formatDate } from "../lib/formatters";
import { getLocalizedText } from "../lib/localize";
import { enrichNotices } from "../lib/translations";
import { AlertCircle, ArrowRight, Newspaper, Search } from "lucide-react";

const NOTICE_TYPE_OPTIONS: Array<{ value: NoticeType; labelKey: string }> = [
  { value: "announcement", labelKey: "community.noticeTypeAnnouncement" },
  { value: "news", labelKey: "community.noticeTypeNews" },
  { value: "notice", labelKey: "community.noticeTypeNotice" },
];

const noticeTypeStyle = (type: NoticeType) => {
  switch (type) {
    case "announcement":
      return { bg: "#f0fdf4", fg: "#15803d" };
    case "news":
      return { bg: "#eff6ff", fg: "#1d4ed8" };
    default:
      return { bg: "#fefce8", fg: "#a16207" };
  }
};

export const NewsListPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [notices, setNotices] = useState<CommunityNoticeResponse[]>([]);
  const [externalNews, setExternalNews] = useState<ExternalNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [noticeType, setNoticeType] = useState<NoticeType | "">("");
  const [sourceType, setSourceType] = useState<NoticeSource | "">("");
  const rawRef = useRef<CommunityNoticeResponse[]>([]);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchLocal = sourceType !== "external";
      const fetchExt = sourceType !== "panchayat";

      const [localRes, extRes] = await Promise.all([
        fetchLocal ? getNotices({ q: query || undefined, notice_type: noticeType || undefined, source_type: sourceType || undefined, limit: 50 }) : Promise.resolve(null),
        fetchExt ? getExternalNews({ q: query || undefined, language: i18n.language, category: noticeType || undefined }).catch(() => []) : Promise.resolve([])
      ]);

      if (localRes) {
        rawRef.current = localRes.items;
        setNotices(await enrichNotices(localRes.items, i18n.language));
      } else {
        rawRef.current = [];
        setNotices([]);
      }

      if (extRes) {
        setExternalNews(extRes);
      } else {
        setExternalNews([]);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load notices.");
    } finally {
      setLoading(false);
    }
  }, [query, noticeType, sourceType, i18n.language]);

  useEffect(() => {
    const timer = setTimeout(() => fetchNotices(), 250);
    return () => clearTimeout(timer);
  }, [fetchNotices]);

  useEffect(() => {
    let active = true;
    if (rawRef.current.length > 0) {
      enrichNotices(rawRef.current, i18n.language).then((enriched) => {
        if (active) setNotices(enriched);
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
      style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", color: "var(--primary-950)", marginBottom: "0.2rem" }}>
            {t("community.news", { defaultValue: "Local news & notices" })}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-subtle)", maxWidth: "620px", margin: 0 }}>
            {t("community.newsDesc", { defaultValue: "Panchayat announcements and community notices." })}
          </p>
        </div>
        <Link to="/community" className="btn btn-secondary btn-sm" aria-label={t("community.backToCommunity", { defaultValue: "Back to community" })}>
          {t("community.backToCommunity", { defaultValue: "Back to community" })}
        </Link>
      </div>

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
        <select value={noticeType} onChange={(e) => setNoticeType(e.target.value as NoticeType | "")} className="form-select" aria-label="Notice type">
          <option value="">{t("community.categoryAll", { defaultValue: "All categories" })}</option>
          {NOTICE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey, { defaultValue: opt.value })}
            </option>
          ))}
        </select>
        <select value={sourceType} onChange={(e) => setSourceType(e.target.value as NoticeSource | "")} className="form-select" aria-label="Source">
          <option value="">{t("community.sourceAll", { defaultValue: "All sources" })}</option>
          <option value="panchayat">{t("community.sourcePanchayat", { defaultValue: "Panchayat announcement" })}</option>
          <option value="external">{t("community.sourceExternal", { defaultValue: "External news" })}</option>
        </select>
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

      {/* Panchayat Notices Section */}
      {!loading && notices.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <h2 style={{ fontSize: "1.1rem", color: "var(--primary-900)", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span>🏛️</span> {t("community.panchayatAnnouncements", { defaultValue: "Panchayat Official Announcements" })}
          </h2>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {notices.map((notice) => {
              const title = getLocalizedText(notice.title, i18n.language);
              const summary = getLocalizedText(notice.summary, i18n.language);
              const style = noticeTypeStyle(notice.notice_type);
              return (
                <motion.div key={notice.id} variants={staggerItem} whileHover={{ y: -1, boxShadow: "var(--shadow-md)" }} transition={{ duration: 0.12 }}>
                  <Link to={`/community/news/${notice.id}`} className="card card-hover" style={{ textDecoration: "none", display: "block", padding: "1rem 1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: "240px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                          <span className="badge" style={{ backgroundColor: style.bg, color: style.fg, fontWeight: 700 }}>
                            {t(`community.noticeType${notice.notice_type[0].toUpperCase()}${notice.notice_type.slice(1)}`, { defaultValue: notice.notice_type })}
                          </span>
                          {notice.is_featured && (
                            <span className="badge" style={{ backgroundColor: "#fdf2f8", color: "#be185d", fontWeight: 700 }}>
                              {t("community.featured", { defaultValue: "Featured" })}
                            </span>
                          )}
                          {notice.published_at && (
                            <span style={{ fontSize: "0.75rem", color: "var(--text-faint)", fontWeight: 600 }}>
                              {formatDate(notice.published_at, i18n.language)}
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text-main)", margin: "0 0 0.35rem 0", lineHeight: 1.35 }}>
                          {title}
                        </h3>
                        {summary && (
                          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-subtle)", margin: 0, lineHeight: 1.5 }}>{summary}</p>
                        )}
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
        </div>
      )}

      {/* External News Section */}
      {!loading && externalNews.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "1rem" }}>
          <h2 style={{ fontSize: "1.1rem", color: "#475569", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span>📰</span> {t("community.externalNews", { defaultValue: "External Regional News Feed" })}
          </h2>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {externalNews.map((art) => (
              <motion.div key={art.id} variants={staggerItem} whileHover={{ y: -1, boxShadow: "var(--shadow-md)" }} transition={{ duration: 0.12 }}>
                <a
                  href={art.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card card-hover"
                  style={{ textDecoration: "none", display: "block", padding: "1rem 1.25rem", borderLeft: "4px solid #cbd5e1" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "240px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                        <span className="badge" style={{ backgroundColor: "#f8fafc", color: "#475569", fontWeight: 700 }}>
                          {art.source}
                        </span>
                        {art.published_at && (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-faint)", fontWeight: 600 }}>
                            {formatDate(art.published_at, i18n.language)}
                          </span>
                        )}
                        <span className="badge" style={{ backgroundColor: "var(--primary-50)", color: "var(--primary-700)", fontWeight: 700 }}>
                          {t("community.readOriginal", { defaultValue: "Read original" })} ↗
                        </span>
                      </div>
                      <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text-main)", margin: "0 0 0.35rem 0", lineHeight: 1.35 }}>
                        {art.title}
                      </h3>
                      {art.summary && (
                        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-subtle)", margin: 0, lineHeight: 1.5 }}>{art.summary}</p>
                      )}
                    </div>
                    {art.image_url && (
                      <div style={{ width: "80px", height: "60px", overflow: "hidden", borderRadius: "6px", flexShrink: 0 }}>
                        <img src={art.image_url} alt="article" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    )}
                  </div>
                </a>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {!loading && notices.length === 0 && externalNews.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <Newspaper size={28} color="var(--text-faint)" style={{ marginBottom: "0.5rem" }} />
          <h3 style={{ fontSize: "1.1rem" }}>{t("community.noNoticesTitle", { defaultValue: "No notices or news found" })}</h3>
        </div>
      )}
    </motion.div>
  );
};
