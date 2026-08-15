/**
 * Frontend dynamic-content translation enrichment.
 *
 * The backend returns localized strings as ``{ language: text }`` objects and
 * caches translations server-side. When the current UI language is missing from
 * one of those objects, this module asks the backend to translate (and cache)
 * the missing variants, then merges the results into the fetched data — so the
 * page shows translated content as it becomes available and never blanks out
 * (the original text is always the fallback).
 */
import {
  IssueResponse,
  EvidenceResponse,
  IssueHistoryResponse,
  ImpactCaseResponse,
  TranslationRequest,
  requestTranslations,
} from "./api";
import { LocalizedString } from "./localize";

export function isLocalizedObject(
  value: LocalizedString | string | null | undefined
): value is LocalizedString {
  return !!value && typeof value === "object";
}

function needsTranslation(
  value: LocalizedString | string | null | undefined,
  lang: string,
  sourceLanguage: string
): boolean {
  if (lang === "en") return false;
  if (lang === sourceLanguage) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (isLocalizedObject(value)) return !value[lang];
  return false;
}

/** Merge a freshly-translated variant into a string-or-object field. */
function mergeLocalized(
  current: LocalizedString | string | null | undefined,
  sourceLanguage: string,
  lang: string,
  translated: string
): LocalizedString | string | null {
  if (isLocalizedObject(current)) return { ...current, [lang]: translated };
  if (current) {
    return { [sourceLanguage]: current, [lang]: translated } as LocalizedString;
  }
  return null;
}

export interface EnrichableIssue {
  issue: IssueResponse;
  sourceLanguage: string;
}

/**
 * Fill missing issue title/description/village-name translations for ``lang``.
 * Returns a shallow-cloned list; failed requests are ignored (original shown).
 */
export async function enrichIssueList(issues: IssueResponse[], lang: string): Promise<IssueResponse[]> {
  if (lang === "en" || issues.length === 0) return issues;

  const requests: TranslationRequest[] = [];
  for (const issue of issues) {
    const source = issue.original_language || "en";
    if (needsTranslation(issue.title, lang, source)) {
      requests.push({ entity_type: "issue", entity_id: issue.id, field_name: "title", target_language: lang, source_language: source });
    }
    if (needsTranslation(issue.description, lang, source)) {
      requests.push({ entity_type: "issue", entity_id: issue.id, field_name: "description", target_language: lang, source_language: source });
    }
    if (issue.village?.name && needsTranslation(issue.village.name, lang, "en")) {
      requests.push({ entity_type: "village", entity_id: issue.village.id, field_name: "name", target_language: lang, source_language: "en" });
    }
  }
  if (requests.length === 0) return issues;

  let results;
  try {
    results = await requestTranslations(requests.slice(0, 60));
  } catch {
    return issues;
  }

  const merged = issues.map((issue) => ({ ...issue }));
  for (const r of results) {
    if (!r.translated_text) continue;
    const target = merged.find((issue) => issue.id === r.entity_id);
    if (!target) continue;
    if (r.field_name === "title") {
      target.title = mergeLocalized(target.title, target.original_language || "en", r.target_language, r.translated_text) as LocalizedString | string;
    } else if (r.field_name === "description") {
      target.description = mergeLocalized(target.description, target.original_language || "en", r.target_language, r.translated_text) as LocalizedString | string | null;
    }
    if (r.field_name === "name" && target.village) {
      target.village = { ...target.village, name: mergeLocalized(target.village.name, "en", r.target_language, r.translated_text) as LocalizedString | string };
    }
  }
  return merged;
}

export interface IssueDetailBundle {
  issue: IssueResponse;
  evidence: EvidenceResponse[];
  history: IssueHistoryResponse[];
}

/**
 * Enrich the full issue detail bundle (issue + evidence + history notes) so the
 * entire detail page reflects ``lang`` without a reload.
 */
