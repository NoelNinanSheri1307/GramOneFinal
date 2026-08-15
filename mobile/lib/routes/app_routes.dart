import 'package:flutter/material.dart';
import '../models/models.dart';
import '../routes/auth_guard.dart';

import '../screens/foundation/foundation_screens.dart';
import '../screens/auth/auth_screens.dart';
import '../screens/citizen/citizen_screens.dart';
import '../screens/panchayat_admin/panchayat_admin_screens.dart';
import '../screens/panchayat_employee/panchayat_employee_screens.dart';
import '../screens/csr/csr_screens.dart';
import '../screens/hardware/hardware_screens.dart';
import '../screens/settings/settings_screens.dart';
import '../screens/security/unauthorized_screen.dart';
import '../screens/main_tab_wrapper.dart';


class AppRoutes {
  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String languageSelection = '/language_selection';
  static const String roleSelection = '/role_selection';

  static const String signIn = '/sign_in';
  static const String createAccount = '/create_account';
  static const String forgotPassword = '/forgot_password';
  static const String otpVerification = '/otp_verification';
  static const String resetSuccess = '/reset_success';
  static const String unauthorized = '/unauthorized';

  static const String mainTabWrapper = '/main_tab_wrapper';

  static const String citizenHome = '/citizen_home';
  static const String reportStep1 = '/report_step1';
  static const String reportStep2 = '/report_step2';
  static const String reportStep3 = '/report_step3';
  static const String reportStep4 = '/report_step4';
  static const String myIssuesList = '/my_issues_list';
  static const String issueDetail = '/issue_detail';
  static const String issueTimeline = '/issue_timeline';
  static const String addEvidence = '/add_evidence';
  static const String evidenceGallery = '/evidence_gallery';
  static const String issueFeedback = '/issue_feedback';

  static const String panchayatDashboard = '/panchayat_dashboard';
  static const String issueQueue = '/issue_queue';
  static const String issueReview = '/issue_review';
  static const String assignEmployee = '/assign_employee';
  static const String verifyFieldWork = '/verify_field_work';
  static const String impactCasesList = '/impact_cases_list';
  static const String createImpactCase = '/create_impact_case';
  static const String impactCaseDetail = '/impact_case_detail';
  static const String projectsList = '/projects_list';
  static const String projectDetail = '/project_detail';
  static const String sponsorshipManagement = '/sponsorship_management';
  static const String employeeManagement = '/employee_management';
  static const String attendanceOverview = '/attendance_overview';
  static const String hardwareMonitoring = '/hardware_monitoring';
  static const String emergencyAlerts = '/emergency_alerts';
  static const String analyticsOverview = '/analytics_overview';

  static const String employeeDashboard = '/employee_dashboard';
  static const String assignedWorkList = '/assigned_work_list';
  static const String workDetail = '/work_detail';
  static const String acceptWork = '/accept_work';
  static const String fieldInspection = '/field_inspection';
  static const String uploadBeforePhoto = '/upload_before_photo';
  static const String uploadAfterPhoto = '/upload_after_photo';
  static const String completeWorkConfirmation = '/complete_work_confirmation';
  static const String employeeAttendance = '/employee_attendance';

  static const String csrDashboard = '/csr_dashboard';
  static const String csrProfile = '/csr_profile';
  static const String opportunityDiscovery = '/opportunity_discovery';
  static const String opportunityDetail = '/opportunity_detail';
  static const String matchingRecommendations = '/matching_recommendations';
  static const String sponsorConfirmation = '/sponsor_confirmation';
  static const String activeSponsorships = '/active_sponsorships';
  static const String sponsoredProjectDetail = '/sponsored_project_detail';
  static const String impactTracking = '/impact_tracking';
  static const String csrNotifications = '/csr_notifications';

  static const String waterTankMonitor = '/water_tank_monitor';
  static const String wasteBinMonitor = '/waste_bin_monitor';
  static const String environmentalMonitor = '/environmental_monitor';
  static const String gasAnomalyAlert = '/gas_anomaly_alert';
  static const String emergencyButtonAlert = '/emergency_button_alert';
  static const String deviceDetail = '/device_detail';
  static const String deviceHealth = '/device_health';

