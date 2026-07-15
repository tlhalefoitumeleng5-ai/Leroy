import 'package:shared_preferences/shared_preferences.dart';

import '../../domain/entities/subscription_plan.dart';

class SubscriptionDemoDataSource {
  SubscriptionDemoDataSource(this._prefs);
  final SharedPreferences _prefs;

  static const _key = 'demo_user_plan';

  static const plans = <SubscriptionPlan>[
    SubscriptionPlan(
      id: 'free',
      name: 'Free',
      priceLabel: '\$0',
      period: 'forever',
      features: [
        '20 AI chats / day',
        '3 image generations / day',
        'Prompt library access',
        'Light & dark themes',
      ],
    ),
    SubscriptionPlan(
      id: 'pro',
      name: 'Pro',
      priceLabel: '\$12',
      period: '/ month',
      highlighted: true,
      features: [
        '500 AI chats / day',
        '50 image generations / day',
        'Priority generation queue',
        'Favorite prompts sync',
        'Early access features',
      ],
    ),
    SubscriptionPlan(
      id: 'enterprise',
      name: 'Enterprise',
      priceLabel: 'Custom',
      period: '',
      features: [
        'Unlimited team seats',
        'SSO & admin controls',
        'Custom model routing',
        'Dedicated support',
      ],
    ),
  ];

  Future<List<SubscriptionPlan>> getPlans() async => plans;

  Future<String> getCurrentPlanId() async => _prefs.getString(_key) ?? 'free';

  Future<String> subscribe(String planId) async {
    await Future<void>.delayed(const Duration(milliseconds: 700));
    await _prefs.setString(_key, planId);
    return planId;
  }
}
