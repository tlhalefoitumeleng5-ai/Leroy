import 'package:leroy_ai/features/prompt_library/data/models/prompt_model.dart';

abstract class PromptRemoteDataSource {
  Future<List<PromptModel>> getPrompts({String? category, String? query});
  Future<PromptModel> toggleFavorite(String promptId);
  Future<List<String>> getCategories();
}

class LocalPromptDataSource implements PromptRemoteDataSource {
  LocalPromptDataSource() {
    _prompts = List.of(_seed);
  }

  late List<PromptModel> _prompts;

  static const _seed = <PromptModel>[
    PromptModel(
      id: 'p1',
      title: 'Product launch brief',
      content:
          'Write a concise product launch brief for {product}. Include audience, value prop, key messaging, and a 7-day rollout plan.',
      category: 'Marketing',
      tags: ['launch', 'copy'],
    ),
    PromptModel(
      id: 'p2',
      title: 'Code review assistant',
      content:
          'Review the following code for bugs, readability, and performance. Suggest concrete improvements with examples:\n\n{code}',
      category: 'Development',
      tags: ['code', 'review'],
    ),
    PromptModel(
      id: 'p3',
      title: 'Cinematic portrait',
      content:
          'Create a cinematic portrait of {subject}, soft rim light, shallow depth of field, 85mm lens, moody teal and amber color grade.',
      category: 'Image',
      tags: ['portrait', 'cinematic'],
    ),
    PromptModel(
      id: 'p4',
      title: 'Weekly reflection',
      content:
          'Help me reflect on my week. Ask 5 thoughtful questions, then summarize themes and suggest one improvement habit.',
      category: 'Personal',
      tags: ['journal', 'habits'],
    ),
    PromptModel(
      id: 'p5',
      title: 'Meeting summary',
      content:
          'Summarize this meeting transcript into decisions, owners, deadlines, and open questions:\n\n{transcript}',
      category: 'Productivity',
      tags: ['meetings', 'summary'],
    ),
    PromptModel(
      id: 'p6',
      title: 'Story world builder',
      content:
          'Build a vivid fictional world for a story about {theme}. Cover geography, culture, conflict, and a memorable opening scene.',
      category: 'Creative',
      tags: ['story', 'worldbuilding'],
    ),
    PromptModel(
      id: 'p7',
      title: 'SEO blog outline',
      content:
          'Create an SEO-optimized outline for a blog post targeting "{keyword}". Include H2/H3s, search intent notes, and CTA ideas.',
      category: 'Marketing',
      tags: ['seo', 'content'],
    ),
    PromptModel(
      id: 'p8',
      title: 'UI critique',
      content:
          'Critique this mobile UI concept for clarity, hierarchy, and accessibility. Propose 5 high-impact improvements.',
      category: 'Design',
      tags: ['ui', 'ux'],
    ),
  ];

  @override
  Future<List<PromptModel>> getPrompts({String? category, String? query}) async {
    var list = List<PromptModel>.of(_prompts);
    if (category != null && category != 'All') {
      list = list.where((p) => p.category == category).toList();
    }
    if (query != null && query.trim().isNotEmpty) {
      final q = query.toLowerCase();
      list = list
          .where((p) =>
              p.title.toLowerCase().contains(q) ||
              p.content.toLowerCase().contains(q) ||
              p.tags.any((t) => t.toLowerCase().contains(q)))
          .toList();
    }
    return list;
  }

  @override
  Future<PromptModel> toggleFavorite(String promptId) async {
    final index = _prompts.indexWhere((p) => p.id == promptId);
    if (index < 0) {
      throw Exception('Prompt not found');
    }
    final current = _prompts[index];
    final updated = PromptModel(
      id: current.id,
      title: current.title,
      content: current.content,
      category: current.category,
      isFavorite: !current.isFavorite,
      tags: current.tags,
    );
    _prompts[index] = updated;
    return updated;
  }

  @override
  Future<List<String>> getCategories() async {
    final cats = _prompts.map((p) => p.category).toSet().toList()..sort();
    return ['All', ...cats];
  }
}
