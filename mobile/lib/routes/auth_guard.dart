import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/auth_service.dart';
import '../screens/security/unauthorized_screen.dart';

class RoleGuard extends StatelessWidget {
  final Widget child;
  final List<UserRole> allowedRoles;

  const RoleGuard({
    super.key,
    required this.child,
    required this.allowedRoles,
  });

  @override
  Widget build(BuildContext context) {
    final auth = AuthService();

    if (!auth.isAuthenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Navigator.pushReplacementNamed(context, '/sign_in');
      });
      return const SizedBox.shrink();
    }

    if (allowedRoles.isNotEmpty && !allowedRoles.contains(auth.currentRole)) {
      return const UnauthorizedScreen();
    }

    return child;
  }
}
