import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { pageFade } from "../lib/motion";
import { useParams, Link } from "react-router-dom";
import { getImpactCase, updateImpactCase, ImpactCaseResponse, ImpactCaseStatus } from "../lib/api";
import { CategoryBadge } from "../components/CategoryBadge";
import { getLocalizedText } from "../lib/localize";
import { formatDate } from "../lib/formatters";
import { enrichImpactCase } from "../lib/translations";
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  ExternalLink,
  HeartHandshake,
} from "lucide-react";

export const ImpactCaseDetailPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const caseId = Number(id);

  const [impactCase, setImpactCase] = useState<ImpactCaseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const rawCaseRef = useRef<ImpactCaseResponse | null>(null);

  const fetchCaseDetail = async () => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getImpactCase(caseId);
      rawCaseRef.current = res;
      setImpactCase(await enrichImpactCase(res, i18n.language));
    } catch (err: any) {
      setError(err?.message || "Failed to load Impact Case details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetail();
  }, [caseId]);

  // Re-enrich (no reload) when the UI language changes.
  useEffect(() => {
    let active = true;
    if (rawCaseRef.current) {
      enrichImpactCase(rawCaseRef.current, i18n.language).then((enriched) => {
        if (active) setImpactCase(enriched);
      });
    }
    return () => {
      active = false;
    };
  }, [i18n.language]);

  const handleStatusChange = async (newStatus: ImpactCaseStatus) => {
    if (!caseId) return;
    setUpdating(true);
    setError(null);
    setUpdateMsg(null);
    try {
      const res = await updateImpactCase(caseId, {
        status: newStatus,
        note: note.trim() || `Status updated to ${newStatus}`,
      });
      rawCaseRef.current = res;
      setImpactCase(await enrichImpactCase(res, i18n.language));
      setNote("");
      setUpdateMsg(
        t("impact.statusUpdated", {
          status: newStatus.toUpperCase(),
          defaultValue: `Impact Case status updated to "${newStatus.toUpperCase()}" successfully.`,
        })
      );
    } catch (err: any) {
      setError("Failed to update status: " + (err?.message || "Error"));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "896px", margin: "0 auto" }}>
        <div className="skeleton" style={{ height: "40px", width: "30%" }} />
        <div className="skeleton" style={{ height: "140px", width: "100%" }} />
      </div>
    );
  }

  if (error || !impactCase) {
    return (
      <div className="card" style={{ maxWidth: "600px", margin: "2rem auto", textAlign: "center" }}>
        <AlertCircle size={40} color="#dc2626" style={{ marginBottom: "0.5rem" }} />
        <h3>{t("impact.notFoundTitle", { defaultValue: "Impact Case Not Found" })}</h3>
        <p style={{ margin: "0.5rem 0 1.25rem 0" }}>
          {error || t("impact.notFoundDesc", { defaultValue: "Impact Case does not exist." })}
        </p>
        <Link to="/panchayat/impact-cases" className="btn btn-primary btn-sm">
          <ArrowLeft size={16} /> {t("impact.backToList", { defaultValue: "Back to Impact Cases List" })}
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
      <div>
        <Link
          to="/panchayat/impact-cases"
          style={{ textDecoration: "none", color: "var(--text-subtle)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
          aria-label={t("impact.backToList", { defaultValue: "Back to Impact Cases List" })}
        >
          <ArrowLeft size={16} /> {t("impact.backToList", { defaultValue: "Back to Impact Cases List" })}
        </Link>
      </div>

      {/* HEADER CARD */}
      <div className="card" style={{ boxShadow: "var(--shadow-md)", borderLeft: "4px solid var(--sdg-civic)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CategoryBadge category={impactCase.category} />
            <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--sdg-civic)", backgroundColor: "var(--sdg-civic-light)", padding: "2px 8px", borderRadius: "4px" }}>
              {impactCase.reference || `#${impactCase.id}`}
            </span>
            {impactCase.sdg && (
              <span className="badge" style={{ backgroundColor: "#e0f2fe", color: "#0369a1" }}>
                {impactCase.sdg}
              </span>
            )}
          </div>

          <span className="badge" style={{ backgroundColor: "#f3e8ff", color: "#6d28d9", fontSize: "0.875rem", padding: "0.35rem 0.75rem" }}>
            {t("impact.statusLabel", { defaultValue: "Status:" })} {t(`status.${impactCase.status}`, { defaultValue: impactCase.status.toUpperCase() })}
          </span>
        </div>

        <h1 style={{ fontSize: "1.6rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>
          {getLocalizedText(impactCase.title, i18n.language)}
        </h1>

        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--text-subtle)" }}>
          <span>
            {t("impact.created", { defaultValue: "Created:" })} {formatDate(impactCase.created_at, i18n.language)}
          </span>
          {impactCase.village?.name && (
            <span>
              {t("issueDetail.village", { defaultValue: "Village:" })}{" "}
              <strong>{getLocalizedText(impactCase.village.name, i18n.language)}</strong> ({impactCase.village.district})
            </span>
          )}
          {impactCase.affected_population && (
            <span>
              {t("impact.impactedPop", { defaultValue: "Impacted Population:" })}{" "}
              <strong>~{impactCase.affected_population} {t("impact.residents", { defaultValue: "residents" })}</strong>
            </span>
          )}
        </div>
      </div>

      {/* STATUS & GOVERNANCE ACTION BAR */}
      <div className="card" style={{ backgroundColor: "var(--bg-subtle)", border: "1.5px solid var(--sdg-civic)" }}>
        <h3 style={{ fontSize: "1.1rem", color: "var(--sdg-civic)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Award size={20} /> {t("impact.lifecycleTitle", { defaultValue: "Impact Case Lifecycle Governance" })}
        </h3>

        {updateMsg && (
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
            <span>{updateMsg}</span>
          </div>
        )}

        <div className="form-group" style={{ marginBottom: "0.75rem" }}>
          <input
            type="text"
            className="form-input"
            placeholder={t("impact.notePlaceholder", { defaultValue: "Add administrative progress note..." })}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-label={t("impact.notePlaceholder", { defaultValue: "Add administrative progress note..." })}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => handleStatusChange("assigned")}
            disabled={updating || impactCase.status === "assigned"}
            className="btn btn-secondary btn-sm"
            aria-label={t("impact.assignBtn", { defaultValue: "Assign Officer" })}
          >
            {t("impact.assignBtn", { defaultValue: "Assign Officer" })}
          </button>
          <button
            onClick={() => handleStatusChange("in_progress")}
            disabled={updating || impactCase.status === "in_progress"}
            className="btn btn-secondary btn-sm"
            aria-label={t("impact.inProgressBtn", { defaultValue: "Mark In Progress" })}
          >
            {t("impact.inProgressBtn", { defaultValue: "Mark In Progress" })}
          </button>
          <button
            onClick={() => handleStatusChange("sponsored")}
            disabled={updating || impactCase.status === "sponsored"}
            className="btn btn-secondary btn-sm"
            style={{ color: "#d97706" }}
            aria-label={t("impact.sponsoredBtn", { defaultValue: "CSR Sponsored" })}
          >
            <HeartHandshake size={14} /> {t("impact.sponsoredBtn", { defaultValue: "CSR Sponsored" })}
          </button>
          <button
            onClick={() => handleStatusChange("resolved")}
            disabled={updating || impactCase.status === "resolved"}
            className="btn btn-primary btn-sm"
            style={{ backgroundColor: "#166534", borderColor: "#166534" }}
            aria-label={t("impact.resolvedBtn", { defaultValue: "Mark Resolved" })}
          >
            <CheckCircle2 size={14} /> {t("impact.resolvedBtn", { defaultValue: "Mark Resolved" })}
          </button>
        </div>
      </div>

      {/* SUMMARY & OVERVIEW */}
      <div className="card">
        <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
          {t("impact.scopeTitle", { defaultValue: "Scope & Case Summary" })}
        </h3>
        <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--text-main)", whiteSpace: "pre-wrap" }}>
          {getLocalizedText(impactCase.summary, i18n.language) || t("impact.noSummary", { defaultValue: "No detailed summary provided for this Impact Case." })}
        </p>
      </div>

      {/* LINKED CITIZEN REPORTS LIST */}
      <div className="card">
        <h3 style={{ fontSize: "1.15rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Building2 size={20} color="var(--sdg-civic)" />
          {t("impact.linkedReportsHeader", { count: impactCase.issues.length, defaultValue: `Linked Citizen Problem Reports (${impactCase.issues.length})` })}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {impactCase.issues.map((iss) => (
            <div
              key={iss.id}
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                padding: "0.85rem 1rem",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-main)" }}>
                  {getLocalizedText(iss.title, i18n.language)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", marginTop: "2px" }}>
                  {t("impact.ref", { defaultValue: "Ref:" })} {iss.reference || `#${iss.id}`} •{" "}
                  {t("issueDetail.category", { defaultValue: "Category:" })} {t(`category.${iss.category}`, { defaultValue: iss.category })} •{" "}
                  {t("impact.statusLabel", { defaultValue: "Status:" })} {t(`status.${iss.status}`, { defaultValue: iss.status })}
                </div>
              </div>

              <Link to={`/panchayat/issues/${iss.id}`} className="btn btn-secondary btn-sm" style={{ fontSize: "0.8rem" }}>
                <span>{t("impact.reviewIssue", { defaultValue: "Review Issue" })}</span>
                <ExternalLink size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};