import '../../../core/network/api_client.dart';
import '../models/auth_user.dart';
import 'auth_storage.dart';

class AuthRepository {
  AuthRepository({
    required ApiClient apiClient,
    required AuthStorage storage,
  })  : _api = apiClient,
        _storage = storage;

  final ApiClient _api;
  final AuthStorage _storage;

  Future<AuthResult?> login(String email, String password) async {
    final res = await _api.post<Map<String, dynamic>>(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    if (res.data == null) return null;
    final result = AuthResult.fromJson(res.data!);
    await _storage.setTokens(result.accessToken, result.refreshToken);
    await _storage.setUser(result.user);
    return result;
  }

  Future<AuthResult?> register({
    required String email,
    required String password,
    required String nickname,
    String? avatarUrl,
    List<String>? interestCategories,
    String? region,
  }) async {
    final data = <String, dynamic>{
      'email': email,
      'password': password,
      'nickname': nickname,
    };
    if (avatarUrl != null) data['avatarUrl'] = avatarUrl;
    if (interestCategories != null) data['interestCategories'] = interestCategories;
    if (region != null) data['region'] = region;

    final res = await _api.post<Map<String, dynamic>>('/auth/register', data: data);
    if (res.data == null) return null;
    final result = AuthResult.fromJson(res.data!);
    await _storage.setTokens(result.accessToken, result.refreshToken);
    await _storage.setUser(result.user);
    return result;
  }

  Future<String?> getAccessToken() async => _storage.getAccessToken();

  Future<AuthUser?> getStoredUser() async => _storage.getStoredUser();

  Future<void> logout() async => _storage.clear();
}
