import React from "react";
import { useTranslation } from "react-i18next";
import { IssueStatus } from "../lib/api";

interface StatusBadgeProps {
  status: IssueStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation();

  const getStatusConfig = (st: IssueStatus) => {
    switch (st) {
      case "reported":
        return { bg: "var(--status-reported-bg)", fg: "var(--status-reported-fg)" };
      case "ai_processed":
        return { bg: "var(--sdg-water-light)", fg: "var(--sdg-water)" };
      case "correlated":
      case "verified":
        return { bg: "var(--status-verified-bg)", fg: "var(--status-verified-fg)" };
      case "prioritized":
        return { bg: "var(--status-in-progress-bg)", fg: "var(--status-in-progress-fg)" };
      case "assigned":
      case "in_progress":
        return { bg: "var(--status-in-progress-bg)", fg: "var(--status-in-progress-fg)" };
      case "field_completed":
        return { bg: "var(--sdg-climate-light)", fg: "var(--sdg-climate-mid)" };
      case "resolved":
      case "impact_verified":
        return { bg: "var(--status-resolved-bg)", fg: "var(--status-resolved-fg)" };
      default:
        return { bg: "var(--bg-muted)", fg: "var(--text-muted)" };
    }
  };

  const { bg, fg } = getStatusConfig(status);
  const label = t(`status.${status}`, { defaultValue: status.replace("_", " ") });

  return (
    <span
      className="badge status-pill"
      aria-label={`${label}`}
      style={{
        backgroundColor: bg,
        color: fg,
        border: `1px solid ${fg}33`,
        fontSize: "12px",
        height: "28px",
        minHeight: "28px",
        padding: "0 12px",
        borderRadius: "var(--radius-full)",
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
      }}
    >
      {label}
    </span>
  );
};