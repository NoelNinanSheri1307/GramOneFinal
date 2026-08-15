import React from "react";
import { useTranslation } from "react-i18next";
import { IssueHistoryResponse, IssueStatus } from "../lib/api";
import { formatDate } from "../lib/formatters";
import { getLocalizedText } from "../lib/localize";
import { CheckCircle2, Clock } from "lucide-react";

interface TimelineProps {
  history: IssueHistoryResponse[];
  currentStatus: IssueStatus;
  createdAt: string;
}

const LIFECYCLE_STEPS: Array<{ key: IssueStatus; labelKey: string; fallbackLabel: string; descKey: string; fallbackDesc: string }> = [
  { key: "reported", labelKey: "status.reported", fallbackLabel: "Report Submitted", descKey: "timeline.reportedDesc", fallbackDesc: "Issue logged by citizen with natural language interpretation" },
  { key: "verified", labelKey: "status.verified", fallbackLabel: "Verified & Correlated", descKey: "timeline.verifiedDesc", fallbackDesc: "Evidence engine validated report details with Panchayat context" },
  { key: "assigned", labelKey: "status.assigned", fallbackLabel: "Assigned for Action", descKey: "timeline.assignedDesc", fallbackDesc: "Assigned to Panchayat officer or field maintenance team" },
  { key: "in_progress", labelKey: "status.in_progress", fallbackLabel: "Resolution In Progress", descKey: "timeline.inProgressDesc", fallbackDesc: "Ground work underway with tracked progress updates" },
  { key: "resolved", labelKey: "status.resolved", fallbackLabel: "Resolved & Verified Impact", descKey: "timeline.resolvedDesc", fallbackDesc: "Issue resolved and impact verified on ground" },
];

export const Timeline: React.FC<TimelineProps> = ({ history, currentStatus, createdAt }) => {
  const { t, i18n } = useTranslation();

  const getStepState = (stepKey: IssueStatus) => {
    const statusOrder: IssueStatus[] = ["reported", "verified", "assigned", "in_progress", "resolved"];
    const currentIndex = statusOrder.indexOf(
      currentStatus === "ai_processed" || currentStatus === "correlated"
        ? "verified"
        : currentStatus === "prioritized" || currentStatus === "open"
        ? "assigned"
        : currentStatus === "impact_verified"
        ? "resolved"
        : currentStatus
    );
    const stepIndex = statusOrder.indexOf(stepKey);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  const getHistoryNote = (stepKey: IssueStatus) => {
    const entry = history.find((h) => h.new_status === stepKey);
    if (entry?.created_at) {
      return {
        date: formatDate(entry.created_at, i18n.language, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        note: entry.note,
      };
    }
    if (stepKey === "reported" && createdAt) {
      return {
        date: formatDate(createdAt, i18n.language, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        note: t("timeline.reportedNote", { defaultValue: "Initial citizen problem report received" }),
      };
    }
    return null;
  };

  return (
    <div style={{ padding: "0.5rem 0" }} aria-label="Issue Status Timeline">
      <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
        {LIFECYCLE_STEPS.map((step, idx) => {
          const state = getStepState(step.key);
          const historyInfo = getHistoryNote(step.key);
          const isLast = idx === LIFECYCLE_STEPS.length - 1;
          const stepTitle = step.labelKey ? t(step.labelKey, { defaultValue: step.fallbackLabel }) : step.fallbackLabel;

          return (
            <div key={step.key} style={{ display: "flex", gap: "1rem", position: "relative" }}>
              {/* Connector Line (Inactive: #E5E7EB per P2 requirement) */}
              {!isLast && (
                <div
                  style={{
                    position: "absolute",
                    left: "17px",
                    top: "34px",
                    bottom: "-24px",
                    width: "2px",
                    backgroundColor: state === "completed" ? "var(--primary-500)" : "#E5E7EB",
                    zIndex: 1,
                  }}
                />
              )}

              {/* Step Node Icon */}
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor:
                    state === "completed"
                      ? "var(--primary-600)"
                      : state === "active"
                      ? "var(--primary-100)"
                      : "var(--bg-subtle)",
                  color:
                    state === "completed"
                      ? "#ffffff"
                      : state === "active"
                      ? "var(--primary-800)"
                      : "var(--text-subtle)",
                  border:
                    state === "active"
                      ? "2px solid var(--primary-600)"
                      : "2px solid #E5E7EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2,
                  flexShrink: 0,
                }}
              >
                {state === "completed" ? (
                  <CheckCircle2 size={18} />
                ) : state === "active" ? (
                  <Clock size={18} />
                ) : (
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--text-subtle)" }} />
                )}
              </div>

              {/* Step Content */}
              <div style={{ flex: 1, paddingTop: "2px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                  <h4
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: state === "active" ? 700 : 600,
                      color: state === "pending" ? "var(--text-subtle)" : "var(--text-main)",
                    }}
                  >
                    {stepTitle}
                  </h4>
                  {historyInfo?.date && (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-subtle)", fontWeight: 500 }}>
                      {historyInfo.date}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {getLocalizedText(historyInfo?.note, i18n.language) ||
                    (step.descKey
                      ? t(step.descKey, { defaultValue: step.fallbackDesc })
                      : step.fallbackDesc)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