export async function enrichIssueDetail(
  bundle: IssueDetailBundle,
  lang: string
): Promise<IssueDetailBundle> {
  if (lang === "en" || !bundle.issue) return bundle;
  const source = bundle.issue.original_language || "en";

  const requests: TranslationRequest[] = [];
  if (needsTranslation(bundle.issue.title, lang, source)) {
    requests.push({ entity_type: "issue", entity_id: bundle.issue.id, field_name: "title", target_language: lang, source_language: source });
  }
  if (needsTranslation(bundle.issue.description, lang, source)) {
    requests.push({ entity_type: "issue", entity_id: bundle.issue.id, field_name: "description", target_language: lang, source_language: source });
  }
  for (const ev of bundle.evidence) {
    if (needsTranslation(ev.description, lang, source)) {
      requests.push({ entity_type: "evidence", entity_id: ev.id, field_name: "description", target_language: lang, source_language: source });
    }
  }
  for (const h of bundle.history) {
    if (needsTranslation(h.note, lang, source)) {
      requests.push({ entity_type: "history", entity_id: h.id, field_name: "note", target_language: lang, source_language: source });
    }
  }
  if (requests.length === 0) return bundle;

  let results;
  try {
    results = await requestTranslations(requests.slice(0, 60));
  } catch {
    return bundle;
  }

  const issue = { ...bundle.issue };
  const evidence = bundle.evidence.map((e) => ({ ...e }));
  const history = bundle.history.map((h) => ({ ...h }));
  const sourceFor = issue.original_language || "en";

  for (const r of results) {
    if (!r.translated_text) continue;
    if (r.entity_type === "issue") {
      if (r.field_name === "title") {
        issue.title = mergeLocalized(issue.title, sourceFor, r.target_language, r.translated_text) as LocalizedString | string;
      } else if (r.field_name === "description") {
        issue.description = mergeLocalized(issue.description, sourceFor, r.target_language, r.translated_text) as LocalizedString | string | null;
      }
    } else if (r.entity_type === "evidence") {
      const ev = evidence.find((e) => e.id === r.entity_id);
      if (ev) ev.description = mergeLocalized(ev.description, sourceFor, r.target_language, r.translated_text) as LocalizedString | string | null;
    } else if (r.entity_type === "history") {
      const h = history.find((entry) => entry.id === r.entity_id);
      if (h) h.note = mergeLocalized(h.note, sourceFor, r.target_language, r.translated_text) as LocalizedString | string | null;
    }
  }
  return { issue, evidence, history };
}

/**
 * Enrich an impact case (title/summary + linked issue titles + village name).
 */
export async function enrichImpactCase(
  impactCase: ImpactCaseResponse,
  lang: string
): Promise<ImpactCaseResponse> {
  if (lang === "en" || !impactCase) return impactCase;
  const source = impactCase.original_language || "en";

  const requests: TranslationRequest[] = [];
  if (needsTranslation(impactCase.title, lang, source)) {
    requests.push({ entity_type: "impact_case", entity_id: impactCase.id, field_name: "title", target_language: lang, source_language: source });
  }
  if (needsTranslation(impactCase.summary, lang, source)) {
    requests.push({ entity_type: "impact_case", entity_id: impactCase.id, field_name: "summary", target_language: lang, source_language: source });
  }
  if (impactCase.village?.name && needsTranslation(impactCase.village.name, lang, "en")) {
    requests.push({ entity_type: "village", entity_id: impactCase.village.id, field_name: "name", target_language: lang, source_language: "en" });
  }
  for (const iss of impactCase.issues) {
    if (needsTranslation(iss.title, lang, source)) {
      requests.push({ entity_type: "issue", entity_id: iss.id, field_name: "title", target_language: lang, source_language: source });
    }
  }
  if (requests.length === 0) return impactCase;

  let results;
  try {
    results = await requestTranslations(requests.slice(0, 60));
  } catch {
    return impactCase;
  }

  const merged: ImpactCaseResponse = {
    ...impactCase,
    issues: impactCase.issues.map((i) => ({ ...i })),
  };
  if (merged.village) merged.village = { ...merged.village };

  for (const r of results) {
    if (!r.translated_text) continue;
    if (r.entity_type === "impact_case") {
      if (r.field_name === "title") {
        merged.title = mergeLocalized(merged.title, source, r.target_language, r.translated_text) as LocalizedString | string;
      } else if (r.field_name === "summary") {
        merged.summary = mergeLocalized(merged.summary, source, r.target_language, r.translated_text) as LocalizedString | string | null;
      }
    } else if (r.entity_type === "village" && merged.village && merged.village.id === r.entity_id) {
      merged.village = { ...merged.village, name: mergeLocalized(merged.village.name, "en", r.target_language, r.translated_text) as LocalizedString | string };
    } else if (r.entity_type === "issue") {
      const iss = merged.issues.find((i) => i.id === r.entity_id);
      if (iss) iss.title = mergeLocalized(iss.title, source, r.target_language, r.translated_text) as LocalizedString | string;
    }
  }
  return merged;
}

/**
 * Fill missing impact-case title/summary translations for list views.
 */
