import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/widgets/error_view.dart';
import '../providers/prompt_providers.dart';
import '../widgets/prompt_card.dart';

class PromptLibraryScreen extends ConsumerWidget {
  const PromptLibraryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final promptsAsync = ref.watch(promptsProvider);
    final categoriesAsync = ref.watch(promptCategoriesProvider);
    final selected = ref.watch(promptCategoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Prompt Library')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: TextField(
              onChanged: (v) => ref.read(promptQueryProvider.notifier).state = v,
              decoration: const InputDecoration(
                hintText: 'Search prompts…',
                prefixIcon: Icon(Icons.search_rounded),
              ),
            ),
          ),
          SizedBox(
            height: 44,
            child: categoriesAsync.when(
              data: (cats) => ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: cats.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final cat = cats[i];
                  return ChoiceChip(
                    label: Text(cat),
                    selected: cat == selected,
                    onSelected: (_) =>
                        ref.read(promptCategoryProvider.notifier).state = cat,
                  );
                },
              ),
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: promptsAsync.when(
              data: (prompts) {
                if (prompts.isEmpty) {
                  return const Center(child: Text('No prompts found'));
                }
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  itemCount: prompts.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (_, i) {
                    final p = prompts[i];
                    return PromptCard(
                      prompt: p,
                      onFavorite: () async {
                        await ref.read(promptRepositoryProvider).toggleFavorite(p.id);
                        ref.invalidate(promptsProvider);
                      },
                      onUse: () {
                        context.showSnack('Opening chat with prompt…');
                        context.go('/home/chat');
                      },
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => ErrorView(
                message: e.toString(),
                onRetry: () => ref.invalidate(promptsProvider),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
