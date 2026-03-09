import 'package:dio/dio.dart';

import '../../../core/config/env.dart';
import '../../../core/network/api_client.dart';
import '../models/auth_user.dart';
import 'auth_storage.dart';

/// 리프레시 토큰으로 액세스 토큰 갱신. ApiClient 401 재시도용(순환 의존 방지).
Future<String?> refreshAccessToken(AuthStorage storage) async {
  final refreshToken = await storage.getRefreshToken();
  if (refreshToken == null || refreshToken.isEmpty) return null;
  final dio = Dio(BaseOptions(
    baseUrl: Env.apiBaseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 15),
    headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
  ));
  try {
    final res = await dio.post<Map<String, dynamic>>(
      '/auth/refresh',
      data: {'refreshToken': refreshToken},
    );
    if (res.data == null) return null;
    final result = AuthResult.fromJson(res.data!);
    await storage.setTokens(result.accessToken, result.refreshToken);
    await storage.setUser(result.user);
    return result.accessToken;
  } on DioException catch (e) {
    // 리프레시 토큰이 진짜 만료/무효(401)일 때만 완전히 로그아웃
    if (e.response?.statusCode == 401) {
      await storage.clear();
    }
    // 네트워크 오류 등 다른 경우에는 토큰은 유지하되, 이번 요청만 실패 처리
    return null;
  } catch (_) {
    return null;
  }
}

class AuthRepository {
  AuthRepository({
    required ApiClient apiClient,
    required AuthStorage storage,
  })  : _api = apiClient,
        _storage = storage;

  final ApiClient _api;
  final AuthStorage _storage;

  Future<AuthResult?> login(String email, String password, {bool autoLogin = true}) async {
    final res = await _api.post<Map<String, dynamic>>(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    if (res.data == null) return null;
    final result = AuthResult.fromJson(res.data!);
    await _storage.setTokens(result.accessToken, result.refreshToken);
    await _storage.setUser(result.user);
    await _storage.setAutoLogin(autoLogin);
    await _storage.setLastEmail(email);
    if (autoLogin) {
      await _storage.setLastPassword(password);
    }
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

  Future<String?> getLastEmail() async => _storage.getLastEmail();

  Future<String?> getLastPassword() async => _storage.getLastPassword();

  Future<bool> getAutoLogin() async => _storage.getAutoLogin();

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
