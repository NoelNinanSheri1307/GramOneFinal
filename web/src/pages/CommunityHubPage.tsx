import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { pageFade, fadeUp, staggerContainer, staggerItem } from "../lib/motion";
import { Landmark, Newspaper, ShieldCheck, HeartHandshake, ArrowRight } from "lucide-react";

interface ModuleCardProps {
  to: string;
  icon: React.ElementType;
  accent: string;
  accentBg: string;
  title: string;
  description: string;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ to, icon: Icon, accent, accentBg, title, description }) => (
  <motion.div variants={staggerItem} whileHover={{ y: -2, boxShadow: "var(--shadow-md)" }} transition={{ duration: 0.12 }}>
    <Link
      to={to}
      className="card card-hover"
      style={{ textDecoration: "none", display: "block", height: "100%", padding: "1.25rem 1.35rem" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            backgroundColor: accentBg,
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", lineHeight: 1.25 }}>
            {title}
          </h2>
        </div>
      </div>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-subtle)", lineHeight: 1.55, margin: 0 }}>
        {description}
      </p>
      <div style={{ marginTop: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem", color: accent, fontSize: "var(--text-sm)", fontWeight: 700 }}>
        <span>Open</span>
        <ArrowRight size={15} />
      </div>
    </Link>
  </motion.div>
);

export const CommunityHubPage: React.FC = () => {
  const { t } = useTranslation();

  const modules: ModuleCardProps[] = [
    {
      to: "/community/schemes",
      icon: Landmark,
      accent: "#1d4ed8",
      accentBg: "#eff6ff",
      title: t("community.schemes", { defaultValue: "Government schemes" }),
      description: t("community.schemesDesc", {
        defaultValue: "Browse scheme eligibility, benefits, required documents, and how to apply.",
      }),
    },
    {
      to: "/community/news",
      icon: Newspaper,
      accent: "#a16207",
      accentBg: "#fefce8",
      title: t("community.news", { defaultValue: "Local news & notices" }),
      description: t("community.newsDesc", { defaultValue: "Panchayat announcements and community notices." }),
    },
    {
      to: "/community/safety",
      icon: ShieldCheck,
      accent: "#15803d",
      accentBg: "#f0fdf4",
      title: t("community.safety", { defaultValue: "Community safety" }),
      description: t("community.safetyDesc", {
        defaultValue: "Drug awareness, prevention, warning signs, and where to seek help.",
      }),
    },
    {
      to: "/community/womens-safety",
      icon: HeartHandshake,
      accent: "#be185d",
      accentBg: "#fdf2f8",
      title: t("community.womensSafety", { defaultValue: "Women's safety" }),
      description: t("community.womensSafetyDesc", {
        defaultValue: "Safety resources, emergency guidance, and official support contacts.",
      }),
    },
  ];

  return (
    <motion.div
      variants={pageFade}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      <motion.div variants={fadeUp} className="card hero-pattern" style={{ padding: "1.25rem 1.5rem" }}>
        <h1 style={{ fontSize: "1.65rem", color: "var(--primary-950)", marginBottom: "0.35rem", letterSpacing: "-0.02em" }}>
          {t("community.hubTitle", { defaultValue: "Community information & safety" })}
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--text-subtle)", maxWidth: "640px", margin: 0 }}>
          {t("community.hubSubtitle", {
            defaultValue: "Trusted civic information published by your Panchayat: government schemes, local notices, and safety awareness.",
          })}
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}
      >
        {modules.map((mod) => (
          <ModuleCard key={mod.to} {...mod} />
        ))}
      </motion.div>
    </motion.div>
  );
};
