import 'package:flutter/material.dart';
import '../../components/buttons.dart';
import '../../components/cards.dart';
import '../../components/navigation_components.dart';
import '../../mock/mock_data.dart';
import '../../models/models.dart';
import '../../theme/app_colors.dart';

class WaterTankMonitorScreen extends StatelessWidget {
  const WaterTankMonitorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Water Tank Telemetry'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: const [
            MetricStatCard(title: 'Tank Capacity Level', value: '78.4%', subtitle: 'Normal • North Ward Reservoir', icon: Icons.water),
            SizedBox(height: 16),
            MetricStatCard(title: 'Pumping Rate', value: '120 L/min', subtitle: 'Solar Grid Powered', icon: Icons.speed, color: AppColors.secondary),
          ],
        ),
      ),
    );
  }
}

class WasteBinMonitorScreen extends StatelessWidget {
  const WasteBinMonitorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Smart Waste Bin Sensor'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: const [
            MetricStatCard(title: 'Bin #12 Fill Level', value: '91.2%', subtitle: 'Alert: Pickup Required', icon: Icons.delete_outline, color: AppColors.statusCritical),
          ],
        ),
      ),
    );
  }
}

class EnvironmentalMonitorScreen extends StatelessWidget {
  const EnvironmentalMonitorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Environmental AQI & Temp'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: const [
            MetricStatCard(title: 'Air Quality Index', value: '32 AQI', subtitle: 'Good Air Quality', icon: Icons.air),
            SizedBox(height: 16),
            MetricStatCard(title: 'Ambient Temp', value: '29.4 °C', subtitle: 'Gram Panchayat Campus', icon: Icons.thermostat),
          ],
        ),
      ),
    );
  }
}

class GasAnomalyAlertScreen extends StatelessWidget {
  const GasAnomalyAlertScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Gas Anomaly Warning'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: AppColors.statusCritical.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
              child: Column(
                children: const [
                  Icon(Icons.warning, size: 56, color: AppColors.statusCritical),
                  SizedBox(height: 12),
                  Text('High Methane Gas Reading: 450 PPM', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.statusCritical)),
                  Text('Biogas Plant Facility • Ward 4', style: TextStyle(color: AppColors.textSecondaryLight)),
                ],
              ),
            ),
            const Spacer(),
            PrimaryButton(
              label: 'Dispatch Emergency Field Crew',
              onPressed: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }
}

class EmergencyButtonAlertScreen extends StatelessWidget {
  const EmergencyButtonAlertScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'SOS Panic Switch Activated'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: AppColors.statusCritical.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)),
              child: Column(
                children: const [
                  Icon(Icons.sos, size: 64, color: AppColors.statusCritical),
                  SizedBox(height: 12),
                  Text('Panic Button Triggered', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.statusCritical)),
                  Text('Women Community Center • Ward 2', style: TextStyle(fontSize: 14)),
                ],
              ),
            ),
            const Spacer(),
            PrimaryButton(
              label: 'Acknowledge & Notify Local Police/Panchayat Head',
              onPressed: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }
}

class DeviceDetailScreen extends StatelessWidget {
  const DeviceDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final dev = (ModalRoute.of(context)?.settings.arguments as TelemetryDevice?) ?? MockData.devices[0];
    return Scaffold(
      appBar: GramOneAppBar(title: dev.name),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(dev.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text('Device ID: ${dev.id} • Type: ${dev.type}'),
            const SizedBox(height: 20),
            MetricStatCard(title: 'Telemetry Value', value: '${dev.currentValue} ${dev.unit}', subtitle: 'Status: ${dev.status}', icon: Icons.sensors),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => Navigator.pushNamed(context, '/device_health'),
              child: const Text('Check Battery & Hardware Health'),
            ),
          ],
        ),
      ),
    );
  }
}

class DeviceHealthStatusScreen extends StatelessWidget {
  const DeviceHealthStatusScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const GramOneAppBar(title: 'Hardware Diagnostics'),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: const [
            Card(
              child: ListTile(
                leading: Icon(Icons.battery_charging_full, color: AppColors.primary),
                title: Text('Battery Level: 92%'),
                subtitle: Text('Solar Auxiliary Charging Active'),
              ),
            ),
            SizedBox(height: 10),
            Card(
              child: ListTile(
                leading: Icon(Icons.wifi, color: AppColors.primary),
                title: Text('LoRaWAN Gateway Link: Strong (-74 dBm)'),
                subtitle: Text('Packet Loss: 0.01%'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
