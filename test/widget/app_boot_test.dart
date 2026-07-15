import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:leroy_ai/core/theme/app_theme.dart';
import 'package:leroy_ai/core/widgets/leroy_logo.dart';
import 'package:leroy_ai/core/widgets/primary_button.dart';

void main() {
  testWidgets('LeroyLogo renders brand wordmark', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: const Scaffold(body: Center(child: LeroyLogo())),
      ),
    );

    expect(find.byType(LeroyLogo), findsOneWidget);
    expect(find.text('Leroy AI'), findsOneWidget);
    expect(find.text('L'), findsOneWidget);
  });

  testWidgets('PrimaryButton invokes callback', (tester) async {
    var tapped = false;
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light(),
        home: Scaffold(
          body: PrimaryButton(
            label: 'Continue',
            onPressed: () => tapped = true,
          ),
        ),
      ),
    );

    await tester.tap(find.text('Continue'));
    expect(tapped, isTrue);
  });
}
