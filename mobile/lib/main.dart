import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'routes/app_routes.dart';
import 'services/auth_service.dart';
import 'services/localization_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const GramOneApp());
}

/// GramOne mobile application root.
class GramOneApp extends StatefulWidget {
  const GramOneApp({super.key});

  @override
  State<GramOneApp> createState() => _GramOneAppState();
}

class _GramOneAppState extends State<GramOneApp> {
  final LocalizationService _loc = LocalizationService();
  final AuthService _auth = AuthService();

  @override
  void initState() {
    super.initState();
    _loc.addListener(_rebuild);
    _auth.addListener(_rebuild);
  }

  @override
  void dispose() {
    _loc.removeListener(_rebuild);
    _auth.removeListener(_rebuild);
    super.dispose();
  }

  void _rebuild() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GramOne Mobile',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      initialRoute: AppRoutes.splash,
      routes: AppRoutes.routes,
      builder: (context, child) {
        return Directionality(
          textDirection: _loc.textDirection,
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}