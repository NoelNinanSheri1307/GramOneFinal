import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { listCSRSponsorships, listCSRProjects, CSRSponsorship, CSRProjectBrief } from "../lib/api";
import { pageFade } from "../lib/motion";
import { getLocalizedText, LocalizedString } from "../lib/localize";
import { csrStatusColor, csrStatusLabel } from "../lib/csrFormat";
import { AlertCircle, Award, CheckCircle2, Handshake } from "lucide-react";

export const CSRSponsorshipsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [sponsorships, setSponsorships] = useState<CSRSponsorship[]>([]);
  const [projects, setProjects] = useState<CSRProjectBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [spoRes, projRes] = await Promise.all([
        listCSRSponsorships({ limit: 100 }).catch(() => ({ items: [] as CSRSponsorship[], total: 0 })),
        listCSRProjects().catch(() => ({ items: [] as CSRProjectBrief[], total: 0 })),
      ]);
      setSponsorships(spoRes.items);
      setProjects(projRes.items);
    } catch (err: any) {
      setError(err?.message || "Failed to load sponsorships.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const label = (v: LocalizedValue) => getLocalizedText(v, i18n.language);
  const totalCommitted = sponsorships
    .filter((s) => ["pending", "confirmed", "active"].includes(s.status))
    .reduce((sum, s) => sum + (s.amount ?? 0), 0);

  return (
    <motion.div variants={pageFade} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <Link to="/csr" style={{ textDecoration: "none", color: "var(--text-subtle)", fontWeight: 600, fontSize: "0.85rem" }}>
          ← {t("csr.backToDashboard", { defaultValue: "Back to CSR dashboard" })}
        </Link>
        <h1 style={{ fontSize: "1.6rem", color: "var(--sdg-civic)", marginTop: "0.25rem" }}>
          {t("csr.mySponsorships", { defaultValue: "My sponsorships" })}
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--text-subtle)" }}>
          {t("csr.mySponsorshipsSubtitle", { defaultValue: "Track every funding commitment and its Panchayat-verified status." })}
        </p>
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
            <div key={n} className="card" style={{ height: "90px" }}>
              <div className="skeleton" style={{ height: "18px", width: "50%", marginBottom: "10px" }} />
              <div className="skeleton" style={{ height: "13px", width: "35%" }} />
            </div>
          ))}
        </div>
      )}

      {/* Committed funding stat */}
      {!loading && sponsorships.length > 0 && (
        <div className="card" style={{ borderLeft: "4px solid var(--sdg-civic)" }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: "var(--sdg-civic-light)", color: "var(--sdg-civic)" }}>
              <Handshake size={22} />
            </div>
            <div>
              <div className="stat-value">₹{totalCommitted.toLocaleString()}</div>
              <div className="stat-label">{t("csr.totalCommitted", { defaultValue: "Committed funding" })}</div>
            </div>
          </div>
        </div>
      )}

      {!loading && sponsorships.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <div className="empty-state-title">{t("csr.noSponsorshipsTitle", { defaultValue: "No sponsorships yet" })}</div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-subtle)", margin: "0.35rem 0 1rem 0" }}>
            {t("csr.noSponsorshipsDesc", { defaultValue: "Initiate a sponsorship from any eligible opportunity to start tracking it here." })}
          </p>
          <Link to="/csr/opportunities" className="btn btn-primary btn-sm" style={{ backgroundColor: "var(--sdg-civic)", borderColor: "var(--sdg-civic)" }}>
            <span>{t("csr.browseOpportunities", { defaultValue: "Browse opportunities" })}</span>
          </Link>
        </div>
      )}

      {!loading && sponsorships.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {sponsorships.map((s) => {
            const sc = csrStatusColor(s.status);
            const projectMatches = projects.find((p) => p.id === s.project_id);
            return (
              <div key={s.id} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", padding: "1.15rem 1.25rem", borderLeft: "4px solid var(--sdg-civic)" }}>
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                    {projectMatches && <span className="badge" style={{ backgroundColor: "var(--sdg-civic-light)", color: "var(--sdg-civic)", fontWeight: 700 }}>{projectMatches.name}</span>}
                    <span className="badge" style={{ backgroundColor: sc.bg, color: sc.fg, fontWeight: 700 }}>
                      {t(`status.${s.status}`, { defaultValue: csrStatusLabel(s.status) })}
                    </span>
                  </div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--text-subtle)" }}>
                    {projectMatches && (
                      <>
                        {t("csr.projectStatus", { defaultValue: "Project" })}:{" "}
                        <strong>{t(`status.${projectMatches.status}`, { defaultValue: csrStatusLabel(projectMatches.status) })}</strong>
                        {projectMatches.village && <> · {label(projectMatches.village.name)}</>}
                        {projectMatches.estimated_budget != null && <> · ₹{projectMatches.estimated_budget.toLocaleString()}</>
                        }
                      </>
                    )}
                    {s.amount != null && <> · {t("csr.commitment", { defaultValue: "Committed" })} ₹{s.amount.toLocaleString()}</>}
                  </div>
                </div>
                {s.impact_case_id && (
                  <Link to={`/csr/opportunities/${s.impact_case_id}`} className="btn btn-secondary btn-sm">
                    <Award size={14} />
                    <span>{t("csr.viewOpportunity", { defaultValue: "View opportunity" })}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Supported projects */}
      {!loading && projects.length > 0 && (
        <div>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={18} color="var(--sdg-civic)" />
            {t("csr.supportedProjects", { defaultValue: "Supported projects" })}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {projects.map((p) => {
              const sc = csrStatusColor(p.status);
              return (
                <div key={p.id} className="card" style={{ padding: "1rem 1.25rem", borderLeft: "4px solid var(--sdg-civic)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{p.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-subtle)", marginTop: "0.2rem" }}>
                        {p.village && label(p.village.name)}
                        {p.estimated_budget != null && <> · ₹{p.estimated_budget.toLocaleString()}</>}
                      </div>
                    </div>
                    <span className="badge" style={{ backgroundColor: sc.bg, color: sc.fg, fontWeight: 700 }}>
                      {t(`status.${p.status}`, { defaultValue: csrStatusLabel(p.status) })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

type LocalizedValue = LocalizedString | string | null | undefined;