  static const String notificationsList = '/notifications_list';
  static const String notificationDetail = '/notification_detail';
  static const String profileScreen = '/profile_screen';
  static const String editProfile = '/edit_profile';
  static const String changeLanguage = '/change_language';
  static const String accessibilitySettings = '/accessibility_settings';
  static const String appSettings = '/app_settings';
  static const String helpSupport = '/help_support';
  static const String aboutGramOne = '/about_gramone';

  static Map<String, WidgetBuilder> get routes => {
        splash: (context) => const SplashScreen(),
        onboarding: (context) => const OnboardingScreen(),
        languageSelection: (context) => const LanguageSelectionScreen(),
        roleSelection: (context) => const RoleSelectionScreen(),

        signIn: (context) => const SignInScreen(),
        createAccount: (context) => const CreateAccountScreen(),
        forgotPassword: (context) => const ForgotPasswordScreen(),
        otpVerification: (context) => const OtpVerificationScreen(),
        resetSuccess: (context) => const ResetPasswordSuccessScreen(),
        unauthorized: (context) => const UnauthorizedScreen(),

        mainTabWrapper: (context) => const MainTabWrapper(),

        // Citizen Routes
        citizenHome: (context) => const CitizenHomeDashboard(),
        reportStep1: (context) => const RoleGuard(
              allowedRoles: [UserRole.citizen, UserRole.panchayatAdmin],
              child: ReportStep1Description(),
            ),
        reportStep2: (context) => const RoleGuard(
              allowedRoles: [UserRole.citizen, UserRole.panchayatAdmin],
              child: ReportStep2Photo(),
            ),
        reportStep3: (context) => const RoleGuard(
              allowedRoles: [UserRole.citizen, UserRole.panchayatAdmin],
              child: ReportStep3AiReview(),
            ),
        reportStep4: (context) => const RoleGuard(
              allowedRoles: [UserRole.citizen, UserRole.panchayatAdmin],
              child: ReportStep4Confirmation(),
            ),
        myIssuesList: (context) => const MyIssuesList(),
        issueDetail: (context) => const IssueDetailScreen(),
        issueTimeline: (context) => const IssueTimelineScreen(),
        addEvidence: (context) => const AddEvidenceScreen(),
        evidenceGallery: (context) => const EvidenceGalleryScreen(),
        issueFeedback: (context) => const IssueResolvedFeedbackScreen(),

        // Panchayat Admin Routes (Strictly Restricted to UserRole.panchayatAdmin)
        panchayatDashboard: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatAdmin],
              child: PanchayatDashboard(),
            ),
        issueQueue: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatAdmin],
              child: IssueQueueScreen(),
            ),
        issueReview: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatAdmin],
              child: IssueReviewScreen(),
            ),
        assignEmployee: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatAdmin],
              child: AssignEmployeeScreen(),
            ),
        verifyFieldWork: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatAdmin],
              child: VerifyFieldWorkScreen(),
            ),
        impactCasesList: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatAdmin, UserRole.csrSponsor],
              child: ImpactCasesListScreen(),
            ),
        createImpactCase: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatAdmin],
              child: CreateImpactCaseScreen(),
            ),
        impactCaseDetail: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatAdmin, UserRole.csrSponsor],
              child: ImpactCaseDetailScreen(),
            ),
        projectsList: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatAdmin],
              child: ProjectsListScreen(),
            ),
        projectDetail: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatAdmin],
              child: ProjectDetailScreen(),
            ),
        sponsorshipManagement: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatAdmin],
              child: SponsorshipManagementScreen(),
            ),
        employeeManagement: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatAdmin],
              child: EmployeeManagementScreen(),
            ),
        attendanceOverview: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatAdmin],
              child: AttendanceOverviewScreen(),
            ),
        hardwareMonitoring: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatAdmin],
              child: HardwareMonitoringScreen(),
            ),
        emergencyAlerts: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatAdmin],
              child: EmergencyAlertsScreen(),
            ),
        analyticsOverview: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatAdmin],
              child: AnalyticsImpactScreen(),
            ),

        // Field Employee Routes
        employeeDashboard: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatEmployee, UserRole.panchayatAdmin],
              child: EmployeeDashboard(),
            ),
        assignedWorkList: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatEmployee, UserRole.panchayatAdmin],
              child: AssignedWorkListScreen(),
            ),
        workDetail: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatEmployee, UserRole.panchayatAdmin],
              child: WorkDetailScreen(),
            ),
        acceptWork: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatEmployee, UserRole.panchayatAdmin],
              child: AcceptWorkScreen(),
            ),
        fieldInspection: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatEmployee, UserRole.panchayatAdmin],
              child: FieldInspectionFormScreen(),
            ),
        uploadBeforePhoto: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatEmployee, UserRole.panchayatAdmin],
              child: UploadBeforePhotoScreen(),
            ),
        uploadAfterPhoto: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatEmployee, UserRole.panchayatAdmin],
              child: UploadAfterPhotoScreen(),
            ),
        completeWorkConfirmation: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatEmployee, UserRole.panchayatAdmin],
              child: CompleteWorkConfirmationScreen(),
            ),
        employeeAttendance: (context) => const RoleGuard(
              allowedRoles: [UserRole.panchayatEmployee, UserRole.panchayatAdmin],
              child: AttendanceStatusScreen(),
            ),

        // CSR Partner Routes
        csrDashboard: (context) => const RoleGuard(
              allowedRoles: [UserRole.csrSponsor, UserRole.panchayatAdmin],
              child: CSRDashboard(),
            ),
        csrProfile: (context) => const RoleGuard(
              allowedRoles: [UserRole.csrSponsor, UserRole.panchayatAdmin],
              child: CSRProfileScreen(),
            ),
        opportunityDiscovery: (context) => const RoleGuard(
              allowedRoles: [UserRole.csrSponsor, UserRole.panchayatAdmin],
              child: OpportunityDiscoveryListScreen(),
            ),
        opportunityDetail: (context) => const RoleGuard(
              allowedRoles: [UserRole.csrSponsor, UserRole.panchayatAdmin],
              child: OpportunityDetailScreen(),
            ),
        matchingRecommendations: (context) => const RoleGuard(
              allowedRoles: [UserRole.csrSponsor, UserRole.panchayatAdmin],
              child: MatchingRecommendationsScreen(),
            ),
        sponsorConfirmation: (context) => const RoleGuard(
              allowedRoles: [UserRole.csrSponsor, UserRole.panchayatAdmin],
              child: SponsorProjectConfirmationScreen(),
            ),
        activeSponsorships: (context) => const RoleGuard(
              allowedRoles: [UserRole.csrSponsor, UserRole.panchayatAdmin],
              child: ActiveSponsorshipsScreen(),
            ),
        sponsoredProjectDetail: (context) => const RoleGuard(
              allowedRoles: [UserRole.csrSponsor, UserRole.panchayatAdmin],
              child: SponsoredProjectDetailScreen(),
            ),
        impactTracking: (context) => const RoleGuard(
              allowedRoles: [UserRole.csrSponsor, UserRole.panchayatAdmin],
              child: ImpactTrackingScreen(),
            ),
        csrNotifications: (context) => const RoleGuard(
              allowedRoles: [UserRole.csrSponsor, UserRole.panchayatAdmin],
              child: CSRNotificationsScreen(),
            ),

        // Hardware Monitoring Routes
        waterTankMonitor: (context) => const WaterTankMonitorScreen(),
        wasteBinMonitor: (context) => const WasteBinMonitorScreen(),
        environmentalMonitor: (context) => const EnvironmentalMonitorScreen(),
        gasAnomalyAlert: (context) => const GasAnomalyAlertScreen(),
        emergencyButtonAlert: (context) => const EmergencyButtonAlertScreen(),
        deviceDetail: (context) => const DeviceDetailScreen(),
        deviceHealth: (context) => const DeviceHealthStatusScreen(),

        // Settings & Profile Routes
        notificationsList: (context) => const NotificationsListScreen(),
        notificationDetail: (context) => const NotificationDetailScreen(),
        profileScreen: (context) => const ProfileScreen(),
        editProfile: (context) => const EditProfileScreen(),
        changeLanguage: (context) => const ChangeLanguageScreen(),
        accessibilitySettings: (context) => const AccessibilitySettingsScreen(),
        appSettings: (context) => const AppSettingsScreen(),
        helpSupport: (context) => const HelpSupportScreen(),
        aboutGramOne: (context) => const AboutGramOneScreen(),

      };
}
