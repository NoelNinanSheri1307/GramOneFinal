import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  getCSRProfile,
  updateCSRProfile,
  getCSROpportunities,
  listCSRSponsorships,
  listCSRProjects,
  listCSRNotifications,
  markCSRNotificationRead,
  CSROpportunity,
  CSRSponsorship,
  CSRProjectBrief,
  CSRNotification,
  CSRProfile,
  CSRProfileUpdatePayload,
} from "../lib/api";
import { pageFade, staggerContainer, staggerItem } from "../lib/motion";
import { getLocalizedText, LocalizedString } from "../lib/localize";
import { CategoryBadge } from "../components/CategoryBadge";
import {
  Handshake,
  Search,
  HeartHandshake,
  Award,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  X,
  Bell,
} from "lucide-react";

export const CSRDashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [opportunities, setOpportunities] = useState<CSROpportunity[]>([]);
  const [sponsorships, setSponsorships] = useState<CSRSponsorship[]>([]);
  const [projects, setProjects] = useState<CSRProjectBrief[]>([]);
  const [notifications, setNotifications] = useState<CSRNotification[]>([]);
  const [profile, setProfile] = useState<CSRProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile editor state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<CSRProfileUpdatePayload>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [oppRes, spoRes, projRes, notifRes, profRes] = await Promise.all([
        getCSROpportunities({ limit: 6 }).catch(() => ({ items: [] as CSROpportunity[], total: 0 })),
        listCSRSponsorships({ limit: 20 }).catch(() => ({ items: [] as CSRSponsorship[], total: 0 })),
        listCSRProjects().catch(() => ({ items: [] as CSRProjectBrief[], total: 0 })),
        listCSRNotifications(10).catch(() => ({ items: [] as CSRNotification[] })),
        getCSRProfile().catch(() => null),
      ]);
      setOpportunities(oppRes.items);
      setSponsorships(spoRes.items);
      setProjects(projRes.items);
      setNotifications(notifRes.items);
      setProfile(profRes);
    } catch (err: any) {
      setError(err?.message || t("csr.backendUnavailable", { defaultValue: "Backend is not reachable." }));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openProfileEditor = () => {
    setProfileForm({
      org_name: profile?.org_name || "",
      contact_name: profile?.contact_name || "",
      contact_email: profile?.contact_email || "",
      description: profile?.description || "",
      focus_areas: profile?.focus_areas || [],
      preferred_sdgs: profile?.preferred_sdgs || [],
      preferred_support_types: profile?.preferred_support_types || [],
      preferred_domains: profile?.preferred_domains || [],
      preferred_state: profile?.preferred_state || "",
      preferred_districts: profile?.preferred_districts || [],
      min_budget: profile?.min_budget,
      max_budget: profile?.max_budget,
    });
    setEditingProfile(true);
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const saved = await updateCSRProfile(profileForm);
      setProfile(saved);
      setEditingProfile(false);
      setProfileMsg(t("csr.profileSaved", { defaultValue: "CSR profile saved successfully." }));
      await fetchAll();
    } catch (err: any) {
      setProfileMsg(err?.message || "Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const activeCount = sponsorships.filter((s) => ["pending", "confirmed", "active"].includes(s.status)).length;
  const inProgressProjects = projects.filter((p) => p.status === "in_progress" || p.status === "sponsored").length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;

  const label = (v: LocalizedValue) => getLocalizedText(v, i18n.language);

  return (
    <motion.div
      variants={pageFade}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      {/* ── CSR Header Banner ── */}
      <div
        className="card hero-pattern"
        style={{
          background: "linear-gradient(135deg, var(--sdg-civic-glow) 0%, #ffffff 100%)",
          borderColor: "rgba(109,40,217,0.2)",
          padding: "1.25rem 1.5rem",
        }}
      >
        <span className="badge" style={{ backgroundColor: "var(--sdg-civic-light)", color: "var(--sdg-civic)", fontWeight: 800, fontSize: "0.75rem", marginBottom: "0.35rem" }}>
          {t("csr.portalBadge", { defaultValue: "CSR Partner Portal" })}
        </span>
        <h1 style={{ fontSize: "1.65rem", color: "var(--primary-950)", marginBottom: "0.2rem" }}>
          {t("csr.title", { defaultValue: "CSR Impact Partnership" })}
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--text-subtle)", maxWidth: "640px" }}>
          {t("csr.subtitle", { defaultValue: "Discover eligible village infrastructure opportunities, sponsor Impact Cases, and track the projects your organization supports." })}
        </p>
      </div>

      {profileMsg && (
        <div className="alert alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{profileMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="skeleton" style={{ height: "110px", borderRadius: "var(--radius-md)" }} />
          ))}
        </div>
      )}

      {!loading && (
        <>
          {/* ── Stats Row ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {[
              { icon: HeartHandshake, count: activeCount, label: t("csr.activeSponsorships", { defaultValue: "Active sponsorships" }), color: "#1d4ed8" },
              { icon: Sparkles, count: opportunities.length, label: t("csr.opportunities", { defaultValue: "Opportunities" }), color: "var(--sdg-civic)" },
              { icon: Award, count: inProgressProjects, label: t("csr.projectsInProgress", { defaultValue: "Projects in progress" }), color: "#a16207" },
              { icon: CheckCircle2, count: completedProjects, label: t("csr.projectsCompleted", { defaultValue: "Completed projects" }), color: "#15803d" },
            ].map((stat) => (
              <div key={stat.label} className="card">
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: `${stat.color}18`, color: stat.color }}>
                    <stat.icon size={22} />
                  </div>
                  <div>
                    <div className="stat-value">{stat.count}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Profile Setup / Summary ── */}
          <div className="card" style={{ borderLeft: "4px solid var(--sdg-civic)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Handshake size={20} color="var(--sdg-civic)" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                    {profile ? profile.org_name : t("csr.noProfileTitle", { defaultValue: "Set up your CSR profile" })}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-subtle)" }}>
                    {profile
                      ? [profile.focus_areas?.join(", ") || "", profile.preferred_state || "", profile.min_budget != null ? `₹${profile.min_budget.toLocaleString()}+` : ""].filter(Boolean).join(" · ")
                      : t("csr.noProfileDesc", { defaultValue: "Add your organization focus areas, geography and budget range to unlock deterministic opportunity matching." })}
                  </div>
                </div>
              </div>
              <button onClick={openProfileEditor} className="btn btn-secondary btn-sm">
                <span>{profile ? t("csr.editProfile", { defaultValue: "Edit profile" }) : t("csr.setupProfile", { defaultValue: "Set up profile" })}</span>
              </button>
            </div>
          </div>

          {/* ── Top Match or Opportunities ── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", marginBottom: "0.15rem" }}>
                  {t("csr.opportunities", { defaultValue: "Opportunities" })}
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--text-subtle)" }}>
                  {t("csr.opportunitiesSubtitle", { defaultValue: "Browse eligible Impact Cases and projects awaiting CSR sponsorship." })}
                </p>
              </div>
              <Link to="/csr/opportunities" className="btn btn-secondary btn-sm">
                <Search size={16} />
                <span>{t("csr.browseOpportunities", { defaultValue: "Browse opportunities" })}</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {opportunities.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
                <div className="empty-state-title">{t("csr.noOpportunitiesTitle", { defaultValue: "No opportunities available" })}</div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-subtle)", margin: "0.35rem 0 0 0" }}>
                  {t("csr.noOpportunitiesDesc", { defaultValue: "Impact Cases created by Panchayat administrations will appear here when they are ready for CSR sponsorship." })}
                </p>
              </div>
            ) : (
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {opportunities.map((o) => (
                  <motion.div key={o.id} variants={staggerItem}>
                    <Link
                      to={`/csr/opportunities/${o.id}`}
                      className="card card-hover"
                      style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", padding: "1rem 1.25rem", borderLeft: "4px solid var(--sdg-civic)" }}
                    >
                      <div style={{ flex: 1, minWidth: "260px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                          <CategoryBadge category={o.category} />
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", fontWeight: 700 }}>{o.reference || `#${o.id}`}</span>
                          {o.matched_score != null && (
                            <span className="badge" style={{ backgroundColor: "var(--sdg-civic-light)", color: "var(--sdg-civic)", fontWeight: 700 }}>
                              {Math.round(o.matched_score)}% {t("csr.matchQuality", { defaultValue: "match" })}
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontSize: "var(--text-base)", color: "var(--text-main)", fontWeight: 700 }}>{label(o.title)}</h3>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-subtle)", marginTop: "0.3rem" }}>
                          {o.village?.name ? label(o.village.name) : "—"} · {t("csr.impactScore", { defaultValue: "Impact" })} {o.impact_score?.overall_score ?? 0}/100 ·{" "}
                          {t("csr.affectedPopulation", { defaultValue: "Affected" })} {o.affected_population ? `~${o.affected_population}` : "—"}
                        </div>
                      </div>
                      <ArrowRight size={16} color="var(--text-faint)" />
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* ── Recent Updates ── */}
          <div>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Bell size={18} color="var(--sdg-civic)" />
              {t("csr.recentUpdates", { defaultValue: "Recent updates" })}
            </h2>
            {notifications.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "var(--text-subtle)" }}>
                {t("csr.noNotifications", { defaultValue: "No recent updates yet." })}
              </p>
            ) : (
              <div className="card" style={{ padding: "0.5rem 0.25rem" }}>
                {notifications.slice(0, 5).map((n) => (
                  <div key={n.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", padding: "0.65rem 0.75rem", borderBottom: "1px solid var(--border-color)", fontSize: "0.875rem" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{n.title}</div>
                      {n.message && <div style={{ fontSize: "0.8rem", color: "var(--text-subtle)" }}>{n.message}</div>}
                    </div>
                    {!n.is_read && (
                      <button
                        onClick={async () => {
                          try {
                            await markCSRNotificationRead(n.id);
                            setNotifications(notifications.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
                          } catch {}
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: "0.7rem", flexShrink: 0 }}
                        aria-label={t("csr.markRead", { defaultValue: "Mark as read" })}
                      >
                        {t("csr.markRead", { defaultValue: "Mark as read" })}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Profile Editor Modal ── */}
      {editingProfile && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.5)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "2rem 1rem", overflowY: "auto" }} onClick={() => setEditingProfile(false)}>
          <div className="card" style={{ maxWidth: "640px", width: "100%", padding: "1.5rem" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.2rem", margin: 0 }}>
                {t("csr.profileSetupTitle", { defaultValue: "Your organization profile" })}
              </h3>
              <button onClick={() => setEditingProfile(false)} className="btn btn-secondary btn-sm" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-subtle)", marginBottom: "1.25rem" }}>
              {t("csr.profileSetupDesc", { defaultValue: "These preferences drive the deterministic match scores shown for each opportunity." })}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              <div>
                <label className="form-label">{t("csr.orgName", { defaultValue: "Organization name" })}</label>
                <input className="form-input" value={profileForm.org_name || ""} onChange={(e) => setProfileForm({ ...profileForm, org_name: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
                <div>
                  <label className="form-label">{t("csr.contactName", { defaultValue: "Contact person" })}</label>
                  <input className="form-input" value={profileForm.contact_name || ""} onChange={(e) => setProfileForm({ ...profileForm, contact_name: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">{t("csr.contactEmail", { defaultValue: "Contact email" })}</label>
                  <input className="form-input" value={profileForm.contact_email || ""} onChange={(e) => setProfileForm({ ...profileForm, contact_email: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="form-label">{t("csr.description", { defaultValue: "About your organization" })}</label>
                <textarea className="form-textarea" rows={2} value={profileForm.description || ""} onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
                <div>
                  <label className="form-label">{t("csr.focusAreas", { defaultValue: "Focus areas" })}</label>
                  <input className="form-input" value={(profileForm.focus_areas || []).join(", ")} onChange={(e) => setProfileForm({ ...profileForm, focus_areas: e.target.value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) })} placeholder={t("csr.focusAreasHint", { defaultValue: "water, education, civic" })} />
                </div>
                <div>
                  <label className="form-label">{t("csr.preferredSdgs", { defaultValue: "Preferred SDGs" })}</label>
                  <input className="form-input" value={(profileForm.preferred_sdgs || []).join(", ")} onChange={(e) => setProfileForm({ ...profileForm, preferred_sdgs: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder={t("csr.preferredSdgsHint", { defaultValue: "6, 4, 11" })} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
                <div>
                  <label className="form-label">{t("csr.preferredState", { defaultValue: "Preferred state" })}</label>
                  <input className="form-input" value={profileForm.preferred_state || ""} onChange={(e) => setProfileForm({ ...profileForm, preferred_state: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">{t("csr.preferredDistricts", { defaultValue: "Preferred districts" })}</label>
                  <input className="form-input" value={(profileForm.preferred_districts || []).join(", ")} onChange={(e) => setProfileForm({ ...profileForm, preferred_districts: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
                <div>
                  <label className="form-label">{t("csr.minBudget", { defaultValue: "Minimum budget (INR)" })}</label>
                  <input className="form-input" type="number" value={profileForm.min_budget ?? ""} onChange={(e) => setProfileForm({ ...profileForm, min_budget: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div>
                  <label className="form-label">{t("csr.maxBudget", { defaultValue: "Maximum budget (INR)" })}</label>
                  <input className="form-input" type="number" value={profileForm.max_budget ?? ""} onChange={(e) => setProfileForm({ ...profileForm, max_budget: e.target.value ? Number(e.target.value) : null })} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
                <div>
                  <label className="form-label">{t("csr.preferredSupportTypes", { defaultValue: "Preferred support types" })}</label>
                  <input className="form-input" value={(profileForm.preferred_support_types || []).join(", ")} onChange={(e) => setProfileForm({ ...profileForm, preferred_support_types: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder={t("csr.supportTypesHint", { defaultValue: "financial, equipment, infrastructure, training, volunteers" })} />
                </div>
                <div>
                  <label className="form-label">{t("csr.preferredDomains", { defaultValue: "Preferred contribution domains" })}</label>
                  <input className="form-input" value={(profileForm.preferred_domains || []).join(", ")} onChange={(e) => setProfileForm({ ...profileForm, preferred_domains: e.target.value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) })} placeholder={t("csr.domainsHint", { defaultValue: "education, water, environment, climate" })} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button onClick={() => setEditingProfile(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={saveProfile} disabled={savingProfile} className="btn btn-primary">
                <span>{savingProfile ? "Saving..." : t("csr.saveProfile", { defaultValue: "Save profile" })}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

type LocalizedValue = LocalizedString | string | null | undefined;