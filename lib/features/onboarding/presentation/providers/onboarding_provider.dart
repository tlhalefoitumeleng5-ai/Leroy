import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/di/providers.dart';
import '../../../splash/presentation/providers/splash_provider.dart';

class OnboardingPage {
  const OnboardingPage({
    required this.title,
    required this.description,
    required this.icon,
  });
  final String title;
  final String description;
  final String icon; // icon name key
}

final onboardingPagesProvider = Provider<List<OnboardingPage>>((ref) {
  return const [
    OnboardingPage(
      title: 'Chat with clarity',
      description:
          'Ask anything. Leroy delivers sharp answers, drafts, and ideas in seconds.',
      icon: 'chat',
    ),
    OnboardingPage(
      title: 'Generate stunning visuals',
      description:
          'Turn prompts into polished images for product, art, and storytelling.',
      icon: 'image',
    ),
    OnboardingPage(
      title: 'Prompt smarter',
      description:
          'Browse a curated library of proven prompts and ship better results faster.',
      icon: 'library',
    ),
  ];
});

final onboardingIndexProvider = StateProvider<int>((ref) => 0);

final completeOnboardingProvider = Provider((ref) {
  return () async {
    await markOnboardingDone(ref.read(sharedPreferencesProvider));
  };
});
