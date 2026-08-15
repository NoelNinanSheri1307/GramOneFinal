import 'package:flutter/material.dart';
import '../components/navigation_components.dart';
import '../models/models.dart';
import '../services/auth_service.dart';
import '../services/localization_service.dart';
import '../services/offline_service.dart';
import '../theme/app_colors.dart';

import 'citizen/citizen_screens.dart';
import 'panchayat_admin/panchayat_admin_screens.dart';
import 'panchayat_employee/panchayat_employee_screens.dart';
import 'csr/csr_screens.dart';
import 'settings/settings_screens.dart';



class MainTabWrapper extends StatefulWidget {
  const MainTabWrapper({super.key});

  @override
  State<MainTabWrapper> createState() => _MainTabWrapperState();
}

class _MainTabWrapperState extends State<MainTabWrapper> {
  int _currentIndex = 0;
  final AuthService _auth = AuthService();
  final LocalizationService _loc = LocalizationService();
  final OfflineService _offline = OfflineService();

  @override
  void initState() {
    super.initState();
    _auth.addListener(_onStateChange);
    _loc.addListener(_onStateChange);
    _offline.addListener(_onStateChange);
  }

  @override
  void dispose() {
    _auth.removeListener(_onStateChange);
    _loc.removeListener(_onStateChange);
    _offline.removeListener(_onStateChange);
    super.dispose();
  }

  void _onStateChange() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final role = _auth.currentRole;

    List<Widget> pages = [];
    List<BottomNavItem> navItems = [];

    // ── Each role branch uses a 100% distinct root widget ──────────────────
    switch (role) {
      // ────────────────────────────────────────────────────
      // 1. CITIZEN
      // ────────────────────────────────────────────────────
      case UserRole.citizen:
        pages = const [
          CitizenHomeDashboard(),
          MyIssuesList(),
          ReportStep1Description(),
          ProjectsListScreen(),
          NotificationsListScreen(),
        ];
        navItems = [
          BottomNavItem(icon: Icons.home_outlined, label: _loc.tr('citizen_tab', fallback: 'Home')),
          BottomNavItem(icon: Icons.assignment_outlined, label: _loc.tr('my_reports', fallback: 'My Issues')),
          BottomNavItem(icon: Icons.add_circle_outline, label: _loc.tr('report_issue', fallback: 'Report')),
          BottomNavItem(icon: Icons.account_balance_outlined, label: 'Projects'),
          BottomNavItem(icon: Icons.notifications_none_outlined, label: _loc.tr('alerts_tab', fallback: 'Alerts')),
        ];
        break;

      // ────────────────────────────────────────────────────
      // 2. PANCHAYAT ADMIN — distinct root: PanchayatDashboard
      // ────────────────────────────────────────────────────
      case UserRole.panchayatAdmin:
        pages = const [
          PanchayatDashboard(),
          IssueQueueScreen(),
          EmployeeManagementScreen(),
          ProjectsListScreen(),
          EmergencyAlertsScreen(),
        ];
        navItems = [
          BottomNavItem(icon: Icons.dashboard_outlined, label: 'Admin HQ'),
          BottomNavItem(icon: Icons.format_list_bulleted, label: 'Issue Queue'),
          BottomNavItem(icon: Icons.people_outline, label: 'Staff'),
          BottomNavItem(icon: Icons.account_balance_outlined, label: 'Projects'),
          BottomNavItem(icon: Icons.warning_amber_rounded, label: 'Emergency'),
        ];
        break;

      // ────────────────────────────────────────────────────


      // ────────────────────────────────────────────────────
      // 6. PANCHAYAT EMPLOYEE — distinct root: EmployeeDashboard
      // ────────────────────────────────────────────────────
      case UserRole.panchayatEmployee:
        pages = const [
          EmployeeDashboard(),
          AssignedWorkListScreen(),
          AttendanceStatusScreen(),
          NotificationsListScreen(),
        ];
        navItems = [
          BottomNavItem(icon: Icons.task_outlined, label: _loc.tr('worker_tab', fallback: 'My Tasks')),
          BottomNavItem(icon: Icons.list_alt_outlined, label: 'Work Queue'),
          BottomNavItem(icon: Icons.how_to_reg_outlined, label: 'Attendance'),
          BottomNavItem(icon: Icons.notifications_none_outlined, label: _loc.tr('alerts_tab', fallback: 'Alerts')),
        ];
        break;

      // ────────────────────────────────────────────────────
      // 7. CSR PARTNER — distinct root: OpportunityDiscoveryListScreen
      // ────────────────────────────────────────────────────
      case UserRole.csrSponsor:
        pages = const [
          OpportunityDiscoveryListScreen(),
          ActiveSponsorshipsScreen(),
          SponsoredProjectDetailScreen(),
          CSRNotificationsScreen(),
          CSRProfileScreen(),
        ];
        navItems = [
          BottomNavItem(icon: Icons.search, label: 'Discover'),
          BottomNavItem(icon: Icons.volunteer_activism_outlined, label: 'Sponsorships'),
          BottomNavItem(icon: Icons.account_balance_outlined, label: 'Projects'),
          BottomNavItem(icon: Icons.notifications_none_outlined, label: _loc.tr('alerts_tab', fallback: 'Alerts')),
          BottomNavItem(icon: Icons.business_outlined, label: 'Profile'),
        ];
        break;
    }

