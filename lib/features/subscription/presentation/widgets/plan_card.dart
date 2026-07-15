import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/subscription_plan.dart';

class PlanCard extends StatelessWidget {
  const PlanCard({
    super.key,
    required this.plan,
    required this.isCurrent,
    required this.onSelect,
    this.isLoading = false,
  });

  final SubscriptionPlan plan;
  final bool isCurrent;
  final VoidCallback onSelect;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final borderColor = plan.highlighted
        ? (isDark ? AppColors.brandAqua : AppColors.brandTeal)
        : Theme.of(context).colorScheme.outline.withValues(alpha: 0.35);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        color: isDark ? AppColors.darkSurface : Colors.white,
        border: Border.all(color: borderColor, width: plan.highlighted ? 2 : 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(plan.name, style: Theme.of(context).textTheme.headlineSmall),
              if (plan.highlighted) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    gradient: AppColors.accentGlow,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Popular',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppColors.brandInk,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                ),
              ],
              const Spacer(),
              if (isCurrent)
                Text(
                  'Current',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: isDark ? AppColors.brandAqua : AppColors.brandTeal,
                      ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(plan.priceLabel, style: Theme.of(context).textTheme.displaySmall),
              if (plan.period.isNotEmpty) ...[
                const SizedBox(width: 4),
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Text(plan.period, style: Theme.of(context).textTheme.bodyMedium),
                ),
              ],
            ],
          ),
          const SizedBox(height: 16),
          ...plan.features.map(
            (f) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Icon(
                    Icons.check_circle_rounded,
                    size: 18,
                    color: isDark ? AppColors.brandAqua : AppColors.brandTeal,
                  ),
                  const SizedBox(width: 8),
                  Expanded(child: Text(f)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: plan.highlighted
                ? FilledButton(
                    onPressed: isCurrent || isLoading ? null : onSelect,
                    child: Text(isCurrent ? 'Current plan' : 'Choose ${plan.name}'),
                  )
                : OutlinedButton(
                    onPressed: isCurrent || isLoading ? null : onSelect,
                    child: Text(isCurrent ? 'Current plan' : 'Choose ${plan.name}'),
                  ),
          ),
        ],
      ),
    );
  }
}
