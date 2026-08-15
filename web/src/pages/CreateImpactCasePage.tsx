import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { pageFade } from "../lib/motion";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { getIssues, createImpactCase, IssueResponse, ImpactCaseResponse, IssueCategory } from "../lib/api";
import { CategoryBadge } from "../components/CategoryBadge";
import { getLocalizedText } from "../lib/localize";
import { enrichIssueList } from "../lib/translations";
import {
  ArrowLeft,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export const CreateImpactCasePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectId = searchParams.get("preselect");

  const [availableIssues, setAvailableIssues] = useState<IssueResponse[]>([]);
  const [selectedIssueIds, setSelectedIssueIds] = useState<number[]>(
    preselectId ? [Number(preselectId)] : []
  );

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState<IssueCategory>("water");
  const [affectedPopulation, setAffectedPopulation] = useState<number>(250);
  const [sdg, setSdg] = useState<string>("SDG 6");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCase, setCreatedCase] = useState<ImpactCaseResponse | null>(null);
  const rawIssuesRef = useRef<IssueResponse[]>([]);

  useEffect(() => {
    const fetchIssues = async () => {
      setLoading(true);
      try {
        const res = await getIssues({ limit: 50 });
        rawIssuesRef.current = res.items;
        setAvailableIssues(await enrichIssueList(res.items, i18n.language));
        if (res.items.length > 0 && !title) {
          setTitle(t("impact.defaultTitle", { defaultValue: "Rampur Village Water & Civic Infrastructure Upgrade" }));
          setSummary(
            t("impact.defaultSummary", {
              defaultValue:
                "Aggregated community impact case combining pipeline leak repair and village school sanitation improvements for CSR sponsorship.",
            })
          );
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load issues.");
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  useEffect(() => {
    let active = true;
    if (rawIssuesRef.current.length > 0) {
      enrichIssueList(rawIssuesRef.current, i18n.language).then((enriched) => {
        if (active) setAvailableIssues(enriched);
      });
    }
    return () => {
      active = false;
    };
  }, [i18n.language]);

  const toggleIssueSelection = (id: number) => {
    setSelectedIssueIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIssueIds.length === 0) {
      setError(t("impact.requiredIssue", { defaultValue: "Please select at least one reported issue to aggregate." }));
      return;
    }
    if (!title.trim()) {
      setError(t("impact.requiredTitle", { defaultValue: "Please enter a title for the Impact Case." }));
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await createImpactCase({
        title,
        summary,
        category,
        issue_ids: selectedIssueIds,
        affected_population: Number(affectedPopulation),
        sdg,
        original_language: i18n.language || "en",
      });
      setCreatedCase(res);
    } catch (err: any) {
      setError("Failed to create Impact Case: " + (err?.message || "Check permissions or server status."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      variants={pageFade}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: "768px", margin: "0 auto", width: "100%" }}
    >
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          to="/panchayat"
          style={{ textDecoration: "none", color: "var(--text-subtle)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.5rem" }}
          aria-label={t("impact.backToDashboard", { defaultValue: "Back to Panchayat dashboard" })}
        >
          <ArrowLeft size={16} /> {t("impact.backToDashboard", { defaultValue: "Back to Panchayat dashboard" })}
        </Link>
        <h1 style={{ fontSize: "1.65rem", color: "var(--sdg-civic)" }}>
          {t("impact.createTitle", { defaultValue: "Create Panchayat impact case" })}
        </h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-subtle)" }}>
          {t("impact.createSubtitle", { defaultValue: "Group correlated citizen reports into an official Panchayat Impact Case for CSR sponsorship matching." })}
        </p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1.25rem" }} role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Success View */}
      {createdCase ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem", boxShadow: "var(--shadow-lg)" }}>
          <h2 style={{ fontSize: "1.5rem", color: "#5b21b6", marginBottom: "0.35rem" }}>
            {t("impact.successTitle", { defaultValue: "Impact case created successfully" })}
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", maxWidth: "480px", margin: "0 auto 1.25rem auto" }}>
            {t("impact.successDesc", {
              count: createdCase.issues.length,
              defaultValue: `The Impact Case has been registered with ${createdCase.issues.length} linked citizen reports and is now eligible for CSR matching.`,
            })}
          </p>

          <div
            style={{
              display: "inline-block",
              backgroundColor: "#f3e8ff",
              border: "1px solid #c4b5fd",
              color: "#5b21b6",
              padding: "0.75rem 1.5rem",
              borderRadius: "var(--radius-md)",
              fontWeight: 800,
              fontSize: "1.1rem",
              marginBottom: "1.75rem",
            }}
          >
            {t("impact.referenceLabel", { defaultValue: "Impact case reference:" })} {createdCase.reference || `#${createdCase.id}`}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
            <button
              onClick={() => navigate(`/panchayat/impact-cases/${createdCase.id}`)}
              className="btn btn-primary"
              style={{ backgroundColor: "var(--sdg-civic)", borderColor: "var(--sdg-civic)", padding: "0.75rem 1.5rem" }}
              aria-label={t("impact.viewDetails", { defaultValue: "View impact case details" })}
            >
              <span>{t("impact.viewDetails", { defaultValue: "View impact case details" })}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      ) : (
        /* Form View */
        <form onSubmit={handleSubmit} className="card" style={{ boxShadow: "var(--shadow-md)" }}>
          {/* STEP 1: SELECT ISSUES */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label className="form-label" style={{ fontSize: "1rem", marginBottom: "0.5rem", display: "block" }}>
              {t("impact.selectIssuesLabel", { count: selectedIssueIds.length, defaultValue: `1. Select related citizen issues (${selectedIssueIds.length} selected)` })}
            </label>
            <p style={{ fontSize: "0.85rem", color: "var(--text-subtle)", marginBottom: "0.75rem" }}>
              {t("impact.selectIssuesHint", { defaultValue: "Check all citizen problem reports that contribute to this larger infrastructure project." })}
            </p>

            {loading ? (
              <div className="skeleton" style={{ height: "100px", width: "100%" }} />
            ) : availableIssues.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "var(--text-subtle)", fontStyle: "italic" }}>
                {t("impact.noIssues", { defaultValue: "No reported issues found in backend. Seed demo issues first." })}
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "240px", overflowY: "auto", border: "1px solid var(--border-color)", padding: "0.5rem", borderRadius: "var(--radius-sm)" }}>
                {availableIssues.map((iss) => {
                  const isChecked = selectedIssueIds.includes(iss.id);
                  return (
                    <label
                      key={iss.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.6rem 0.75rem",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: isChecked ? "var(--sdg-civic-light)" : "#ffffff",
                        border: isChecked ? "1px solid var(--sdg-civic)" : "1px solid #e2e8f0",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleIssueSelection(iss.id)}
                        style={{ width: "18px", height: "18px", accentColor: "var(--sdg-civic)" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <CategoryBadge category={iss.category} />
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-subtle)" }}>
                            {iss.reference || `#${iss.id}`}
                          </span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)", marginTop: "2px" }}>
                          {getLocalizedText(iss.title, i18n.language)}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* STEP 2: CASE DETAILS */}
          <div style={{ display: "grid", gap: "1.25rem", marginBottom: "1.5rem" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="case-title" className="form-label">
                {t("impact.titleLabel", { defaultValue: "Impact case title" })} <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                id="case-title"
                type="text"
                required
                className="form-input"
                placeholder="e.g. Rampur Village Drinking Water Infrastructure Pipeline Upgrade"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="case-desc" className="form-label">
                {t("impact.summaryLabel", { defaultValue: "Detailed scope & resolution objective" })}
              </label>
              <textarea
                id="case-desc"
                className="form-textarea"
                rows={3}
                placeholder={t("impact.summaryPlaceholder", { defaultValue: "Describe the consolidated infrastructure plan, expected CSR funding matching, and long-term village benefit..." })}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="case-pop" className="form-label">
                {t("impact.populationLabel", { defaultValue: "Estimated affected population" })}
              </label>
              <input
                id="case-pop"
                type="number"
                min={0}
                className="form-input"
                value={affectedPopulation}
                onChange={(e) => setAffectedPopulation(Number(e.target.value))}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="case-cat" className="form-label">
                {t("impact.categoryLabel", { defaultValue: "Domain category" })}
              </label>
              <select
                id="case-cat"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as IssueCategory)}
              >
                <option value="water">{t("category.water", { defaultValue: "Water & Sanitation" })}</option>
                <option value="education">{t("category.education", { defaultValue: "Education Infrastructure" })}</option>
                <option value="civic">{t("category.civic", { defaultValue: "Civic Infrastructure" })}</option>
                <option value="other">{t("category.other", { defaultValue: "Other" })}</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="case-sdg" className="form-label">
                {t("impact.sdgLabel", { defaultValue: "Target SDG indicator" })}
              </label>
              <select
                id="case-sdg"
                className="form-select"
                value={sdg}
                onChange={(e) => setSdg(e.target.value)}
              >
                <option value="SDG 6">SDG 6 (Clean Water)</option>
                <option value="SDG 4">SDG 4 (Quality Education)</option>
                <option value="SDG 11">SDG 11 (Sustainable Cities)</option>
                <option value="SDG 13">SDG 13 (Climate Action)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || selectedIssueIds.length === 0}
            className="btn btn-primary btn-block"
            style={{ backgroundColor: "var(--sdg-civic)", borderColor: "var(--sdg-civic)", fontSize: "1.05rem", padding: "0.85rem 1.5rem" }}
          >
            <span>{submitting ? t("impact.creating", { defaultValue: "Creating impact case..." }) : t("impact.createBtn", { defaultValue: "Create impact case" })}</span>
          </button>
        </form>
      )}
    </motion.div>
  );
};