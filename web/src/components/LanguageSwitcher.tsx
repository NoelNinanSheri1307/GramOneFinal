import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, SupportedLanguageCode } from "../i18n";
import { Globe, ChevronDown, Check } from "lucide-react";

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  const handleSelectLanguage = (code: SupportedLanguageCode) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="language-switcher-container" ref={dropdownRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary btn-sm language-switcher-trigger"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.85rem",
          padding: "0.45rem 0.75rem",
          borderRadius: "var(--radius-md)",
          minHeight: "38px",
          fontWeight: 600,
        }}
      >
        <Globe size={16} style={{ flexShrink: 0 }} />
        <span>{currentLang.nativeName}</span>
        <ChevronDown
          size={14}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
          }}
        />
      </button>

      {isOpen && (
        <div
          className="language-dropdown-menu"
          role="listbox"
          aria-label="Select language"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 1000,
            minWidth: "190px",
            maxHeight: "320px",
            overflowY: "auto",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-lg)",
            padding: "0.35rem",
          }}
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === currentLang.code;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelectLanguage(lang.code as SupportedLanguageCode)}
                className="language-option-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "0.55rem 0.75rem",
                  fontSize: "0.875rem",
                  borderRadius: "var(--radius-xs)",
                  border: "none",
                  backgroundColor: isSelected ? "var(--primary-50)" : "transparent",
                  color: isSelected ? "#000000" : "var(--text-main)",
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  textAlign: lang.code === "ur" ? "right" : "left",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                  <span style={{ color: isSelected ? "#000000" : "inherit" }}>{lang.nativeName}</span>
                  <span style={{ fontSize: "0.725rem", color: isSelected ? "#333333" : "var(--text-subtle)", opacity: isSelected ? 0.9 : 0.8 }}>
                    {lang.name}
                  </span>
                </div>
                {isSelected && <Check size={16} color="var(--primary-600)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
