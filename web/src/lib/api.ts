/**
 * Authenticated API client for GramOne web integration.
 * Transport concerns (base URL + bearer token) and API contracts.
 */
import { API_BASE_URL } from "../config";

const TOKEN_STORAGE_KEY = "gramone_access_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAccessToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    let code = "request_failed";
    let message = `Request failed with status ${response.status}`;
    try {
      const envelope = (await response.json()) as { detail?: { code?: string; message?: string } };
      code = envelope.detail?.code ?? code;
      message = envelope.detail?.message ?? message;
    } catch {
      // non-JSON error body; keep defaults
    }
    throw new ApiError(response.status, code, message);
  }

  return (await response.json()) as T;
}

export type IssueCategory =
  | "water"
  | "sanitation"
  | "education"
  | "agriculture"
  | "civic"
  | "waste"
  | "health"
  | "disaster"
  | "environment"
  | "other";

export type IssueStatus =
  | "reported"
  | "ai_processed"
  | "correlated"
  | "verified"
  | "prioritized"
  | "open"
  | "assigned"
  | "in_progress"
  | "field_completed"
  | "resolved"
  | "impact_verified";

export type ImpactCaseStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "prioritized"
  | "sponsored"
  | "resolved"
  | "impact_verified";

export type IssueSource = "citizen" | "panchayat" | "hardware" | "system";
export type EvidenceType =
  | "citizen_report"
  | "multiple_citizen_reports"
  | "panchayat_verification"
  | "hardware_telemetry"
  | "uploaded_image"
  | "before_field_image"
  | "after_field_image"
  | "field_inspection_note"
  | "related_issue";

import { LocalizedString } from "./localize";

