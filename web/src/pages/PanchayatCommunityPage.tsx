import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  getSchemes,
  getNotices,
  getSafetyResources,
  createScheme,
  updateScheme,
  createNotice,
  updateNotice,
  createSafetyResource,
  updateSafetyResource,
} from "../lib/api";
import { pageFade } from "../lib/motion";
import { formatDate } from "../lib/formatters";
import { getLocalizedText } from "../lib/localize";
import { AlertCircle, ArrowLeft, Plus, Pencil, Save, X, Send, Archive as ArchiveIcon } from "lucide-react";

type Tab = "schemes" | "notices" | "safety";

interface FieldConfig {
  name: string;
  labelKey: string;
  type: "text" | "textarea" | "select" | "datetime" | "checkbox";
  options?: Array<{ value: string; label: string }>;
  placeholderKey?: string;
}

interface EntityConfig {
  tab: Tab;
  load: () => Promise<{ items: Array<any>; total: number }>;
  create: (payload: any) => Promise<any>;
  update: (id: number, payload: any) => Promise<any>;
  fields: FieldConfig[];
  statusOptions: Array<{ value: string; label: string }>;
}

const STATUS_PUBLISH = "published";

export const PanchayatCommunityPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<Tab>("schemes");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string | boolean | null>>({});
  const [saving, setSaving] = useState(false);

  const schemeCategoryOptions: Array<{ value: string; label: string }> = [
    { value: "education", label: "Education" },
    { value: "health", label: "Health" },
    { value: "agriculture", label: "Agriculture" },
    { value: "housing", label: "Housing" },
    { value: "livelihood", label: "Livelihood" },
    { value: "womens_empowerment", label: "Women's empowerment" },
    { value: "pension", label: "Pension" },
    { value: "water_sanitation", label: "Water & sanitation" },
    { value: "disaster_relief", label: "Disaster relief" },
    { value: "other", label: "Other" },
  ];

  const configs: Record<Tab, EntityConfig> = {
    schemes: {
      tab: "schemes",
      load: () => getSchemes({ limit: 100 }),
      create: (p) => createScheme(p),
      update: (id, p) => updateScheme(id, p),
      fields: [
        { name: "category", labelKey: "community.schemeCategoryLabel", type: "select", options: schemeCategoryOptions },
        { name: "title", labelKey: "community.schemeTitleLabel", type: "text" },
        { name: "short_description", labelKey: "community.shortDescLabel", type: "textarea", placeholderKey: "community.shortDescLabel" },
        { name: "detailed_description", labelKey: "community.detailedDescLabel", type: "textarea" },
        { name: "eligibility", labelKey: "community.eligibilityLabel", type: "textarea" },
        { name: "benefits", labelKey: "community.benefitsLabel", type: "textarea" },
        { name: "required_documents", labelKey: "community.documentsLabel", type: "textarea" },
        { name: "application_instructions", labelKey: "community.applyLabel", type: "textarea" },
        { name: "official_url", labelKey: "community.officialUrlLabel", type: "text" },
        { name: "deadline", labelKey: "community.deadlineLabel", type: "datetime" },
        { name: "state", labelKey: "community.scopeLabel", type: "text", placeholderKey: "community.scopeLabel" },
        { name: "district", labelKey: "community.scopeLabel", type: "text", placeholderKey: "community.scopeLabel" },
        { name: "target_groups", labelKey: "community.targetGroupsLabel", type: "text" },
        { name: "status", labelKey: "community.noticeTypeLabel", type: "select", options: [
          { value: "draft", label: t("community.draft", { defaultValue: "Draft" }) },
          { value: "published", label: t("community.published", { defaultValue: "Published" }) },
          { value: "archived", label: t("community.archived", { defaultValue: "Archived" }) },
        ] },
      ],
      statusOptions: [
        { value: "draft", label: t("community.draft", { defaultValue: "Draft" }) },
        { value: "published", label: t("community.published", { defaultValue: "Published" }) },
        { value: "archived", label: t("community.archived", { defaultValue: "Archived" }) },
      ],
    },
    notices: {
      tab: "notices",
      load: () => getNotices({ limit: 100 }),
      create: (p) => createNotice(p),
      update: (id, p) => updateNotice(id, p),
      fields: [
        { name: "notice_type", labelKey: "community.noticeTypeLabel", type: "select", options: [
          { value: "announcement", label: t("community.noticeTypeAnnouncement", { defaultValue: "Announcement" }) },
          { value: "news", label: t("community.noticeTypeNews", { defaultValue: "News" }) },
          { value: "notice", label: t("community.noticeTypeNotice", { defaultValue: "Notice" }) },
        ] },
        { name: "source_type", labelKey: "community.sourceAll", type: "select", options: [
          { value: "panchayat", label: t("community.sourcePanchayat", { defaultValue: "Panchayat announcement" }) },
          { value: "external", label: t("community.sourceExternal", { defaultValue: "External news" }) },
        ] },
        { name: "title", labelKey: "community.noticeTitleLabel", type: "text" },
        { name: "summary", labelKey: "community.noticeSummaryLabel", type: "textarea" },
        { name: "content", labelKey: "community.noticeContentLabel", type: "textarea" },
        { name: "category", labelKey: "community.noticeCategoryLabel", type: "text" },
        { name: "is_featured", labelKey: "community.featuredLabel", type: "checkbox" },
        { name: "status", labelKey: "community.noticeTypeLabel", type: "select", options: [
          { value: "draft", label: t("community.draft", { defaultValue: "Draft" }) },
          { value: "published", label: t("community.published", { defaultValue: "Published" }) },
        ] },
      ],
      statusOptions: [
        { value: "draft", label: t("community.draft", { defaultValue: "Draft" }) },
        { value: "published", label: t("community.published", { defaultValue: "Published" }) },
      ],
    },
    safety: {
      tab: "safety",
      load: () => getSafetyResources({ limit: 100 }),
      create: (p) => createSafetyResource(p),
      update: (id, p) => updateSafetyResource(id, p),
      fields: [
        { name: "section", labelKey: "community.safetySectionLabel", type: "select", options: [
          { value: "womens_safety", label: t("community.safetySectionWomens", { defaultValue: "Women's safety" }) },
          { value: "drug_awareness", label: t("community.safetySectionDrug", { defaultValue: "Drug awareness" }) },
          { value: "community_safety", label: t("community.safetySectionCommunity", { defaultValue: "Community safety" }) },
        ] },
        { name: "resource_type", labelKey: "community.safetyTypeLabel", type: "select", options: [
          { value: "article", label: t("community.safetyTypeArticle", { defaultValue: "Article" }) },
          { value: "notice", label: t("community.safetyTypeNotice", { defaultValue: "Notice" }) },
          { value: "help_resource", label: t("community.safetyTypeHelp", { defaultValue: "Help resource" }) },
        ] },
        { name: "title", labelKey: "community.noticeTitleLabel", type: "text" },
        { name: "summary", labelKey: "community.noticeSummaryLabel", type: "textarea" },
        { name: "content", labelKey: "community.noticeContentLabel", type: "textarea" },
        { name: "external_url", labelKey: "community.externalUrlLabel", type: "text" },
        { name: "contact_label", labelKey: "community.contactLabelLabel", type: "text" },
        { name: "contact_phone", labelKey: "community.contactPhoneLabel", type: "text" },
        { name: "is_featured", labelKey: "community.featuredLabel", type: "checkbox" },
        { name: "status", labelKey: "community.noticeTypeLabel", type: "select", options: [
          { value: "draft", label: t("community.draft", { defaultValue: "Draft" }) },
          { value: "published", label: t("community.published", { defaultValue: "Published" }) },
        ] },
      ],
      statusOptions: [
        { value: "draft", label: t("community.draft", { defaultValue: "Draft" }) },
        { value: "published", label: t("community.published", { defaultValue: "Published" }) },
      ],
    },
  };

  const activeConfig = configs[tab];

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await activeConfig.load();
      setItems(res.items);
    } catch (err: any) {
      setError(err?.message || "Failed to load community content.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const emptyForm = (config: EntityConfig): Record<string, string | boolean | null> => {
    const f: Record<string, string | boolean | null> = {};
    for (const field of config.fields) {
      f[field.name] = field.type === "checkbox" ? false : field.type === "select" ? field.options?.[0]?.value ?? "" : "";
    }
    return f;
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm(activeConfig));
    setFormOpen(true);
  };

  const openEdit = (item: any) => {
    const f: Record<string, string | boolean | null> = {};
    for (const field of activeConfig.fields) {
      const value = item[field.name];
      f[field.name] = field.type === "checkbox" ? !!value : value ?? "";
    }
    setEditing(item);
    setForm(f);
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const payload: Record<string, any> = { ...form };
      for (const field of activeConfig.fields) {
        if (field.type === "datetime") {
          payload[field.name] = payload[field.name] ? new Date(payload[field.name] as string).toISOString() : null;
        }
        if (field.type === "text" || field.type === "textarea") {
          const v = payload[field.name];
          payload[field.name] = typeof v === "string" && v.trim() === "" ? null : v;
        }
      }
      if (editing) {
        await activeConfig.update(editing.id, payload);
      } else {
        await activeConfig.create(payload);
      }
      setFormOpen(false);
      setNotice(t("community.saveSuccess", { defaultValue: "Saved successfully." }));
      await fetchItems();
    } catch (err: any) {
      setError(err?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (item: any, status: string) => {
    setError(null);
    try {
      await activeConfig.update(item.id, { status });
      await fetchItems();
    } catch (err: any) {
      setError(err?.message || "Failed to update status.");
    }
  };

  const renderField = (field: FieldConfig) => {
    const value = form[field.name] ?? "";
    const label = t(field.labelKey, { defaultValue: field.name });
    if (field.type === "checkbox") {
      return (
        <label key={field.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
          <input type="checkbox" checked={!!value} onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.checked }))} />
          {label}
        </label>
      );
    }
    if (field.type === "select") {
      return (
        <label key={field.name} style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.85rem", fontWeight: 600 }}>
          {label}
          <select className="form-select" value={(value as string) || ""} onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))}>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      );
    }
    if (field.type === "datetime") {
      return (
        <label key={field.name} style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.85rem", fontWeight: 600 }}>
          {label}
          <input
            type="datetime-local"
            value={(value as string) || ""}
            onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))}
            style={{ padding: "0.45rem 0.6rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", fontSize: "0.85rem" }}
          />
        </label>
      );
    }
    if (field.type === "textarea") {
      return (
        <label key={field.name} style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.85rem", fontWeight: 600 }}>
          {label}
          <textarea
            value={(value as string) || ""}
            rows={field.name === "content" ? 6 : 3}
            onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))}
            style={{ padding: "0.5rem 0.6rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", resize: "vertical" }}
          />
        </label>
      );
    }
    return (
      <label key={field.name} style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.85rem", fontWeight: 600 }}>
        {label}
        <input
          type="text"
          value={(value as string) || ""}
          onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))}
          placeholder={field.placeholderKey ? t(field.placeholderKey, { defaultValue: "" }) : ""}
          style={{ padding: "0.45rem 0.6rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", fontSize: "0.85rem" }}
        />
      </label>
    );
  };

  const statusBadgeStyle = (status: string) => {
    if (status === "published") return { bg: "var(--status-verified-bg)", fg: "var(--status-verified-fg)" };
    if (status === "archived") return { bg: "var(--bg-muted)", fg: "var(--text-muted)" };
    return { bg: "var(--status-in-progress-bg)", fg: "var(--status-in-progress-fg)" };
  };

  return (
    <motion.div variants={pageFade} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
            <Link to="/panchayat" className="btn btn-secondary btn-sm" aria-label="Back">
              <ArrowLeft size={15} />
            </Link>
            <h1 style={{ fontSize: "1.5rem", color: "var(--text-main)", margin: 0 }}>
              {t("community.manageTitle", { defaultValue: "Community management" })}
            </h1>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-subtle)", maxWidth: "640px", margin: "0.4rem 0 0 0" }}>
            {t("community.manageSubtitle", { defaultValue: "Publish and manage schemes, announcements, and safety notices for your village." })}
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={openNew} className="btn btn-primary btn-sm">
          <Plus size={16} />
          {t(
            tab === "schemes"
              ? "community.newScheme"
              : tab === "notices"
                ? "community.newNotice"
                : "community.newSafety",
            { defaultValue: "New" }
          )}
        </motion.button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {(["schemes", "notices", "safety"] as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`btn btn-sm ${tab === key ? "btn-primary" : "btn-secondary"}`}
            style={{ backgroundColor: tab === key ? "var(--sdg-civic)" : undefined, borderColor: tab === key ? "var(--sdg-civic)" : undefined }}
          >
            {t(
              key === "schemes"
                ? "community.tabSchemes"
                : key === "notices"
                  ? "community.tabNotices"
                  : "community.tabSafety",
              { defaultValue: key }
            )}
          </button>
        ))}
      </div>

      {notice && <div className="alert" style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", color: "#166534" }}>{notice}</div>}
      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="card" style={{ height: "80px" }}>
              <div className="skeleton" style={{ height: "16px", width: "55%", marginBottom: "10px" }} />
              <div className="skeleton" style={{ height: "12px", width: "35%" }} />
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && !formOpen && (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <h3 style={{ fontSize: "1.05rem" }}>
            {t(
              tab === "schemes" ? "community.noSchemesTitle" : tab === "notices" ? "community.noNoticesTitle" : "community.noSafetyTitle",
              { defaultValue: "Nothing here yet" }
            )}
          </h3>
        </div>
      )}

      {/* List */}
      {!loading && items.length > 0 && !formOpen && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {items.map((item) => {
            const title = getLocalizedText(item.title, i18n.language);
            const style = statusBadgeStyle(item.status || "");
            return (
              <div key={item.id} className="card" style={{ padding: "0.9rem 1.1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                    <span className="badge" style={{ backgroundColor: style.bg, color: style.fg, fontWeight: 700 }}>
                      {item.status || "draft"}
                    </span>
                    {item.published_at && <span style={{ fontSize: "0.72rem", color: "var(--text-faint)" }}>{formatDate(item.published_at, i18n.language)}</span>}
                  </div>
                  <strong style={{ fontSize: "0.95rem", color: "var(--text-main)" }}>{title}</strong>
                </div>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                  {item.status !== "published" && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleStatus(item, STATUS_PUBLISH)}>
                      <Send size={13} />
                      {t("community.publish", { defaultValue: "Publish" })}
                    </button>
                  )}
                  {item.status === "published" && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleStatus(item, "draft")}>
                      {t("community.unpublish", { defaultValue: "Unpublish" })}
                    </button>
                  )}
                  {tab === "schemes" && item.status !== "archived" && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleStatus(item, "archived")}>
                      <ArchiveIcon size={13} />
                      {t("community.archive", { defaultValue: "Archive" })}
                    </button>
                  )}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>
                    <Pencil size={13} />
                    {t("community.edit", { defaultValue: "Edit" })}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit form */}
      {formOpen && (
        <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", margin: 0 }}>
              {editing ? t("community.edit", { defaultValue: "Edit" }) : t(
                tab === "schemes" ? "community.newScheme" : tab === "notices" ? "community.newNotice" : "community.newSafety",
                { defaultValue: "New" }
              )}
            </h2>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFormOpen(false)} aria-label={t("community.cancel", { defaultValue: "Cancel" })}>
              <X size={14} />
              {t("community.cancel", { defaultValue: "Cancel" })}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.85rem" }}>
            {activeConfig.fields.map((field) => renderField(field))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.1rem" }}>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
              <Save size={15} />
              {saving ? t("community.saving", { defaultValue: "Saving..." }) : t("community.save", { defaultValue: "Save" })}
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
