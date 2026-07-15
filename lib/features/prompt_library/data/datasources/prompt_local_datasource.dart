import '../../domain/entities/prompt_entity.dart';

class PromptLocalDataSource {
  final _favorites = <String>{};

  static const _seed = <PromptEntity>[
    PromptEntity(
      id: '1',
      title: 'Brand voice rewrite',
      content:
          'Rewrite the following copy in a confident, modern brand voice. Keep it concise and remove jargon:\n\n{{text}}',
      category: 'Writing',
      tags: ['brand', 'copy'],
    ),
    PromptEntity(
      id: '2',
      title: 'Product feature bullets',
      content:
          'Turn these notes into 5 benefit-led feature bullets for a landing page. Audience: {{audience}}.\n\nNotes:\n{{notes}}',
      category: 'Writing',
      tags: ['product', 'marketing'],
    ),
    PromptEntity(
      id: '3',
      title: 'Cinematic product shot',
      content:
          'Ultra-detailed product photo of {{product}}, soft teal rim light, dark slate backdrop, 85mm lens, shallow depth of field, premium advertising style',
      category: 'Image',
      tags: ['product', 'photo'],
    ),
    PromptEntity(
      id: '4',
      title: 'Abstract atmosphere',
      content:
          'Abstract atmospheric composition suggesting {{mood}}, flowing teal and charcoal forms, soft grain, editorial art direction, no text',
      category: 'Image',
      tags: ['abstract', 'mood'],
    ),
    PromptEntity(
      id: '5',
      title: 'Meeting summary',
      content:
          'Summarize this transcript into: decisions, action items (owner + due), and open questions.\n\n{{transcript}}',
      category: 'Productivity',
      tags: ['meetings', 'summary'],
    ),
    PromptEntity(
      id: '6',
      title: 'Code explainer',
      content:
          'Explain this code to a mid-level engineer. Cover intent, edge cases, and one improvement:\n\n```\n{{code}}\n```',
      category: 'Code',
      tags: ['engineering'],
    ),
    PromptEntity(
      id: '7',
      title: 'Social carousel outline',
      content:
          'Create a 6-slide LinkedIn carousel outline about {{topic}}. Each slide: headline + 1 sentence. Tone: practical and sharp.',
      category: 'Marketing',
      tags: ['social', 'linkedin'],
    ),
    PromptEntity(
      id: '8',
      title: 'Customer email reply',
      content:
          'Draft an empathetic support reply for: {{issue}}. Offer a clear next step and keep under 120 words.',
      category: 'Writing',
      tags: ['support', 'email'],
    ),
    PromptEntity(
      id: '9',
      title: 'Storyboard frames',
      content:
          'Create 4 storyboard frames for an ad about {{product}}. For each: shot type, visual, on-screen text, and voiceover line.',
      category: 'Creative',
      tags: ['ads', 'storyboard'],
    ),
    PromptEntity(
      id: '10',
      title: 'SQL from English',
      content:
          'Write readable SQL for: {{request}}. Assume Postgres. Explain joins briefly after the query.',
      category: 'Code',
      tags: ['sql', 'data'],
    ),
  ];

  Future<List<PromptEntity>> getPrompts({String? category, String? query}) async {
    await Future<void>.delayed(const Duration(milliseconds: 150));
    var list = _seed.map((p) {
      return p.copyWith(isFavorite: _favorites.contains(p.id));
    }).toList();
    if (category != null && category != 'All') {
      list = list.where((p) => p.category == category).toList();
    }
    if (query != null && query.trim().isNotEmpty) {
      final q = query.toLowerCase();
      list = list
          .where((p) =>
              p.title.toLowerCase().contains(q) ||
              p.content.toLowerCase().contains(q) ||
              p.tags.any((t) => t.contains(q)))
          .toList();
    }
    return list;
  }

  Future<List<String>> getCategories() async {
    final cats = _seed.map((p) => p.category).toSet().toList()..sort();
    return ['All', ...cats];
  }

  Future<PromptEntity> toggleFavorite(String id) async {
    if (_favorites.contains(id)) {
      _favorites.remove(id);
    } else {
      _favorites.add(id);
    }
    final base = _seed.firstWhere((p) => p.id == id);
    return base.copyWith(isFavorite: _favorites.contains(id));
  }
}
