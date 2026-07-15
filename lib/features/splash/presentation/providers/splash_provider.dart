import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Splash navigation is handled in SplashScreen; provider kept for symmetry.
final splashReadyProvider = StateProvider<bool>((ref) => false);
