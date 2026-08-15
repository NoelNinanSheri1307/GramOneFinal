import 'package:flutter/material.dart';
import '../../components/buttons.dart';
import '../../components/input_fields.dart';
import '../../theme/app_colors.dart';

class SignInScreen extends StatelessWidget {
  const SignInScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sign in')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Welcome back', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              const Text('Enter your registered credentials or mobile number.', style: TextStyle(color: AppColors.textSecondaryLight)),
              const SizedBox(height: 32),
              const CustomTextField(label: 'Phone number or email', hint: '+91 98765 43210', prefixIcon: Icons.person_outline),
              const SizedBox(height: 16),
              const CustomPasswordField(label: 'Password'),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => Navigator.pushNamed(context, '/forgot_password'),
                  child: const Text('Forgot password?'),
                ),
              ),
              const SizedBox(height: 24),
              PrimaryButton(
                label: 'Sign in',
                onPressed: () => Navigator.pushReplacementNamed(context, '/main_tab_wrapper'),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text("Don't have an account? "),
                  GestureDetector(
                    onTap: () => Navigator.pushNamed(context, '/create_account'),
                    child: const Text('Create account', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class CreateAccountScreen extends StatelessWidget {
  const CreateAccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create account')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Join GramOne', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              const Text('Register your citizen or administrative profile.', style: TextStyle(color: AppColors.textSecondaryLight)),
              const SizedBox(height: 24),
              const CustomTextField(label: 'Full name', hint: 'Ramesh Kumar', prefixIcon: Icons.badge_outlined),
              const SizedBox(height: 14),
              const CustomTextField(label: 'Mobile number', hint: '+91 98765 43210', keyboardType: TextInputType.phone, prefixIcon: Icons.phone_outlined),
              const SizedBox(height: 14),
              const CustomTextField(label: 'Gram Panchayat name', hint: 'Kaveri Gram Panchayat', prefixIcon: Icons.location_city_outlined),
              const SizedBox(height: 14),
              const CustomPasswordField(label: 'Password'),
              const SizedBox(height: 24),
              PrimaryButton(
                label: 'Send OTP Verification',
                onPressed: () => Navigator.pushNamed(context, '/otp_verification'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ForgotPasswordScreen extends StatelessWidget {
  const ForgotPasswordScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Forgot password')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Reset password', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('Enter your registered phone number to receive a verification code.', style: TextStyle(color: AppColors.textSecondaryLight)),
            const SizedBox(height: 24),
            const CustomTextField(label: 'Mobile number', hint: '+91 98765 43210', keyboardType: TextInputType.phone, prefixIcon: Icons.phone_outlined),
            const SizedBox(height: 24),
            PrimaryButton(
              label: 'Get OTP',
              onPressed: () => Navigator.pushNamed(context, '/otp_verification'),
            ),
          ],
        ),
      ),
    );
  }
}

class OtpVerificationScreen extends StatelessWidget {
  const OtpVerificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('OTP verification')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Icon(Icons.mark_email_read_outlined, size: 64, color: AppColors.primary),
            const SizedBox(height: 16),
            const Text('Enter 4-digit code', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('Sent to +91 98765 43210', style: TextStyle(color: AppColors.textSecondaryLight)),
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: List.generate(
                4,
                (i) => SizedBox(
                  width: 54,
                  height: 54,
                  child: TextField(
                    textAlign: TextAlign.center,
                    keyboardType: TextInputType.number,
                    maxLength: 1,
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                    decoration: InputDecoration(
                      counterText: '',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 32),
            PrimaryButton(
              label: 'Verify OTP',
              onPressed: () => Navigator.pushNamed(context, '/reset_success'),
            ),
          ],
        ),
      ),
    );
  }
}

class ResetPasswordSuccessScreen extends StatelessWidget {
  const ResetPasswordSuccessScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: AppColors.primaryContainer,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_outline, size: 64, color: AppColors.primary),
            ),
            const SizedBox(height: 24),
            const Text('Account Verified!', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            const Text(
              'Your profile is ready. You can now access GramOne services.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondaryLight),
            ),
            const SizedBox(height: 36),
            PrimaryButton(
              label: 'Go to Dashboard',
              onPressed: () => Navigator.pushNamedAndRemoveUntil(context, '/main_tab_wrapper', (route) => false),
            ),
          ],
        ),
      ),
    );
  }
}
