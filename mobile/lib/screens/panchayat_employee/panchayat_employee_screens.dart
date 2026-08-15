import 'package:flutter/material.dart';
import '../../components/buttons.dart';
import '../../components/cards.dart';
import '../../components/input_fields.dart';
import '../../components/navigation_components.dart';
import '../../mock/mock_data.dart';
import '../../models/models.dart';
import '../../theme/app_colors.dart';
import '../../extensions/localization_extensions.dart';

class EmployeeDashboard extends StatelessWidget {
  const EmployeeDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('field_worker_portal', fallback: 'Field Worker Portal')),
        actions: [
          IconButton(
            icon: const Icon(Icons.how_to_reg_outlined),
            onPressed: () => Navigator.pushNamed(context, '/employee_attendance'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primaryContainer.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const CircleAvatar(
                    backgroundColor: AppColors.primary, 
                    child: Icon(Icons.engineering, color: Colors.white)
                  ),
                  const SizedBox(width: 14),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Suresh Patil', 
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryDark)
                      ),
                      Text(
                        'Senior Field Tech • On Field', 
                        style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: MetricStatCard(
                    title: context.tr('assigned_work', fallback: 'Assigned Work'),
                    value: '3 ${context.tr('tasks', fallback: 'Tasks')}',
                    subtitle: '1 ${context.tr('high_priority', fallback: 'High Priority')}',
                    icon: Icons.assignment_outlined,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: MetricStatCard(
                    title: context.tr('completed_tasks', fallback: 'Completed'),
                    value: '42 ${context.tr('tasks', fallback: 'Tasks')}',
                    subtitle: context.tr('this_month', fallback: 'This Month'),
                    icon: Icons.check_circle_outline,
                    color: AppColors.statusResolved,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  context.tr('my_field_assignments', fallback: 'My Field Assignments'), 
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)
                ),
                TextButton(
                  onPressed: () => Navigator.pushNamed(context, '/assigned_work_list'),
                  child: Text(context.tr('view_all', fallback: 'View All')),
                ),
              ],
            ),
            ...MockData.issues.take(2).map(
                  (iss) => IssueCard(
                    issue: iss,
                    onTap: () => Navigator.pushNamed(context, '/work_detail', arguments: iss),
                  ),
                ),
          ],
        ),
      ),
    );
  }
}

class AssignedWorkListScreen extends StatelessWidget {
  const AssignedWorkListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: GramOneAppBar(title: context.tr('assigned_field_work', fallback: 'Assigned Field Work')),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: MockData.issues.length,
        itemBuilder: (context, idx) {
          final issue = MockData.issues[idx];
          return IssueCard(
            issue: issue,
            onTap: () => Navigator.pushNamed(context, '/work_detail', arguments: issue),
          );
        },
      ),
    );
  }
}

class WorkDetailScreen extends StatelessWidget {
  const WorkDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final issue = (ModalRoute.of(context)?.settings.arguments as IssueItem?) ?? MockData.issues[0];
    return Scaffold(
      appBar: GramOneAppBar(title: issue.id),
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
                const Icon(Icons.location_on, color: AppColors.primary),
                const SizedBox(width: 6),
                Text(issue.location, style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            const Spacer(),
            PrimaryButton(
              label: context.tr('accept_work', fallback: 'Accept Work Assignment'),
              onPressed: () => Navigator.pushNamed(context, '/accept_work', arguments: issue),
            ),
            const SizedBox(height: 12),
            SecondaryButton(
              label: context.tr('fill_inspection', fallback: 'Fill Inspection Form'),
              onPressed: () => Navigator.pushNamed(context, '/field_inspection'),
            ),
          ],
        ),
      ),
    );
  }
}

class AcceptWorkScreen extends StatelessWidget {
  const AcceptWorkScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: GramOneAppBar(title: context.tr('accept_work', fallback: 'Accept Work')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const Icon(Icons.assignment_turned_in_outlined, size: 64, color: AppColors.primary),
            const SizedBox(height: 16),
            Text(
              context.tr('confirm_dispatch', fallback: 'Confirm Dispatch Acceptance'), 
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)
            ),
            const SizedBox(height: 8),
            Text(
              context.tr('confirm_dispatch_desc', fallback: 'Accepting will notify citizen and Panchayat admin that you are en route.'), 
              textAlign: TextAlign.center
            ),
            const Spacer(),
            PrimaryButton(
              label: context.tr('confirm_start_nav', fallback: 'Confirm & Start Navigation'),
              onPressed: () => Navigator.pushNamed(context, '/upload_before_photo'),
            ),
          ],
        ),
      ),
    );
  }
}

