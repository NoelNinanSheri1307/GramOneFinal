import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../lib/auth";
import { pageFade, fadeUp, buttonTap, successPop } from "../lib/motion";
import {
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

export const SignUpPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("citizen");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // UI & Interaction states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Focus tracking for accessibility
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  // Real-time Validation Checks
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email.trim());

  const passLength = password.length >= 8;
  const passUpper = /[A-Z]/.test(password);
  const passLower = /[a-z]/.test(password);
  const passNumber = /[0-9]/.test(password);
  const isPasswordValid = passLength && passUpper && passLower && passNumber;

  const doPasswordsMatch = confirmPassword.length > 0 && confirmPassword === password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const missing: string[] = [];
    if (!name.trim()) missing.push("Full name is required.");
    if (!isEmailValid) missing.push("Enter a valid email address.");
    if (!isPasswordValid) {
      missing.push(
        "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number."
      );
    }
    if (!doPasswordsMatch) missing.push("Passwords do not match.");
    if (!agreeTerms) missing.push("Please agree to the Terms of Service and Privacy Policy.");
    if (missing.length > 0) {
      setError(missing.join(" "));
      return;
    }

    setLoading(true);

    try {
      await register(name.trim(), email.trim(), password, role);
      setSuccess(true);
      setTimeout(() => {
        navigate(
          role === "panchayat" ? "/panchayat" : role === "csr" ? "/csr" : role === "panchayat_employee" ? "/employee" : "/dashboard"
        );
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to create account. Email may already be registered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={pageFade}
      initial="hidden"
      animate="visible"
      style={{ width: "100%", margin: "1rem auto 3rem auto" }}
    >
      <div className="auth-split-container">
        <div className="auth-split-grid">
          {/* =========================================================
              LEFT / BRAND PANEL (auth-brand-column)
             ========================================================= */}
          <div className="auth-brand-column">
            <motion.div variants={fadeUp} className="auth-brand-panel">
              {/* Logo Mark */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", zIndex: 1 }}>
                <div
                  className="logo-mark"
                  style={{ backgroundColor: "#ffffff", width: "42px", height: "42px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", padding: "4px", border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  <img src="/logo.png" alt="GramOne Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.04em" }}>
                  GramOne
                </span>
              </div>

              <div style={{ zIndex: 1 }}>
                <h2 style={{ color: "#ffffff", fontSize: "1.65rem", marginBottom: "0.5rem", letterSpacing: "-0.03em" }}>
                  Empowering rural governance &amp; citizen impact
                </h2>
                <p style={{ color: "#e2e8f0", fontSize: "0.95rem", lineHeight: 1.65 }}>
                  Join thousands of village residents and Panchayat officials resolving infrastructure issues with transparent AI verification.
                </p>
              </div>

              {/* Value Props (Clean text without decorative icon containers) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", zIndex: 1 }}>
                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem", color: "#ffffff", marginBottom: "0.2rem" }}>
                    AI-powered issue interpretation
                  </strong>
                  <span style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.55 }}>
                    Report problems in plain text. GramOne extracts location clues, affected population, and SDG targets automatically.
                  </span>
                </div>

                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem", color: "#ffffff", marginBottom: "0.2rem" }}>
                    Transparent resolution timeline
                  </strong>
                  <span style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.55 }}>
                    Track every resolution step from citizen report to Panchayat officer verification and CSR partnership funding.
                  </span>
                </div>

                <div>
                  <strong style={{ display: "block", fontSize: "0.95rem", color: "#ffffff", marginBottom: "0.2rem" }}>
                    Encrypted &amp; private by design
                  </strong>
                  <span style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.55 }}>
                    Your personal information is protected with 256-bit TLS encryption in transit. We never sell citizen data.
                  </span>
                </div>
              </div>

              {/* Text-Only SDG Badges */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", zIndex: 1 }}>
                <span className="badge" style={{ backgroundColor: "rgba(3, 105, 161, 0.35)", color: "#bae6fd" }}>SDG 6 · Clean Water</span>
                <span className="badge" style={{ backgroundColor: "rgba(194, 65, 12, 0.35)", color: "#fdba74" }}>SDG 4 · Quality Education</span>
                <span className="badge" style={{ backgroundColor: "rgba(109, 40, 217, 0.35)", color: "#c4b5fd" }}>SDG 11 · Sustainable Communities</span>
                <span className="badge" style={{ backgroundColor: "rgba(16, 185, 129, 0.35)", color: "#a7f3d0" }}>SDG 13 · Climate Action</span>
              </div>

              {/* Enterprise compliance signals */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "1rem", fontSize: "0.75rem", color: "#cbd5e1", display: "flex", gap: "1rem", flexWrap: "wrap", zIndex: 1 }}>
                <span>GDPR Compliant</span>
                <span>•</span>
                <span>ISO 27001 Ready</span>
                <span>•</span>
                <span>SOC 2 Aligned</span>
              </div>
            </motion.div>
          </div>

          {/* =========================================================
              RIGHT / FORM PANEL (auth-form-column)
             ========================================================= */}
          <div className="auth-form-column">
            <motion.div variants={fadeUp}>
          <div className="card" style={{ boxShadow: "var(--shadow-xl)", padding: "2rem 1.75rem" }}>
            <div style={{ marginBottom: "1.25rem" }}>
              <h1 style={{ fontSize: "1.65rem", letterSpacing: "-0.03em", marginBottom: "0.35rem" }}>
                Create your GramOne account
              </h1>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-subtle)" }}>
                Start reporting rural problems or administering Panchayat resolution.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="alert alert-error"
                style={{ marginBottom: "1.25rem" }}
                role="alert"
                aria-live="polite"
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
                <span>{error}</span>
              </motion.div>
            )}

            {success ? (
              <motion.div
                variants={successPop}
                initial="hidden"
                animate="visible"
                style={{ textAlign: "center", padding: "2rem 1rem" }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    backgroundColor: "#f0fdf4",
                    color: "#166534",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1rem",
                    border: "2px solid #bbf7d0",
                  }}
                >
                  <CheckCircle2 size={36} />
                </div>
                <h2 style={{ fontSize: "1.5rem", color: "var(--primary-900)", marginBottom: "0.35rem" }}>
                  Account created successfully
                </h2>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--text-subtle)" }}>
                  Redirecting to your dashboard...
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {/* 1. Full Name */}
                <div className="form-group">
                  <label htmlFor="signup-name" className="form-label">
                    Full name <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    required
                    autoComplete="name"
                    className="form-input"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* 2. Email Address */}
                <div className="form-group">
                  <label htmlFor="signup-email" className="form-label">
                    Email address <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    required
                    autoComplete="email"
                    className="form-input"
                    placeholder="name@gramone.org"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailTouched(true);
                    }}
                    onBlur={() => setEmailTouched(true)}
                    aria-invalid={emailTouched && email.length > 0 && !isEmailValid}
                    aria-describedby="email-feedback"
                  />
                  {emailTouched && email.length > 0 && (
                    <div
                      id="email-feedback"
                      aria-live="polite"
                      style={{
                        fontSize: "var(--text-xs)",
                        marginTop: "0.3rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        color: isEmailValid ? "#067647" : "#d92d20",
                        fontWeight: 600,
                      }}
                    >
                      {isEmailValid ? (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Email looks good</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={14} />
                          <span>Enter a valid email address (e.g. name@example.com)</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Password */}
                <div className="form-group">
                  <label htmlFor="signup-password" className="form-label">
                    Password <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      className="form-input"
                      style={{ paddingRight: "2.75rem" }}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      aria-invalid={password.length > 0 && !isPasswordValid}
                      aria-describedby="password-rules"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--text-subtle)",
                        cursor: "pointer",
                        padding: "4px",
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Password Rules Checklist */}
                  {(passwordFocused || password.length > 0) && (
                    <div id="password-rules" className="rule-checklist" aria-live="polite">
                      <span style={{ fontWeight: 700, color: "var(--text-main)", marginBottom: "0.2rem" }}>
                        Password must contain:
                      </span>
                      <div className={`rule-check-item ${passLength ? "rule-pass" : "rule-fail"}`}>
                        {passLength ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>At least 8 characters</span>
                      </div>
                      <div className={`rule-check-item ${passUpper ? "rule-pass" : "rule-fail"}`}>
                        {passUpper ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>One uppercase letter (A-Z)</span>
                      </div>
                      <div className={`rule-check-item ${passLower ? "rule-pass" : "rule-fail"}`}>
                        {passLower ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>One lowercase letter (a-z)</span>
                      </div>
                      <div className={`rule-check-item ${passNumber ? "rule-pass" : "rule-fail"}`}>
                        {passNumber ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        <span>One number (0-9)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Confirm Password */}
                <div className="form-group">
                  <label htmlFor="signup-confirm-password" className="form-label">
                    Confirm password <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      className="form-input"
                      style={{ paddingRight: "2.75rem" }}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setConfirmTouched(true);
                      }}
                      onBlur={() => setConfirmTouched(true)}
                      aria-invalid={confirmTouched && !doPasswordsMatch}
                      aria-describedby="confirm-feedback"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--text-subtle)",
                        cursor: "pointer",
                        padding: "4px",
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {confirmTouched && confirmPassword.length > 0 && (
                    <div
                      id="confirm-feedback"
                      aria-live="polite"
                      style={{
                        fontSize: "var(--text-xs)",
                        marginTop: "0.3rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        color: doPasswordsMatch ? "#067647" : "#d92d20",
                        fontWeight: 600,
                      }}
                    >
                      {doPasswordsMatch ? (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Passwords match</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={14} />
                          <span>Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 5. Role Selector (Plain text) */}
                <div className="form-group">
                  <label className="form-label">{t("auth.roleLabel", { defaultValue: "Account role" })}</label>
                  <div className="role-selector-grid" role="group" aria-label="Account role selector">
                    <button
                      type="button"
                      onClick={() => setRole("citizen")}
                      className={`btn btn-sm ${role === "citizen" ? "btn-primary" : "btn-secondary"}`}
                      aria-label="Select Citizen account role"
                      aria-pressed={role === "citizen"}
                      style={{ padding: "0.6rem 0.75rem", fontSize: "0.85rem", minHeight: "44px" }}
                    >
                      <span>{t("auth.roleCitizen", { defaultValue: "Citizen" })}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("panchayat")}
                      className={`btn btn-sm ${role === "panchayat" ? "btn-primary" : "btn-secondary"}`}
                      aria-label="Select Panchayat Admin account role"
                      aria-pressed={role === "panchayat"}
                      style={{
                        padding: "0.6rem 0.75rem",
                        fontSize: "0.85rem",
                        minHeight: "44px",
                        ...(role === "panchayat" ? { backgroundColor: "var(--sdg-civic)", borderColor: "var(--sdg-civic)" } : {}),
                      }}
                    >
                      <span>{t("auth.rolePanchayat", { defaultValue: "Panchayat Admin" })}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("csr")}
                      className={`btn btn-sm ${role === "csr" ? "btn-primary" : "btn-secondary"}`}
                      aria-label="Select CSR Partner account role"
                      aria-pressed={role === "csr"}
                      style={{
                        padding: "0.6rem 0.75rem",
                        fontSize: "0.85rem",
                        minHeight: "44px",
                        ...(role === "csr" ? { backgroundColor: "#047857", borderColor: "#047857" } : {}),
                      }}
                    >
                      <span>CSR Partner</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("panchayat_employee")}
                      className={`btn btn-sm ${role === "panchayat_employee" ? "btn-primary" : "btn-secondary"}`}
                      aria-label="Select Panchayat Employee account role"
                      aria-pressed={role === "panchayat_employee"}
                      style={{
                        padding: "0.6rem 0.75rem",
                        fontSize: "0.85rem",
                        minHeight: "44px",
                        ...(role === "panchayat_employee" ? { backgroundColor: "#0284c7", borderColor: "#0284c7" } : {}),
                      }}
                    >
                      <span>Field Employee</span>
                    </button>
                  </div>
                </div>

                {/* 6. Terms Checkbox */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  <input
                    id="signup-terms"
                    type="checkbox"
                    required
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    style={{ marginTop: "3px", width: "18px", height: "18px", accentColor: "var(--primary-600)", cursor: "pointer" }}
                  />
                  <label htmlFor="signup-terms" style={{ fontSize: "var(--text-xs)", color: "var(--text-body)", cursor: "pointer", lineHeight: 1.4 }}>
                    I agree to the <a href="#terms" onClick={(e) => e.preventDefault()} style={{ color: "var(--primary-700)", fontWeight: 600 }}>Terms of Service</a> and{" "}
                    <a href="#privacy" onClick={(e) => e.preventDefault()} style={{ color: "var(--primary-700)", fontWeight: 600 }}>Privacy Policy</a>.
                  </label>
                </div>

                {/* 7. Primary Submission Button */}
                <motion.button
                  whileTap={buttonTap}
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-block btn-lg"
                  style={{
                    opacity: loading ? 0.65 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? (
                    <>
                      <div className="skeleton" style={{ width: "18px", height: "18px", borderRadius: "50%" }} />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create account</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </motion.button>
              </form>
            )}

            {/* Sign In Link */}
            <div style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "var(--text-sm)", color: "var(--text-subtle)" }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: "var(--primary-700)", fontWeight: 700, textDecoration: "none" }}>
                Sign in
              </Link>
            </div>

            {/* Trust Footer Signals */}
            <div className="trust-badge-row">
              <span>Encrypted in transit</span>
              <span>•</span>
              <span>We never sell citizen data</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </div>
</motion.div>
  );
};
