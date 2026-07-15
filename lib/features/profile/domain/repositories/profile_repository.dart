import '../../../auth/domain/entities/user_entity.dart';
import '../../../../core/utils/typedefs.dart';

abstract class ProfileRepository {
  ResultFuture<UserEntity> getProfile(String uid);
  ResultFuture<UserEntity> updateDisplayName(String displayName);
}
