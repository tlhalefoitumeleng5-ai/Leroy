import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:leroy_ai/core/constants/app_routes.dart';
import 'package:leroy_ai/core/theme/app_colors.dart';
import 'package:leroy_ai/core/widgets/common_widgets.dart';
import 'package:leroy_ai/features/onboarding/domain/entities/onboarding_page.dart';
import 'package:leroy_ai/shared/providers/app_config_provider.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _controller = PageController();
  int _index = 0;

  static const _pages = [
    OnboardingPage(
      title: 'Chat with clarity',
      description:
          'Leroy AI helps you think, write, and decide — with responses that feel sharp and human.',
      icon: Icons.chat_bubble_outline_rounded,
    ),
    OnboardingPage(
      title: 'Create stunning visuals',
      description:
          'Turn prompts into polished images. Iterate on style, mood, and composition in seconds.',
      icon: Icons.auto_awesome_mosaic_outlined,
    ),
    OnboardingPage(
      title: 'Reuse winning prompts',
      description:
          'Browse a curated prompt library built for marketers, makers, and creative teams.',
      icon: Icons.library_books_outlined,
    ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    await ref.read(onboardingCompleteProvider.notifier).complete();
    if (mounted) context.go(AppRoutes.login);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isLast = _index == _pages.length - 1;

    return AtmosphereBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
            child: Column(
              children: [
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: _finish,
                    child: const Text('Skip'),
                  ),
                ),
                Expanded(
                  child: PageView.builder(
                    controller: _controller,
                    itemCount: _pages.length,
                    onPageChanged: (i) => setState(() => _index = i),
                    itemBuilder: (context, i) {
                      final page = _pages[i];
                      return Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 120,
                            height: 120,
                            decoration: BoxDecoration(
                              gradient: AppColors.brandGradient,
                              borderRadius: BorderRadius.circular(36),
                            ),
                            child: Icon(page.icon, size: 56, color: Colors.white),
                          )
                              .animate()
                              .fadeIn(duration: 400.ms)
                              .scale(begin: const Offset(0.9, 0.9)),
                          const SizedBox(height: 40),
                          Text(
                            page.title,
                            style: theme.textTheme.headlineMedium,
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 14),
                          Text(
                            page.description,
                            style: theme.textTheme.bodyLarge?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                              height: 1.55,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      );
                    },
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(_pages.length, (i) {
                    final active = i == _index;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: active ? 28 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: active
                            ? AppColors.teal
                            : theme.colorScheme.outline.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(8),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 28),
                LeroyButton(
                  label: isLast ? 'Get started' : 'Continue',
                  onPressed: () {
                    if (isLast) {
                      _finish();
                    } else {
                      _controller.nextPage(
                        duration: const Duration(milliseconds: 320),
                        curve: Curves.easeOutCubic,
                      );
                    }
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
