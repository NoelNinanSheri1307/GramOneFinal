import 'package:flutter/material.dart';

/// GramOne design system color palette following WCAG AA & AAA contrast standards.
class AppColors {
  // Primary Civic Emerald & Teal Tones
  static const Color primary = Color(0xFF0F766E);
  static const Color primaryDark = Color(0xFF115E59);
  static const Color primaryLight = Color(0xFFCCFBF1);
  static const Color primaryContainer = Color(0xFFE6FFFA);
  static const Color onPrimaryContainer = Color(0xFF04221A);

  // Secondary & Accents
  static const Color secondary = Color(0xFFD97706); // Accent Amber
  static const Color secondaryContainer = Color(0xFFFEF3C7);
  static const Color onSecondaryContainer = Color(0xFF78350F);
  static const Color accentSky = Color(0xFF0369A1); // Accent Sky

  // Neutral Background & Surfaces
  static const Color backgroundLight = Color(0xFFF8FAFC);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceVariantLight = Color(0xFFF1F5F9);
  static const Color borderLight = Color(0xFFCBD5E1);

  static const Color backgroundDark = Color(0xFF0F172A);
  static const Color surfaceDark = Color(0xFF1E293B);
  static const Color surfaceVariantDark = Color(0xFF334155);
  static const Color borderDark = Color(0xFF475569);

  // Text Colors (High Contrast WCAG AA)
  static const Color textPrimaryLight = Color(0xFF0F172A);
  static const Color textSecondaryLight = Color(0xFF475569);
  static const Color textTertiaryLight = Color(0xFF64748B);

  static const Color textPrimaryDark = Color(0xFFF8FAFC);
  static const Color textSecondaryDark = Color(0xFFCBD5E1);
  static const Color textTertiaryDark = Color(0xFF94A3B8);

  // Status & Priority Colors (WCAG Compliant)
  static const Color statusPending = Color(0xFFB45309); // Warning Amber
  static const Color statusInProgress = Color(0xFF0369A1); // Information Sky
  static const Color statusResolved = Color(0xFF15803D); // Success Green
  static const Color statusRejected = Color(0xFFB91C1C); // Danger Red
  static const Color statusCritical = Color(0xFF991B1B); // Dark Danger Red

  // Category Colors
  static const Color catWater = Color(0xFF0284C7);
  static const Color catSanitation = Color(0xFF0D9488);
  static const Color catRoads = Color(0xFF7C3AED);
  static const Color catElectricity = Color(0xFFEA580C);
  static const Color catEnvironment = Color(0xFF15803D);
}
