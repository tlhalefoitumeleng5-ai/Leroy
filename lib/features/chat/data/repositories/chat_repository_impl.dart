import 'package:dartz/dartz.dart';

import '../../../../core/errors/error_mapper.dart';
import '../../../../core/utils/typedefs.dart';
import '../../domain/entities/chat_message.dart';
import '../../domain/repositories/chat_repository.dart';
import '../datasources/chat_demo_datasource.dart';

class ChatRepositoryImpl implements ChatRepository {
  ChatRepositoryImpl(this._demo);

  final ChatDemoDataSource _demo;

  @override
  ResultFuture<List<ChatSession>> getSessions() async {
    try {
      return Right(await _demo.getSessions());
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<List<ChatMessage>> getMessages(String sessionId) async {
    try {
      return Right(await _demo.getMessages(sessionId));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<ChatSession> createSession({String? title}) async {
    try {
      return Right(await _demo.createSession(title: title));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultFuture<ChatMessage> sendMessage({
    required String sessionId,
    required String content,
  }) async {
    try {
      return Right(await _demo.sendMessage(sessionId: sessionId, content: content));
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }

  @override
  ResultVoid deleteSession(String sessionId) async {
    try {
      await _demo.deleteSession(sessionId);
      return const Right(null);
    } catch (e) {
      return Left(mapExceptionToFailure(e));
    }
  }
}
