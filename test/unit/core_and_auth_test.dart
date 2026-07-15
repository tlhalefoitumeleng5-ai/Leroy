import 'package:flutter_test/flutter_test.dart';
import 'package:leroy_ai/core/utils/validators.dart';
import 'package:leroy_ai/core/extensions/string_extensions.dart';
import 'package:leroy_ai/features/auth/domain/entities/user_entity.dart';

void main() {
  group('Validators', () {
    test('email validates correctly', () {
      expect(Validators.email(null), isNotNull);
      expect(Validators.email(''), isNotNull);
      expect(Validators.email('bad'), isNotNull);
      expect(Validators.email('user@leroy.ai'), isNull);
    });

    test('password requires 6+ chars', () {
      expect(Validators.password('123'), isNotNull);
      expect(Validators.password('123456'), isNull);
    });

    test('confirm password matches', () {
      expect(Validators.confirmPassword('abc', 'xyz'), isNotNull);
      expect(Validators.confirmPassword('secret', 'secret'), isNull);
    });
  });

  group('String extensions', () {
    test('initials', () {
      expect('Leroy AI'.initials, 'LA');
      expect('Ada'.initials, 'A');
    });

    test('isValidEmail', () {
      expect('a@b.com'.isValidEmail, isTrue);
      expect('nope'.isValidEmail, isFalse);
    });
  });

  group('UserEntity', () {
    test('isPro for pro/enterprise', () {
      const free = UserEntity(id: '1', email: 'a@b.c', displayName: 'A');
      const pro = UserEntity(
        id: '2',
        email: 'a@b.c',
        displayName: 'A',
        planId: 'pro',
      );
      expect(free.isPro, isFalse);
      expect(pro.isPro, isTrue);
    });
  });
}
