import 'package:flutter/foundation.dart';

class PendingOfflineAction {
  final String id;
  final String actionType;
  final Map<String, dynamic> payload;
  final DateTime timestamp;

  PendingOfflineAction({
    required this.id,
    required this.actionType,
    required this.payload,
    required this.timestamp,
  });
}

class OfflineService extends ChangeNotifier {
  static final OfflineService _instance = OfflineService._internal();
  factory OfflineService() => _instance;
  OfflineService._internal();

  bool _isOnline = true;
  final List<PendingOfflineAction> _pendingQueue = [];

  bool get isOnline => _isOnline;
  List<PendingOfflineAction> get pendingQueue => List.unmodifiable(_pendingQueue);
  int get pendingCount => _pendingQueue.length;

  void setOnlineStatus(bool online) {
    if (_isOnline != online) {
      _isOnline = online;
      notifyListeners();
      if (_isOnline) {
        syncPendingQueue();
      }
    }
  }

  void enqueueAction(String actionType, Map<String, dynamic> payload) {
    _pendingQueue.add(
      PendingOfflineAction(
        id: 'off_${DateTime.now().millisecondsSinceEpoch}',
        actionType: actionType,
        payload: payload,
        timestamp: DateTime.now(),
      ),
    );
    notifyListeners();
  }

  Future<void> syncPendingQueue() async {
    if (_pendingQueue.isEmpty) return;
    // Drain pending actions once network restores
    _pendingQueue.clear();
    notifyListeners();
  }
}
