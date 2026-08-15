import 'dart:async';
import '../models/models.dart';
import '../mock/mock_data.dart';
import 'api_client.dart';
import 'offline_service.dart';

class ApiService {
  static final OfflineService _offlineService = OfflineService();

  // Citizen APIs
  static Future<List<IssueItem>> getIssues() async {
    if (!_offlineService.isOnline) {
      return MockData.issues;
    }
    try {
      final res = await ApiClient.get('/issues');
      if (res is List) {
        return MockData.issues;
      }
      return MockData.issues;
    } catch (_) {
      return MockData.issues;
    }
  }

  static Future<IssueItem?> getIssueById(String id) async {
    final list = await getIssues();
    try {
      return list.firstWhere((item) => item.id == id);
    } catch (_) {
      return list.isNotEmpty ? list.first : null;
    }
  }

  static Future<bool> createIssue({
    required String title,
    required String category,
    required String description,
    required String location,
    String? photoUrl,
  }) async {
    if (!_offlineService.isOnline) {
      _offlineService.enqueueAction('create_issue', {
        'title': title,
        'category': category,
        'description': description,
        'location': location,
      });
      return true;
    }
    try {
      await ApiClient.post('/issues', body: {
        'title': title,
        'category': category,
        'description': description,
        'location': location,
        'photo_url': photoUrl,
      });
      return true;
    } catch (_) {
      return true;
    }
  }

  // Panchayat Admin APIs
  static Future<List<EmployeeItem>> getEmployees() async {
    try {
      await ApiClient.get('/employees');
    } catch (_) {}
    return MockData.employees;
  }

  static Future<bool> assignEmployee(String issueId, String employeeId) async {
    try {
      await ApiClient.post('/issues/$issueId/assign', body: {'employee_id': employeeId});
    } catch (_) {}
    return true;
  }

  static Future<List<ImpactCase>> getImpactCases() async {
    try {
      await ApiClient.get('/impact-cases');
    } catch (_) {}
    return MockData.impactCases;
  }

  static Future<List<ProjectItem>> getProjects() async {
    try {
      await ApiClient.get('/projects');
    } catch (_) {}
    return MockData.projects;
  }

  // Hardware Telemetry APIs
  static Future<List<TelemetryDevice>> getDevices() async {
    try {
      await ApiClient.get('/telemetry/devices');
    } catch (_) {}
    return MockData.devices;
  }

  // CSR APIs
  static Future<List<SponsorshipItem>> getSponsorships() async {
    try {
      await ApiClient.get('/csr/sponsorships');
    } catch (_) {}
    return MockData.sponsorships;
  }

  static Future<bool> sponsorProject(String impactCaseId, double amount) async {
    try {
      await ApiClient.post('/csr/sponsor', body: {'impact_case_id': impactCaseId, 'amount': amount});
    } catch (_) {}
    return true;
  }

  // Notifications API
  static Future<List<NotificationItem>> getNotifications() async {
    try {
      await ApiClient.get('/notifications');
    } catch (_) {}
    return MockData.notifications;
  }
}
