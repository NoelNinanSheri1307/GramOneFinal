enum IssueStatus { pending, inProgress, resolved, rejected, critical }
enum UserRole { citizen, panchayatAdmin, panchayatEmployee, csrSponsor }

class UserProfile {
  final String id;
  final String name;
  final String email;
  final String phone;
  final UserRole role;
  final String panchayat;
  final String district;
  final String state;
  final String avatarUrl;

  const UserProfile({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    required this.panchayat,
    required this.district,
    required this.state,
    required this.avatarUrl,
  });
}

class IssueItem {
  final String id;
  final String title;
  final String category;
  final String description;
  final String location;
  final String reportedBy;
  final DateTime reportedDate;
  final IssueStatus status;
  final String? assignedEmployee;
  final String? beforePhotoUrl;
  final String? afterPhotoUrl;
  final List<String> timelineSteps;
  final List<String> evidencePhotos;
  final String aiSeverity;

  const IssueItem({
    required this.id,
    required this.title,
    required this.category,
    required this.description,
    required this.location,
    required this.reportedBy,
    required this.reportedDate,
    required this.status,
    this.assignedEmployee,
    this.beforePhotoUrl,
    this.afterPhotoUrl,
    required this.timelineSteps,
    required this.evidencePhotos,
    required this.aiSeverity,
  });
}

class ImpactCase {
  final String id;
  final String title;
  final String category;
  final String description;
  final String location;
  final double budgetRequired;
  final double budgetRaised;
  final int beneficiariesCount;
  final String status;
  final String bannerUrl;

  const ImpactCase({
    required this.id,
    required this.title,
    required this.category,
    required this.description,
    required this.location,
    required this.budgetRequired,
    required this.budgetRaised,
    required this.beneficiariesCount,
    required this.status,
    required this.bannerUrl,
  });
}

class ProjectItem {
  final String id;
  final String title;
  final String sector;
  final String panchayat;
  final double totalBudget;
  final double fundedAmount;
  final double progressPercentage;
  final String status;
  final DateTime startDate;
  final DateTime targetCompletionDate;

  const ProjectItem({
    required this.id,
    required this.title,
    required this.sector,
    required this.panchayat,
    required this.totalBudget,
    required this.fundedAmount,
    required this.progressPercentage,
    required this.status,
    required this.startDate,
    required this.targetCompletionDate,
  });
}

class EmployeeItem {
  final String id;
  final String name;
  final String role;
  final String phone;
  final int activeTasksCount;
  final int completedTasksCount;
  final String attendanceStatus; // Present, On Field, Absent
  final String avatarUrl;

  const EmployeeItem({
    required this.id,
    required this.name,
    required this.role,
    required this.phone,
    required this.activeTasksCount,
    required this.completedTasksCount,
    required this.attendanceStatus,
    required this.avatarUrl,
  });
}

class NotificationItem {
  final String id;
  final String title;
  final String body;
  final DateTime timestamp;
  final bool isRead;
  final String category;

  const NotificationItem({
    required this.id,
    required this.title,
    required this.body,
    required this.timestamp,
    required this.isRead,
    required this.category,
  });
}

class TelemetryDevice {
  final String id;
  final String name;
  final String type; // Water, Waste, Air, Gas, Emergency
  final String location;
  final String batteryLevel;
  final String status; // Normal, Alert, Offline
  final String currentValue;
  final String unit;
  final DateTime lastUpdated;

  const TelemetryDevice({
    required this.id,
    required this.name,
    required this.type,
    required this.location,
    required this.batteryLevel,
    required this.status,
    required this.currentValue,
    required this.unit,
    required this.lastUpdated,
  });
}

class SponsorshipItem {
  final String id;
  final String projectTitle;
  final String sponsorName;
  final double amountCommitted;
  final double amountDisbursed;
  final String status;
  final DateTime date;

  const SponsorshipItem({
    required this.id,
    required this.projectTitle,
    required this.sponsorName,
    required this.amountCommitted,
    required this.amountDisbursed,
    required this.status,
    required this.date,
  });
}
