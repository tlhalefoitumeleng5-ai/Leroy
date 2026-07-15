import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/errors/exceptions.dart';
import 'package:leroy_ai/features/subscription/data/models/plan_model.dart';

abstract class SubscriptionDataSource {
  Future<List<PlanModel>> getPlans();
  Future<String> getCurrentPlan(String userId);
  Future<void> selectPlan(String userId, String planId);
}

class SubscriptionDataSourceImpl implements SubscriptionDataSource {
  SubscriptionDataSourceImpl({FirebaseFirestore? firestore, this.useFirebase = false})
      : _db = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _db;
  final bool useFirebase;
  String _localPlan = 'free';

  static const plans = <PlanModel>[
    PlanModel(
      id: 'free',
      name: 'Free',
      priceLabel: '\$0',
      period: '/month',
      features: [
        '20 chat messages / day',
        '3 image generations / day',
        'Prompt library access',
        'Standard response speed',
      ],
    ),
    PlanModel(
      id: 'pro',
      name: 'Pro',
      priceLabel: '\$12',
      period: '/month',
      isPopular: true,
      features: [
        'Unlimited chat',
        '100 images / day',
        'Priority responses',
        'Saved chat history sync',
        'Custom prompt folders',
      ],
    ),
    PlanModel(
      id: 'studio',
      name: 'Studio',
      priceLabel: '\$29',
      period: '/month',
      features: [
        'Everything in Pro',
        'Team workspaces',
        'API access',
        'Advanced image styles',
        'Dedicated support',
      ],
    ),
  ];

  @override
  Future<List<PlanModel>> getPlans() async => plans;

  @override
  Future<String> getCurrentPlan(String userId) async {
    if (!useFirebase) return _localPlan;
    try {
      final doc = await _db
          .collection(AppConstants.usersCollection)
          .doc(userId)
          .get();
      return doc.data()?['plan'] as String? ?? 'free';
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<void> selectPlan(String userId, String planId) async {
    _localPlan = planId;
    if (!useFirebase) return;
    try {
      await _db.collection(AppConstants.usersCollection).doc(userId).set(
        {'plan': planId},
        SetOptions(merge: true),
      );
    } catch (e) {
      throw ServerException(e.toString());
    }
  }
}
