import 'package:flutter/material.dart';
import '../../components/buttons.dart';
import '../../components/cards.dart';
import '../../components/navigation_components.dart';
import '../../mock/mock_data.dart';
import '../../models/models.dart';
import '../../theme/app_colors.dart';

class CSRDashboard extends StatelessWidget {
  const CSRDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('CSR Partner Portal'),
        actions: [
          IconButton(
            icon: const Icon(Icons.business),
            onPressed: () => Navigator.pushNamed(context, '/csr_profile'),
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
                    title: 'Total Sponsored',
                    value: '₹4.8L',
                    subtitle: '2 Active Projects',
                    icon: Icons.volunteer_activism,
                    color: AppColors.primary,
                  ),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: MetricStatCard(
                    title: 'Lives Impacted',
                    value: '3,050',
                    subtitle: '2 Gram Panchayats',
                    icon: Icons.people_alt_outlined,
                    color: AppColors.secondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            const Text('CSR Quick Actions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ActionChip(
                  avatar: const Icon(Icons.search, size: 18),
                  label: const Text('Discover Projects'),
                  onPressed: () => Navigator.pushNamed(context, '/opportunity_discovery'),
                ),
                ActionChip(
                  avatar: const Icon(Icons.auto_awesome, size: 18),
                  label: const Text('AI Matching'),
                  onPressed: () => Navigator.pushNamed(context, '/matching_recommendations'),
                ),
                ActionChip(
                  avatar: const Icon(Icons.list_alt, size: 18),
                  label: const Text('Active Sponsorships'),
                  onPressed: () => Navigator.pushNamed(context, '/active_sponsorships'),
                ),
                ActionChip(
                  avatar: const Icon(Icons.insights, size: 18),
                  label: const Text('Impact Metrics'),
                  onPressed: () => Navigator.pushNamed(context, '/impact_tracking'),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Top Impact Opportunities', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                TextButton(
                  onPressed: () => Navigator.pushNamed(context, '/opportunity_discovery'),
                  child: const Text('View All'),
                ),
              ],
            ),
            ...MockData.impactCases.map(
              (ic) => ImpactCaseCard(
                impactCase: ic,
                onTap: () => Navigator.pushNamed(context, '/opportunity_detail', arguments: ic),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CSRProfileScreen extends StatelessWidget {
  const CSRProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'CSR Partner Profile'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: const [
            CircleAvatar(radius: 36, child: Icon(Icons.business, size: 40)),
            SizedBox(height: 14),
            Text('Tata Sustainability Foundation', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            Text('Corporate Registration #CSR-2024-88', style: TextStyle(color: AppColors.textSecondaryLight)),
            SizedBox(height: 24),
            Card(
              child: ListTile(
                title: Text('Focus Sectors'),
                subtitle: Text('Clean Water, Renewable Energy, Rural Education'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class OpportunityDiscoveryListScreen extends StatelessWidget {
  const OpportunityDiscoveryListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Discover CSR Projects'),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: MockData.impactCases.length,
        itemBuilder: (context, idx) {
          final ic = MockData.impactCases[idx];
          return ImpactCaseCard(
            impactCase: ic,
            onTap: () => Navigator.pushNamed(context, '/opportunity_detail', arguments: ic),
          );
        },
      ),
    );
  }
}

class OpportunityDetailScreen extends StatelessWidget {
  const OpportunityDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ic = (ModalRoute.of(context)?.settings.arguments as ImpactCase?) ?? MockData.impactCases[0];
    return Scaffold(
      appBar: GramOneAppBar(title: ic.title),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(ic.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(ic.description, style: const TextStyle(color: AppColors.textSecondaryLight)),
            const SizedBox(height: 16),
            Text('Required Budget: ₹${ic.budgetRequired}', style: const TextStyle(fontWeight: FontWeight.bold)),
            const Spacer(),
            PrimaryButton(
              label: 'Pledge Sponsorship',
              onPressed: () => Navigator.pushNamed(context, '/sponsor_confirmation', arguments: ic),
            ),
          ],
        ),
      ),
    );
  }
}

class MatchingRecommendationsScreen extends StatelessWidget {
  const MatchingRecommendationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'AI CSR Matchmaker'),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: AppColors.primaryContainer, borderRadius: BorderRadius.circular(10)),
              child: Row(
                children: const [
                  Icon(Icons.auto_awesome, color: AppColors.primary),
                  SizedBox(width: 10),
                  Text('98% Match based on your Clean Water focus preference.'),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ImpactCaseCard(
                impactCase: MockData.impactCases[0],
                onTap: () => Navigator.pushNamed(context, '/opportunity_detail', arguments: MockData.impactCases[0]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class SponsorProjectConfirmationScreen extends StatelessWidget {
  const SponsorProjectConfirmationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Confirm Sponsorship Pledge'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const Text('Pledge Commitment Amount', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            const TextField(
              decoration: InputDecoration(prefixText: '₹ ', hintText: '200000'),
              keyboardType: TextInputType.number,
            ),
            const Spacer(),
            PrimaryButton(
              label: 'Authorize & Submit Pledge',
              onPressed: () => Navigator.pushNamed(context, '/active_sponsorships'),
            ),
          ],
        ),
      ),
    );
  }
}

class ActiveSponsorshipsScreen extends StatelessWidget {
  const ActiveSponsorshipsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Active CSR Sponsorships'),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: MockData.sponsorships.length,
        itemBuilder: (context, idx) {
          final item = MockData.sponsorships[idx];
          return Card(
            child: ListTile(
              title: Text(item.projectTitle),
              subtitle: Text('Committed: ₹${item.amountCommitted} • ${item.status}'),
              onTap: () => Navigator.pushNamed(context, '/sponsored_project_detail'),
            ),
          );
        },
      ),
    );
  }
}

class SponsoredProjectDetailScreen extends StatelessWidget {
  const SponsoredProjectDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Sponsored Project Detail'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text('Solar Smart Water Pumping Station', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            SizedBox(height: 12),
            LinearProgressIndicator(value: 0.75),
            SizedBox(height: 8),
            Text('75% Milestones Completed'),
          ],
        ),
      ),
    );
  }
}

class ImpactTrackingScreen extends StatelessWidget {
  const ImpactTrackingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'CSR Impact Telemetry'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: const [
            MetricStatCard(title: 'Clean Water Delivered', value: '1.2M Liters', subtitle: 'Monitored via IoT Tank Sensors', icon: Icons.water_drop),
          ],
        ),
      ),
    );
  }
}

class CSRNotificationsScreen extends StatelessWidget {
  const CSRNotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'CSR Notifications'),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: MockData.notifications.length,
        itemBuilder: (context, idx) => NotificationCard(
          notification: MockData.notifications[idx],
          onTap: () {},
        ),
      ),
    );
  }
}
