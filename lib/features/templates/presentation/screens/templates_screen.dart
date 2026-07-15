import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:leroy_ai/core/theme/app_colors.dart';
import 'package:leroy_ai/core/widgets/common_widgets.dart';
import 'package:leroy_ai/features/chat/presentation/providers/chat_provider.dart';
import 'package:leroy_ai/features/prompt_library/domain/entities/prompt_entity.dart';
import 'package:leroy_ai/shared/providers/dependency_providers.dart';

final templatesProvider =
    FutureProvider.autoDispose<List<PromptEntity>>((ref) async {
  return ref.watch(templatesDataSourceProvider).getTemplates();
});

class TemplatesScreen extends ConsumerWidget {
  const TemplatesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(templatesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Templates')),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => EmptyStateView(
          icon: Icons.error_outline,
          title: 'Unable to load templates',
          message: e.toString(),
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(templatesProvider),
        ),
        data: (templates) {
          if (templates.isEmpty) {
            return const EmptyStateView(
              icon: Icons.dashboard_customize_outlined,
              title: 'No templates yet',
              message:
                  'Add documents to the Firestore templates collection to populate this screen.',
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: templates.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final t = templates[index];
              return ListTile(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(
                    color: Theme.of(context)
                        .colorScheme
                        .outline
                        .withValues(alpha: 0.4),
                  ),
                ),
                leading: const Icon(Icons.description_outlined,
                    color: AppColors.teal),
                title: Text(t.title),
                subtitle: Text(t.category),
                trailing: const Icon(Icons.chat_outlined),
                onTap: () async {
                  final session = await ref
                      .read(chatListProvider.notifier)
                      .createSession(title: t.title);
                  if (session == null || !context.mounted) return;
                  context.push(
                    '/chat/${session.id}?prompt=${Uri.encodeComponent(t.content)}',
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}
