import 'package:flutter_test/flutter_test.dart';

import 'package:gramone/main.dart';

void main() {
  testWidgets('Foundation home renders', (WidgetTester tester) async {
    await tester.pumpWidget(const GramOneApp());

    expect(find.text('GramOne'), findsWidgets);
    expect(find.textContaining('foundation'), findsWidgets);
  });
}