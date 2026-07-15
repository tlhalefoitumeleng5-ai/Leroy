import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../auth/presentation/providers/auth_providers.dart';
import '../../domain/entities/profile_stats.dart';

final profileStatsProvider = Provider<ProfileStats>((ref) {
  // Demo stats; replace with Firestore aggregates in production.
  final user = ref.watch(currentUserProvider);
  if (user == null) return const ProfileStats();
  return const ProfileStats(chats: 12, images: 4, promptsSaved: 3);
});
