/**
 * Shared, environment-based configuration for the web app.
 * Backend business logic is never duplicated here; this only holds
 * connectivity/site settings consumed by the UI.
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export const APP_NAME: string = "GramOne";