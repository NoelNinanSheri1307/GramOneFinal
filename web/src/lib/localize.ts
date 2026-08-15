import i18n from "../i18n";

export type LocalizedString = {
  en: string;
  hi?: string;
  ta?: string;
  te?: string;
  kn?: string;
  ml?: string;
  bn?: string;
  mr?: string;
  gu?: string;
  pa?: string;
  or?: string;
  as?: string;
  ur?: string;
  [key: string]: string | undefined;
};

/**
 * Helper to retrieve localized text for a given string or LocalizedString object.
 *
 * Fallback order:
 * 1. Return value[language] if available.
 * 2. Return value.en if available.
 * 3. Return the first available translation in value.
 * 4. If value is a string, return value.
 * 5. Return empty string "" (never return undefined).
 */
export function getLocalizedText(
  value: LocalizedString | string | null | undefined,
  targetLang?: string
): string {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  const lang = targetLang || i18n.language || "en";

  // Development-only completeness warning
  if (
    import.meta.env.DEV &&
    lang !== "en" &&
    !value[lang]
  ) {
    console.warn(`[i18n] Missing ${lang} translation for localized string:`, value);
  }

  // 1. Exact language match
  if (value[lang]) {
    return value[lang]!;
  }

  // 2. Fallback to English
  if (value.en) {
    return value.en;
  }

  // 3. Fallback to first available key
  const availableKeys = Object.keys(value).filter((k) => typeof value[k] === "string");
  if (availableKeys.length > 0) {
    return value[availableKeys[0]]!;
  }

  return "";
}

/**
 * Normalized Unicode search across all localized text translations and string properties.
 */
export function searchMatches(
  value: LocalizedString | string | null | undefined,
  query: string
): boolean {
  if (!value || !query.trim()) return false;
  const normalizedQuery = query.toLowerCase().normalize("NFD");

  if (typeof value === "string") {
    return value.toLowerCase().normalize("NFD").includes(normalizedQuery);
  }

  // Check all available language translations in the LocalizedString object
  return Object.values(value).some((text) => {
    if (typeof text === "string") {
      return text.toLowerCase().normalize("NFD").includes(normalizedQuery);
    }
    return false;
  });
}
