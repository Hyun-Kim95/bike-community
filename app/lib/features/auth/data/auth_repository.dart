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

  /// GET /users/me - 현재 로그인 사용자 상세 (프로필 수정용). storage에도 반영
  Future<AuthUser?> getMe() async {
    final res = await _api.get<Map<String, dynamic>>('/users/me');
    if (res.data == null) return null;
    final user = AuthUser.fromJson(Map<String, dynamic>.from(res.data!));
    await _storage.setUser(user);
    return user;
  }

  /// PATCH /users/me - 프로필 수정 후 저장된 사용자 갱신
  Future<AuthUser?> updateProfile({
    String? nickname,
    String? avatarUrl,
    String? bio,
    List<String>? interestCategories,
    String? region,
  }) async {
    final data = <String, dynamic>{};
    if (nickname != null) data['nickname'] = nickname;
    if (avatarUrl != null) data['avatarUrl'] = avatarUrl;
    if (bio != null) data['bio'] = bio;
    if (interestCategories != null) data['interestCategories'] = interestCategories;
    if (region != null) data['region'] = region;

    final res = await _api.patch<Map<String, dynamic>>('/users/me', data: data);
    if (res.data == null) return null;
    final user = AuthUser.fromJson(Map<String, dynamic>.from(res.data!));
    await _storage.setUser(user);
    return user;
  }
}
