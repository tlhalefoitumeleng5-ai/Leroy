import 'package:equatable/equatable.dart';

class ProfileStats extends Equatable {
  const ProfileStats({
    this.chats = 0,
    this.images = 0,
    this.promptsSaved = 0,
  });

  final int chats;
  final int images;
  final int promptsSaved;

  @override
  List<Object?> get props => [chats, images, promptsSaved];
}
