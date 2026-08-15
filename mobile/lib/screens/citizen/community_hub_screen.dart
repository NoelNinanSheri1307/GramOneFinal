import 'package:flutter/material.dart';
import '../../components/navigation_components.dart';
import '../../theme/app_colors.dart';
import '../../services/api_client.dart';

class CommunityHubScreen extends StatefulWidget {
  const CommunityHubScreen({super.key});

  @override
  State<CommunityHubScreen> createState() => _CommunityHubScreenState();
}

class _CommunityHubScreenState extends State<CommunityHubScreen> {
  int _activeSubTab = 0; // 0: News, 1: Announcements, 2: Safety Info

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Community Hub'),
      body: Column(
        children: [
          Container(
            color: Theme.of(context).cardColor,
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildSubTabButton(0, 'Regional News', Icons.newspaper),
                _buildSubTabButton(1, 'Announcements', Icons.campaign_outlined),
                _buildSubTabButton(2, 'Safety Guides', Icons.security),
              ],
            ),
          ),
          Expanded(
            child: IndexedStack(
              index: _activeSubTab,
              children: const [
                NewsSubTab(),
                AnnouncementsSubTab(),
                SafetySubTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubTabButton(int index, String label, IconData icon) {
    final isSel = _activeSubTab == index;
    return GestureDetector(
      onTap: () => setState(() => _activeSubTab = index),
      child: Column(
        children: [
          Icon(icon, color: isSel ? AppColors.primary : AppColors.textTertiaryLight, size: 24),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
              color: isSel ? AppColors.primary : AppColors.textTertiaryLight,
            ),
          ),
        ],
      ),
    );
  }
}

class NewsSubTab extends StatelessWidget {
  const NewsSubTab({super.key});

  Future<List<dynamic>> _fetchNews() async {
    try {
      final res = await ApiClient.get('/community/news');
      if (res is List) return res;
      if (res is Map && res['results'] is List) return res['results'] as List;
    } catch (_) {}
    return [];
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<dynamic>>(
      future: _fetchNews(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        final items = snapshot.data ?? [];
        if (items.isEmpty) {
          return const Center(child: Text('No regional news found'));
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: items.length,
          itemBuilder: (context, idx) {
            final item = items[idx];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 6),
                    Text(item['description'] ?? '', style: const TextStyle(fontSize: 13, color: AppColors.textSecondaryLight)),
                    const SizedBox(height: 8),
                    Text('Source: ${item['source_id'] ?? 'News'}', style: const TextStyle(fontSize: 11, color: AppColors.textTertiaryLight)),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}

class AnnouncementsSubTab extends StatelessWidget {
  const AnnouncementsSubTab({super.key});

  Future<List<dynamic>> _fetchAnnouncements() async {
    try {
      final res = await ApiClient.get('/community/notices');
      if (res is List) return res;
      if (res is Map && res['items'] is List) return res['items'] as List;
    } catch (_) {}
    return [];
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<dynamic>>(
      future: _fetchAnnouncements(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        final items = snapshot.data ?? [];
        if (items.isEmpty) {
          return const Center(child: Text('No announcements posted by Panchayat'));
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: items.length,
          itemBuilder: (context, idx) {
            final item = items[idx];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                leading: const Icon(Icons.campaign, color: AppColors.primary, size: 28),
                title: Text(item['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text(item['body'] ?? ''),
              ),
            );
          },
        );
      },
    );
  }
}

class SafetySubTab extends StatelessWidget {
  const SafetySubTab({super.key});

  Future<List<dynamic>> _fetchSafety() async {
    try {
      final res = await ApiClient.get('/community/safety');
      if (res is List) return res;
      if (res is Map && res['items'] is List) return res['items'] as List;
    } catch (_) {}
    return [];
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<dynamic>>(
      future: _fetchSafety(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        final items = snapshot.data ?? [];
        if (items.isEmpty) {
          return const Center(child: Text('No safety resources listed'));
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: items.length,
          itemBuilder: (context, idx) {
            final item = items[idx];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 6),
                    Text(item['body'] ?? '', style: const TextStyle(fontSize: 13, color: AppColors.textSecondaryLight)),
                    const SizedBox(height: 8),
                    Text('Section: ${item['section'] ?? 'General'}', style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}
