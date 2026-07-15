import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:leroy_ai/core/theme/app_colors.dart';
import 'package:leroy_ai/core/utils/snackbar_utils.dart';
import 'package:leroy_ai/core/widgets/common_widgets.dart';
import 'package:leroy_ai/features/prompt_library/presentation/providers/prompt_provider.dart';

class PromptLibraryScreen extends ConsumerWidget {
  const PromptLibraryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(promptLibraryProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Prompt Library')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: TextField(
              onChanged: (v) =>
                  ref.read(promptLibraryProvider.notifier).setQuery(v),
              decoration: const InputDecoration(
                hintText: 'Search prompts…',
                prefixIcon: Icon(Icons.search_rounded),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 42,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: state.categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final cat = state.categories[index];
                final selected = cat == state.selectedCategory;
                return ChoiceChip(
                  label: Text(cat),
                  selected: selected,
                  onSelected: (_) => ref
                      .read(promptLibraryProvider.notifier)
                      .setCategory(cat),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: state.isLoading
                ? const LoadingView()
                : state.prompts.isEmpty
                    ? const EmptyStateView(
                        icon: Icons.menu_book_outlined,
                        title: 'No prompts found',
                        message: 'Try another category or search term.',
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: state.prompts.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final prompt = state.prompts[index];
                          return Material(
                            color: theme.colorScheme.surface,
                            borderRadius: BorderRadius.circular(20),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: theme.colorScheme.outline
                                      .withValues(alpha: 0.4),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          prompt.title,
                                          style: theme.textTheme.titleMedium,
                                        ),
                                      ),
                                      IconButton(
                                        onPressed: () => ref
                                            .read(promptLibraryProvider
                                                .notifier)
                                            .toggleFavorite(prompt.id),
                                        icon: Icon(
                                          prompt.isFavorite
                                              ? Icons.favorite_rounded
                                              : Icons.favorite_border_rounded,
                                          color: prompt.isFavorite
                                              ? AppColors.coral
                                              : null,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Text(
                                    prompt.category,
                                    style: theme.textTheme.labelMedium?.copyWith(
                                      color: AppColors.teal,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    prompt.content,
                                    style: theme.textTheme.bodyMedium,
                                    maxLines: 4,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 12),
                                  Align(
                                    alignment: Alignment.centerRight,
                                    child: TextButton.icon(
                                      onPressed: () async {
                                        await Clipboard.setData(
                                          ClipboardData(text: prompt.content),
                                        );
                                        if (context.mounted) {
                                          AppSnackBar.success(
                                            context,
                                            'Prompt copied',
                                          );
                                        }
                                      },
                                      icon: const Icon(Icons.copy_rounded, size: 18),
                                      label: const Text('Copy'),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
