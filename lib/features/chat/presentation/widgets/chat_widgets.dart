import 'package:flutter/material.dart';
import 'package:leroy_ai/core/theme/app_colors.dart';

/// Animated typing dots shown while the assistant is responding.
class ChatTypingIndicator extends StatelessWidget {
  const ChatTypingIndicator({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: List.generate(3, (i) {
          return Container(
            width: 7,
            height: 7,
            margin: EdgeInsets.only(right: i == 2 ? 0 : 5),
            decoration: const BoxDecoration(
              color: AppColors.teal,
              shape: BoxShape.circle,
            ),
          );
        }),
      ),
    );
  }
}
