import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { pageFade } from "../lib/motion";
import {
  getIssue,
  getIssueEvidence,
  updateIssue,
  createEvidence,
  uploadPhotoEvidence,
  IssueResponse,
  EvidenceResponse,
  EvidenceType,
} from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";
import { CategoryBadge } from "../components/CategoryBadge";
import { formatDate } from "../lib/formatters";
import { getLocalizedText } from "../lib/localize";
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Upload,
  CheckSquare,
  Wrench,
  Clock,
  FileCheck,
} from "lucide-react";

export const EmployeeIssueDetailPage: React.FC = () => {
  const { i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const issueId = Number(id);

  const [issue, setIssue] = useState<IssueResponse | null>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Field Note Form State
  const [fieldNote, setFieldNote] = useState("");
  const [evidenceType, setEvidenceType] = useState<EvidenceType>("field_inspection_note");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const loadIssueData = async () => {
    if (!issueId) return;
    setLoading(true);
    setError(null);
    try {
      const [issueRes, evRes] = await Promise.all([
        getIssue(issueId),
        getIssueEvidence(issueId).catch(() => []),
      ]);
      setIssue(issueRes);
      setEvidenceList(evRes);
    } catch (err: any) {
      setError(err?.message || "Failed to load issue details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssueData();
  }, [issueId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleClaimOrAcceptWork = async () => {
    if (!issue) return;
    setActionLoading(true);
    setError(null);
    try {
      const targetStatus = issue.status === "reported" ? "assigned" : "in_progress";
      const noteMsg =
        issue.status === "reported"
          ? "Field employee claimed and accepted work assignment."
          : "Field employee accepted assignment and commenced site inspection.";
      
      const updated = await updateIssue(issue.id, {
        status: targetStatus,
        note: noteMsg,
      });
      setIssue(updated);
      setSuccessMsg(
        issue.status === "reported"
          ? "Work assignment claimed successfully!"
          : "Assignment accepted! Work status set to In Progress."
      );
      await loadIssueData();
    } catch (err: any) {
      setError(err?.message || "Failed to update work status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartWork = async () => {
    if (!issue) return;
    setActionLoading(true);
    setError(null);
    try {
      const updated = await updateIssue(issue.id, {
        status: "in_progress",
        note: "Field inspection & resolution work in progress on site.",
      });
      setIssue(updated);
      setSuccessMsg("Work status set to IN PROGRESS!");
      await loadIssueData();
    } catch (err: any) {
      setError(err?.message || "Failed to start work.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkFieldCompleted = async () => {
    if (!issue) return;
    setActionLoading(true);
    setError(null);
    try {
      const updated = await updateIssue(issue.id, {
        status: "field_completed",
        note: "Field inspection & repair work completed on site. Sent to Panchayat Admin for verification.",
      });
      setIssue(updated);
      setSuccessMsg("Field work marked as COMPLETED! Sent to Panchayat Admin for verification.");
      await loadIssueData();
    } catch (err: any) {
      setError(err?.message || "Failed to mark field work completed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddFieldEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue) return;
    setActionLoading(true);
    setError(null);
    try {
      let sourceRef = "Field Worker Report";
      if (selectedFile) {
        const uploadRes = await uploadPhotoEvidence(selectedFile);
        sourceRef = uploadRes.source_reference;
      }

      await createEvidence(issue.id, {
        evidence_type: evidenceType,
        source_reference: sourceRef,
        description: fieldNote || (selectedFile ? selectedFile.name : "Field inspection note"),
      });

      setFieldNote("");
      setSelectedFile(null);
      setPhotoPreview(null);
      setSuccessMsg("Field evidence attached successfully.");
      await loadIssueData();
    } catch (err: any) {
      setError(err?.message || "Failed to add field evidence.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "896px", margin: "0 auto" }}>
        <div className="skeleton" style={{ height: "40px", width: "30%" }} />
        <div className="skeleton" style={{ height: "200px", width: "100%" }} />
      </div>
    );
  }

  if (error && !issue) {
    return (
      <div className="card" style={{ maxWidth: "600px", margin: "2rem auto", textAlign: "center" }}>
        <AlertTriangle size={40} color="#dc2626" style={{ marginBottom: "0.5rem" }} />
        <h3>Issue Not Found</h3>
        <p>{error}</p>
        <Link to="/employee" className="btn btn-primary btn-sm">
          ← Back to Employee Workload
        </Link>
      </div>
    );
  }

  if (!issue) return null;

  const localizedTitle = getLocalizedText(issue.title, i18n.language);
  const localizedDesc = getLocalizedText(issue.description, i18n.language);

  return (
    <motion.div
      variants={pageFade}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: "896px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      <div>
        <Link to="/employee" style={{ textDecoration: "none", color: "var(--text-subtle)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
          <ArrowLeft size={16} /> Back to Employee Dashboard
        </Link>
      </div>

      {/* Header Info Card */}
      <div className="card" style={{ borderLeft: "4px solid var(--primary-600)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CategoryBadge category={issue.category} />
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-subtle)" }}>
              {issue.reference || `#${issue.id}`}
            </span>
          </div>
          <StatusBadge status={issue.status} />
        </div>

        <h1 style={{ fontSize: "1.35rem", marginBottom: "0.5rem", color: "var(--text-main)" }}>{localizedTitle}</h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-body)", whiteSpace: "pre-wrap", margin: "0.5rem 0" }}>
          {localizedDesc || "No description provided."}
        </p>

        <div style={{ fontSize: "0.8rem", color: "var(--text-subtle)", display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.75rem", borderTop: "1px solid var(--border-color)", paddingTop: "0.5rem" }}>
          <span>Reported: {formatDate(issue.created_at, i18n.language)}</span>
          <span>Domain: {issue.category.toUpperCase()}</span>
          <span>Assigned To: {issue.assigned_to?.name || "Unassigned"}</span>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* PERMITTED WORKFLOW ACTION BAR — Clean Theme-Safe Container */}
      <div className="card" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <Wrench size={20} color="var(--primary-600)" />
          <h2 style={{ fontSize: "1.1rem", margin: 0, color: "var(--text-main)" }}>Field Action Controls</h2>
        </div>

        {issue.status === "reported" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <p style={{ fontSize: "0.9rem", color: "var(--text-body)", margin: 0 }}>
              This issue has been reported by a citizen and is currently unassigned. You can claim and accept this work order to begin inspection.
            </p>
            <button
              type="button"
              onClick={handleClaimOrAcceptWork}
              disabled={actionLoading}
              className="btn btn-primary btn-lg"
              style={{ width: "100%" }}
            >
              <CheckSquare size={18} />
              <span>{actionLoading ? "Processing..." : "Claim & Accept Work Assignment"}</span>
            </button>
          </div>
        )}

        {issue.status === "assigned" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <p style={{ fontSize: "0.9rem", color: "var(--text-body)", margin: 0 }}>
              Work order assigned. Click below to confirm acceptance and commence site inspection.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleStartWork}
                disabled={actionLoading}
                className="btn btn-primary btn-lg"
                style={{ flex: 1, minWidth: "200px" }}
              >
                <Clock size={18} />
                <span>{actionLoading ? "Processing..." : "Start Field Inspection & Work"}</span>
              </button>
            </div>
          </div>
        )}

        {issue.status === "in_progress" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <p style={{ fontSize: "0.9rem", color: "var(--text-body)", margin: 0 }}>
              Field work is active. Once repairs/inspections are finished, click below to submit for Panchayat verification.
            </p>
            <button
              type="button"
              onClick={handleMarkFieldCompleted}
              disabled={actionLoading}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", backgroundColor: "var(--primary-600)", borderColor: "var(--primary-600)" }}
            >
              <CheckCircle size={18} />
              <span>{actionLoading ? "Processing..." : "Mark Assigned Work as Field Completed"}</span>
            </button>
          </div>
        )}

        {issue.status === "field_completed" && (
          <div style={{ padding: "1rem", backgroundColor: "var(--bg-card)", border: "1px solid var(--primary-500)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <FileCheck size={24} color="var(--primary-500)" />
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>Field Work Marked Completed</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Inspection and site repairs completed. Sent to Panchayat Admin for final resolution verification.
              </div>
            </div>
          </div>
        )}

        {issue.status === "resolved" && (
          <div style={{ padding: "1rem", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <CheckCircle size={24} color="#059669" />
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>Issue Resolved & Closed</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                This work order has been fully verified and closed by Panchayat Administration.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD FIELD EVIDENCE & BEFORE/AFTER PHOTOS FORM */}
      {(issue.status === "in_progress" || issue.status === "assigned" || issue.status === "field_completed" || issue.status === "reported") && (
        <div className="card">
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "var(--text-main)" }}>Add Field Inspection Notes & Photos</h2>

          <form onSubmit={handleAddFieldEvidence} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Evidence Type</label>
              <select
                className="form-select"
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
              >
                <option value="field_inspection_note">Field Inspection Note</option>
                <option value="before_field_image">Before Inspection Photo</option>
                <option value="after_field_image">After Repair Photo</option>
                <option value="uploaded_image">Site Photo</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Field Notes / Observations</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Describe field findings, work completed, materials used..."
                value={fieldNote}
                onChange={(e) => setFieldNote(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Attach Real Photo Evidence (Optional)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="form-input"
              />
              {photoPreview && (
                <div style={{ marginTop: "0.5rem" }}>
                  <img src={photoPreview} alt="Preview" style={{ height: "100px", borderRadius: "6px", border: "1px solid var(--border-color)" }} />
                </div>
              )}
            </div>

            <button type="submit" disabled={actionLoading} className="btn btn-secondary btn-md">
              <Upload size={16} />
              <span>{actionLoading ? "Uploading..." : "Save Field Evidence"}</span>
            </button>
          </form>
        </div>
      )}

      {/* EVIDENCE LOGS */}
      <div className="card">
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "var(--text-main)" }}>
          Evidence & Site Records ({evidenceList.length})
        </h2>
        {evidenceList.length === 0 ? (
          <p style={{ fontSize: "0.85rem", color: "var(--text-subtle)", fontStyle: "italic" }}>No evidence uploaded yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {evidenceList.map((ev) => (
              <div key={ev.id} style={{ padding: "0.75rem", backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-subtle)", marginBottom: "0.25rem" }}>
                  <span style={{ fontWeight: 700, textTransform: "uppercase", color: "var(--primary-600)" }}>{ev.evidence_type}</span>
                  <span>{formatDate(ev.created_at, i18n.language)}</span>
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--text-body)" }}>{getLocalizedText(ev.description, i18n.language)}</div>
                {ev.source_reference && (ev.evidence_type.includes("image") || ev.evidence_type.includes("uploaded")) && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <img
                      src={ev.source_reference.startsWith("http") || ev.source_reference.startsWith("/api") ? ev.source_reference : `/api/v1/issues/evidence-file/${ev.source_reference}`}
                      alt="Field evidence"
                      style={{ maxHeight: "200px", maxWidth: "100%", borderRadius: "6px", border: "1px solid var(--border-color)" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
