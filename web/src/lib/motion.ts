/**
 * GramOne Shared Framer Motion animation variants.
 * P1 Refinement: Simplified, subtle transitions (opacity 0->1, translateY 8px->0, 0.18s, easeOut).
 */
import { Variants } from "framer-motion";

// ── Page-level entrance ──────────────────────────────────────────
export const pageFade: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

// ── Slide up from below (cards, banners) ─────────────────────────
export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: "easeOut" },
  },
};

// ── Stagger container for lists ──────────────────────────────────
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

// ── Stagger child item (subtle fade & translate, no scale) ───────
export const staggerItem: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: "easeOut" },
  },
};

// ── Card hover lift (subtle) ─────────────────────────────────────
export const cardHover = {
  rest:  { y: 0, boxShadow: "var(--shadow-sm)", transition: { duration: 0.18, ease: "easeOut" } },
  hover: { y: -2, boxShadow: "var(--shadow-md)", transition: { duration: 0.18, ease: "easeOut" } },
};

// ── Button tap (subtle press) ────────────────────────────────────
export const buttonTap = { scale: 0.98 };

// ── Success state reveal (subtle fade & translate) ───────────────
export const successPop: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: "easeOut" },
  },
};

// ── Scale in (subtle fade & translate) ───────────────────────────
export const scaleIn: Variants = {
  hidden:  { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: "easeOut" },
  },
};

// ── Navbar indicator slide ────────────────────────────────────────
export const navIndicator = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18, ease: "easeOut" } },
};
