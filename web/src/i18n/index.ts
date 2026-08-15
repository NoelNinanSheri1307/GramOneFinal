import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import hiCommon from "./locales/hi/common.json";
import taCommon from "./locales/ta/common.json";
import teCommon from "./locales/te/common.json";
import knCommon from "./locales/kn/common.json";
import mlCommon from "./locales/ml/common.json";
import bnCommon from "./locales/bn/common.json";
import mrCommon from "./locales/mr/common.json";
import guCommon from "./locales/gu/common.json";
import paCommon from "./locales/pa/common.json";
import orCommon from "./locales/or/common.json";
import asCommon from "./locales/as/common.json";
import urCommon from "./locales/ur/common.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "kn", name: "Kannada", nativeName: "கன்னட / ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া" },
  { code: "ur", name: "Urdu", nativeName: "اردو", dir: "rtl" },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

const resources = {
  en: { common: enCommon },
  hi: { common: hiCommon },
  ta: { common: taCommon },
  te: { common: teCommon },
  kn: { common: knCommon },
  ml: { common: mlCommon },
  bn: { common: bnCommon },
  mr: { common: mrCommon },
  gu: { common: guCommon },
  pa: { common: paCommon },
  or: { common: orCommon },
  as: { common: asCommon },
  ur: { common: urCommon },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS: "common",
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "gramone_language",
    },
    interpolation: {
      escapeValue: false, // React handles escaping
    },
  });

// Handle RTL direction updates automatically
const updateDocumentDirection = (lng: string) => {
  const isRtl = lng === "ur";
  document.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr");
  document.documentElement.setAttribute("lang", lng);
};

updateDocumentDirection(i18n.language || "en");

i18n.on("languageChanged", (lng) => {
  updateDocumentDirection(lng);
});

export default i18n;
