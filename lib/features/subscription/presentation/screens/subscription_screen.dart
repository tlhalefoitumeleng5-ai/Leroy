import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:leroy_ai/core/utils/snackbar_utils.dart';
import 'package:leroy_ai/core/widgets/common_widgets.dart';
import 'package:leroy_ai/features/subscription/presentation/providers/subscription_provider.dart';
import 'package:leroy_ai/shared/widgets/feature_widgets.dart';

class SubscriptionScreen extends ConsumerWidget {
  const SubscriptionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(subscriptionProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Subscription Plans')),
      body: state.isLoading
          ? const LoadingView()
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Text(
                  'Choose the plan that matches your creative pace.',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 20),
                ...state.plans.map(
                  (plan) => Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: PlanCard(
                      name: plan.name,
                      price: plan.priceLabel,
                      period: plan.period,
                      features: plan.features,
                      isPopular: plan.isPopular,
                      isSelected: state.selectedPlanId == plan.id,
                      onTap: () => ref
                          .read(subscriptionProvider.notifier)
                          .select(plan.id),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                LeroyButton(
                  label: state.selectedPlanId == state.currentPlanId
                      ? 'Current plan'
                      : 'Continue with ${state.selectedPlanId}',
                  isLoading: state.isSaving,
                  onPressed: state.selectedPlanId == state.currentPlanId
                      ? null
                      : () async {
                          final ok = await ref
                              .read(subscriptionProvider.notifier)
                              .confirm();
                          if (!context.mounted) return;
                          if (ok) {
                            AppSnackBar.success(
                              context,
                              'Plan updated to ${state.selectedPlanId}',
                            );
                          } else {
                            AppSnackBar.show(
                              context,
                              state.error ?? 'Unable to update plan',
                              isError: true,
                            );
                          }
                        },
                ),
              ],
            ),
    );
  }
}
