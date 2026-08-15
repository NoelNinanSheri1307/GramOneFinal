import 'package:flutter/material.dart';
import '../../components/badges.dart';
import '../../components/buttons.dart';
import '../../components/cards.dart';
import '../../components/input_fields.dart';
import '../../components/navigation_components.dart';
import '../../components/states_and_tiles.dart';
import '../../mock/mock_data.dart';
import '../../models/models.dart';
import '../../theme/app_colors.dart';

class CitizenHomeDashboard extends StatelessWidget {
  const CitizenHomeDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'GramOne Citizen',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
              ),
            ),
            const Text('Kaveri Gram Panchayat', style: TextStyle(fontSize: 12, color: AppColors.primary)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none_outlined),
            onPressed: () => Navigator.pushNamed(context, '/notifications_list'),
          ),
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: () => Navigator.pushNamed(context, '/profile_screen'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primary, AppColors.primaryDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Report a Civic Issue',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'AI detects urgency & assigns nearest field technician.',
                    style: TextStyle(fontSize: 13, color: AppColors.primaryContainer),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () => Navigator.pushNamed(context, '/report_step1'),
                    icon: const Icon(Icons.add_a_photo_outlined, size: 18),
                    label: const Text('New Report'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.primaryDark,
                      minimumSize: const Size(140, 42),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: const [
                Expanded(
                  child: MetricStatCard(
                    title: 'My Reports',
                    value: '4',
                    subtitle: '2 Resolved',
                    icon: Icons.assignment_outlined,
                  ),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: MetricStatCard(
                    title: 'Village Projects',
                    value: '8',
                    subtitle: '3 Active CSR',
                    icon: Icons.account_balance_outlined,
                    color: AppColors.secondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Recent Panchayat Issues', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                TextButton(
                  onPressed: () => Navigator.pushNamed(context, '/my_issues_list'),
                  child: const Text('View All'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ...MockData.issues.take(2).map(
                  (iss) => IssueCard(
                    issue: iss,
                    onTap: () => Navigator.pushNamed(context, '/issue_detail', arguments: iss),
                  ),
                ),
          ],
        ),
      ),
    );
  }
}

class ReportStep1Description extends StatefulWidget {
  const ReportStep1Description({super.key});

  @override
  State<ReportStep1Description> createState() => _ReportStep1DescriptionState();
}

class _ReportStep1DescriptionState extends State<ReportStep1Description> {
  String _selectedCat = 'Water Supply';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Report Issue — Step 1 of 3'),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Describe the problem', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              const Text('Provide details about location and what needs repair.', style: TextStyle(color: AppColors.textSecondaryLight)),
              const SizedBox(height: 20),
              DropdownButtonFormField<String>(
                initialValue: _selectedCat,
                decoration: const InputDecoration(labelText: 'Category'),
                items: ['Water Supply', 'Sanitation', 'Roads & Infrastructure', 'Electricity', 'Environment']
                    .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                    .toList(),
                onChanged: (v) => setState(() => _selectedCat = v!),
              ),
              const SizedBox(height: 16),
              const CustomTextField(
                label: 'Issue Title',
                hint: 'e.g. Water pipe leakage near community well',
              ),
              const SizedBox(height: 16),
              const CustomTextField(
                label: 'Detailed Description',
                hint: 'Describe severity, landmark, and duration...',
                maxLines: 4,
              ),
              const Spacer(),
              PrimaryButton(
                label: 'Next: Attach Photo',
                onPressed: () => Navigator.pushNamed(context, '/report_step2'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ReportStep2Photo extends StatelessWidget {
  const ReportStep2Photo({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Report Issue — Step 2 of 3'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Upload evidence photo', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            const Text('Photos help AI classify severity and speed up dispatch.', style: TextStyle(color: AppColors.textSecondaryLight)),
            const SizedBox(height: 24),
            Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.primary, width: 2, style: BorderStyle.solid),
                borderRadius: BorderRadius.circular(12),
                color: AppColors.primaryContainer.withValues(alpha: 0.3),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(Icons.camera_alt_outlined, size: 48, color: AppColors.primary),
                  SizedBox(height: 10),
                  Text('Tap to take photo or upload from gallery', style: TextStyle(fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: const [
                Icon(Icons.location_on, size: 18, color: AppColors.primary),
                SizedBox(width: 6),
                Text('GPS Tag: Ward 3,Kavery Gram (11.0168° N, 76.9558° E)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
              ],
            ),
            const Spacer(),
            PrimaryButton(
              label: 'Run AI Diagnostics',
              onPressed: () => Navigator.pushNamed(context, '/report_step3'),
            ),
          ],
        ),
      ),
    );
  }
}

class ReportStep3AiReview extends StatelessWidget {
  const ReportStep3AiReview({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'AI Analysis Review'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primaryContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: const [
                  Icon(Icons.smart_toy_outlined, color: AppColors.primary, size: 32),
                  SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      'GramAI detected High Severity Water Pipeline Leakage with 94% confidence.',
                      style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.primaryDark),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text('Suggested Priority:', style: TextStyle(fontSize: 14, color: AppColors.textSecondaryLight)),
            const SizedBox(height: 4),
            const Text('High Priority — Fast Track Dispatch', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.statusPending)),
            const SizedBox(height: 20),
            const Text('Auto-Assigned Department:', style: TextStyle(fontSize: 14, color: AppColors.textSecondaryLight)),
            const SizedBox(height: 4),
            const Text('Panchayat Public Works & Water Supply', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const Spacer(),
            PrimaryButton(
              label: 'Submit Report',
              onPressed: () => Navigator.pushNamed(context, '/report_step4'),
            ),
          ],
        ),
      ),
    );
  }
}

