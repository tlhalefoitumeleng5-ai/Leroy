import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:leroy_ai/core/utils/snackbar_utils.dart';
import 'package:leroy_ai/core/widgets/common_widgets.dart';
import 'package:leroy_ai/features/auth/presentation/providers/auth_provider.dart';
import 'package:leroy_ai/features/subscription/presentation/providers/subscription_provider.dart';
import 'package:leroy_ai/shared/providers/dependency_providers.dart';
import 'package:leroy_ai/shared/widgets/feature_widgets.dart';

class SubscriptionScreen extends ConsumerWidget {
  const SubscriptionScreen({super.key});

  Future<void> _checkout(
    BuildContext context,
    WidgetRef ref,
    String provider,
  ) async {
    final userId = ref.read(currentUserProvider)?.id;
    final planId = ref.read(subscriptionProvider).selectedPlanId;
    if (userId == null) return;
    if (planId == 'free') {
      final ok =
          await ref.read(subscriptionProvider.notifier).confirm();
      if (!context.mounted) return;
      if (ok) {
        ref.read(authProvider.notifier).setPlan('free');
        AppSnackBar.success(context, 'Switched to Free plan');
      }
      return;
    }
    final result = await ref.read(startCheckoutUseCaseProvider).call(
          userId: userId,
          planId: planId,
          provider: provider,
        );
    if (!context.mounted) return;
    result.fold(
      (f) => AppSnackBar.show(context, f.message, isError: true),
      (_) => AppSnackBar.success(context, 'Opening $provider checkout…'),
    );
  }

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
                  'Choose Free, Starter, Pro, or Business. Paid plans checkout via Stripe or PayFast.',
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
                LeroyButton(
                  label: state.selectedPlanId == 'free'
                      ? 'Select Free plan'
                      : 'Pay with Stripe',
                  isLoading: state.isSaving,
                  onPressed: () => _checkout(context, ref, 'stripe'),
                ),
                const SizedBox(height: 10),
                if (state.selectedPlanId != 'free')
                  LeroyButton(
                    label: 'Pay with PayFast',
                    isOutlined: true,
                    onPressed: () => _checkout(context, ref, 'payfast'),
                  ),
              ],
            ),
    );
  }
}
