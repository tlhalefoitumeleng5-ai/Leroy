import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Settings-local UI state (e.g. expanded sections).
final settingsExpandedProvider = StateProvider<bool>((ref) => true);
