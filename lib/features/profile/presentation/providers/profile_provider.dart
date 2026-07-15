import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:leroy_ai/features/auth/presentation/providers/auth_provider.dart';

/// Convenience provider for profile screen.
final profileUserProvider = Provider((ref) => ref.watch(currentUserProvider));