class FieldInspectionFormScreen extends StatelessWidget {
  const FieldInspectionFormScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: GramOneAppBar(title: context.tr('field_inspection_title', fallback: 'Field Inspection Form')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            CustomTextField(
              label: context.tr('technical_cause', fallback: 'Technical Cause Identified'), 
              hint: 'Pipe joint fracture due to pressure surge...'
            ),
            const SizedBox(height: 14),
            CustomTextField(
              label: context.tr('repair_time', fallback: 'Estimated Repair Time (Hours)'), 
              hint: '2.5', 
              keyboardType: TextInputType.number
            ),
            const SizedBox(height: 14),
            CustomTextField(
              label: context.tr('materials_required', fallback: 'Materials Required'), 
              hint: '2-inch PVC coupling, sealant...'
            ),
            const Spacer(),
            PrimaryButton(
              label: context.tr('save_inspection', fallback: 'Save Inspection Notes'),
              onPressed: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }
}

class UploadBeforePhotoScreen extends StatelessWidget {
  const UploadBeforePhotoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: GramOneAppBar(title: context.tr('upload_before_photo', fallback: 'Upload Before Repair Photo')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Container(
              height: 200,
              width: double.infinity,
              color: AppColors.primaryContainer,
              child: const Center(child: Icon(Icons.camera_alt, size: 48, color: AppColors.primary)),
            ),
            const Spacer(),
            PrimaryButton(
              label: context.tr('proceed_completion', fallback: 'Proceed to Work Completion'),
              onPressed: () => Navigator.pushNamed(context, '/upload_after_photo'),
            ),
          ],
        ),
      ),
    );
  }
}

class UploadAfterPhotoScreen extends StatelessWidget {
  const UploadAfterPhotoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: GramOneAppBar(title: context.tr('upload_after_photo', fallback: 'Upload After Repair Photo')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Container(
              height: 200,
              width: double.infinity,
              color: AppColors.secondaryContainer,
              child: const Center(child: Icon(Icons.camera_alt, size: 48, color: AppColors.secondary)),
            ),
            const Spacer(),
            PrimaryButton(
              label: context.tr('submit_completion', fallback: 'Submit Work Completion'),
              onPressed: () => Navigator.pushNamed(context, '/complete_work_confirmation'),
            ),
          ],
        ),
      ),
    );
  }
}

class CompleteWorkConfirmationScreen extends StatelessWidget {
  const CompleteWorkConfirmationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.check_circle_outline, size: 72, color: AppColors.statusResolved),
            const SizedBox(height: 20),
            Text(
              context.tr('work_completed', fallback: 'Work Completed!'), 
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)
            ),
            const SizedBox(height: 10),
            Text(
              context.tr('work_completed_desc', fallback: 'Panchayat Admin has been requested for final verification.'), 
              textAlign: TextAlign.center
            ),
            const SizedBox(height: 32),
            PrimaryButton(
              label: context.tr('back_to_worker_dashboard', fallback: 'Back to Worker Dashboard'),
              onPressed: () => Navigator.pushNamedAndRemoveUntil(context, '/main_tab_wrapper', (route) => false),
            ),
          ],
        ),
      ),
    );
  }
}

class AttendanceStatusScreen extends StatelessWidget {
  const AttendanceStatusScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: GramOneAppBar(title: context.tr('daily_attendance', fallback: 'Daily Attendance Status')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Card(
              child: ListTile(
                leading: const Icon(Icons.how_to_reg, color: AppColors.statusResolved),
                title: Text(context.tr('checked_in_field', fallback: 'Status: Checked In — On Field')),
                subtitle: Text(context.tr('attendance_time', fallback: 'Time: 08:30 AM • GPS Location Verified')),
              ),
            ),
            const Spacer(),
            SecondaryButton(
              label: context.tr('check_out_today', fallback: 'Check Out for Today'),
              onPressed: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }
}
