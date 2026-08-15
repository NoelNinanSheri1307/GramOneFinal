import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationIndicator } from "./NotificationIndicator";
import { LogOut } from "lucide-react";

const NavLink: React.FC<{
  to: string;
  isActive: boolean;
  accentColor?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}> = ({ to, isActive, accentColor, ariaLabel, children }) => (
  <Link
    to={to}
    aria-label={ariaLabel}
    aria-current={isActive ? "page" : undefined}
    className={`btn btn-sm ${isActive ? "btn-primary" : "btn-secondary"}`}
    style={{
      fontWeight: isActive ? 700 : 500,
      ...(isActive && accentColor ? { backgroundColor: accentColor, borderColor: accentColor } : {}),
    }}
  >
    {children}
    <AnimatePresence>
      {isActive && (
        <motion.span
          layoutId="nav-pill"
          style={{
            position: "absolute",
            bottom: "-6px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "18px",
            height: "2.5px",
            borderRadius: "2px",
            backgroundColor: isActive && accentColor ? accentColor : "var(--primary-500)",
            opacity: 0.8,
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          exit={{ scaleX: 0 }}
          transition={{ duration: 0.18 }}
        />
      )}
    </AnimatePresence>
  </Link>
);

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  const isPanchayat = user?.role === "panchayat";
  const isEmployee = user?.role === "panchayat_employee";
  const isCsr = user?.role === "csr";

  return (
    <motion.header
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        backgroundColor: "var(--bg-card)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--border-color)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0.5rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "nowrap",
          gap: "0.75rem",
        }}
      >
        {/* ── Brand Wordmark ── */}
        <Link
          to={isAuthenticated ? (isPanchayat ? "/panchayat" : isEmployee ? "/employee" : isCsr ? "/csr" : "/dashboard") : "/login"}
          aria-label={t("nav.brand", { defaultValue: "GramOne" })}
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}
        >
          <motion.img
            src="/logo.png"
            alt="GramOne Logo"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="logo-mark"
            style={{ objectFit: "contain", padding: "4px", backgroundColor: "var(--bg-card)", borderRadius: "8px", border: "1px solid var(--border-color)", height: "36px" }}
          />
          <div style={{ lineHeight: 1 }}>
            <span className="gramone-wordmark">{t("nav.brand", { defaultValue: "GramOne" })}</span>
            <span
              style={{
                display: "block",
                fontSize: "0.6rem",
                fontWeight: 800,
                backgroundColor: !isAuthenticated
                  ? "var(--primary-100)"
                  : isPanchayat
                    ? "var(--sdg-civic-light)"
                    : isEmployee
                      ? "var(--sdg-water-light)"
                      : isCsr
                        ? "var(--sdg-climate-light)"
                        : "var(--primary-100)",
                color: !isAuthenticated
                  ? "var(--primary-800)"
                  : isPanchayat
                    ? "var(--sdg-civic)"
                    : isEmployee
                      ? "var(--sdg-water)"
                      : isCsr
                        ? "var(--sdg-climate-mid)"
                        : "var(--primary-800)",
                padding: "2px 5px",
                borderRadius: "3px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginTop: "2px",
              }}
            >
              {!isAuthenticated
                ? t("nav.platformSub", { defaultValue: "Rural Impact Platform" })
                : isPanchayat
                  ? t("nav.rolePanchayat", { defaultValue: "Panchayat Admin" })
                  : isEmployee
                    ? t("nav.roleEmployee", { defaultValue: "Field Worker" })
                    : isCsr
                      ? t("nav.roleCsr", { defaultValue: "CSR Partner" })
                      : t("nav.roleCitizen", { defaultValue: "Citizen Portal" })}
            </span>
          </div>
        </Link>

        {/* ── Navigation ── */}
        {isAuthenticated && (
          <nav
            aria-label="Main Navigation"
            style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "nowrap", position: "relative", overflowX: "auto", scrollbarWidth: "none" }}
          >
            {isEmployee ? (
              <NavLink
                to="/employee"
                ariaLabel="Field Employee Dashboard"
                isActive={isActive("/employee")}
                accentColor="#0284c7"
              >
                <span>Field Workload</span>
              </NavLink>
            ) : isCsr ? (
              <>
                <NavLink
                  to="/csr"
                  ariaLabel={t("nav.csrDashboard", { defaultValue: "CSR dashboard" })}
                  isActive={isActive("/csr") && !isActive("/csr/opportunities") && !isActive("/csr/sponsorships")}
                  accentColor="#047857"
                >
                  <span>{t("nav.csrDashboard", { defaultValue: "CSR dashboard" })}</span>
                </NavLink>
                <NavLink
                  to="/csr/opportunities"
                  ariaLabel={t("nav.csrOpportunities", { defaultValue: "Opportunities" })}
                  isActive={isActive("/csr/opportunities")}
                  accentColor="#047857"
                >
                  <span>{t("nav.csrOpportunities", { defaultValue: "Opportunities" })}</span>
                </NavLink>
                <NavLink
                  to="/csr/sponsorships"
                  ariaLabel={t("nav.csrSponsorships", { defaultValue: "My sponsorships" })}
                  isActive={isActive("/csr/sponsorships")}
                  accentColor="#047857"
                >
                  <span>{t("nav.csrSponsorships", { defaultValue: "My sponsorships" })}</span>
                </NavLink>
              </>
            ) : isPanchayat ? (
              <>
                <NavLink
                  to="/panchayat"
                  ariaLabel={t("nav.panchayatAdmin", { defaultValue: "Panchayat admin" })}
                  isActive={
                    isActive("/panchayat") &&
                    !isActive("/panchayat/create-impact-case") &&
                    !isActive("/panchayat/impact-cases")
                  }
                  accentColor="var(--sdg-civic)"
                >
                  <span>{t("nav.panchayatAdmin", { defaultValue: "Panchayat admin" })}</span>
                </NavLink>
                <NavLink
                  to="/panchayat/impact-cases"
                  ariaLabel={t("nav.impactCases", { defaultValue: "Impact cases" })}
                  isActive={
                    isActive("/panchayat/impact-cases") ||
                    isActive("/panchayat/create-impact-case")
                  }
                  accentColor="var(--sdg-civic)"
                >
                  <span>{t("nav.impactCases", { defaultValue: "Impact cases" })}</span>
                </NavLink>
                <NavLink
                  to="/issues"
                  ariaLabel={t("dashboard.recentTitle", { defaultValue: "All reports" })}
                  isActive={isActive("/issues")}
                >
                  <span>{t("dashboard.viewAll", { defaultValue: "All reports" })}</span>
                </NavLink>
                <NavLink
                  to="/panchayat/community"
                  ariaLabel={t("nav.communityManage", { defaultValue: "Community management" })}
                  isActive={isActive("/panchayat/community")}
                  accentColor="var(--sdg-civic)"
                >
                  <span>{t("nav.communityManage", { defaultValue: "Community management" })}</span>
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to="/dashboard"
                  ariaLabel={t("nav.dashboard", { defaultValue: "Dashboard" })}
                  isActive={isActive("/dashboard")}
                >
                  <span>{t("nav.dashboard", { defaultValue: "Dashboard" })}</span>
                </NavLink>
                <NavLink
                  to="/report"
                  ariaLabel={t("nav.reportProblem", { defaultValue: "Report problem" })}
                  isActive={isActive("/report")}
                >
                  <span>{t("nav.reportProblem", { defaultValue: "Report problem" })}</span>
                </NavLink>
                <NavLink
                  to="/issues"
                  ariaLabel={t("nav.myIssues", { defaultValue: "My issues" })}
                  isActive={isActive("/issues")}
                >
                  <span>{t("nav.myIssues", { defaultValue: "My issues" })}</span>
                </NavLink>
                <NavLink
                  to="/community"
                  ariaLabel={t("nav.community", { defaultValue: "Community" })}
                  isActive={isActive("/community")}
                >
                  <span>{t("nav.community", { defaultValue: "Community" })}</span>
                </NavLink>
              </>
            )}
          </nav>
        )}

        {/* ── User Controls, Language Switcher, Theme Toggle & Sign Out ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0, flexWrap: "nowrap" }}>
          {/* 1. Language Switcher */}
          <LanguageSwitcher />

          {/* 2. Theme Toggle (Light / Dark) */}
          <ThemeToggle />

          {/* 3. Notifications Indicator */}
          {isAuthenticated && <NotificationIndicator />}

          {/* 4. Sign Out Button (Right-most) */}
          {isAuthenticated && user ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={logout}
              className="btn btn-secondary btn-sm"
              title={t("nav.signOut", { defaultValue: "Sign out" })}
              aria-label={t("nav.signOut", { defaultValue: "Sign out" })}
              style={{
                color: "#dc2626",
                borderColor: "#fecaca",
                padding: "0.35rem 0.65rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontWeight: 600,
              }}
            >
              <LogOut size={15} />
              <span>{t("nav.signOut", { defaultValue: "Sign out" })}</span>
            </motion.button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Link
                to="/login"
                className="btn btn-secondary btn-sm"
                aria-label={t("nav.signIn", { defaultValue: "Sign in" })}
              >
                <span>{t("nav.signIn", { defaultValue: "Sign in" })}</span>
              </Link>
              <Link
                to="/signup"
                className="btn btn-primary btn-sm"
                aria-label={t("nav.createAccount", { defaultValue: "Create account" })}
              >
                <span>{t("nav.createAccount", { defaultValue: "Create account" })}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
};
