import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:leroy_ai/core/theme/app_colors.dart';
import 'package:leroy_ai/core/widgets/common_widgets.dart';
import 'package:leroy_ai/features/chat/presentation/providers/chat_provider.dart';

class ChatListScreen extends ConsumerWidget {
  const ChatListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(chatListProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Chat'),
        actions: [
          IconButton(
            tooltip: 'New chat',
            onPressed: () async {
              final session =
                  await ref.read(chatListProvider.notifier).createSession();
              if (session != null && context.mounted) {
                context.push('/chat/${session.id}');
              }
            },
            icon: const Icon(Icons.add_comment_outlined),
          ),
        ],
      ),
      body: state.isLoading
          ? const LoadingView(message: 'Loading conversations…')
          : state.sessions.isEmpty
              ? EmptyStateView(
                  icon: Icons.forum_outlined,
                  title: 'No conversations yet',
                  message: 'Start a new chat with Leroy AI.',
                  actionLabel: 'New chat',
                  onAction: () async {
                    final session = await ref
                        .read(chatListProvider.notifier)
                        .createSession();
                    if (session != null && context.mounted) {
                      context.push('/chat/${session.id}');
                    }
                  },
                )
              : RefreshIndicator(
                  color: AppColors.teal,
                  onRefresh: () => ref.read(chatListProvider.notifier).load(),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: state.sessions.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final session = state.sessions[index];
                      return Dismissible(
                        key: ValueKey(session.id),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          decoration: BoxDecoration(
                            color: AppColors.coral,
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: const Icon(Icons.delete, color: Colors.white),
                        ),
                        onDismissed: (_) => ref
                            .read(chatListProvider.notifier)
                            .deleteSession(session.id),
                        child: Material(
                          color: theme.colorScheme.surface,
                          borderRadius: BorderRadius.circular(18),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(18),
                            onTap: () => context.push('/chat/${session.id}'),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(
                                  color: theme.colorScheme.outline
                                      .withValues(alpha: 0.4),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color:
                                          AppColors.teal.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    child: const Icon(
                                      Icons.chat_bubble_outline_rounded,
                                      color: AppColors.teal,
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          session.title,
                                          style: theme.textTheme.titleMedium,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          session.lastMessage ??
                                              'No messages yet',
                                          style: theme.textTheme.bodySmall,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),
                                  Text(
                                    DateFormat.MMMd().format(session.updatedAt),
                                    style: theme.textTheme.labelSmall,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final session =
              await ref.read(chatListProvider.notifier).createSession();
          if (session != null && context.mounted) {
            context.push('/chat/${session.id}');
          }
        },
        backgroundColor: AppColors.teal,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.auto_awesome),
        label: const Text('New chat'),
      ),
    );
  }
}
