import 'package:flutter/material.dart';
import '../../components/buttons.dart';
import '../../components/cards.dart';
import '../../components/input_fields.dart';
import '../../components/navigation_components.dart';
import '../../mock/mock_data.dart';
import '../../models/models.dart';
import '../../theme/app_colors.dart';

class PanchayatDashboard extends StatelessWidget {
  const PanchayatDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Panchayat Admin Console'),
        actions: [
          IconButton(
            icon: const Icon(Icons.analytics_outlined),
            onPressed: () => Navigator.pushNamed(context, '/analytics_overview'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: const [
                Expanded(
                  child: MetricStatCard(
                    title: 'Pending Queue',
                    value: '14',
                    subtitle: '3 Critical AI Alerts',
                    icon: Icons.pending_actions,
                    color: AppColors.statusPending,
                  ),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: MetricStatCard(
                    title: 'Active Workers',
                    value: '12 / 14',
                    subtitle: '86% Attendance',
                    icon: Icons.badge_outlined,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: const [
                Expanded(
                  child: MetricStatCard(
                    title: 'CSR Projects',
                    value: '₹8.5L',
                    subtitle: '2 Open Sponsorships',
                    icon: Icons.volunteer_activism_outlined,
                    color: AppColors.secondary,
                  ),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: MetricStatCard(
                    title: 'IoT Devices',
                    value: '5 Sensors',
                    subtitle: '1 Gas Anomaly Alert',
                    icon: Icons.sensors,
                    color: AppColors.statusCritical,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            const Text('Administrative Controls', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildActionChip(context, 'Issue Queue', Icons.list_alt, '/issue_queue'),
                _buildActionChip(context, 'Impact Cases', Icons.volunteer_activism, '/impact_cases_list'),
                _buildActionChip(context, 'Projects', Icons.account_balance, '/projects_list'),
                _buildActionChip(context, 'Employees', Icons.people_outline, '/employee_management'),
                _buildActionChip(context, 'Attendance', Icons.how_to_reg_outlined, '/attendance_overview'),
                _buildActionChip(context, 'IoT Hardware', Icons.sensors, '/hardware_monitoring'),
                _buildActionChip(context, 'Emergency SOS', Icons.warning_amber, '/emergency_alerts'),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Urgent Issues Queue', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                TextButton(
                  onPressed: () => Navigator.pushNamed(context, '/issue_queue'),
                  child: const Text('See Queue'),
                ),
              ],
            ),
            ...MockData.issues.map(
              (iss) => IssueCard(
                issue: iss,
                onTap: () => Navigator.pushNamed(context, '/issue_review', arguments: iss),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionChip(BuildContext context, String label, IconData icon, String route) {
    return ActionChip(
      avatar: Icon(icon, size: 18, color: AppColors.primary),
      label: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
      onPressed: () => Navigator.pushNamed(context, route),
    );
  }
}

class IssueQueueScreen extends StatelessWidget {
  const IssueQueueScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Panchayat Issue Queue'),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: MockData.issues.length,
        itemBuilder: (context, idx) {
          final issue = MockData.issues[idx];
          return IssueCard(
            issue: issue,
            onTap: () => Navigator.pushNamed(context, '/issue_review', arguments: issue),
          );
        },
      ),
    );
  }
}

class IssueReviewScreen extends StatelessWidget {
  const IssueReviewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final issue = (ModalRoute.of(context)?.settings.arguments as IssueItem?) ?? MockData.issues[0];
    return Scaffold(
      appBar: GramOneAppBar(title: 'Review ${issue.id}'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(issue.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(issue.description, style: const TextStyle(color: AppColors.textSecondaryLight)),
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(Icons.smart_toy_outlined, color: AppColors.primary),
                const SizedBox(width: 8),
                Text('AI Score: ${issue.aiSeverity}', style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            const Spacer(),
            PrimaryButton(
              label: 'Assign Employee',
              onPressed: () => Navigator.pushNamed(context, '/assign_employee', arguments: issue),
            ),
            const SizedBox(height: 12),
            SecondaryButton(
              label: 'Verify Completed Field Work',
              onPressed: () => Navigator.pushNamed(context, '/verify_field_work', arguments: issue),
            ),
          ],
        ),
      ),
    );
  }
}

class AssignEmployeeScreen extends StatelessWidget {
  const AssignEmployeeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Assign Field Technician'),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: MockData.employees.length,
        itemBuilder: (context, idx) {
          final emp = MockData.employees[idx];
          return EmployeeCard(
            employee: emp,
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Assigned task to ${emp.name}')),
              );
              Navigator.pop(context);
            },
          );
        },
      ),
    );
  }
}

class VerifyFieldWorkScreen extends StatelessWidget {
  const VerifyFieldWorkScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Verify Completed Work'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Before & After Photo Comparison', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Container(
                    height: 140,
                    color: AppColors.primaryContainer,
                    child: const Center(child: Text('Before Photo')),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    height: 140,
                    color: AppColors.secondaryContainer,
                    child: const Center(child: Text('After Photo')),
                  ),
                ),
              ],
            ),
            const Spacer(),
            PrimaryButton(
              label: 'Approve & Close Ticket',
              onPressed: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }
}

class ImpactCasesListScreen extends StatelessWidget {
  const ImpactCasesListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Panchayat Impact Cases'),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        onPressed: () => Navigator.pushNamed(context, '/create_impact_case'),
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: MockData.impactCases.length,
        itemBuilder: (context, idx) {
          final caseItem = MockData.impactCases[idx];
          return ImpactCaseCard(
            impactCase: caseItem,
            onTap: () => Navigator.pushNamed(context, '/impact_case_detail', arguments: caseItem),
          );
        },
      ),
    );
  }
}

