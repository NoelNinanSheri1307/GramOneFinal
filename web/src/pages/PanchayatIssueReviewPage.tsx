import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { pageFade } from "../lib/motion";
import { useParams, Link } from "react-router-dom";
import {
  getIssue,
  getIssueEvidence,
  getIssueHistory,
  updateIssue,
  IssueResponse,
  EvidenceResponse,
  IssueHistoryResponse,
  IssueStatus,
} from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";
import { CategoryBadge } from "../components/CategoryBadge";
import { Timeline } from "../components/Timeline";
import { formatDate } from "../lib/formatters";
import { getLocalizedText } from "../lib/localize";
import { enrichIssueDetail } from "../lib/translations";
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Wrench,
  UserCheck,
  PlusCircle,
} from "lucide-react";

export const PanchayatIssueReviewPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const issueId = Number(id);

  const [issue, setIssue] = useState<IssueResponse | null>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceResponse[]>([]);
  const [history, setHistory] = useState<IssueHistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rawBundleRef = useRef<{ issue: IssueResponse; evidence: EvidenceResponse[]; history: IssueHistoryResponse[] } | null>(null);

  // Governance action form states
  const [actionNote, setActionNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

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

  const handleStatusUpdate = async (newStatus: IssueStatus, defaultNote: string) => {
    if (!issueId) return;
    setUpdating(true);
    setError(null);
    setActionSuccessMsg(null);

    const noteToSubmit = actionNote.trim() || defaultNote;

    try {
      await updateIssue(issueId, {
        status: newStatus,
        note: noteToSubmit,
      });
      setActionNote("");
      setActionSuccessMsg(
        t("impact.reportStatusUpdated", {
          status: newStatus.replace("_", " ").toUpperCase(),
          defaultValue: `Status updated to "${newStatus.replace("_", " ").toUpperCase()}" successfully.`,
        })
      );
      await fetchDetailData();
    } catch (err: any) {
      setError("Governance action failed: " + (err?.message || "Server error"));
    } finally {
      setUpdating(false);
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
        <h3>{t("impact.notFoundIssueTitle", { defaultValue: "Issue Not Found" })}</h3>
        <p style={{ margin: "0.5rem 0 1.25rem 0" }}>
          {error || t("impact.notFoundIssueDesc", { defaultValue: "Issue does not exist." })}
        </p>
        <Link to="/panchayat" className="btn btn-primary btn-sm">
          <ArrowLeft size={16} /> {t("impact.backToDashboard", { defaultValue: "Back to Panchayat dashboard" })}
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      variants={pageFade}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: "896px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link
          to="/panchayat"
          style={{ textDecoration: "none", color: "var(--text-subtle)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
          aria-label={t("impact.backToDashboard", { defaultValue: "Back to Panchayat dashboard" })}
        >
          <ArrowLeft size={16} /> {t("impact.backToDashboard", { defaultValue: "Back to Panchayat dashboard" })}
        </Link>
      </div>

      {/* HEADER CARD */}
      <div className="card" style={{ boxShadow: "var(--shadow-md)", borderLeft: "4px solid var(--sdg-civic)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CategoryBadge category={issue.category} />
            <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--sdg-civic)", backgroundColor: "var(--sdg-civic-light)", padding: "2px 8px", borderRadius: "4px" }}>
              {issue.reference || `#${issue.id}`}
            </span>
          </div>

          <StatusBadge status={issue.status} />
        </div>

        <h1 style={{ fontSize: "1.6rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>
          {getLocalizedText(issue.title, i18n.language)}
        </h1>

        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--text-subtle)" }}>
          <span>
            {t("issueDetail.reportedOn", { defaultValue: "Reported:" })} {formatDate(issue.created_at, i18n.language)}
          </span>
          {issue.village?.name && (
            <span>
              {t("issueDetail.village", { defaultValue: "Village:" })}{" "}
              <strong>{getLocalizedText(issue.village.name, i18n.language)}</strong> ({issue.village.district})
            </span>
          )}
          {issue.reporter?.name && (
            <span>
              {t("issueDetail.reporter", { defaultValue: "Reporter:" })} <strong>{issue.reporter.name}</strong>
            </span>
          )}
        </div>
      </div>

      {/* GOVERNANCE ACTION PANEL */}
      <div className="card" style={{ border: "2px solid var(--sdg-civic)", backgroundColor: "var(--bg-subtle)" }}>
        <h3 style={{ fontSize: "1.15rem", color: "var(--sdg-civic)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {t("impact.actionPanel", { defaultValue: "Panchayat Governance Action Panel" })}
        </h3>

        {actionSuccessMsg && (
          <div
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--primary-500)",
              color: "var(--text-main)",
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-sm)",
              marginBottom: "1rem",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
            role="status"
          >
            <CheckCircle2 size={18} />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label htmlFor="action-note-input" className="form-label" style={{ fontSize: "0.875rem" }}>
            {t("impact.actionNoteLabel", { defaultValue: "Administrative Resolution / Inspection Note" })}
          </label>
          <input
            id="action-note-input"
            className="form-input"
            type="text"
            placeholder={t("impact.actionNotePlaceholder", { defaultValue: "e.g. Ground inspection completed by Ward Panchayat officer. Repairs scheduled." })}
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
          />
        </div>

        {/* Action Buttons Grid */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={() => handleStatusUpdate("verified", "Verified by Panchayat Admin.")}
            disabled={updating || issue.status === "verified"}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, minWidth: "140px" }}
            aria-label={t("impact.verifyReport", { defaultValue: "1. Verify Report" })}
          >
            <UserCheck size={16} color="#047857" />
            <span>{t("impact.verifyReport", { defaultValue: "1. Verify Report" })}</span>
          </button>

          <button
            onClick={() => handleStatusUpdate("assigned", "Assigned to Panchayat Field Employee.")}
            disabled={updating || issue.status === "assigned"}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, minWidth: "140px" }}
            aria-label={t("impact.assignOfficer", { defaultValue: "2. Assign Officer / Worker" })}
          >
            <Clock size={16} color="#b45309" />
            <span>{t("impact.assignOfficer", { defaultValue: "2. Assign Officer / Worker" })}</span>
          </button>

          <button
            onClick={() => handleStatusUpdate("in_progress", "Work order issued; field employee deployed.")}
            disabled={updating || issue.status === "in_progress"}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, minWidth: "140px" }}
            aria-label={t("impact.markInProgress", { defaultValue: "3. Mark In Progress" })}
          >
            <Wrench size={16} color="#a16207" />
            <span>{t("impact.markInProgress", { defaultValue: "3. Mark In Progress" })}</span>
          </button>

          {issue.status === "field_completed" && (
            <button
              onClick={() => handleStatusUpdate("resolved", "Panchayat Admin verified completed field work and closed issue.")}
              disabled={updating}
              className="btn btn-primary btn-sm"
              style={{ flex: 1, minWidth: "140px", backgroundColor: "#059669", borderColor: "#059669" }}
            >
              <CheckCircle2 size={16} />
              <span>Review & Resolve Completed Field Work</span>
            </button>
          )}

          <button
            onClick={() => handleStatusUpdate("resolved", "Panchayat confirmed full resolution of reported problem.")}
            disabled={updating || issue.status === "resolved"}
            className="btn btn-primary btn-sm"
            style={{ flex: 1, minWidth: "140px", backgroundColor: "#166534", borderColor: "#166534" }}
            aria-label={t("impact.markResolved", { defaultValue: "4. Mark Resolved" })}
          >
            <CheckCircle2 size={16} />
            <span>{t("impact.markResolved", { defaultValue: "4. Mark Resolved" })}</span>
          </button>
        </div>

        {/* Create Impact Case CTA */}
        <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px dashed var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-subtle)" }}>
            {t("impact.csrHint", { defaultValue: "Need CSR sponsorship for a large infrastructure fix? Group this into an Impact Case." })}
          </div>
          <Link to={`/panchayat/create-impact-case?preselect=${issue.id}`} className="btn btn-accent btn-sm">
            <PlusCircle size={16} />
            <span>{t("impact.createImpactFromIssue", { defaultValue: "Create Impact Case from this Issue" })}</span>
          </Link>
        </div>
      </div>

      {/* DESCRIPTION + AI FACTS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
        <div className="card">
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileText size={18} color="var(--primary-600)" /> {t("impact.citizenReportText", { defaultValue: "Citizen Report Text" })}
          </h3>
          <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--text-main)", whiteSpace: "pre-wrap" }}>
            {getLocalizedText(issue.description, i18n.language) || t("impact.noFullDesc", { defaultValue: "No full description provided." })}
          </p>
        </div>

        <div className="card ai-interpretation-card">
          <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "var(--primary-900)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Sparkles size={18} color="var(--accent-amber)" /> {t("impact.aiFacts", { defaultValue: "GramOne AI Extracted Facts" })}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", fontSize: "0.875rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-subtle)" }}>{t("issueDetail.category", { defaultValue: "Category:" })}</span>
              <strong style={{ textTransform: "capitalize" }}>{t(`category.${issue.category}`, { defaultValue: issue.category })}</strong>
            </div>
            {issue.subcategory && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-subtle)" }}>{t("issueDetail.subcategory", { defaultValue: "Subcategory:" })}</span>
                <strong>{issue.subcategory}</strong>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-subtle)" }}>{t("issueDetail.sourceEngine", { defaultValue: "Source engine:" })}</span>
              <span className="badge" style={{ backgroundColor: "#f3f4f6", color: "#374151" }}>
                {t(`source.${issue.source}`, { defaultValue: issue.source.toUpperCase() })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* EVIDENCE LOGS */}
      <div className="card">
        <h3 style={{ fontSize: "1.15rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ShieldCheck size={20} color="var(--primary-600)" />{" "}
          {t("impact.evidenceHeader", { count: evidenceList.length, defaultValue: `Evidence & Field Observations (${evidenceList.length})` })}
        </h3>
        {evidenceList.length === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "var(--text-subtle)" }}>
            {t("impact.noSecondaryEvidence", { defaultValue: "Initial citizen report received. No secondary evidence uploaded yet." })}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {evidenceList.map((ev) => (
              <div
                key={ev.id}
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.875rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                    {getLocalizedText(ev.description, i18n.language) || t("impact.evidenceRecord", { defaultValue: "Evidence Record" })}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", marginTop: "2px" }}>
                    {t("impact.evidenceTypeLabel", { defaultValue: "Type:" })}{" "}
                    <code>{t(`evidenceType.${ev.evidence_type}`, { defaultValue: ev.evidence_type })}</code> •{" "}
                    {t("impact.evidenceSourceLabel", { defaultValue: "Source:" })} {ev.source_reference || t("source.system", { defaultValue: "System" })}
                  </div>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)" }}>
                  {formatDate(ev.created_at, i18n.language, { day: "numeric", month: "short" })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TIMELINE */}
      <div className="card">
        <h3 style={{ fontSize: "1.15rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Clock size={20} color="var(--primary-600)" /> {t("impact.timelineHeader", { defaultValue: "Resolution & History Timeline" })}
        </h3>
        <Timeline history={history} currentStatus={issue.status} createdAt={issue.created_at} />
      </div>
    </motion.div>
  );
};