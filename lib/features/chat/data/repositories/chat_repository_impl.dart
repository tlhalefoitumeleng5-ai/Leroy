import 'package:dartz/dartz.dart';
import 'package:leroy_ai/core/errors/error_mapper.dart';
import 'package:leroy_ai/core/utils/typedefs.dart';
import 'package:leroy_ai/features/chat/data/datasources/chat_remote_datasource.dart';
import 'package:leroy_ai/features/chat/domain/entities/chat_entity.dart';
import 'package:leroy_ai/features/chat/domain/repositories/chat_repository.dart';

class ChatRepositoryImpl implements ChatRepository {
  ChatRepositoryImpl(this._remote);
  final ChatRemoteDataSource _remote;

  @override
  ResultFuture<List<ChatSession>> getSessions(String userId) async {
    try {
      return Right(await _remote.getSessions(userId));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<ChatSession> createSession(String userId, {String? title}) async {
    try {
      return Right(await _remote.createSession(userId, title: title));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<List<ChatMessage>> getMessages(
    String userId,
    String chatId,
  ) async {
    try {
      return Right(await _remote.getMessages(userId, chatId));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<ChatMessage> sendMessage({
    required String userId,
    required String chatId,
    required String content,
  }) async {
    try {
      return Right(await _remote.sendMessage(
        userId: userId,
        chatId: chatId,
        content: content,
      ));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<ChatMessage> regenerateLastReply({
    required String userId,
    required String chatId,
  }) async {
    try {
      return Right(await _remote.regenerateLastReply(
        userId: userId,
        chatId: chatId,
      ));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<void> deleteSession(String userId, String chatId) async {
    try {
      await _remote.deleteSession(userId, chatId);
      return const Right(null);
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }
}
