import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:leroy_ai/core/constants/app_constants.dart';
import 'package:leroy_ai/core/errors/exceptions.dart';
import 'package:leroy_ai/core/services/ai_cloud_service.dart';
import 'package:leroy_ai/features/subscription/data/models/plan_model.dart';
import 'package:url_launcher/url_launcher.dart';

abstract class SubscriptionDataSource {
  Future<List<PlanModel>> getPlans();
  Future<String> getCurrentPlan(String userId);
  Future<void> selectPlan(String userId, String planId);
  Future<String> startCheckout({
    required String userId,
    required String planId,
    required String provider,
  });
}

class SubscriptionDataSourceImpl implements SubscriptionDataSource {
  SubscriptionDataSourceImpl({
    FirebaseFirestore? firestore,
    AiCloudService? ai,
  })  : _db = firestore ?? FirebaseFirestore.instance,
        _ai = ai ?? AiCloudService();

  final FirebaseFirestore _db;
  final AiCloudService _ai;

  static const plans = <PlanModel>[
    PlanModel(
      id: 'free',
      name: 'Free',
      priceLabel: '\$0',
      period: '/month',
      features: [
        'Limited AI chat',
        '3 images / day',
        '1 video / day',
        'Prompt library access',
      ],
    ),
    PlanModel(
      id: 'starter',
      name: 'Starter',
      priceLabel: '\$9',
      period: '/month',
      features: [
        'Unlimited chat',
        '50 images / day',
        '10 videos / day',
        'Priority responses',
      ],
    ),
    PlanModel(
      id: 'pro',
      name: 'Pro',
      priceLabel: '\$19',
      period: '/month',
      isPopular: true,
      features: [
        'Everything in Starter',
        '200 images / day',
        '50 videos / day',
        'Voice chat',
        'History sync',
      ],
    ),
    PlanModel(
      id: 'business',
      name: 'Business',
      priceLabel: '\$49',
      period: '/month',
      features: [
        'Everything in Pro',
        'Team seats',
        'API access',
        'Dedicated support',
        'Custom templates',
      ],
    ),
  ];

  @override
  Future<List<PlanModel>> getPlans() async => plans;

  @override
  Future<String> getCurrentPlan(String userId) async {
    try {
      final doc =
          await _db.collection(AppConstants.usersCollection).doc(userId).get();
      return doc.data()?['plan'] as String? ?? 'free';
    } catch (e) {
      throw ServerException(e.toString());
    }
  }

  @override
  Future<void> selectPlan(String userId, String planId) async {
    if (planId == 'free') {
      try {
        await _db.collection(AppConstants.usersCollection).doc(userId).set(
          {'plan': 'free'},
          SetOptions(merge: true),
        );
        return;
      } catch (e) {
        throw ServerException(e.toString());
      }
    }
    throw ServerException(
      'Paid plans require Stripe or PayFast checkout.',
    );
  }

  @override
  Future<String> startCheckout({
    required String userId,
    required String planId,
    required String provider,
  }) async {
    try {
      final result = await _ai.createCheckout(
        planId: planId,
        provider: provider,
      );
      final url = result['checkoutUrl'] as String?;
      if (url == null || url.isEmpty) {
        throw ServerException(
          'Checkout unavailable. Deploy ${AppConstants.fnCheckout} with Stripe/PayFast secrets.',
        );
      }
      final uri = Uri.parse(url);
      if (!await canLaunchUrl(uri)) {
        throw ServerException('Cannot open checkout URL.');
      }
      await launchUrl(uri, mode: LaunchMode.externalApplication);
      return url;
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException(e.toString());
    }
  }
}
