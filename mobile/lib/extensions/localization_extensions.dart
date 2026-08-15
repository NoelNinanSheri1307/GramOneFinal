import '../services/localization_service.dart';
import 'package:flutter/material.dart';

/// BuildContext extension for zero-boilerplate localization access.
/// Usage: context.tr('key') or context.tr('key', fallback: 'Default text')
/// This reads from LocalizationService singleton every time build() runs,
/// so it always reflects the current locale without needing listeners in each widget.
extension LocalizationExtension on BuildContext {
  String tr(String key, {String? fallback}) {
    return LocalizationService().tr(key, fallback: fallback);
  }
}