class CreateImpactCaseScreen extends StatelessWidget {
  const CreateImpactCaseScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Create Impact Case'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const CustomTextField(label: 'Impact Title', hint: 'e.g. Solar Drinking Water Station'),
            const SizedBox(height: 14),
            const CustomTextField(label: 'Required Budget (INR)', hint: '450000', keyboardType: TextInputType.number),
            const SizedBox(height: 14),
            const CustomTextField(label: 'Beneficiaries Count', hint: '2400', keyboardType: TextInputType.number),
            const SizedBox(height: 14),
            const CustomTextField(label: 'Description', hint: 'Details for CSR sponsors...', maxLines: 4),
            const Spacer(),
            PrimaryButton(
              label: 'Publish Case for CSR Discovery',
              onPressed: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }
}

class ImpactCaseDetailScreen extends StatelessWidget {
  const ImpactCaseDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final caseItem = (ModalRoute.of(context)?.settings.arguments as ImpactCase?) ?? MockData.impactCases[0];
    return Scaffold(
      appBar: GramOneAppBar(title: caseItem.title),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(caseItem.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(caseItem.description, style: const TextStyle(color: AppColors.textSecondaryLight)),
            const SizedBox(height: 20),
            Text('Target Budget: ₹${caseItem.budgetRequired}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('Raised to Date: ₹${caseItem.budgetRaised}', style: const TextStyle(fontSize: 16, color: AppColors.primary)),
            const Spacer(),
            PrimaryButton(
              label: 'Manage Sponsorships',
              onPressed: () => Navigator.pushNamed(context, '/sponsorship_management'),
            ),
          ],
        ),
      ),
    );
  }
}

class ProjectsListScreen extends StatelessWidget {
  const ProjectsListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Village Infrastructure Projects'),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: MockData.projects.length,
        itemBuilder: (context, idx) {
          final prj = MockData.projects[idx];
          return ProjectCard(
            project: prj,
            onTap: () => Navigator.pushNamed(context, '/project_detail', arguments: prj),
          );
        },
      ),
    );
  }
}

class ProjectDetailScreen extends StatelessWidget {
  const ProjectDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final prj = (ModalRoute.of(context)?.settings.arguments as ProjectItem?) ?? MockData.projects[0];
    return Scaffold(
      appBar: GramOneAppBar(title: prj.title),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(prj.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Sector: ${prj.sector}', style: const TextStyle(color: AppColors.textSecondaryLight)),
            const SizedBox(height: 16),
            LinearProgressIndicator(value: prj.progressPercentage / 100),
            const SizedBox(height: 8),
            Text('${prj.progressPercentage}% Completed'),
          ],
        ),
      ),
    );
  }
}

class SponsorshipManagementScreen extends StatelessWidget {
  const SponsorshipManagementScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'CSR Sponsorship Management'),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: MockData.sponsorships.length,
        itemBuilder: (context, idx) {
          final item = MockData.sponsorships[idx];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              title: Text(item.sponsorName, style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('${item.projectTitle}\nCommitted: ₹${item.amountCommitted}'),
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: AppColors.primaryContainer, borderRadius: BorderRadius.circular(6)),
                child: Text(item.status, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
              ),
            ),
          );
        },
      ),
    );
  }
}

class EmployeeManagementScreen extends StatelessWidget {
  const EmployeeManagementScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Panchayat Employee Directory'),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: MockData.employees.length,
        itemBuilder: (context, idx) {
          final emp = MockData.employees[idx];
          return EmployeeCard(employee: emp, onTap: () {});
        },
      ),
    );
  }
}

class AttendanceOverviewScreen extends StatelessWidget {
  const AttendanceOverviewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Field Worker Attendance'),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: MockData.employees.length,
        itemBuilder: (context, idx) {
          final emp = MockData.employees[idx];
          return Card(
            child: ListTile(
              leading: const Icon(Icons.check_circle, color: AppColors.statusResolved),
              title: Text(emp.name),
              subtitle: Text('${emp.role} • ${emp.attendanceStatus}'),
            ),
          );
        },
      ),
    );
  }
}

class HardwareMonitoringScreen extends StatelessWidget {
  const HardwareMonitoringScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'IoT Telemetry Sensors'),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: MockData.devices.length,
        itemBuilder: (context, idx) {
          final dev = MockData.devices[idx];
          return HardwareAlertCard(
            device: dev,
            onTap: () => Navigator.pushNamed(context, '/device_detail', arguments: dev),
          );
        },
      ),
    );
  }
}

class EmergencyAlertsScreen extends StatelessWidget {
  const EmergencyAlertsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Emergency SOS & Gas Alerts'),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          HardwareAlertCard(
            device: MockData.devices[3], // Gas Anomaly
            onTap: () => Navigator.pushNamed(context, '/gas_anomaly_alert'),
          ),
          HardwareAlertCard(
            device: MockData.devices[4], // SOS Switch
            onTap: () => Navigator.pushNamed(context, '/emergency_button_alert'),
          ),
        ],
      ),
    );
  }
}

class AnalyticsImpactScreen extends StatelessWidget {
  const AnalyticsImpactScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Panchayat Impact Analytics'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: const [
            MetricStatCard(title: 'Total Resolution Rate', value: '92.4%', subtitle: '+4.2% vs last month', icon: Icons.trending_up),
            SizedBox(height: 12),
            MetricStatCard(title: 'Avg Resolution Speed', value: '18.5 Hours', subtitle: 'AI automated dispatch', icon: Icons.timer, color: AppColors.secondary),
          ],
        ),
      ),
    );
  }
}
