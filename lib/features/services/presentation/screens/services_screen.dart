import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:leroy_ai/core/theme/app_colors.dart';
import 'package:leroy_ai/core/utils/snackbar_utils.dart';
import 'package:leroy_ai/features/services/data/datasources/services_datasource.dart';
import 'package:leroy_ai/features/services/domain/entities/service_entity.dart';
import 'package:url_launcher/url_launcher.dart';

/// Business services catalog with ZAR pricing (Leroy AI Solutions).
class ServicesScreen extends StatelessWidget {
  const ServicesScreen({super.key, this.dataSource = const ServicesDataSource()});

  final ServicesDataSource dataSource;

  Future<void> _enquire(BuildContext context, ServiceEntity service) async {
    final uri = dataSource.enquiryUri(service);
    final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!context.mounted) return;
    if (!opened) {
      AppSnackBar.show(
        context,
        'Could not open WhatsApp. Message us on +27 69 220 2159.',
        isError: true,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final services = ServicesDataSource.catalog;

    return Scaffold(
      appBar: AppBar(title: const Text('Our Services')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          Text(
            'Leroy AI Solutions',
            style: theme.textTheme.titleMedium?.copyWith(
              color: AppColors.teal,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'AI automation, custom apps, and websites — priced in South African Rands.',
            style: theme.textTheme.bodyLarge?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 22),
          ...services.map(
            (service) => Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: _ServiceCard(
                service: service,
                onEnquire: () => _enquire(context, service),
              ),
            ),
          ),
        ]
            .animate(interval: 40.ms)
            .fadeIn(duration: 320.ms)
            .slideY(begin: 0.04, end: 0),
      ),
    );
  }
}

class _ServiceCard extends StatelessWidget {
  const _ServiceCard({
    required this.service,
    required this.onEnquire,
  });

  final ServiceEntity service;
  final VoidCallback onEnquire;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final accent = service.isFeatured ? AppColors.coral : AppColors.teal;

    return Material(
      color: theme.colorScheme.surface,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        onTap: onEnquire,
        borderRadius: BorderRadius.circular(22),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: Border.all(
              color: service.isFeatured
                  ? accent.withValues(alpha: 0.55)
                  : theme.colorScheme.outline.withValues(alpha: 0.45),
              width: service.isFeatured ? 1.4 : 1,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 46,
                      height: 46,
                      decoration: BoxDecoration(
                        color: accent.withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Icon(service.icon, color: accent),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  service.title,
                                  style: theme.textTheme.titleMedium,
                                ),
                              ),
                              if (service.isFeatured)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: accent.withValues(alpha: 0.16),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    'New',
                                    style: theme.textTheme.labelSmall?.copyWith(
                                      color: accent,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            service.description,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  service.priceLabel,
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: AppColors.teal,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 14),
                Align(
                  alignment: Alignment.centerLeft,
                  child: FilledButton.tonal(
                    onPressed: onEnquire,
                    child: const Text('Get this service'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
