import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/widgets/error_view.dart';
import '../providers/subscription_providers.dart';
import '../widgets/plan_card.dart';

class SubscriptionScreen extends ConsumerWidget {
  const SubscriptionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plansAsync = ref.watch(subscriptionPlansProvider);
    final currentAsync = ref.watch(currentPlanIdProvider);
    final subState = ref.watch(subscriptionControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Subscription Plans')),
      body: plansAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(subscriptionPlansProvider),
        ),
        data: (plans) {
          final current = currentAsync.valueOrNull ?? 'free';
          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
            children: [
              Text(
                'Choose the plan that matches your creative pace.',
                style: context.textTheme.bodyLarge,
              ),
              const SizedBox(height: 20),
              ...plans.map(
                (plan) => PlanCard(
                  plan: plan,
                  isCurrent: plan.id == current,
                  isLoading: subState.isLoading,
                  onSelect: () async {
                    final ok = await ref
                        .read(subscriptionControllerProvider.notifier)
                        .subscribe(plan.id);
                    if (context.mounted) {
                      context.showSnack(
                        ok ? 'Switched to ${plan.name}' : 'Could not update plan',
                        isError: !ok,
                      );
                    }
                  },
                ),
              ),
              Text(
                'Demo billing only — connect RevenueCat / Play Billing for production.',
                style: context.textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
            ],
          );
        },
      ),
    );
  }
}
