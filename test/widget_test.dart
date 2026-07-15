import 'package:flutter_test/flutter_test.dart';
import 'package:leroy_ai/core/utils/validators.dart';

void main() {
  test('default smoke — validators load', () {
    expect(Validators.email('hello@leroy.ai'), isNull);
  });
}
