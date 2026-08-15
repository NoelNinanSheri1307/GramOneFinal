import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export const ThemeToggle: React.FC = () => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
      onClick={toggleTheme}
      className="btn btn-secondary btn-sm theme-toggle-btn"
      aria-label={
        isDark
          ? t("nav.lightTheme", { defaultValue: "Switch to light theme" })
          : t("nav.darkTheme", { defaultValue: "Switch to dark theme" })
      }
      title={
        isDark
          ? t("nav.lightTheme", { defaultValue: "Switch to light theme" })
          : t("nav.darkTheme", { defaultValue: "Switch to dark theme" })
      }
      style={{
        padding: "0.4rem 0.6rem",
        minHeight: "38px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.35rem",
        borderRadius: "var(--radius-md)",
      }}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {isDark ? (
          <Sun size={17} color="#f59e0b" style={{ flexShrink: 0 }} />
        ) : (
          <Moon size={17} color="#475569" style={{ flexShrink: 0 }} />
        )}
      </motion.div>
      <span className="theme-toggle-label" style={{ fontSize: "0.78rem", fontWeight: 600 }}>
        {isDark ? t("nav.dark", { defaultValue: "Dark" }) : t("nav.light", { defaultValue: "Light" })}
      </span>
    </motion.button>
  );
};
