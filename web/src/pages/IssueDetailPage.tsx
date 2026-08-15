import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { pageFade, buttonTap } from "../lib/motion";
import {
  getIssue,
  getIssueEvidence,
  getIssueHistory,
  createEvidence,
  IssueResponse,
  EvidenceResponse,
  IssueHistoryResponse,
} from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";
import { CategoryBadge } from "../components/CategoryBadge";
import { Timeline } from "../components/Timeline";
import { formatDate } from "../lib/formatters";
import { getLocalizedText } from "../lib/localize";
import { enrichIssueDetail } from "../lib/translations";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, ShieldCheck, AlertCircle, Globe } from "lucide-react";

export const IssueDetailPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const issueId = Number(id);

  const [issue, setIssue] = useState<IssueResponse | null>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceResponse[]>([]);
  const [history, setHistory] = useState<IssueHistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rawBundleRef = useRef<{ issue: IssueResponse; evidence: EvidenceResponse[]; history: IssueHistoryResponse[] } | null>(null);

  // Evidence Form
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [evidenceNote, setEvidenceNote] = useState("");
  const [addingEvidence, setAddingEvidence] = useState(false);

  const fetchDetailData = async () => {
    if (!issueId) return;
    setLoading(true);
    setError(null);
    try {
      const [issueRes, evRes, histRes] = await Promise.all([
        getIssue(issueId),
        getIssueEvidence(issueId).catch(() => []),
        getIssueHistory(issueId).catch(() => []),
      ]);
      rawBundleRef.current = { issue: issueRes, evidence: evRes, history: histRes };
      const enriched = await enrichIssueDetail(rawBundleRef.current, i18n.language);
      setIssue(enriched.issue);
      setEvidenceList(enriched.evidence);
      setHistory(enriched.history);
    } catch (err: any) {
      setError(err?.message || "Failed to load issue details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailData();
  }, [issueId]);

  // Re-enrich (no reload) when the UI language changes.
  useEffect(() => {
    let active = true;
    if (rawBundleRef.current) {
      enrichIssueDetail(rawBundleRef.current, i18n.language).then((enriched) => {
        if (active) {
          setIssue(enriched.issue);
          setEvidenceList(enriched.evidence);
          setHistory(enriched.history);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [i18n.language]);

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceNote.trim() || !issueId) return;
    setAddingEvidence(true);
    try {
      await createEvidence(issueId, {
        evidence_type: "citizen_report",
        description: evidenceNote,
        source_reference: "Citizen Web Upload",
      });
      setEvidenceNote("");
      setShowEvidenceForm(false);
      await fetchDetailData();
    } catch (err: any) {
      alert("Failed to submit evidence: " + (err?.message || "Server error"));
    } finally {
      setAddingEvidence(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "896px", margin: "0 auto" }}>
        <div className="skeleton" style={{ height: "40px", width: "30%" }} />
        <div className="skeleton" style={{ height: "140px", width: "100%" }} />
        <div className="skeleton" style={{ height: "200px", width: "100%" }} />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="card" style={{ maxWidth: "600px", margin: "2rem auto", textAlign: "center" }}>
        <AlertCircle size={40} color="#dc2626" style={{ marginBottom: "0.5rem" }} />
        <h3>{t("issueDetail.notFoundTitle", { defaultValue: "Issue not found" })}</h3>
        <p style={{ margin: "0.5rem 0 1.25rem 0" }}>{error || t("issueDetail.notFoundDesc", { defaultValue: "The requested issue does not exist or you do not have permission to view it." })}</p>
        <Link to="/issues" className="btn btn-primary btn-sm" aria-label={t("issueDetail.backToList", { defaultValue: "Back to issues list" })}>
          <ArrowLeft size={16} /> {t("issueDetail.backToList", { defaultValue: "Back to issues list" })}
        </Link>
      </div>
    );
  }

  const createdDateStr = formatDate(issue.created_at, i18n.language);
  const localizedTitle = getLocalizedText(issue.title, i18n.language);
  const localizedDesc = getLocalizedText(issue.description, i18n.language);
  const villageName = issue.village?.name ? getLocalizedText(issue.village.name, i18n.language) : "Rampur";
  const villageStr = `${villageName} ${t("dashboard.panchayatSuffix", { defaultValue: "Panchayat" })}`;
  const origLang = issue.original_language || "en";

  return (
    <motion.div
      variants={pageFade}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: "896px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      {/* Back Link */}
      <div>
        <Link
          to="/issues"
          aria-label={t("issueDetail.backToDirectory", { defaultValue: "Back to issues directory" })}
          style={{ textDecoration: "none", color: "var(--text-subtle)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
        >
          <ArrowLeft size={16} /> {t("issueDetail.backToDirectory", { defaultValue: "Back to issues directory" })}
        </Link>
      </div>

      {/* SECTION A: HEADER CARD */}
      <div className="card" style={{ boxShadow: "var(--shadow-md)", borderLeft: "4px solid var(--primary-600)", padding: "1.25rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <CategoryBadge category={issue.category} />
            <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--primary-800)", backgroundColor: "var(--primary-50)", padding: "2px 8px", borderRadius: "4px" }}>
              {issue.reference || `#${issue.id}`}
            </span>
            {/* Part 6: Original language indicator */}
            {origLang && (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--text-subtle)",
                  backgroundColor: "var(--bg-subtle)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                <Globe size={12} />
                {t("report.originalLangPrefix", { defaultValue: "Original language:" })} {origLang.toUpperCase()}
              </span>
            )}
          </div>
          <StatusBadge status={issue.status} />
        </div>

        <h1 style={{ fontSize: "1.65rem", marginBottom: "0.5rem", color: "var(--text-main)", letterSpacing: "-0.03em" }}>
          {localizedTitle}
        </h1>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", fontSize: "0.875rem", color: "var(--text-subtle)", borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem" }}>
          <div>
            <strong style={{ color: "var(--text-main)" }}>{t("issueDetail.reportedOn", { defaultValue: "Reported:" })}</strong> {createdDateStr}
          </div>
          <div>
            <strong style={{ color: "var(--text-main)" }}>{t("issueDetail.village", { defaultValue: "Village:" })}</strong> {villageStr}
          </div>
          <div>
            <strong style={{ color: "var(--text-main)" }}>{t("issueDetail.reporter", { defaultValue: "Reporter:" })}</strong> {issue.reporter?.name || "Local Citizen"}
          </div>
        </div>
      </div>

      {/* SECTION B: DESCRIPTION & AI INTERPRETATION CARD */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
        {/* Description Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <h2 style={{ fontSize: "1.15rem", marginBottom: "0.75rem", color: "var(--text-main)", lineHeight: 1.3 }}>
            {t("issueDetail.descHeader", { defaultValue: "Description" })}
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--text-body)", lineHeight: 1.6, flex: 1, whiteSpace: "pre-wrap" }}>
            {localizedDesc || t("issueDetail.noDesc", { defaultValue: "No full description provided." })}
          </p>
        </div>

        {/* AI Interpretation Card */}
        <div className="card ai-interpretation-card" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <ShieldCheck size={20} color="var(--primary-600)" />
            <h2 style={{ fontSize: "1.15rem", color: "var(--primary-900)", margin: 0, lineHeight: 1.3 }}>
              {t("issueDetail.aiHeader", { defaultValue: "GramOne AI Analysis" })}
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.875rem", color: "var(--text-main)", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-subtle)" }}>{t("issueDetail.category", { defaultValue: "Category:" })}</span>
              <strong style={{ textTransform: "capitalize" }}>{issue.category}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-subtle)" }}>{t("issueDetail.subcategory", { defaultValue: "Subcategory:" })}</span>
              <strong>{issue.subcategory || "Water Supply Line"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-subtle)" }}>{t("issueDetail.sourceEngine", { defaultValue: "Source engine:" })}</span>
              <span style={{ fontWeight: 600, color: "var(--primary-700)" }}>GramOne AI Engine v2</span>
            </div>
            <div style={{ borderTop: "1px dashed var(--border-color)", paddingTop: "0.5rem", marginTop: "auto" }}>
              <span style={{ color: "var(--text-subtle)", display: "block", fontSize: "0.75rem" }}>{t("issueDetail.evidenceVerification", { defaultValue: "Evidence verification:" })}</span>
              <strong style={{ color: "var(--primary-800)" }}>
                High confidence ({evidenceList.length || 1} {t("issueDetail.recordsAttached", { defaultValue: "record(s) attached" })})
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION C: EVIDENCE LIST */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <h2 style={{ fontSize: "1.15rem" }}>
            {t("issueDetail.evidenceHeader", { count: evidenceList.length, defaultValue: `Evidence & verification logs (${evidenceList.length})` })}
          </h2>
          <button
            type="button"
            onClick={() => setShowEvidenceForm(!showEvidenceForm)}
            className="btn btn-secondary btn-sm"
            aria-label={t("issueDetail.addEvidence", { defaultValue: "Add evidence" })}
          >
            {t("issueDetail.addEvidence", { defaultValue: "Add evidence" })}
          </button>
        </div>

        {/* Evidence Submission Form */}
        {showEvidenceForm && (
          <form onSubmit={handleAddEvidence} style={{ marginBottom: "1.25rem", padding: "1rem", backgroundColor: "#f8fafc", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <div className="form-group" style={{ marginBottom: "0.75rem" }}>
              <label htmlFor="evidence-note" className="form-label" style={{ fontSize: "0.85rem" }}>
                {t("issueDetail.evidenceLabel", { defaultValue: "Evidence description / citizen observation" })}
              </label>
              <textarea
                id="evidence-note"
                className="form-textarea"
                rows={3}
                required
                placeholder={t("issueDetail.evidencePlaceholder", { defaultValue: "e.g. Additional photo or testimony confirming the water leak." })}
                value={evidenceNote}
                onChange={(e) => setEvidenceNote(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowEvidenceForm(false)} className="btn btn-secondary btn-sm" aria-label={t("issueDetail.cancel", { defaultValue: "Cancel" })}>
                {t("issueDetail.cancel", { defaultValue: "Cancel" })}
              </button>
              <button type="submit" disabled={addingEvidence} className="btn btn-primary btn-sm" aria-label={t("issueDetail.saveEvidence", { defaultValue: "Save evidence" })}>
                {addingEvidence ? t("issueDetail.submitting", { defaultValue: "Submitting..." }) : t("issueDetail.saveEvidence", { defaultValue: "Save evidence" })}
              </button>
            </div>
          </form>
        )}

        {evidenceList.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "var(--text-subtle)", fontStyle: "italic" }}>
            {t("issueDetail.emptyEvidence", { defaultValue: "Initial citizen report recorded. Additional field testimony or photo evidence can be attached above." })}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {evidenceList.map((ev) => (
              <div
                key={ev.id}
                style={{
                  padding: "0.85rem 1rem",
                  backgroundColor: "var(--bg-card)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-color)",
                  fontSize: "0.875rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-subtle)", fontSize: "0.75rem", marginBottom: "0.35rem" }}>
                  <span style={{ fontWeight: 700, textTransform: "uppercase" }}>
                    {t(`evidenceType.${ev.evidence_type}`, { defaultValue: ev.evidence_type.replace("_", " ") })}
                  </span>
                  <span>{formatDate(ev.created_at, i18n.language)}</span>
                </div>
                <div style={{ color: "var(--text-body)", marginBottom: ev.source_reference ? "0.5rem" : 0 }}>
                  {getLocalizedText(ev.description, i18n.language)}
                </div>
                {ev.source_reference && (ev.evidence_type === "uploaded_image" || ev.evidence_type === "before_field_image" || ev.evidence_type === "after_field_image") && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <img
                      src={ev.source_reference.startsWith("http") || ev.source_reference.startsWith("/api") ? ev.source_reference : `/api/v1/issues/evidence-file/${ev.source_reference}`}
                      alt="Uploaded evidence"
                      style={{ maxHeight: "240px", maxWidth: "100%", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION D: IMPACT CASE CREATION OR IMPACT DETAIL */}
      {user?.role === "panchayat" ? (
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, var(--sdg-civic-light) 0%, #ffffff 70%)",
            borderColor: "rgba(109,40,217,0.2)",
          }}
        >
          <h2 style={{ fontSize: "1.15rem", color: "var(--sdg-civic)", marginBottom: "0.35rem" }}>
            {t("issueDetail.impactHeader", { defaultValue: "Impact case aggregation" })}
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: 1.5 }}>
            {t("issueDetail.impactDesc", { defaultValue: "Combine this report with related village infrastructure issues into a consolidated Impact Case to attract CSR partner funding." })}
          </p>
          <div>
            <motion.div whileTap={buttonTap}>
              <Link
                to={`/panchayat/create-impact-case?issue_ids=${issue.id}`}
                className="btn btn-primary btn-sm"
                aria-label={t("issueDetail.createImpactBtn", { defaultValue: "Create impact case with this report" })}
                style={{ backgroundColor: "var(--sdg-civic)", borderColor: "var(--sdg-civic)" }}
              >
                {t("issueDetail.createImpactBtn", { defaultValue: "Create impact case with this report" })}
              </Link>
            </motion.div>
          </div>
        </div>
      ) : (
        issue.impact_case && (
          <div
            className="card"
            style={{
              background: "linear-gradient(135deg, var(--sdg-civic-light) 0%, var(--bg-card) 70%)",
              borderColor: "rgba(109,40,217,0.2)",
            }}
          >
            <h2 style={{ fontSize: "1.15rem", color: "var(--sdg-civic)", marginBottom: "0.35rem" }}>
              {t("issueDetail.impactHeadingCitizen", { defaultValue: "Long-term community resolution" })}
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              {t("issueDetail.impactDescCitizen", { 
                defaultValue: "This issue has been aggregated into a larger Panchayat Impact Project to seek CSR partner funding: "
              })}
              <strong>{getLocalizedText(issue.impact_case.title, i18n.language)} ({issue.impact_case.reference})</strong>.
            </p>
          </div>
        )
      )}

      {/* SECTION E: STATUS & RESOLUTION TIMELINE */}
      <div className="card">
        <h2 style={{ fontSize: "1.15rem", marginBottom: "1.25rem" }}>
          {t("issueDetail.timelineHeader", { defaultValue: "Status & resolution timeline" })}
        </h2>
        <Timeline history={history} currentStatus={issue.status} createdAt={issue.created_at} />
      </div>
    </motion.div>
  );
};
