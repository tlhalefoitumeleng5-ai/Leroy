import 'package:flutter_test/flutter_test.dart';
import 'package:leroy_ai/core/utils/validators.dart';
import 'package:leroy_ai/features/auth/data/models/user_model.dart';

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
      final model = UserModel(
        id: 'u1',
        email: 'founder@leroyai.solutions',
        displayName: 'Tlhalefo',
        plan: 'pro',
        emailVerified: true,
        createdAt: DateTime(2026, 1, 1),
      );
      final mapped = UserModel.fromMap(model.toMap());
      expect(mapped.id, model.id);
      expect(mapped.email, model.email);
      expect(mapped.plan, 'pro');
      expect(mapped.emailVerified, isTrue);
    });
  });
}
