import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import 'package:leroy_ai/core/theme/app_colors.dart';
import 'package:leroy_ai/core/utils/media_saver.dart';
import 'package:leroy_ai/core/utils/snackbar_utils.dart';
import 'package:leroy_ai/core/widgets/common_widgets.dart';
import 'package:leroy_ai/features/history/presentation/providers/history_provider.dart';

class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});

  IconData _icon(String type) {
    switch (type) {
      case 'image':
        return Icons.image_outlined;
      case 'video':
        return Icons.videocam_outlined;
      case 'chat':
        return Icons.forum_outlined;
      default:
        return Icons.history;
    }
  }

  Future<void> _download(BuildContext context, String type, String url) async {
    try {
      if (type == 'video') {
        await MediaSaver.saveVideoFromUrl(url);
      } else {
        await MediaSaver.saveImageFromUrl(url);
      }
      if (context.mounted) {
        AppSnackBar.success(context, 'Saved to gallery');
      }
    } catch (e) {
      if (context.mounted) {
        AppSnackBar.show(context, e.toString(), isError: true);
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(historyProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('History')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              onChanged: (v) => ref.read(historyProvider.notifier).setQuery(v),
              decoration: const InputDecoration(
                hintText: 'Search history…',
                prefixIcon: Icon(Icons.search_rounded),
              ),
            ),
          ),
          Expanded(
            child: state.isLoading
                ? const LoadingView()
                : state.items.isEmpty
                    ? const EmptyStateView(
                        icon: Icons.history,
                        title: 'No history yet',
                        message:
                            'Generated images, videos, and chats will appear here.',
                      )
                    : RefreshIndicator(
                        color: AppColors.teal,
                        onRefresh: () =>
                            ref.read(historyProvider.notifier).load(),
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: state.items.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final item = state.items[index];
                            return Dismissible(
                              key: ValueKey(item.id),
                              direction: DismissDirection.endToStart,
                              background: Container(
                                alignment: Alignment.centerRight,
                                padding: const EdgeInsets.only(right: 20),
                                color: AppColors.coral,
                                child: const Icon(Icons.delete,
                                    color: Colors.white),
                              ),
                              onDismissed: (_) => ref
                                  .read(historyProvider.notifier)
                                  .delete(item.id),
                              child: ListTile(
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                  side: BorderSide(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .outline
                                        .withValues(alpha: 0.4),
                                  ),
                                ),
                                leading: Icon(_icon(item.type),
                                    color: AppColors.teal),
                                title: Text(item.title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis),
                                subtitle: Text(item.type.toUpperCase()),
                                trailing: item.url == null
                                    ? IconButton(
                                        tooltip: 'Delete',
                                        onPressed: () => ref
                                            .read(historyProvider.notifier)
                                            .delete(item.id),
                                        icon: const Icon(Icons.delete_outline),
                                      )
                                    : PopupMenuButton<String>(
                                        onSelected: (value) async {
                                          if (value == 'download') {
                                            await _download(
                                              context,
                                              item.type,
                                              item.url!,
                                            );
                                          } else if (value == 'share') {
                                            await Share.share(item.url!);
                                          } else if (value == 'delete') {
                                            await ref
                                                .read(historyProvider.notifier)
                                                .delete(item.id);
                                          }
                                        },
                                        itemBuilder: (_) => const [
                                          PopupMenuItem(
                                              value: 'download',
                                              child: Text('Download')),
                                          PopupMenuItem(
                                              value: 'share',
                                              child: Text('Share')),
                                          PopupMenuItem(
                                              value: 'delete',
                                              child: Text('Delete')),
                                        ],
                                      ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
