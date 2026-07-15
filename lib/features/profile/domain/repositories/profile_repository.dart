import 'package:leroy_ai/features/auth/domain/entities/user_entity.dart';
import 'package:leroy_ai/core/utils/typedefs.dart';

/// Profile operations delegate to auth repository in v1.
abstract class ProfileRepository {
  ResultFuture<UserEntity> updateDisplayName(String name);
}
