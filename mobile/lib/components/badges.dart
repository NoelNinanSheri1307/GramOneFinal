import 'package:flutter/material.dart';
import '../extensions/localization_extensions.dart';
import '../models/models.dart';
import '../services/localization_service.dart';
import '../theme/app_colors.dart';

/// StatusBadge — reads locale from LocalizationService every build.
/// NOT const — must rebuild when locale changes.
class StatusBadge extends StatelessWidget {
  final IssueStatus status;
  const StatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String label;

    switch (status) {
      case IssueStatus.pending:
        bg = AppColors.statusPending.withValues(alpha: 0.15);
        fg = AppColors.statusPending;
        label = context.tr('status_pending', fallback: 'Pending Triage');
        break;
      case IssueStatus.inProgress:
        bg = AppColors.statusInProgress.withValues(alpha: 0.15);
        fg = AppColors.statusInProgress;
        label = context.tr('status_in_progress', fallback: 'In Progress');
        break;
      case IssueStatus.resolved:
        bg = AppColors.statusResolved.withValues(alpha: 0.15);
        fg = AppColors.statusResolved;
        label = context.tr('status_resolved', fallback: 'Resolved');
        break;
      case IssueStatus.rejected:
        bg = AppColors.statusRejected.withValues(alpha: 0.15);
        fg = AppColors.statusRejected;
        label = context.tr('status_rejected', fallback: 'Rejected');
        break;
      case IssueStatus.critical:
        bg = AppColors.statusCritical.withValues(alpha: 0.2);
        fg = AppColors.statusCritical;
        label = context.tr('status_critical', fallback: 'Critical Alert');
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: fg.withValues(alpha: 0.4)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: fg,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

/// CategoryBadge — translates category names via LocalizationService.
/// NOT const — must rebuild when locale changes.
class CategoryBadge extends StatelessWidget {
  final String category;
  const CategoryBadge({super.key, required this.category});

  String _localizedCategory(BuildContext context) {
    // Map English category strings to i18n keys
    final loc = LocalizationService();
    if (category.contains('Water')) return loc.tr('cat_water', fallback: category);
    if (category.contains('Sanitation')) return loc.tr('cat_sanitation', fallback: category);
    if (category.contains('Road')) return loc.tr('cat_roads', fallback: category);
    if (category.contains('Electricity')) return loc.tr('cat_electricity', fallback: category);
    if (category.contains('Environment')) return loc.tr('cat_environment', fallback: category);
    return category;
  }

  @override
  Widget build(BuildContext context) {
    Color color = AppColors.primary;
    if (category.contains('Water')) color = AppColors.catWater;
    if (category.contains('Sanitation')) color = AppColors.catSanitation;
    if (category.contains('Road')) color = AppColors.catRoads;
    if (category.contains('Electricity')) color = AppColors.catElectricity;
    if (category.contains('Environment')) color = AppColors.catEnvironment;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Text(
        _localizedCategory(context),
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class FilterChipGroup extends StatefulWidget {
  final List<String> categories;
  final String initialSelected;
  final ValueChanged<String> onSelected;

  const FilterChipGroup({
    super.key,
    required this.categories,
    required this.initialSelected,
    required this.onSelected,
  });

  @override
  State<FilterChipGroup> createState() => _FilterChipGroupState();
}

class _FilterChipGroupState extends State<FilterChipGroup> {
  late String _selected;

  @override
  void initState() {
    super.initState();
    _selected = widget.initialSelected;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: widget.categories.map((cat) {
          final isSelected = cat == _selected;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(cat),
              selected: isSelected,
              selectedColor: AppColors.primary,
              labelStyle: TextStyle(
                color: isSelected
                    ? Colors.white
                    : isDark
                        ? AppColors.textPrimaryDark
                        : AppColors.textPrimaryLight,
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
              onSelected: (selected) {
                if (selected) {
                  setState(() => _selected = cat);
                  widget.onSelected(cat);
                }
              },
            ),
          );
        }).toList(),
      ),
    );
  }
}
