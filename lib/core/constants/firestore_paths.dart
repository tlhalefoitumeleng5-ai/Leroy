/// Typed Firestore path helpers.
abstract final class FirestorePaths {
  static String user(String uid) => 'users/$uid';
  static String userChats(String uid) => 'users/$uid/chats';
  static String chat(String uid, String chatId) => 'users/$uid/chats/$chatId';
  static String chatMessages(String uid, String chatId) =>
      'users/$uid/chats/$chatId/messages';
  static String userImages(String uid) => 'users/$uid/images';
  static String userSubscription(String uid) => 'users/$uid/subscription/current';
  static const String publicPrompts = 'prompts';
}
