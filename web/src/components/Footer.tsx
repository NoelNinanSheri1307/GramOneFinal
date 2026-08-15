import React from "react";
import { useTranslation } from "react-i18next";

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer
      style={{
        backgroundColor: "var(--bg-card)",
        borderTop: "1px solid var(--border-color)",
        padding: "1.5rem 1.25rem",
        marginTop: "auto",
      }}
    >
      <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
        {/* SDG Impact Row (Text-Only Badges) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          <span
            style={{
              color: "var(--sdg-water)",
              fontWeight: 700,
              fontSize: "0.75rem",
              padding: "0.3rem 0.75rem",
              backgroundColor: "var(--sdg-water-light)",
              borderRadius: "var(--radius-full)",
            }}
          >
            {t("footer.sdg6", { defaultValue: "SDG 6 · Clean Water" })}
          </span>
          <span style={{ color: "var(--border-color-mid)", fontSize: "0.75rem" }}>•</span>
          <span
            style={{
              color: "var(--sdg-edu)",
              fontWeight: 700,
              fontSize: "0.75rem",
              padding: "0.3rem 0.75rem",
              backgroundColor: "var(--sdg-edu-light)",
              borderRadius: "var(--radius-full)",
            }}
          >
            {t("footer.sdg4", { defaultValue: "SDG 4 · Quality Education" })}
          </span>
          <span
            style={{
              color: "var(--sdg-civic)",
              fontWeight: 700,
              fontSize: "0.75rem",
              padding: "0.3rem 0.75rem",
              backgroundColor: "var(--sdg-civic-light)",
              borderRadius: "var(--radius-full)",
            }}
          >
            {t("footer.sdg11", { defaultValue: "SDG 11 · Sustainable Communities" })}
          </span>
          <span style={{ color: "var(--border-color-mid)", fontSize: "0.75rem" }}>•</span>
          <span
            style={{
              color: "var(--sdg-climate)",
              fontWeight: 700,
              fontSize: "0.75rem",
              padding: "0.3rem 0.75rem",
              backgroundColor: "var(--sdg-climate-light)",
              borderRadius: "var(--radius-full)",
            }}
          >
            {t("footer.sdg13", { defaultValue: "SDG 13 · Climate Action" })}
          </span>
        </div>

        {/* Wordmark + tagline */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "1rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--primary-900)",
              marginBottom: "0.25rem",
            }}
          >
            {t("nav.brand", { defaultValue: "GramOne" })}
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-subtle)", margin: 0 }}>
            {t("footer.copy", { defaultValue: "© 2026 GramOne. Empowering Gram Panchayats & Rural Communities." })}
          </p>
        </div>
      </div>
    </footer>
  );
};
