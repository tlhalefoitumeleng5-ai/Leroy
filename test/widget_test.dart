import 'package:flutter_test/flutter_test.dart';
import 'package:leroy_ai/core/utils/validators.dart';
import 'package:leroy_ai/features/auth/data/models/user_model.dart';
import 'package:leroy_ai/features/prompt_library/data/datasources/prompt_remote_datasource.dart';

void main() {
  group('Validators', () {
    test('email rejects empty and invalid', () {
      expect(Validators.email(null), isNotNull);
      expect(Validators.email(''), isNotNull);
      expect(Validators.email('not-an-email'), isNotNull);
      expect(Validators.email('you@leroy.ai'), isNull);
    });

    test('password enforces minimum length', () {
      expect(Validators.password('short'), isNotNull);
      expect(Validators.password('longenough'), isNull);
    });

    test('confirm password matches', () {
      expect(Validators.confirmPassword('abc', 'xyz'), isNotNull);
      expect(Validators.confirmPassword('secret12', 'secret12'), isNull);
    });
  });

  group('UserModel', () {
    test('serializes to and from map', () {
      final model = UserModel.demo();
      final mapped = UserModel.fromMap(model.toMap());
      expect(mapped.id, model.id);
      expect(mapped.email, model.email);
      expect(mapped.plan, 'pro');
    });
  });

  group('Prompt library', () {
    test('returns seeded prompts and categories', () async {
      final source = LocalPromptDataSource();
      final prompts = await source.getPrompts();
      final categories = await source.getCategories();
      expect(prompts, isNotEmpty);
      expect(categories.first, 'All');
      expect(categories.length, greaterThan(1));
    });

    test('filters by category and toggles favorite', () async {
      final source = LocalPromptDataSource();
      final marketing = await source.getPrompts(category: 'Marketing');
      expect(marketing.every((p) => p.category == 'Marketing'), isTrue);

      final toggled = await source.toggleFavorite(marketing.first.id);
      expect(toggled.isFavorite, isTrue);
    });
  });
}
