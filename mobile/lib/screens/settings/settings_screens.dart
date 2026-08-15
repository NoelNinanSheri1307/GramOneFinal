import 'package:flutter/material.dart';
import '../../components/buttons.dart';
import '../../components/cards.dart';
import '../../components/input_fields.dart';
import '../../components/navigation_components.dart';
import '../../components/states_and_tiles.dart';
import '../../mock/mock_data.dart';
import '../../models/models.dart';
import '../../services/localization_service.dart';
import '../../theme/app_colors.dart';

class NotificationsListScreen extends StatelessWidget {
  const NotificationsListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Notifications'),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: MockData.notifications.length,
        itemBuilder: (context, idx) {
          final notif = MockData.notifications[idx];
          return NotificationCard(
            notification: notif,
            onTap: () => Navigator.pushNamed(context, '/notification_detail', arguments: notif),
          );
        },
      ),
    );
  }
}

class NotificationDetailScreen extends StatelessWidget {
  const NotificationDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final notif = (ModalRoute.of(context)?.settings.arguments as NotificationItem?) ?? MockData.notifications[0];
    return Scaffold(
      appBar: GramOneAppBar(title: notif.category),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(notif.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Text(notif.body, style: const TextStyle(fontSize: 15, height: 1.4)),
            const SizedBox(height: 20),
            Text('Received: ${notif.timestamp.toString().substring(0, 16)}', style: const TextStyle(color: AppColors.textTertiaryLight)),
          ],
        ),
      ),
    );
  }
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = MockData.currentUser;
    return Scaffold(
      appBar: const GramOneAppBar(title: 'User Profile'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const CircleAvatar(radius: 40, child: Icon(Icons.person, size: 44)),
            const SizedBox(height: 12),
            Text(user.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            Text(user.email, style: const TextStyle(color: AppColors.textSecondaryLight)),
            Text('${user.panchayat}, ${user.district}', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
            const SizedBox(height: 24),
            _buildSettingTile(context, 'Edit Profile', Icons.edit_outlined, '/edit_profile'),
            _buildSettingTile(context, 'Change Language', Icons.language, '/change_language'),
            _buildSettingTile(context, 'Accessibility Settings', Icons.accessibility_new, '/accessibility_settings'),
            _buildSettingTile(context, 'App Settings', Icons.settings_outlined, '/app_settings'),
            _buildSettingTile(context, 'Help & Support', Icons.help_outline, '/help_support'),
            _buildSettingTile(context, 'About GramOne', Icons.info_outline, '/about_gramone'),
            const SizedBox(height: 24),
            SecondaryButton(
              label: 'Sign Out',
              icon: Icons.logout,
              onPressed: () => Navigator.pushNamedAndRemoveUntil(context, '/role_selection', (r) => false),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingTile(BuildContext context, String title, IconData icon, String route) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        trailing: const Icon(Icons.chevron_right, size: 20),
        onTap: () => Navigator.pushNamed(context, route),
      ),
    );
  }
}

class EditProfileScreen extends StatelessWidget {
  const EditProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Edit Profile'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const CustomTextField(label: 'Full Name', hint: 'Ramesh Kumar'),
            const SizedBox(height: 14),
            const CustomTextField(label: 'Email', hint: 'ramesh.k@gramone.gov.in'),
            const SizedBox(height: 14),
            const CustomTextField(label: 'Phone Number', hint: '+91 98765 43210'),
            const Spacer(),
            PrimaryButton(
              label: 'Save Changes',
              onPressed: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }
}

class ChangeLanguageScreen extends StatefulWidget {
  const ChangeLanguageScreen({super.key});

  @override
  State<ChangeLanguageScreen> createState() => _ChangeLanguageScreenState();
}

class _ChangeLanguageScreenState extends State<ChangeLanguageScreen> {
  late String _selectedCode;

  @override
  void initState() {
    super.initState();
    // ROOT CAUSE FIX: read the actual persisted locale from LocalizationService
    _selectedCode = LocalizationService().currentLocale;
  }

  void _applyLocale(String code) {
    // ROOT CAUSE FIX: call setLocale so Directionality in main.dart rebuilds
    LocalizationService().setLocale(code);
    setState(() => _selectedCode = code);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Change App Language'),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: MockData.languages.length,
        itemBuilder: (context, idx) {
          final item = MockData.languages[idx];
          // ROOT CAUSE FIX: was hardcoded isSelected: idx == 0
          final isSel = item['code'] == _selectedCode;
          return LanguageSelectorTile(
            name: item['name']!,
            nativeName: item['native']!,
            isSelected: isSel,
            onTap: () => _applyLocale(item['code']!),
          );
        },
      ),
    );
  }
}

class AccessibilitySettingsScreen extends StatelessWidget {
  const AccessibilitySettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Accessibility Options'),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SwitchListTile(
            title: const Text('High Contrast Text Mode'),
            subtitle: const Text('Enhance readability for outdoors'),
            value: true,
            onChanged: (v) {},
          ),
          SwitchListTile(
            title: const Text('Large Touch Targets (Minimum 44px)'),
            subtitle: const Text('Enforce enlarged hit areas'),
            value: true,
            onChanged: (v) {},
          ),
          SwitchListTile(
            title: const Text('Screen Reader Labels (TalkBack/VoiceOver)'),
            subtitle: const Text('Expose explicit semantic labels'),
            value: true,
            onChanged: (v) {},
          ),
        ],
      ),
    );
  }
}

class AppSettingsScreen extends StatelessWidget {
  const AppSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'App Settings'),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SwitchListTile(
            title: const Text('Push Notifications'),
            subtitle: const Text('Receive issue triage & hardware alerts'),
            value: true,
            onChanged: (v) {},
          ),
          SwitchListTile(
            title: const Text('Offline Sync & Local Cache'),
            subtitle: const Text('Buffer photos when mobile signal is weak'),
            value: true,
            onChanged: (v) {},
          ),
        ],
      ),
    );
  }
}

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Help & Support'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text('Toll-Free Civic Helpline', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('1800-425-GRAM (1800-425-4726)', style: TextStyle(fontSize: 18, color: AppColors.primary, fontWeight: FontWeight.bold)),
            SizedBox(height: 20),
            Text('Gram Panchayat Support Email', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('support@gramone.gov.in', style: TextStyle(fontSize: 16)),
          ],
        ),
      ),
    );
  }
}

class AboutGramOneScreen extends StatelessWidget {
  const AboutGramOneScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'About GramOne'),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: const [
            Icon(Icons.account_balance, size: 64, color: AppColors.primary),
            SizedBox(height: 16),
            Text('GramOne Mobile v1.0.0', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text(
              'Unified Civic Intelligence, Citizen Reporting, Panchayat Administration, IoT Telemetry, and CSR Project Sponsorship Platform.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondaryLight),
            ),
          ],
        ),
      ),
    );
  }
}