    // Clamp index if role switch shrinks tab count
    if (_currentIndex >= pages.length) {
      _currentIndex = 0;
    }

    return Scaffold(
      drawer: _buildDrawer(context, role),
      body: Column(
        children: [
          // Offline banner
          if (!_offline.isOnline)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
              color: AppColors.statusPending,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(Icons.wifi_off, size: 16, color: Colors.white),
                  SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      'Offline — Changes sync automatically when online',
                      style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                      maxLines: 1,
                    ),
                  ),
                ],
              ),
            ),
          Expanded(
            child: IndexedStack(
              index: _currentIndex,
              children: pages,
            ),
          ),
        ],
      ),
      bottomNavigationBar: GramOneBottomNav(
        currentIndex: _currentIndex,
        onTap: (idx) => setState(() => _currentIndex = idx),
        items: navItems,
      ),
    );
  }

  Widget _buildDrawer(BuildContext context, UserRole role) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.primary, AppColors.primaryDark],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                const Text(
                  'GramOne',
                  style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'Role: ${role.name.toUpperCase()}',
                    style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Locale: ${_loc.currentLocale.toUpperCase()} · ${_loc.isRtl ? "RTL" : "LTR"}',
                  style: const TextStyle(color: Colors.white70, fontSize: 11),
                ),
              ],
            ),
          ),
          ListTile(
            leading: const Icon(Icons.swap_horiz, color: AppColors.primary),
            title: const Text('Switch Role (Diagnostic)'),
            onTap: () {
              Navigator.pop(context);
              _showRoleSwitchDialog(context);
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.language),
            title: const Text('Change Language'),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/change_language');
            },
          ),
          ListTile(
            leading: const Icon(Icons.settings_outlined),
            title: const Text('App Settings'),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/app_settings');
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: AppColors.statusRejected),
            title: const Text(
              'Sign Out',
              style: TextStyle(color: AppColors.statusRejected, fontWeight: FontWeight.w600),
            ),
            onTap: () {
              Navigator.pop(context);
              _auth.logout();
              Navigator.pushNamedAndRemoveUntil(context, '/sign_in', (route) => false);
            },
          ),
        ],
      ),
    );
  }

  void _showRoleSwitchDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: const Text('Switch Active Role (Audit)'),
        children: UserRole.values.map((r) {
          return SimpleDialogOption(
            onPressed: () {
              _auth.setRole(r);
              setState(() => _currentIndex = 0);
              Navigator.pop(ctx);
            },
            child: Text(r.name),
          );
        }).toList(),
      ),
    );
  }
}
