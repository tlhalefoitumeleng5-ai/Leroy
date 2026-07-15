import 'package:intl/intl.dart';

abstract final class AppDateUtils {
  static String formatChatTime(DateTime dt) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final date = DateTime(dt.year, dt.month, dt.day);
    if (date == today) {
      return DateFormat.jm().format(dt);
    }
    if (date == today.subtract(const Duration(days: 1))) {
      return 'Yesterday';
    }
    return DateFormat.MMMd().format(dt);
  }

  static String formatRelative(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat.yMMMd().format(dt);
  }
}
