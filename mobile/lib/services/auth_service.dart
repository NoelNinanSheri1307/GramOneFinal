import 'package:flutter/foundation.dart';
import '../models/models.dart';
import 'api_client.dart';

class AuthService extends ChangeNotifier {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal() {
    ApiClient.onUnauthorized = handleSessionExpired;
  }

  bool _isAuthenticated = true; // default demo session logged in
  UserProfile? _currentUser = const UserProfile(
    id: 'usr_001',
    name: 'Ramesh Kumar',
    email: 'ramesh.k@gramone.gov.in',
    phone: '+91 98765 43210',
    role: UserRole.citizen,
    panchayat: 'Kaveri Gram Panchayat',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
  );
  String? _authToken = 'mock_jwt_token_gramone_2026';

  bool get isAuthenticated => _isAuthenticated;
  UserProfile? get currentUser => _currentUser;
  UserRole get currentRole => _currentUser?.role ?? UserRole.citizen;
  String? get token => _authToken;

  void setRole(UserRole role) {
    if (_currentUser != null) {
      _currentUser = UserProfile(
        id: _currentUser!.id,
        name: _currentUser!.name,
        email: _currentUser!.email,
        phone: _currentUser!.phone,
        role: role,
        panchayat: _currentUser!.panchayat,
        district: _currentUser!.district,
        state: _currentUser!.state,
        avatarUrl: _currentUser!.avatarUrl,
      );
      notifyListeners();
    }
  }

  Future<bool> login(String username, String password, {UserRole selectedRole = UserRole.citizen}) async {
    // In production connects to POST /api/v1/auth/token
    _isAuthenticated = true;
    _authToken = 'jwt_token_${DateTime.now().millisecondsSinceEpoch}';
    ApiClient.setAuthToken(_authToken);

    _currentUser = UserProfile(
      id: 'usr_${DateTime.now().millisecondsSinceEpoch}',
      name: username.isEmpty ? 'Ramesh Kumar' : username,
      email: '$username@gramone.gov.in',
      phone: '+91 98765 43210',
      role: selectedRole,
      panchayat: 'Kaveri Gram Panchayat',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    );
    notifyListeners();
    return true;
  }

  void logout() {
    _isAuthenticated = false;
    _currentUser = null;
    _authToken = null;
    ApiClient.setAuthToken(null);
    notifyListeners();
  }

  void handleSessionExpired() {
    if (_isAuthenticated) {
      logout();
    }
  }

  bool canAccess(List<UserRole> allowedRoles) {
    if (!_isAuthenticated) return false;
    if (allowedRoles.isEmpty) return true;
    return allowedRoles.contains(currentRole);
  }
}
