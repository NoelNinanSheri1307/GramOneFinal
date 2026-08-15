import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { AlertCircle, ArrowRight } from "lucide-react";
import { pageFade, fadeUp, buttonTap } from "../lib/motion";

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to sign in. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={pageFade}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: "440px", margin: "2.5rem auto", width: "100%" }}
    >
      {/* ── Hero header ── */}
      <motion.div
        variants={fadeUp}
        style={{ textAlign: "center", marginBottom: "2rem" }}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={buttonTap}
          transition={{ duration: 0.15 }}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "18px",
            backgroundColor: "var(--bg-card)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-md)",
            marginBottom: "1rem",
            padding: "6px",
            border: "1px solid var(--border-color)",
          }}
        >
          <img src="/logo.png" alt="GramOne Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </motion.div>
        <h1 style={{ fontSize: "1.875rem", letterSpacing: "-0.03em", marginBottom: "0.4rem" }}>
          {t("auth.signInTitle", { defaultValue: "Sign in to GramOne" })}
        </h1>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-subtle)" }}>
          {t("auth.signInSubtitle", { defaultValue: "Access your village reports and resolution dashboard." })}
        </p>
        {/* Text-Only SDG pill strip */}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", marginTop: "0.85rem", flexWrap: "wrap" }}>
          <span className="badge" style={{ backgroundColor: "var(--sdg-water-light)", color: "var(--sdg-water)", fontWeight: 700 }}>{t("footer.sdg6", { defaultValue: "SDG 6 · Clean Water" })}</span>
          <span className="badge" style={{ backgroundColor: "var(--sdg-edu-light)", color: "var(--sdg-edu)", fontWeight: 700 }}>{t("footer.sdg4", { defaultValue: "SDG 4 · Quality Education" })}</span>
          <span className="badge" style={{ backgroundColor: "var(--sdg-civic-light)", color: "var(--sdg-civic)", fontWeight: 700 }}>{t("footer.sdg11", { defaultValue: "SDG 11 · Sustainable Communities" })}</span>
          <span className="badge" style={{ backgroundColor: "var(--sdg-climate-light)", color: "var(--sdg-climate)", fontWeight: 700 }}>{t("footer.sdg13", { defaultValue: "SDG 13 · Climate Action" })}</span>
        </div>
      </motion.div>

      {/* ── Login Card ── */}
      <motion.div variants={fadeUp} className="card" style={{ boxShadow: "var(--shadow-lg)" }}>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="alert alert-error"
            role="alert"
            style={{ marginBottom: "1.25rem" }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email-input" className="form-label">{t("auth.email", { defaultValue: "Email address" })}</label>
            <input
              id="email-input"
              type="email"
              required
              className="form-input"
              placeholder="citizen@gramone.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password-input" className="form-label">{t("auth.password", { defaultValue: "Password" })}</label>
            <input
              id="password-input"
              type="password"
              required
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <motion.button
            whileTap={buttonTap}
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block btn-lg"
            aria-label={t("auth.signInBtn", { defaultValue: "Sign in" })}
            style={{ marginTop: "0.5rem" }}
          >
            {loading ? t("auth.signingIn", { defaultValue: "Signing in…" }) : t("auth.signInBtn", { defaultValue: "Sign in" })}
            {!loading && <ArrowRight size={18} />}
          </motion.button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "var(--text-sm)", color: "var(--text-subtle)" }}>
          {t("auth.noAccount", { defaultValue: "Don't have an account?" })}{" "}
          <Link to="/signup" style={{ color: "var(--primary-700)", fontWeight: 700, textDecoration: "none" }}>
            {t("auth.signUpLink", { defaultValue: "Create account" })}
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
};
