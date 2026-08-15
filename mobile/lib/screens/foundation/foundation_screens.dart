import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../components/buttons.dart';
import '../../components/states_and_tiles.dart';
import '../../models/models.dart';
import '../../services/auth_service.dart';
import '../../services/localization_service.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/onboarding');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primaryDark,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.primaryContainer.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.account_balance, size: 72, color: Colors.white),
            ),
            const SizedBox(height: 24),
            const Text(
              'GramOne',
              style: TextStyle(
                fontSize: 36,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Civic Governance & CSR Infrastructure',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.primaryContainer,
              ),
            ),
            const SizedBox(height: 48),
            const CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
          ],
        ),
      ),
    );
  }
}

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _controller = PageController();
  int _currentIndex = 0;

  final List<Map<String, String>> _slides = [
    {
      'title': 'Report Civic Issues Instantly',
      'body': 'Capture water, road, or sanitation problems in your Gram Panchayat with AI-driven severity scoring.',
      'icon': 'campaign',
    },
    {
      'title': 'Transparent Panchayat Operations',
      'body': 'Track field work status, employee verification, and village project milestones in real-time.',
      'icon': 'account_balance',
    },
    {
      'title': 'CSR Impact & IoT Telemetry',
      'body': 'Discover high-impact sponsorship opportunities and monitor rural smart hardware metrics.',
      'icon': 'volunteer_activism',
    },
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.topRight,
              child: TextButton(
                onPressed: () => Navigator.pushReplacementNamed(context, '/language_selection'),
                child: const Text('Skip'),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                onPageChanged: (idx) => setState(() => _currentIndex = idx),
                itemCount: _slides.length,
                itemBuilder: (context, index) {
                  final slide = _slides[index];
                  IconData iconData = Icons.campaign;
                  if (slide['icon'] == 'account_balance') iconData = Icons.account_balance;
                  if (slide['icon'] == 'volunteer_activism') iconData = Icons.volunteer_activism;

                  return Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(28),
                          decoration: const BoxDecoration(
                            color: AppColors.primaryContainer,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(iconData, size: 64, color: AppColors.primary),
                        ),
                        const SizedBox(height: 32),
                        Text(
                          slide['title']!,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          slide['body']!,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 15,
                            color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _slides.length,
                (idx) => AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: _currentIndex == idx ? 24 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _currentIndex == idx ? AppColors.primary : AppColors.borderLight,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: PrimaryButton(
                label: _currentIndex == _slides.length - 1 ? 'Get Started' : 'Next',
                onPressed: () {
                  if (_currentIndex < _slides.length - 1) {
                    _controller.nextPage(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeInOut,
                    );
                  } else {
                    Navigator.pushReplacementNamed(context, '/language_selection');
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class LanguageSelectionScreen extends StatefulWidget {
  const LanguageSelectionScreen({super.key});

  @override
  State<LanguageSelectionScreen> createState() => _LanguageSelectionScreenState();
}

class _LanguageSelectionScreenState extends State<LanguageSelectionScreen> {
  final LocalizationService _loc = LocalizationService();
  late String _selectedLang;

  final List<Map<String, String>> _langs = [
    {'code': 'en', 'name': 'English', 'native': 'English'},
    {'code': 'hi', 'name': 'Hindi', 'native': 'हिन्दी'},
    {'code': 'ta', 'name': 'Tamil', 'native': 'தமிழ்'},
    {'code': 'te', 'name': 'Telugu', 'native': 'తెలుగు'},
    {'code': 'kn', 'name': 'Kannada', 'native': 'ಕನ್ನಡ'},
    {'code': 'ml', 'name': 'Malayalam', 'native': 'മലയാളം'},
    {'code': 'mr', 'name': 'Marathi', 'native': 'मराठी'},
    {'code': 'bn', 'name': 'Bengali', 'native': 'বাংলা'},
    {'code': 'gu', 'name': 'Gujarati', 'native': 'ગુજરાતી'},
    {'code': 'pa', 'name': 'Punjabi', 'native': 'ਪੰਜਾਬੀ'},
    {'code': 'od', 'name': 'Odia', 'native': 'ଓଡ଼ିଆ'},
    {'code': 'as', 'name': 'Assamese', 'native': 'অসমীয়া'},
    {'code': 'ur', 'name': 'Urdu', 'native': 'اردو'},
  ];

  @override
  void initState() {
    super.initState();
    _selectedLang = _loc.currentLocale;
  }

  void _selectLang(String code) {
    if (_selectedLang != code) {
      // Immediately propagate to LocalizationService so Directionality in main.dart rebuilds
      _loc.setLocale(code);
      setState(() => _selectedLang = code);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Language / भाषा चुनें'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Choose your preferred language',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: ListView.builder(
                  itemCount: _langs.length,
                  itemBuilder: (context, index) {
                    final item = _langs[index];
                    final isSel = item['code'] == _selectedLang;
                    return LanguageSelectorTile(
                      name: item['name']!,
                      nativeName: item['native']!,
                      isSelected: isSel,
                      onTap: () => _selectLang(item['code']!),
                    );
                  },
                ),
              ),
              const SizedBox(height: 12),
              PrimaryButton(
                label: 'Confirm Language',
                onPressed: () {
                  // Locale already applied on tap; confirm navigates to next step
                  Navigator.pushReplacementNamed(context, '/role_selection');
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}


class RoleSelectionScreen extends StatelessWidget {
  const RoleSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              const Text(
                'Welcome to GramOne',
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Select your operational role to continue.',
                style: TextStyle(fontSize: 14, color: AppColors.textSecondaryLight),
              ),
              const SizedBox(height: 32),
              Expanded(
                child: ListView(
                  children: [
                    _buildRoleCard(
                      context,
                      title: 'Citizen',
                      subtitle: 'Report problems, track status, view local civic progress',
                      icon: Icons.person_outline,
                      role: UserRole.citizen,
                    ),
                    _buildRoleCard(
                      context,
                      title: 'Panchayat Admin',
                      subtitle: 'Manage issue queue, assign workers, review impact cases',
                      icon: Icons.account_balance_outlined,
                      role: UserRole.panchayatAdmin,
                    ),

                    _buildRoleCard(
                      context,
                      title: 'Panchayat Field Employee',
                      subtitle: 'Inspect work sites, upload photos, confirm completed work',
                      icon: Icons.engineering_outlined,
                      role: UserRole.panchayatEmployee,
                    ),
                    _buildRoleCard(
                      context,
                      title: 'CSR Partner / Sponsor',
                      subtitle: 'Discover high impact projects, sponsor initiatives, track metrics',
                      icon: Icons.volunteer_activism_outlined,
                      role: UserRole.csrSponsor,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoleCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required UserRole role,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      child: InkWell(
        // ← ROOT CAUSE FIX: persist role in AuthService BEFORE sign-in so
        //   MainTabWrapper renders the correct shell on first load.
        onTap: () {
          AuthService().setRole(role);
          Navigator.pushNamed(context, '/sign_in', arguments: role);
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: const BoxDecoration(
                  color: AppColors.primaryContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: AppColors.primary, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondaryLight),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, size: 16, color: AppColors.textTertiaryLight),
            ],
          ),
        ),
      ),
    );
  }
}
