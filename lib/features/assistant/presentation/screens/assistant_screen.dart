import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:leroy_ai/core/theme/app_colors.dart';
import 'package:leroy_ai/features/chat/presentation/providers/chat_provider.dart';

class AssistantScreen extends ConsumerWidget {
  const AssistantScreen({super.key});

  static const _presets = [
    ('Write a marketing brief', 'Write a concise marketing brief for: '),
    ('Debug my code', 'Review this code and suggest fixes:\n'),
    ('Plan my day', 'Help me plan a productive day around these priorities:\n'),
    ('Summarize text', 'Summarize the following clearly:\n'),
  ];

  Future<void> _open(BuildContext context, WidgetRef ref, String seed) async {
    final session = await ref
        .read(chatListProvider.notifier)
        .createSession(title: 'AI Assistant');
    if (session == null || !context.mounted) return;
    context.push('/chat/${session.id}?prompt=${Uri.encodeComponent(seed)}');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('AI Assistant')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'Choose a focused assistant workflow. Each opens a live Firebase-backed chat.',
            style: theme.textTheme.bodyLarge?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 20),
          ..._presets.map(
            (p) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(
                    color: theme.colorScheme.outline.withValues(alpha: 0.4),
                  ),
                ),
                leading: const Icon(Icons.smart_toy_outlined,
                    color: AppColors.teal),
                title: Text(p.$1),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => _open(context, ref, p.$2),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
