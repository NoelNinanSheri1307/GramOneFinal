import i18n from "../i18n";

/**
 * Localized Date Formatter using Intl.DateTimeFormat
 */
export function formatDate(
  date: string | Date | number,
  overrideLocale?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const locale = overrideLocale || i18n.language || "en";
  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    day: "numeric",
    month: "short",
    year: "numeric",
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
  } catch {
    return new Intl.DateTimeFormat("en", defaultOptions).format(d);
  }
}

/**
 * Localized Number Formatter using Intl.NumberFormat
 */
export function formatNumber(num: number, overrideLocale?: string): string {
  if (typeof num !== "number" || isNaN(num)) return "0";
  const locale = overrideLocale || i18n.language || "en";
  try {
    return new Intl.NumberFormat(locale).format(num);
  } catch {
    return new Intl.NumberFormat("en").format(num);
  }
}

/**
 * Localized Time Formatter using Intl.DateTimeFormat
 */
export function formatTime(date: string | Date | number, overrideLocale?: string): string {
  if (!date) return "";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const locale = overrideLocale || i18n.language || "en";
  try {
    return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(d);
  } catch {
    return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(d);
  }
}