export async function enrichImpactCaseList(
  cases: ImpactCaseResponse[],
  lang: string
): Promise<ImpactCaseResponse[]> {
  if (lang === "en" || cases.length === 0) return cases;

  const requests: TranslationRequest[] = [];
  for (const impactCase of cases) {
    const source = impactCase.original_language || "en";
    if (needsTranslation(impactCase.title, lang, source)) {
      requests.push({
        entity_type: "impact_case",
        entity_id: impactCase.id,
        field_name: "title",
        target_language: lang,
        source_language: source,
      });
    }
    if (needsTranslation(impactCase.summary, lang, source)) {
      requests.push({
        entity_type: "impact_case",
        entity_id: impactCase.id,
        field_name: "summary",
        target_language: lang,
        source_language: source,
      });
    }
    if (impactCase.village?.name && needsTranslation(impactCase.village.name, lang, "en")) {
      requests.push({
        entity_type: "village",
        entity_id: impactCase.village.id,
        field_name: "name",
        target_language: lang,
        source_language: "en",
      });
    }
  }
  if (requests.length === 0) return cases;

  let results;
  try {
    results = await requestTranslations(requests.slice(0, 60));
  } catch {
    return cases;
  }

  const merged = cases.map((impactCase) => ({
    ...impactCase,
    village: impactCase.village ? { ...impactCase.village } : impactCase.village,
  }));
  for (const r of results) {
    if (!r.translated_text) continue;
    const target = merged.find((impactCase) => impactCase.id === r.entity_id);
    if (!target) continue;
    const source = target.original_language || "en";
    if (r.entity_type === "impact_case") {
      if (r.field_name === "title") {
        target.title = mergeLocalized(target.title, source, r.target_language, r.translated_text) as LocalizedString | string;
      } else if (r.field_name === "summary") {
        target.summary = mergeLocalized(target.summary, source, r.target_language, r.translated_text) as LocalizedString | string | null;
      }
    } else if (r.entity_type === "village" && target.village && target.village.id === r.entity_id) {
      target.village = {
        ...target.village,
        name: mergeLocalized(target.village.name, "en", r.target_language, r.translated_text) as LocalizedString | string,
      };
    }
  }
  return merged;
}

// ---------------------------------------------------------------------------
// Community Information & Safety content enrichment
// ---------------------------------------------------------------------------

export type CommunityEntityType = "scheme" | "community_notice" | "safety_resource";

const SCHEME_FIELDS = [
  "title",
  "short_description",
  "detailed_description",
  "eligibility",
  "benefits",
  "application_instructions",
] as const;
const NOTICE_FIELDS = ["title", "summary", "content"] as const;
const SAFETY_FIELDS = ["title", "summary", "content"] as const;

/**
 * Fill missing localized variants for community content (schemes, notices,
 * safety resources). Failed requests are ignored and the original text is
 * shown, matching the issue/impact-case enrichment contract.
 */
export async function enrichCommunityItems<T extends { id: number; original_language?: string }>(
  items: T[],
  lang: string,
  entityType: CommunityEntityType,
  fields: readonly string[],
): Promise<T[]> {
  if (lang === "en" || items.length === 0) return items;

  const requests: TranslationRequest[] = [];
  for (const item of items) {
    const source = item.original_language || "en";
    if (source === lang) continue;
    const record = item as unknown as Record<string, unknown>;
    for (const field of fields) {
      if (needsTranslation(record[field] as LocalizedString | string | null, lang, source)) {
        requests.push({
          entity_type: entityType,
          entity_id: item.id,
          field_name: field,
          target_language: lang,
          source_language: source,
        });
      }
    }
  }
  if (requests.length === 0) return items;

  let results;
  try {
    results = await requestTranslations(requests.slice(0, 60));
  } catch {
    return items;
  }

  const merged = items.map((item) => ({ ...item })) as Array<T & Record<string, unknown>>;
  for (const r of results) {
    if (!r.translated_text) continue;
    const target = merged.find((item) => item.id === r.entity_id);
    if (!target) continue;
    const source = target.original_language || "en";
    const current = (target as Record<string, unknown>)[r.field_name] as LocalizedString | string | null;
    (target as Record<string, unknown>)[r.field_name] = mergeLocalized(current, source, r.target_language, r.translated_text);
  }
  return merged;
}

export function enrichSchemes<T extends { id: number; original_language?: string }>(items: T[], lang: string): Promise<T[]> {
  return enrichCommunityItems(items, lang, "scheme", SCHEME_FIELDS as readonly string[]);
}

export function enrichNotices<T extends { id: number; original_language?: string }>(items: T[], lang: string): Promise<T[]> {
  return enrichCommunityItems(items, lang, "community_notice", NOTICE_FIELDS as readonly string[]);
}

export function enrichSafetyResources<T extends { id: number; original_language?: string }>(items: T[], lang: string): Promise<T[]> {
  return enrichCommunityItems(items, lang, "safety_resource", SAFETY_FIELDS as readonly string[]);
}