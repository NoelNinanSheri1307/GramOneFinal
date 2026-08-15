import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { getCSROpportunity, createCSRSponsorship, CSROpportunity } from "../lib/api";
import { CategoryBadge } from "../components/CategoryBadge";
import { pageFade } from "../lib/motion";
import { getLocalizedText, LocalizedString } from "../lib/localize";
import { csrStatusColor, csrStatusLabel } from "../lib/csrFormat";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  HeartHandshake,
  MapPin,
  Users,
  ShieldCheck,
  Award,
} from "lucide-react";

export const CSROpportunityDetailPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const opportunityId = Number(id);

  const [opportunity, setOpportunity] = useState<CSROpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [supportType, setSupportType] = useState("financial");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const rawRef = useRef<CSROpportunity | null>(null);

  const fetchData = useCallback(async () => {
    if (!opportunityId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getCSROpportunity(opportunityId);
      rawRef.current = res;
      setOpportunity(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load opportunity.");
    } finally {
      setLoading(false);
    }
  }, [opportunityId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let active = true;
    if (rawRef.current) {
      setOpportunity(rawRef.current);
      void active;
    }
  }, [i18n.language]);

  const handleSponsor = async () => {
    if (!opportunity) return;
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const project = opportunity.projects?.[0];
      if (!project) {
        setError("No funded project exists for this opportunity yet. The Panchayat must create one first.");
        return;
      }
      await createCSRSponsorship({
        project_id: project.id,
        amount: amount ? Number(amount) : null,
        support_type: supportType,
        note: note.trim() || undefined,
      });
      setSuccessMsg(t("csr.sponsoredSuccess", { defaultValue: "Sponsorship submitted. The Panchayat will confirm your commitment." }));
      await fetchData();
    } catch (err: any) {
      setError(err?.message || "Failed to submit sponsorship.");
    } finally {
      setSubmitting(false);
    }
  };

  const label = (v: LocalizedValue) => getLocalizedText(v, i18n.language);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "896px", margin: "0 auto" }}>
        <div className="skeleton" style={{ height: "40px", width: "30%" }} />
        <div className="skeleton" style={{ height: "150px", width: "100%" }} />
        <div className="skeleton" style={{ height: "220px", width: "100%" }} />
      </div>
    );
  }

  if (error && !opportunity) {
    return (
      <div className="card" style={{ maxWidth: "600px", margin: "2rem auto", textAlign: "center" }}>
        <AlertCircle size={40} color="#dc2626" style={{ marginBottom: "0.5rem" }} />
        <h3>{t("csr.notFoundTitle", { defaultValue: "Opportunity not found" })}</h3>
        <p style={{ margin: "0.5rem 0 1.25rem 0" }}>{error}</p>
        <Link to="/csr/opportunities" className="btn btn-primary btn-sm">
          {t("csr.backToOpportunities", { defaultValue: "Back to opportunities" })}
        </Link>
      </div>
    );
  }

  if (!opportunity) return null;

  const score = opportunity.impact_score;
  const project = opportunity.projects?.[0];
  const alreadySponsored = opportunity.sponsored;

  return (
    <motion.div variants={pageFade} initial="hidden" animate="visible" style={{ maxWidth: "896px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <Link to="/csr/opportunities" style={{ textDecoration: "none", color: "var(--text-subtle)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
          <ArrowLeft size={16} /> {t("csr.backToOpportunities", { defaultValue: "Back to opportunities" })}
        </Link>
      </div>

      {successMsg && (
        <div className="alert alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="card" style={{ borderLeft: "4px solid var(--sdg-civic)", boxShadow: "var(--shadow-md)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
          <CategoryBadge category={opportunity.category} />
          <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--sdg-civic)" }}>{opportunity.reference || `#${opportunity.id}`}</span>
          {opportunity.sdg && (
            <span className="badge" style={{ backgroundColor: "var(--sdg-water-light)", color: "var(--sdg-water)" }}>{opportunity.sdg}</span>
          )}
          {opportunity.matched_score != null && (
            <span className="badge" style={{ backgroundColor: "var(--sdg-civic-light)", color: "var(--sdg-civic)", fontWeight: 700 }}>
              {Math.round(opportunity.matched_score)}% {t("csr.matchQuality", { defaultValue: "match" })}
            </span>
          )}
        </div>
        <h1 style={{ fontSize: "1.6rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>{label(opportunity.title)}</h1>
        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--text-subtle)" }}>
          {opportunity.village && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
              <MapPin size={14} /> {label(opportunity.village.name)} ({opportunity.village.district}, {opportunity.village.state})
            </span>
          )}
          {opportunity.affected_population && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
              <Users size={14} /> ~{opportunity.affected_population} {t("csr.affectedPopulation", { defaultValue: "affected" })}
            </span>
          )}
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
            <Award size={14} /> {t("csr.caseStatus", { defaultValue: "Status" })}:{" "}
            <strong>{t(`status.${opportunity.status}`, { defaultValue: csrStatusLabel(opportunity.status) })}</strong>
          </span>
        </div>
      </div>

      {/* Match Analysis Card */}
      {opportunity.matched_score != null && (
        <div className="card" style={{ borderLeft: "4px solid var(--sdg-civic)", backgroundColor: "var(--bg-card)" }}>
          <h3 style={{ fontSize: "1rem", color: "var(--sdg-civic)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShieldCheck size={18} />
            <span>{t("csr.matchAnalysis", { defaultValue: "Match Analysis" })} ({Math.round(opportunity.matched_score)}% {t("csr.matchQuality", { defaultValue: "match" })})</span>
          </h3>
          <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.85rem", color: "var(--text-subtle)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {opportunity.match_reasons?.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Sponsor action */}
      <div className="card" style={{ backgroundColor: "var(--bg-subtle)", border: "2px solid var(--sdg-civic)" }}>
        <h3 style={{ fontSize: "1.15rem", color: "var(--sdg-civic)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <HeartHandshake size={20} /> {t("csr.sponsor", { defaultValue: "Sponsor this project" })}
        </h3>

        {project && (
          <div style={{ fontSize: "0.875rem", color: "var(--text-subtle)", marginBottom: "0.75rem" }}>
            {project.name}
            {project.estimated_budget != null && (
              <span> · {t("csr.fundingStatus", { defaultValue: "Estimated budget" })} ₹{project.estimated_budget.toLocaleString()}</span>
            )}
          </div>
        )}

        {alreadySponsored ? (
          <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#166534", margin: 0 }}>
            <CheckCircle2 size={16} style={{ verticalAlign: "middle", marginRight: "0.25rem" }} />
            {t("csr.alreadySponsored", { defaultValue: "You already sponsor this project" })}
          </p>
        ) : !project ? (
          <p style={{ fontSize: "0.875rem", color: "var(--text-subtle)", margin: 0 }}>
            {t("csr.noProjectYet", { defaultValue: "A fundable project has not been created for this opportunity yet. Check back after the Panchayat sets it up." })}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", margin: 0 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: "0.85rem" }}>{t("csr.sponsorAmount", { defaultValue: "Funding commitment (INR, optional)" })}</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder={t("csr.sponsorAmountPlaceholder", { defaultValue: "e.g. 500000" })}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  aria-label={t("csr.sponsorAmount", { defaultValue: "Funding commitment" })}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: "0.85rem" }}>{t("csr.proposedSupportType", { defaultValue: "Proposed contribution type" })}</label>
                <select
                  className="form-select"
                  value={supportType}
                  onChange={(e) => setSupportType(e.target.value)}
                  aria-label={t("csr.proposedSupportType", { defaultValue: "Proposed contribution type" })}
                >
                  <option value="financial">Financial</option>
                  <option value="equipment">Equipment / Material</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="training">Training / Expertise</option>
                  <option value="volunteers">Volunteers</option>
                  <option value="emergency">Emergency assistance</option>
                  <option value="long_term">Long-term project support</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: "0.85rem" }}>{t("csr.sponsorNote", { defaultValue: "Commitment note (optional)" })}</label>
              <input
                className="form-input"
                placeholder={t("csr.sponsorNotePlaceholder", { defaultValue: "e.g. Funding commitment towards pipeline repair." })}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                aria-label={t("csr.sponsorNote", { defaultValue: "Commitment note" })}
              />
            </div>
            <button onClick={handleSponsor} disabled={submitting} className="btn btn-primary" style={{ backgroundColor: "var(--sdg-civic)", borderColor: "var(--sdg-civic)" }}>
              <HeartHandshake size={16} />
              <span>{submitting ? t("csr.sponsoring", { defaultValue: "Submitting sponsorship..." }) : t("csr.sponsor", { defaultValue: "Sponsor this project" })}</span>
            </button>
          </div>
        )}
      </div>

      {/* Problem summary */}
      <div className="card">
        <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>{t("csr.problem", { defaultValue: "Problem" })}</h3>
        <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--text-main)", whiteSpace: "pre-wrap", margin: 0 }}>
          {label(opportunity.summary || "") || t("impact.noSummary", { defaultValue: "No detailed summary provided." })}
        </p>
      </div>

      {/* Evidence */}
      <div className="card">
        <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ShieldCheck size={18} color="var(--primary-600)" /> {t("impact.evidenceHeader", { defaultValue: "Evidence" })}
        </h3>
        <div style={{ display: "flex", gap: "2rem", fontSize: "0.875rem", color: "var(--text-subtle)" }}>
          <span>
            {t("csr.evidenceCount", { defaultValue: "evidence item" })}:{" "}
            <strong>{opportunity.evidence_count}{opportunity.evidence_count !== 1 ? "s" : ""}</strong>
          </span>
        </div>
      </div>

      {/* Explainable score */}
      {score && (
        <div className="card">
          <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>{t("csr.scoreBreakdown", { defaultValue: "Explainable impact score" })}</h3>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "1rem" }}>
            <span style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--sdg-civic)" }}>{score.overall_score}</span>
            <span style={{ fontSize: "0.875rem", color: "var(--text-subtle)" }}>/ 100</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {[
              { label: t("csr.severity", { defaultValue: "Severity" }), value: score.severity_component, max: 30 },
              { label: t("csr.population", { defaultValue: "Population" }), value: score.population_component, max: 25 },
              { label: t("csr.evidence", { defaultValue: "Evidence" }), value: score.evidence_component, max: 15 },
              { label: t("csr.timeFactor", { defaultValue: "Time" }), value: score.time_component, max: 15 },
              { label: t("csr.infrastructure", { defaultValue: "Infrastructure" }), value: score.infrastructure_component, max: 15 },
            ].map((row) => (
              <div key={row.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-subtle)", marginBottom: "0.2rem" }}>
                  <span>{row.label}</span>
                  <span>{row.value} / {row.max}</span>
                </div>
                <div style={{ height: "8px", backgroundColor: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (row.value / row.max) * 100)}%`, backgroundColor: "var(--sdg-civic)", borderRadius: "4px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sponsorship status */}
      {project && (
        <div className="card">
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>{t("csr.sponsorshipStatus", { defaultValue: "Sponsorship status" })}</h3>
          {project.sponsorship_status ? (
            <span className="badge" style={{ ...csrStatusColor(project.sponsorship_status), fontWeight: 700 }}>
              {t(`status.${project.sponsorship_status}`, { defaultValue: csrStatusLabel(project.sponsorship_status) })}
            </span>
          ) : (
            <span style={{ fontSize: "0.875rem", color: "var(--text-subtle)" }}>
              {t("csr.sponsorshipPending", { defaultValue: "Not yet sponsored" })}
            </span>
          )}
          <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--text-subtle)" }}>
            {t("csr.projectStatus", { defaultValue: "Project status" })}:{" "}
            <strong>{t(`status.${project.status}`, { defaultValue: csrStatusLabel(project.status) })}</strong>
          </div>
        </div>
      )}
    </motion.div>
  );
};

type LocalizedValue = LocalizedString | string | null | undefined;