class ReportStep4Confirmation extends StatelessWidget {
  const ReportStep4Confirmation({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SuccessStateWidget(
        title: 'Report Submitted!',
        description: 'Ticket #ISS-2026-090 has been created. Track updates on your dashboard timeline.',
        onAction: () => Navigator.pushNamedAndRemoveUntil(context, '/main_tab_wrapper', (route) => false),
      ),
    );
  }
}

class MyIssuesList extends StatelessWidget {
  const MyIssuesList({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'My Reported Issues'),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: MockData.issues.length,
        itemBuilder: (context, idx) {
          final issue = MockData.issues[idx];
          return IssueCard(
            issue: issue,
            onTap: () => Navigator.pushNamed(context, '/issue_detail', arguments: issue),
          );
        },
      ),
    );
  }
}

class IssueDetailScreen extends StatelessWidget {
  const IssueDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final issue = (ModalRoute.of(context)?.settings.arguments as IssueItem?) ?? MockData.issues[0];
    return Scaffold(
      appBar: GramOneAppBar(title: issue.id),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                CategoryBadge(category: issue.category),
                StatusBadge(status: issue.status),
              ],
            ),
            const SizedBox(height: 12),
            Text(issue.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(issue.description, style: const TextStyle(fontSize: 14, color: AppColors.textSecondaryLight)),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () => Navigator.pushNamed(context, '/issue_timeline', arguments: issue),
              icon: const Icon(Icons.timeline),
              label: const Text('View Timeline & History'),
            ),
            const SizedBox(height: 12),
            SecondaryButton(
              label: 'Add Evidence Photo',
              icon: Icons.add_a_photo,
              onPressed: () => Navigator.pushNamed(context, '/add_evidence'),
            ),
            const SizedBox(height: 12),
            SecondaryButton(
              label: 'View Evidence Gallery',
              icon: Icons.photo_library,
              onPressed: () => Navigator.pushNamed(context, '/evidence_gallery'),
            ),
            const SizedBox(height: 12),
            if (issue.status == IssueStatus.resolved)
              PrimaryButton(
                label: 'Give Feedback on Resolution',
                onPressed: () => Navigator.pushNamed(context, '/issue_feedback'),
              ),
          ],
        ),
      ),
    );
  }
}

class IssueTimelineScreen extends StatelessWidget {
  const IssueTimelineScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Issue Timeline'),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: const [
          TimelineStepWidget(title: 'Report submitted by Ramesh Kumar', date: 'Today, 10:30 AM', isCompleted: true),
          TimelineStepWidget(title: 'AI Severity set to High', date: 'Today, 10:31 AM', isCompleted: true),
          TimelineStepWidget(title: 'Panchayat Admin assigned Technician Suresh Patil', date: 'Today, 11:15 AM', isCompleted: true),
          TimelineStepWidget(title: 'Technician on-site inspection', date: 'In Progress', isCompleted: false),
          TimelineStepWidget(title: 'Final Resolution Verification', date: 'Pending', isCompleted: false, isLast: true),
        ],
      ),
    );
  }
}

class AddEvidenceScreen extends StatelessWidget {
  const AddEvidenceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Add Supplemental Evidence'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const CustomTextField(label: 'Note / Observation', hint: 'Describe changes since initial report...', maxLines: 3),
            const SizedBox(height: 20),
            Container(
              height: 160,
              width: double.infinity,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.borderLight),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Center(
                child: Icon(Icons.add_photo_alternate_outlined, size: 48, color: AppColors.primary),
              ),
            ),
            const Spacer(),
            PrimaryButton(
              label: 'Submit Evidence',
              onPressed: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }
}

class EvidenceGalleryScreen extends StatelessWidget {
  const EvidenceGalleryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Evidence Gallery'),
      body: GridView.count(
        padding: const EdgeInsets.all(16),
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        children: List.generate(
          4,
          (i) => Container(
            decoration: BoxDecoration(
              color: AppColors.primaryContainer,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Icon(Icons.image, size: 48, color: AppColors.primary),
            ),
          ),
        ),
      ),
    );
  }
}

class IssueResolvedFeedbackScreen extends StatelessWidget {
  const IssueResolvedFeedbackScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Resolution Feedback'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Rate Resolution Quality', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                5,
                (i) => const Icon(Icons.star, color: Colors.amber, size: 36),
              ),
            ),
            const SizedBox(height: 24),
            const CustomTextField(label: 'Comments (Optional)', hint: 'Great job by the field worker...', maxLines: 4),
            const Spacer(),
            PrimaryButton(
              label: 'Submit Feedback',
              onPressed: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }
}
