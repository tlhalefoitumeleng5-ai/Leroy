import 'package:flutter/material.dart';

import '../../../../core/constants/app_strings.dart';
import '../../../../core/theme/app_colors.dart';

class ChatInputBar extends StatefulWidget {
  const ChatInputBar({
    super.key,
    required this.onSend,
    this.enabled = true,
  });

  final ValueChanged<String> onSend;
  final bool enabled;

  @override
  State<ChatInputBar> createState() => _ChatInputBarState();
}

class _ChatInputBarState extends State<ChatInputBar> {
  final _controller = TextEditingController();

  void _submit() {
    final text = _controller.text;
    if (text.trim().isEmpty) return;
    widget.onSend(text);
    _controller.clear();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _controller,
                enabled: widget.enabled,
                minLines: 1,
                maxLines: 5,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _submit(),
                decoration: InputDecoration(
                  hintText: AppStrings.typeMessage,
                  filled: true,
                  fillColor: isDark ? AppColors.darkSurfaceAlt : Colors.white,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Material(
              color: AppColors.brandAqua,
              borderRadius: BorderRadius.circular(14),
              child: InkWell(
                onTap: widget.enabled ? _submit : null,
                borderRadius: BorderRadius.circular(14),
                child: const SizedBox(
                  width: 52,
                  height: 52,
                  child: Icon(Icons.arrow_upward_rounded, color: AppColors.brandInk),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
