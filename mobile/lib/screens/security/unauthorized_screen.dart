import 'package:flutter/material.dart';
import '../../components/buttons.dart';
import '../../components/navigation_components.dart';
import '../../services/localization_service.dart';
import '../../theme/app_colors.dart';

class UnauthorizedScreen extends StatelessWidget {
  const UnauthorizedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final loc = LocalizationService();
    return Scaffold(
      appBar: GramOneAppBar(title: loc.tr('unauthorized_access'), showBack: false),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.statusRejected.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.gpp_bad_outlined,
                  size: 64,
                  color: AppColors.statusRejected,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                loc.tr('unauthorized_access'),
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                loc.tr('unauthorized_msg'),
                style: const TextStyle(fontSize: 14, color: AppColors.textSecondaryLight),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 36),
              PrimaryButton(
                label: loc.tr('back_to_dashboard'),
                onPressed: () {
                  Navigator.pushNamedAndRemoveUntil(context, '/main_tab_wrapper', (route) => false);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