export interface UserBrief {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface VillageBrief {
  id: number;
  name: LocalizedString | string;
  district: string;
  state: string;
}

export interface ImpactCaseBrief {
  id: number;
  reference: string;
  title: LocalizedString | string;
  status: string;
}

export interface IssueBrief {
  id: number;
  reference: string | null;
  title: LocalizedString | string;
  category: IssueCategory;
  status: IssueStatus;
}

export interface IssueHistoryResponse {
  id: number;
  previous_status: IssueStatus | null;
  new_status: IssueStatus;
  changed_by: number | null;
  note: LocalizedString | string | null;
  created_at: string;
}

export interface EvidenceResponse {
  id: number;
  issue_id: number;
  evidence_type: EvidenceType;
  source_reference: string | null;
  description: LocalizedString | string | null;
  created_at: string;
}

export interface IssueResponse {
  id: number;
  reference: string | null;
  title: LocalizedString | string;
  description: LocalizedString | string | null;
  category: IssueCategory;
  subcategory: string | null;
  source: IssueSource;
  status: IssueStatus;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  village: VillageBrief | null;
  reporter: UserBrief | null;
  assigned_to: UserBrief | null;
  evidence_count: number;
  impact_case: ImpactCaseBrief | null;
  history: IssueHistoryResponse[];
  original_language?: string;
}

export interface IssueListResponse {
  items: IssueResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface ImpactCaseCreate {
  title: string;
  summary?: string;
  category: IssueCategory;
  village_id?: number;
  issue_ids: number[];
  affected_population?: number;
  sdg?: string;
  original_language?: string;
}

export interface ImpactCaseUpdate {
  title?: string;
  summary?: string;
  affected_population?: number;
  sdg?: string;
  status?: ImpactCaseStatus;
  assigned_to?: number;
  note?: string;
}

export interface ImpactCaseResponse {
  id: number;
  reference: string | null;
  title: LocalizedString | string;
  summary: LocalizedString | string | null;
  category: IssueCategory;
  village: VillageBrief | null;
  status: ImpactCaseStatus;
  affected_population: number | null;
  sdg: string | null;
  assigned_to: UserBrief | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  issues: IssueBrief[];
  original_language?: string;
}

export interface ImpactCaseListResponse {
  items: ImpactCaseResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface DeviceStatusResponse {
  device_id: string;
  device_type: string;
  status: string;
  water_level_percent: number | null;
  battery_percent: number | null;
  warning_level: "normal" | "critical";
  last_seen_at: string | null;
}

export interface IssueInterpretation {
  category: IssueCategory;
  subcategory: string | null;
  summary: LocalizedString | string;
  affected_entity: string | null;
  location_clues: string[];
  duration_hint: string | null;
  urgency_suggestion: "high" | "medium" | "low" | null;
  affected_population: number | null;
  suggested_sdg: string | null;
  evidence_candidates: Array<{ description: string }>;
  missing_information: string[];
  explicit_facts: string[];
  inferences: string[];
  confidence: "high" | "medium" | "low";
  interpretation_version: string;
  original_language?: string;
  description?: string | null;
  localized_description?: Record<string, string> | null;
}

export async function interpretIssue(
  text: string,
  language?: string
): Promise<IssueInterpretation> {
  return apiRequest<IssueInterpretation>("/issues/interpret", {
    method: "POST",
    body: JSON.stringify({ text, language: language || undefined }),
  });
}

export async function createIssueFromInterpretation(
  interpretation: IssueInterpretation
): Promise<IssueResponse> {
  return apiRequest<IssueResponse>("/issues/from-interpretation", {
    method: "POST",
    body: JSON.stringify(interpretation),
  });
}

export interface IssueCreatePayload {
  title: string;
  description?: string | null;
  category: IssueCategory;
  subcategory?: string | null;
  village_id?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  original_language?: string;
}

export async function createIssue(payload: IssueCreatePayload): Promise<IssueResponse> {
  return apiRequest<IssueResponse>("/issues", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getIssues(params?: {
  category?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<IssueListResponse> {
  const query = new URLSearchParams();
  if (params?.category) query.append("category", params.category);
  if (params?.status) query.append("status", params.status);
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.offset) query.append("offset", params.offset.toString());
  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<IssueListResponse>(`/issues${queryString}`);
}

export async function getIssue(id: number): Promise<IssueResponse> {
  return apiRequest<IssueResponse>(`/issues/${id}`);
}

export async function updateIssue(
  id: number,
  payload: {
    status?: IssueStatus;
    note?: string;
    assigned_to?: number;
    title?: string;
    description?: string;
  }
): Promise<IssueResponse> {
  return apiRequest<IssueResponse>(`/issues/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getIssueEvidence(id: number): Promise<EvidenceResponse[]> {
  return apiRequest<EvidenceResponse[]>(`/issues/${id}/evidence`);
}

export async function getIssueHistory(id: number): Promise<IssueHistoryResponse[]> {
  return apiRequest<IssueHistoryResponse[]>(`/issues/${id}/history`);
}

export async function createEvidence(
  id: number,
  payload: { evidence_type: string; description?: string; source_reference?: string }
): Promise<EvidenceResponse> {
  return apiRequest<EvidenceResponse>(`/issues/${id}/evidence`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getImpactCases(params?: {
  category?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<ImpactCaseListResponse> {
  const query = new URLSearchParams();
  if (params?.category) query.append("category", params.category);
  if (params?.status) query.append("status", params.status);
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.offset) query.append("offset", params.offset.toString());
  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<ImpactCaseListResponse>(`/impact-cases${queryString}`);
}

export async function getImpactCase(id: number): Promise<ImpactCaseResponse> {
  return apiRequest<ImpactCaseResponse>(`/impact-cases/${id}`);
}

export async function createImpactCase(payload: ImpactCaseCreate): Promise<ImpactCaseResponse> {
  return apiRequest<ImpactCaseResponse>("/impact-cases", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateImpactCase(
  id: number,
  payload: ImpactCaseUpdate
): Promise<ImpactCaseResponse> {
  return apiRequest<ImpactCaseResponse>(`/impact-cases/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getHardwareDevices(): Promise<DeviceStatusResponse[]> {
  return apiRequest<DeviceStatusResponse[]>("/hardware/devices");
}

export async function sendDemoTelemetry(
  waterLevelPercent: number = 18.0,
  batteryPercent: number = 92.0
): Promise<DeviceStatusResponse> {
  return apiRequest<DeviceStatusResponse>("/hardware/telemetry", {
    method: "POST",
    body: JSON.stringify({
      device_id: "WATER-DEMO-001",
      water_level_percent: waterLevelPercent,
      battery_percent: batteryPercent,
    }),
  });
}

// ---------------------------------------------------------------------------
// Dynamic content translation
// ---------------------------------------------------------------------------

export type TranslationEntityType =
  | "issue"
  | "impact_case"
  | "evidence"
  | "history"
  | "village"
  | "scheme"
  | "community_notice"
  | "safety_resource";

export interface TranslationRequest {
  entity_type: TranslationEntityType;
  entity_id: number;
  field_name: string;
  target_language: string;
  source_language?: string;
}

export interface TranslationResult {
  entity_type: TranslationEntityType;
  entity_id: number;
  field_name: string;
  target_language: string;
  translated_text: string | null;
}

export interface TranslationBatchResponse {
  results: TranslationResult[];
}

/**
 * Ensure translations exist for dynamic fields and return them.
 *
 * Cache hits are returned instantly; misses are translated by the backend AI
 * layer and cached. A request that fails yields ``translated_text: null`` and
 * the caller simply shows the original text.
 */
export async function requestTranslations(
  requests: TranslationRequest[]
): Promise<TranslationResult[]> {
  if (requests.length === 0) return [];
  const res = await apiRequest<TranslationBatchResponse>("/translations/translate-batch", {
    method: "POST",
    body: JSON.stringify({ requests }),
  });
  return res.results;
}

/**
 * Persist pre-authored localized variants for a dynamic field.
 * Original content is never modified.
 */
export async function storeTranslations(
  entityType: TranslationEntityType,
  entityId: number,
  fieldName: string,
  sourceLanguage: string,
  translations: Record<string, string>
): Promise<void> {
  await apiRequest<{ ok: boolean }>("/translations/store", {
    method: "POST",
    body: JSON.stringify({
      entity_type: entityType,
      entity_id: entityId,
      field_name: fieldName,
      source_language: sourceLanguage,
      translations,
    }),
  });
}

// ---------------------------------------------------------------------------
// Real Photo Upload & Storage Integration
// ---------------------------------------------------------------------------

export interface UploadPhotoResponse {
  source_reference: string;
  filename: string;
  url: string;
}

export async function uploadPhotoEvidence(file: File): Promise<UploadPhotoResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/issues/upload-photo`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    let code = "upload_failed";
    let message = `Upload failed with status ${response.status}`;
    try {
      const envelope = (await response.json()) as { detail?: { code?: string; message?: string } };
      code = envelope.detail?.code ?? code;
      message = envelope.detail?.message ?? message;
    } catch {}
    throw new ApiError(response.status, code, message);
  }

  return (await response.json()) as UploadPhotoResponse;
}

// ---------------------------------------------------------------------------
// User & Employee Management Contracts
// ---------------------------------------------------------------------------

export interface UserProfileResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  village_id: number | null;
  rfid_card_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface EmployeeItem {
  id: number;
  name: string;
  email: string;
  rfid_card_id: string | null;
  assigned_issues_count: number;
  in_progress_issues_count: number;
  last_attendance_status: string;
  last_signed_in_at: string | null;
}

export interface AttendanceRecord {
  id: number;
  user_id: number;
  user_name: string;
  rfid_card_id: string;
  village_id: number | null;
  sign_in_time: string;
  sign_out_time: string | null;
}

export async function getCurrentUserProfile(): Promise<UserProfileResponse> {
  return apiRequest<UserProfileResponse>("/users/me");
}

export async function fetchEmployeesList(): Promise<EmployeeItem[]> {
  return apiRequest<EmployeeItem[]>("/users/employees");
}

export async function fetchAttendanceHistory(): Promise<AttendanceRecord[]> {
  return apiRequest<AttendanceRecord[]>("/users/attendance");
}

export async function rfidScanCard(rfid_card_id: string, device_id?: string): Promise<any> {
  return apiRequest<any>("/hardware/rfid-scan", {
    method: "POST",
    body: JSON.stringify({ rfid_card_id, device_id }),
  });
}

// ---------------------------------------------------------------------------
// CSR Workflow
// ---------------------------------------------------------------------------

export interface CSRProfile {
  id: number;
  user_id: number;
  org_name: string;
  contact_name: string | null;
  contact_email: string | null;
  description: string | null;
  focus_areas: string[];
  preferred_sdgs: string[];
  preferred_support_types: string[];
  preferred_domains: string[];
  preferred_state: string | null;
  preferred_districts: string[];
  min_budget: number | null;
  max_budget: number | null;
}

export interface CSRProfileUpdatePayload {
  org_name?: string;
  contact_name?: string;
  contact_email?: string;
  description?: string;
  focus_areas?: string[];
  preferred_sdgs?: string[];
  preferred_support_types?: string[];
  preferred_domains?: string[];
  preferred_state?: string;
  preferred_districts?: string[];
  min_budget?: number | null;
  max_budget?: number | null;
}

export interface ImpactScoreBreakdown {
  overall_score: number;
  severity_component: number;
  population_component: number;
  evidence_component: number;
  time_component: number;
  infrastructure_component: number;
  rationale?: Record<string, string>;
}

export interface CSRProjectBrief {
  id: number;
  name: string;
  description: string | null;
  status: string;
  estimated_budget: number | null;
  village: VillageBrief | null;
  completed_at: string | null;
  sponsorship_status: string | null;
}

export interface CSROpportunity {
  id: number;
  reference: string | null;
  title: LocalizedString | string;
  summary: LocalizedString | string | null;
  category: IssueCategory;
  village: VillageBrief | null;
  status: string;
  affected_population: number | null;
  sdg: string | null;
  assigned_to: UserBrief | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  evidence_count: number;
  impact_score: ImpactScoreBreakdown | null;
  matched_score: number | null;
  match_reasons: string[];
  projects: CSRProjectBrief[];
  sponsored: boolean;
  original_language?: string;
}

export interface CSROpportunityListResponse {
  items: CSROpportunity[];
  total: number;
  limit: number;
  offset: number;
}

export interface CSRSponsorship {
  id: number;
  project_id: number;
  amount: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  project: CSRProjectBrief | null;
  impact_case_id: number | null;
}

export interface CSRSponsorshipListResponse {
  items: CSRSponsorship[];
  total: number;
  limit: number;
  offset: number;
}

export interface CSRNotification {
  id: number;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

export async function getCSRProfile(): Promise<CSRProfile> {
  return apiRequest<CSRProfile>("/csr/me");
}

export async function updateCSRProfile(payload: CSRProfileUpdatePayload): Promise<CSRProfile> {
  return apiRequest<CSRProfile>("/csr/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getCSROpportunities(params?: {
  category?: string;
  status?: string;
  state?: string;
  district?: string;
  q?: string;
  sort?: "impact" | "recent";
  village_id?: number;
  limit?: number;
  offset?: number;
}): Promise<CSROpportunityListResponse> {
  const query = new URLSearchParams();
  if (params?.category) query.append("category", params.category);
  if (params?.status) query.append("status", params.status);
  if (params?.state) query.append("state", params.state);
  if (params?.district) query.append("district", params.district);
  if (params?.q) query.append("q", params.q);
  if (params?.sort) query.append("sort", params.sort);
  if (params?.village_id) query.append("village_id", params.village_id.toString());
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.offset) query.append("offset", params.offset.toString());
  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<CSROpportunityListResponse>(`/csr/opportunities${queryString}`);
}

export async function getCSROpportunity(id: number): Promise<CSROpportunity> {
  return apiRequest<CSROpportunity>(`/csr/opportunities/${id}`);
}

export async function getCSRMatches(): Promise<{ items: CSROpportunity[]; total: number }> {
  return apiRequest<{ items: CSROpportunity[]; total: number }>("/csr/matches");
}

export async function createCSRSponsorship(payload: {
  project_id: number;
  amount?: number | null;
  support_type?: string | null;
  note?: string;
}): Promise<CSRSponsorship> {
  return apiRequest<CSRSponsorship>("/csr/sponsorships", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listCSRSponsorships(params?: {
  limit?: number;
  offset?: number;
}): Promise<CSRSponsorshipListResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.offset) query.append("offset", params.offset.toString());
  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<CSRSponsorshipListResponse>(`/csr/sponsorships${queryString}`);
}

export async function listCSRProjects(): Promise<{ items: CSRProjectBrief[]; total: number }> {
  return apiRequest<{ items: CSRProjectBrief[]; total: number }>("/csr/projects");
}

export async function listCSRNotifications(limit?: number): Promise<{ items: CSRNotification[] }> {
  const query = limit ? `?limit=${limit}` : "";
  return apiRequest<{ items: CSRNotification[] }>(`/csr/notifications${query}`);
}

export async function markCSRNotificationRead(id: number): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/csr/notifications/${id}/read`, { method: "POST" });
}

export async function createProject(payload: {
  name: string;
  description?: string;
  impact_case_id: number;
  village_id: number;
  estimated_budget?: number | null;
}): Promise<CSRProjectBrief> {
  return apiRequest<CSRProjectBrief>("/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listProjects(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: CSRProjectBrief[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.status) query.append("status", params.status);
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.offset) query.append("offset", params.offset.toString());
  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<{ items: CSRProjectBrief[]; total: number }>(`/projects${queryString}`);
}

// ---------------------------------------------------------------------------
// Community Information & Safety layer
// ---------------------------------------------------------------------------

export type SchemeCategory =
  | "education"
  | "health"
  | "agriculture"
  | "housing"
  | "livelihood"
  | "womens_empowerment"
  | "pension"
  | "water_sanitation"
  | "disaster_relief"
  | "other";

export type SchemeStatus = "draft" | "published" | "archived";
export type PublishStatus = "draft" | "published";
export type NoticeType = "announcement" | "news" | "notice";
export type NoticeSource = "panchayat" | "external";
export type SafetySection = "womens_safety" | "drug_awareness" | "community_safety";
export type SafetyResourceType = "article" | "notice" | "help_resource";

export interface SchemeResponse {
  id: number;
  category: SchemeCategory;
  title: LocalizedString | string;
  short_description: LocalizedString | string;
  detailed_description: LocalizedString | string | null;
  eligibility: LocalizedString | string | null;
  benefits: LocalizedString | string | null;
  required_documents: string | null;
  application_instructions: LocalizedString | string | null;
  official_url: string | null;
  deadline: string | null;
  state: string | null;
  district: string | null;
  village: VillageBrief | null;
  target_groups: string | null;
  status: SchemeStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  original_language?: string;
}

export interface SchemeListResponse {
  items: SchemeResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface SchemePayload {
  category?: SchemeCategory;
  title: string;
  short_description: string;
  detailed_description?: string | null;
  eligibility?: string | null;
  benefits?: string | null;
  required_documents?: string | null;
  application_instructions?: string | null;
  official_url?: string | null;
  deadline?: string | null;
  state?: string | null;
  district?: string | null;
  village_id?: number | null;
  target_groups?: string | null;
  status?: SchemeStatus;
  original_language?: string;
}

export interface CommunityNoticeResponse {
  id: number;
  notice_type: NoticeType;
  source_type: NoticeSource;
  title: LocalizedString | string;
  summary: LocalizedString | string | null;
  content: LocalizedString | string | null;
  category: string | null;
  is_featured: boolean;
  state: string | null;
  district: string | null;
  village: VillageBrief | null;
  status: PublishStatus;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  original_language?: string;
}

export interface ExternalNewsArticle {
  id: string;
  title: string;
  summary: string;
  image_url: string | null;
  source_type: "external";
  notice_type: "news";
  source: string;
  url: string;
  published_at: string | null;
  language: string;
  category: string | null;
  region: string | null;
}

export interface NoticeListResponse {
  items: CommunityNoticeResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface NoticePayload {
  notice_type?: NoticeType;
  source_type?: NoticeSource;
  title: string;
  summary?: string | null;
  content?: string | null;
  category?: string | null;
  is_featured?: boolean;
  state?: string | null;
  district?: string | null;
  village_id?: number | null;
  status?: PublishStatus;
  expires_at?: string | null;
  original_language?: string;
}

export interface SafetyResourceResponse {
  id: number;
  section: SafetySection;
  resource_type: SafetyResourceType;
  title: LocalizedString | string;
  summary: LocalizedString | string | null;
  content: LocalizedString | string | null;
  external_url: string | null;
  contact_label: string | null;
  contact_phone: string | null;
  is_featured: boolean;
  state: string | null;
  district: string | null;
  village: VillageBrief | null;
  status: PublishStatus;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  original_language?: string;
}

export interface SafetyResourceListResponse {
  items: SafetyResourceResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface SafetyResourcePayload {
  section?: SafetySection;
  resource_type?: SafetyResourceType;
  title: string;
  summary?: string | null;
  content?: string | null;
  external_url?: string | null;
  contact_label?: string | null;
  contact_phone?: string | null;
  is_featured?: boolean;
  state?: string | null;
  district?: string | null;
  village_id?: number | null;
  status?: PublishStatus;
  expires_at?: string | null;
  original_language?: string;
}

export async function getSchemes(params?: {
  q?: string;
  category?: SchemeCategory;
  target_group?: string;
  state?: string;
  status?: SchemeStatus;
  limit?: number;
  offset?: number;
}): Promise<SchemeListResponse> {
  const query = new URLSearchParams();
  if (params?.q) query.append("q", params.q);
  if (params?.category) query.append("category", params.category);
  if (params?.target_group) query.append("target_group", params.target_group);
  if (params?.state) query.append("state", params.state);
  if (params?.status) query.append("status", params.status);
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.offset) query.append("offset", params.offset.toString());
  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<SchemeListResponse>(`/community/schemes${queryString}`);
}

export async function getScheme(id: number): Promise<SchemeResponse> {
  return apiRequest<SchemeResponse>(`/community/schemes/${id}`);
}

export async function createScheme(payload: SchemePayload): Promise<SchemeResponse> {
  return apiRequest<SchemeResponse>("/community/schemes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateScheme(id: number, payload: Partial<SchemePayload>): Promise<SchemeResponse> {
  return apiRequest<SchemeResponse>(`/community/schemes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getNotices(params?: {
  q?: string;
  notice_type?: NoticeType;
  source_type?: NoticeSource;
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<NoticeListResponse> {
  const query = new URLSearchParams();
  if (params?.q) query.append("q", params.q);
  if (params?.notice_type) query.append("notice_type", params.notice_type);
  if (params?.source_type) query.append("source_type", params.source_type);
  if (params?.category) query.append("category", params.category);
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.offset) query.append("offset", params.offset.toString());
  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<NoticeListResponse>(`/community/notices${queryString}`);
}

export async function getExternalNews(params?: {
  q?: string;
  language?: string;
  category?: string;
}): Promise<ExternalNewsArticle[]> {
  const query = new URLSearchParams();
  if (params?.q) query.append("q", params.q);
  if (params?.language) query.append("language", params.language);
  if (params?.category) query.append("category", params.category);
  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<ExternalNewsArticle[]>(`/community/news${queryString}`);
}

export async function getNotice(id: number): Promise<CommunityNoticeResponse> {
  return apiRequest<CommunityNoticeResponse>(`/community/notices/${id}`);
}

export async function createNotice(payload: NoticePayload): Promise<CommunityNoticeResponse> {
  return apiRequest<CommunityNoticeResponse>("/community/notices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateNotice(id: number, payload: Partial<NoticePayload>): Promise<CommunityNoticeResponse> {
  return apiRequest<CommunityNoticeResponse>(`/community/notices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getSafetyResources(params?: {
  section?: SafetySection;
  resource_type?: SafetyResourceType;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<SafetyResourceListResponse> {
  const query = new URLSearchParams();
  if (params?.section) query.append("section", params.section);
  if (params?.resource_type) query.append("resource_type", params.resource_type);
  if (params?.q) query.append("q", params.q);
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.offset) query.append("offset", params.offset.toString());
  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<SafetyResourceListResponse>(`/community/safety${queryString}`);
}

export async function getSafetyResource(id: number): Promise<SafetyResourceResponse> {
  return apiRequest<SafetyResourceResponse>(`/community/safety/${id}`);
}

export async function createSafetyResource(payload: SafetyResourcePayload): Promise<SafetyResourceResponse> {
  return apiRequest<SafetyResourceResponse>("/community/safety", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSafetyResource(
  id: number,
  payload: Partial<SafetyResourcePayload>
): Promise<SafetyResourceResponse> {
  return apiRequest<SafetyResourceResponse>(`/community/safety/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export interface NotificationResponse {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
  payload: {
    target_id?: number;
    target_type?: string;
    i18nKey?: string;
    i18nParams?: Record<string, string>;
  } | null;
}

export interface NotificationListResponse {
  items: NotificationResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface NotificationUnreadCountResponse {
  count: number;
}

export async function getNotifications(params?: {
  limit?: number;
  offset?: number;
  is_read?: boolean;
  type?: string;
}): Promise<NotificationListResponse> {
  const query = new URLSearchParams();
  if (params?.limit !== undefined) query.append("limit", params.limit.toString());
  if (params?.offset !== undefined) query.append("offset", params.offset.toString());
  if (params?.is_read !== undefined) query.append("is_read", params.is_read.toString());
  if (params?.type) query.append("type", params.type);
  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<NotificationListResponse>(`/notifications${queryString}`);
}

export async function getUnreadNotificationsCount(): Promise<NotificationUnreadCountResponse> {
  return apiRequest<NotificationUnreadCountResponse>("/notifications/unread-count");
}

export async function markNotificationAsRead(id: number): Promise<NotificationResponse> {
  return apiRequest<NotificationResponse>(`/notifications/${id}/read`, {
    method: "POST",
  });
}

export async function markAllNotificationsAsRead(): Promise<{ status: string; marked_count: number }> {
  return apiRequest<{ status: string; marked_count: number }>("/notifications/read-all", {
    method: "POST",
  });
}