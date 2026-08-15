import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { interpretIssue, createIssueFromInterpretation, uploadPhotoEvidence, createEvidence, IssueInterpretation, IssueCategory, IssueResponse } from "../lib/api";
import { CategoryBadge } from "../components/CategoryBadge";
import { pageFade, successPop, buttonTap } from "../lib/motion";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { LocalizedString, getLocalizedText } from "../lib/localize";
import {
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  ShieldCheck,
  Edit3,
  Globe,
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";

const SAMPLE_PROMPTS = [
  {
    category: "water" as IssueCategory,
    labelKey: "report.promptWater",
    fallbackLabel: "Water Leakage",
    text: "Main drinking water pipeline near Rampur Primary School has burst. Clean drinking water is spilling into the dirt road and 250 families have no drinking water supply for 2 days.",
  },
  {
    category: "education" as IssueCategory,
    labelKey: "report.promptSchool",
    fallbackLabel: "School Roof Leak",
    text: "Classroom roof in Government Primary School Ward 3 is leaking heavily during rain. Desks and textbooks are damaged, affecting 60 students in classes 3 and 4.",
  },
  {
    category: "civic" as IssueCategory,
    labelKey: "report.promptCivic",
    fallbackLabel: "Broken Streetlights",
    text: "Street lights on the main Panchayat stretch from bus stand to primary health center have been out of order for 3 weeks, making night travel unsafe for women and elders.",
  },
];

type ReportStep = "input" | "analyzing" | "review" | "creating" | "success";

export const ReportIssuePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<ReportStep>("input");
  const [inputText, setInputText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory>("water");
  const [reportLanguage, setReportLanguage] = useState(i18n.language || "en");
  const [villageName, setVillageName] = useState("Rampur Panchayat");

  // Real Photo Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  // Interpretation state
  const [interpretation, setInterpretation] = useState<IssueInterpretation | null>(null);
  const [editedTitle, setEditedTitle] = useState<LocalizedString | string>("");
  const [editedCategory, setEditedCategory] = useState<IssueCategory>("water");

  // Created Issue state
  const [createdIssue, setCreatedIssue] = useState<IssueResponse | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState(t("report.analyzingProgress1", { defaultValue: "Understanding your report with GramOne AI..." }));

  useEffect(() => {
    setReportLanguage(i18n.language || "en");
  }, [i18n.language]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Only JPEG, PNG, and WEBP image files are supported.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Selected image exceeds maximum 10MB limit.");
        return;
      }
      setError(null);
      setSelectedFile(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
      setPhotoPreviewUrl(null);
    }
  };

  // Submit text to AI
  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError(t("report.inputLabel", { defaultValue: "Please describe the issue in plain text first." }));
      return;
    }
    setError(null);
    setStep("analyzing");
    setProgressMsg(t("report.analyzingProgress1", { defaultValue: "Understanding your report with GramOne AI..." }));

    const progressTimer = setTimeout(() => {
      setProgressMsg(t("report.analyzingProgress2", { defaultValue: "Extracting location clues, explicit facts & affected population..." }));
    }, 1200);

    try {
      const result = await interpretIssue(inputText, reportLanguage);
      clearTimeout(progressTimer);

      const enrichedInterpretation: IssueInterpretation = {
        ...result,
        summary: typeof result.summary === "string" ? result.summary : result.summary.en,
        original_language: reportLanguage,
        description: inputText,
      };

      setInterpretation(enrichedInterpretation);
      setEditedTitle(
        typeof result.summary === "string" ? result.summary : result.summary.en
      );
      setEditedCategory(result.category || selectedCategory);
      setStep("review");
    } catch (err: any) {
      clearTimeout(progressTimer);
      setError("AI analysis failed: " + (err?.message || "Please check server connectivity."));
      setStep("input");
    }
  };

  // Confirm and create issue
  const handleConfirmAndCreate = async () => {
    if (!interpretation) return;
    setError(null);
    setStep("creating");

    const confirmedPayload: IssueInterpretation = {
      ...interpretation,
      summary: typeof editedTitle === "string" ? editedTitle : editedTitle.en,
      category: editedCategory,
      original_language: reportLanguage,
      description: inputText,
    };

    try {
      const issue = await createIssueFromInterpretation(confirmedPayload);

      // Upload real photo if user attached one
      if (selectedFile) {
        try {
          const uploadRes = await uploadPhotoEvidence(selectedFile);
          await createEvidence(issue.id, {
            evidence_type: "uploaded_image",
            source_reference: uploadRes.source_reference,
            description: selectedFile.name,
          });
        } catch (uploadErr: any) {
          console.warn("Issue created, but photo upload failed:", uploadErr);
        }
      }

      setCreatedIssue(issue);
      setStep("success");
    } catch (err: any) {
      setError("Failed to create issue: " + (err?.message || "Server error."));
      setStep("review");
    }
  };

  const handleStartOver = () => {
    setStep("input");
    setInterpretation(null);
    setCreatedIssue(null);
    setError(null);
  };

  const getLanguageNativeName = (code: string) => {
    const l = SUPPORTED_LANGUAGES.find((item) => item.code === code);
    return l ? `${l.nativeName} (${l.name})` : code;
  };

  return (
    <motion.div
      variants={pageFade}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: "768px", margin: "0 auto", width: "100%" }}
    >
      {/* Page Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.65rem" }}>{t("report.title", { defaultValue: "Report a rural problem" })}</h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-subtle)" }}>
          {t("report.subtitle", { defaultValue: "Describe the problem in plain text. GramOne AI will structure the facts and route it to your Panchayat." })}
        </p>
      </div>

      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: "1.25rem" }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: INPUT FORM */}
      {step === "input" && (
        <div className="card" style={{ boxShadow: "var(--shadow-md)" }}>
          {/* Quick Prompt Selector Chips */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label className="form-label" style={{ display: "block", marginBottom: "0.5rem" }}>
              {t("report.sampleLabel", { defaultValue: "Sample prompts (click to try):" })}
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {SAMPLE_PROMPTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText(sample.text);
                    setSelectedCategory(sample.category);
                  }}
                  className="btn btn-secondary btn-sm"
                  aria-label={`Sample prompt: ${t(sample.labelKey, { defaultValue: sample.fallbackLabel })}`}
                  style={{ fontSize: "0.8rem", backgroundColor: "#f8fafc" }}
                >
                  {t(sample.labelKey, { defaultValue: sample.fallbackLabel })}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="problem-desc" className="form-label">
              {t("report.inputLabel", { defaultValue: "Describe the problem in natural language" })}
            </label>
            <textarea
              id="problem-desc"
              className="form-textarea"
              rows={5}
              placeholder={t("report.inputPlaceholder", { defaultValue: "e.g. Drinking water supply line near Rampur Primary School has burst. Water is leaking into the street and 200 families have no water for 2 days..." })}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          {/* Form Helpers Grid: Category, Language & Village */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
            {/* AI Reporting Flow Enhancement: Language Selector */}
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="report-lang-select" className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Globe size={14} color="var(--primary-600)" />
                {t("report.reportLangLabel", { defaultValue: "Report language" })}
              </label>
              <select
                id="report-lang-select"
                className="form-select"
                value={reportLanguage}
                onChange={(e) => setReportLanguage(e.target.value)}
                aria-label="Select report language"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
              <span className="form-hint" style={{ fontSize: "0.75rem", color: "var(--text-subtle)", marginTop: "2px", display: "block" }}>
                {t("report.reportLangHelper", { defaultValue: "You can report issues in your own language." })}
              </span>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="category-select" className="form-label">
                {t("report.catHelper", { defaultValue: "Category (optional helper)" })}
              </label>
              <select
                id="category-select"
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as IssueCategory)}
                aria-label="Select category"
              >
                <option value="water">Water Supply & Infrastructure</option>
                <option value="sanitation">Sanitation & Hygiene</option>
                <option value="education">School & Education</option>
                <option value="agriculture">Agriculture & Irrigation</option>
                <option value="civic">Civic Infrastructure & Roads</option>
                <option value="waste">Waste Management</option>
                <option value="health">Public Health & PHC</option>
                <option value="disaster">Emergency & Disaster Management</option>
                <option value="environment">Environment & Natural Resources</option>
                <option value="other">Other Domain</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="village-name" className="form-label">
                {t("report.villageLabel", { defaultValue: "Village / Panchayat Name" })}
              </label>
              <input
                id="village-name"
                type="text"
                className="form-input"
                value={villageName}
                onChange={(e) => setVillageName(e.target.value)}
              />
            </div>
          </div>

          {/* Real Photo Evidence Attachment */}
          <div
            style={{
              padding: "1rem",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "#f8fafc",
              border: "1px solid var(--border-color)",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <strong style={{ fontSize: "0.875rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <ImageIcon size={16} color="var(--primary-600)" />
                {t("report.photoLabel", { defaultValue: "Photo Evidence Attachment (Real File Upload)" })}
              </strong>
              {selectedFile ? (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="btn btn-secondary btn-sm"
                  style={{ color: "#dc2626" }}
                  aria-label="Remove photo"
                >
                  <X size={14} />
                  <span>Remove</span>
                </button>
              ) : (
                <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                  <Upload size={14} />
                  <span>Select Image File</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                </label>
              )}
            </div>

            {selectedFile && photoPreviewUrl ? (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.75rem", backgroundColor: "var(--bg-card)", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                <img
                  src={photoPreviewUrl}
                  alt="Selected evidence preview"
                  style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "4px" }}
                />
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>{selectedFile.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)" }}>{(selectedFile.size / 1024).toFixed(1)} KB • Ready for upload</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)" }}>
                Attach a photo taken at the site (JPEG, PNG, WEBP up to 10MB). Real file upload enabled.
              </div>
            )}
          </div>

          <motion.button
            whileTap={buttonTap}
            type="button"
            onClick={handleAnalyze}
            className="btn btn-primary btn-block btn-lg"
            aria-label={t("report.analyzeBtn", { defaultValue: "Analyze with GramOne AI" })}
          >
            <span>{t("report.analyzeBtn", { defaultValue: "Analyze with GramOne AI" })}</span>
            <ArrowRight size={18} />
          </motion.button>
        </div>
      )}

      {/* STEP 2: ANALYZING STATE */}
      {step === "analyzing" && (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              border: "3px solid var(--primary-200)",
              borderTopColor: "var(--primary-600)",
              margin: "0 auto 1.25rem auto",
              animation: "spin 1s linear infinite",
            }}
          />
          <h2 style={{ fontSize: "1.35rem", marginBottom: "0.5rem" }}>{t("report.analyzingTitle", { defaultValue: "GramOne AI Processing" })}</h2>
          <p style={{ fontSize: "1rem", color: "var(--primary-700)", fontWeight: 600 }}>{progressMsg}</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* STEP 3: REVIEW INTERPRETATION */}
      {step === "review" && interpretation && (
        <div className="card ai-interpretation-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ backgroundColor: "var(--primary-100)", color: "var(--primary-800)", padding: "6px", borderRadius: "8px" }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.25rem", color: "var(--primary-900)" }}>{t("report.understoodTitle", { defaultValue: "Here is what GramOne understood:" })}</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-subtle)" }}>
                  {t("report.understoodSubtitle", { defaultValue: "Review extracted facts before creating the official Panchayat issue." })}
                </p>
              </div>
            </div>

            {/* Part 6: Original language badge */}
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--primary-800)",
                backgroundColor: "var(--primary-50)",
                padding: "4px 10px",
                borderRadius: "9999px",
                border: "1px solid var(--primary-200)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <Globe size={14} />
              {t("report.originalLangPrefix", { defaultValue: "Original language:" })} {getLanguageNativeName(reportLanguage)}
            </span>
          </div>

          {/* AI Structured Breakdown Grid */}
          <div
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "1.25rem",
              marginBottom: "1.5rem",
              display: "grid",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CategoryBadge category={editedCategory} />
                {interpretation.suggested_sdg && (
                  <span className="badge" style={{ backgroundColor: "var(--sdg-water-light)", color: "var(--sdg-water)", fontWeight: 700 }}>
                    {interpretation.suggested_sdg}
                  </span>
                )}
              </div>

              {interpretation.urgency_suggestion && (
                <span
                  className="badge"
                  style={{
                    backgroundColor:
                      interpretation.urgency_suggestion === "high"
                        ? "#fef2f2"
                        : interpretation.urgency_suggestion === "medium"
                        ? "#fefce8"
                        : "#f3f4f6",
                    color:
                      interpretation.urgency_suggestion === "high"
                        ? "#991b1b"
                        : interpretation.urgency_suggestion === "medium"
                        ? "#a16207"
                        : "#374151",
                    fontWeight: 700,
                  }}
                >
                  {t("report.urgencyLabel", { defaultValue: "Urgency:" })} {interpretation.urgency_suggestion.toUpperCase()}
                </span>
              )}
            </div>

            {/* Editable Localized Title */}
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="edited-title" className="form-label" style={{ fontSize: "0.85rem", color: "var(--text-subtle)" }}>
                {t("report.extractedTitleLabel", { defaultValue: "Extracted Title (edit if needed)" })}
              </label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  id="edited-title"
                  type="text"
                  className="form-input"
                  value={getLocalizedText(editedTitle, i18n.language)}
                  onChange={(e) => {
                    const newTitleText = e.target.value;
                    if (typeof editedTitle === "object" && editedTitle) {
                      setEditedTitle({ ...editedTitle, [i18n.language]: newTitleText });
                    } else {
                      setEditedTitle(newTitleText);
                    }
                  }}
                  style={{ fontWeight: 700, fontSize: "1.05rem" }}
                />
                <Edit3 size={18} color="var(--text-subtle)" style={{ flexShrink: 0 }} />
              </div>
            </div>

            {/* Structured Facts */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", fontSize: "0.875rem", paddingTop: "0.5rem", borderTop: "1px dashed var(--border-color)" }}>
              <div>
                <span style={{ color: "var(--text-subtle)", display: "block", fontSize: "0.75rem" }}>{t("report.locationLandmark", { defaultValue: "Location landmark" })}</span>
                <strong>{interpretation.location_clues?.[0] || "Primary School Area"}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-subtle)", display: "block", fontSize: "0.75rem" }}>{t("report.affectedPopulation", { defaultValue: "Estimated affected population" })}</span>
                <strong>~{interpretation.affected_population || 250} {t("report.residents", { defaultValue: "residents" })}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-subtle)", display: "block", fontSize: "0.75rem" }}>{t("report.evidenceConfidence", { defaultValue: "Evidence confidence" })}</span>
                <strong style={{ color: "var(--primary-700)", textTransform: "capitalize" }}>{interpretation.confidence || "High"} confidence</strong>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleConfirmAndCreate}
              className="btn btn-primary"
              aria-label={t("report.confirmBtn", { defaultValue: "Confirm & create issue" })}
              style={{ flex: 2, minWidth: "220px", fontSize: "1.05rem" }}
            >
              <CheckCircle2 size={18} />
              <span>{t("report.confirmBtn", { defaultValue: "Confirm & create issue" })}</span>
            </button>

            <button
              type="button"
              onClick={handleStartOver}
              className="btn btn-secondary"
              aria-label={t("report.startOver", { defaultValue: "Start over" })}
              style={{ flex: 1, minWidth: "140px" }}
            >
              <RotateCcw size={16} />
              <span>{t("report.startOver", { defaultValue: "Start over" })}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: CREATING STATE */}
      {step === "creating" && (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div className="skeleton" style={{ width: "48px", height: "48px", borderRadius: "50%", margin: "0 auto 1rem auto" }} />
          <h2>{t("report.creatingTitle", { defaultValue: "Creating official issue in GramOne..." })}</h2>
        </div>
      )}

      {/* STEP 5: SUCCESS STATE */}
      {step === "success" && createdIssue && (
        <motion.div
          variants={successPop}
          initial="hidden"
          animate="visible"
          className="card"
          style={{
            textAlign: "center",
            padding: "3.5rem 2rem",
            boxShadow: "var(--shadow-xl)",
            borderColor: "var(--primary-200)",
            background: "linear-gradient(135deg, var(--primary-50) 0%, #ffffff 60%)",
          }}
        >
          <motion.div
            variants={successPop}
            style={{
              width: "72px",
              height: "72px",
              margin: "0 auto 1.25rem auto",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-green)",
            }}
          >
            <CheckCircle2 size={38} />
          </motion.div>

          <h2 style={{ fontSize: "1.75rem", color: "var(--primary-900)", marginBottom: "0.4rem", letterSpacing: "-0.03em" }}>
            {t("report.successTitle", { defaultValue: "Issue successfully reported" })}
          </h2>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-subtle)", maxWidth: "460px", margin: "0 auto 0.75rem auto" }}>
            {t("report.successSubtitle", { defaultValue: "Your problem report has been recorded and routed to your Panchayat for official review and action." })}
          </p>

          {/* Part 6: Original language badge */}
          <div style={{ marginBottom: "1.25rem" }}>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "var(--primary-800)",
                backgroundColor: "var(--primary-100)",
                padding: "4px 12px",
                borderRadius: "9999px",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <Globe size={14} />
              {t("report.originalLangPrefix", { defaultValue: "Original language:" })} {getLanguageNativeName(reportLanguage)}
            </span>
          </div>

          {/* Reference Badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              display: "inline-block",
              backgroundColor: "var(--primary-50)",
              border: "2px solid var(--primary-400)",
              color: "var(--primary-900)",
              padding: "0.85rem 1.75rem",
              borderRadius: "var(--radius-lg)",
              fontWeight: 800,
              fontSize: "1.15rem",
              marginBottom: "2rem",
              letterSpacing: "-0.02em",
            }}
          >
            {t("report.referencePrefix", { defaultValue: "Issue reference:" })} {createdIssue.reference || `#${createdIssue.id}`}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}
          >
            <motion.button
              whileTap={buttonTap}
              onClick={() => window.location.assign(`/issues/${createdIssue.id}`)}
              className="btn btn-primary btn-lg"
              aria-label={t("report.trackBtn", { defaultValue: "Track this issue" })}
            >
              <span>{t("report.trackBtn", { defaultValue: "Track this issue" })}</span>
              <ArrowRight size={18} />
            </motion.button>
            <motion.button
              whileTap={buttonTap}
              onClick={handleStartOver}
              className="btn btn-secondary"
              aria-label={t("report.reportAnother", { defaultValue: "Report another issue" })}
            >
              <RotateCcw size={16} />
              <span>{t("report.reportAnother", { defaultValue: "Report another issue" })}</span>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};
