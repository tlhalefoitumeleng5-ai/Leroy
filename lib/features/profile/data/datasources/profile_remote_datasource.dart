/// Profile remote datasource — wire to Firestore when leaving demo mode.
abstract class ProfileRemoteDataSource {
  Future<Map<String, dynamic>?> fetchProfile(String uid);
  Future<void> updateProfile(String uid, Map<String, dynamic> data);
}

class ProfileRemoteDataSourceStub implements ProfileRemoteDataSource {
  @override
  Future<Map<String, dynamic>?> fetchProfile(String uid) async => null;

  @override
  Future<void> updateProfile(String uid, Map<String, dynamic> data) async {}
}
