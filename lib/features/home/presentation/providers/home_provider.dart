import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class HomeShortcut {
  const HomeShortcut({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.route,
  });
  final String title;
  final String subtitle;
  final IconData icon;
  final String route;
}

final homeShortcutsProvider = Provider<List<HomeShortcut>>((ref) {
  return const [
    HomeShortcut(
      title: 'AI Chat',
      subtitle: 'Draft, explain, brainstorm',
      icon: Icons.auto_awesome_rounded,
      route: '/home/chat',
    ),
    HomeShortcut(
      title: 'Image Studio',
      subtitle: 'Generate visual concepts',
      icon: Icons.palette_outlined,
      route: '/home/studio',
    ),
    HomeShortcut(
      title: 'Prompt Library',
      subtitle: 'Proven templates',
      icon: Icons.menu_book_rounded,
      route: '/home/prompts',
    ),
    HomeShortcut(
      title: 'Upgrade',
      subtitle: 'Unlock Pro limits',
      icon: Icons.workspace_premium_outlined,
      route: '/subscription',
    ),
  ];
});
