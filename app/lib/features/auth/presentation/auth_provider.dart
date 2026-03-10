import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../data/auth_repository.dart';
import '../models/auth_user.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider({required AuthRepository repository}) : _repository = repository {
    loadStoredUser();
  }

  final AuthRepository _repository;
  AuthUser? _user;
  bool _loading = false;
  bool _initialized = false;
  String? _error;

  AuthUser? get user => _user;
  bool get isLoggedIn => _user != null;
  bool get loading => _loading;
  bool get initialized => _initialized;
  String? get error => _error;

  Future<void> loadStoredUser() async {
    try {
      final autoLogin = await _repository.getAutoLogin();
      if (!autoLogin) {
        // 자동 로그인이 꺼져 있으면, 앱 재시작 시마다 로그인 화면부터 시작
        _user = null;
        return;
      }

      // 1순위: 로컬에 저장된 사용자 정보로 바로 복원
      final stored = await _repository.getStoredUser();
      if (stored != null) {
        _user = stored;
        return;
      }

      // 2순위: 토큰이 있을 때만 서버에서 내 정보 재조회
      final token = await _repository.getAccessToken();
      if (token == null || token.isEmpty) {
        _user = null;
        return;
      }

      try {
        final me = await _repository.getMe();
        _user = me;
      } catch (_) {
        _user = null;
      }
    } catch (_) {
      _user = null;
    } finally {
      _initialized = true;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password, {bool autoLogin = true}) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final result = await _repository.login(email, password, autoLogin: autoLogin);
      if (result == null) {
        _error = '로그인에 실패했습니다.';
        return false;
      }
      _user = result.user;
      _error = null;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _errorMessage(e);
      notifyListeners();
      return false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<String?> getLastEmail() async => _repository.getLastEmail();

  Future<bool> register({
    required String email,
    required String password,
    required String nickname,
    String? region,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final result = await _repository.register(
        email: email,
        password: password,
        nickname: nickname,
        region: region,
      );
      if (result == null) {
        _error = '회원가입에 실패했습니다.';
        return false;
      }
      _user = result.user;
      _error = null;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _errorMessage(e);
      notifyListeners();
      return false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  static String _errorMessage(dynamic e) {
    if (e is DioException && e.response?.data is Map) {
      final msg = e.response!.data['message'];
      if (msg != null && msg is String) return msg;
    }
    return e.toString().replaceFirst('DioException: ', '');
  }

  Future<void> logout() async {
    await _repository.logout();
    _user = null;
    _error = null;
    notifyListeners();
  }

  Future<bool> getAutoLogin() async => _repository.getAutoLogin();

  /// 서버에서 최신 사용자 정보를 가져와 반영 (프로필 수정 화면 로드 시)
  Future<AuthUser?> getMe() async {
    try {
      final u = await _repository.getMe();
      if (u != null) {
        _user = u;
        notifyListeners();
      }
      return u;
    } catch (_) {
      return null;
    }
  }

  /// 프로필 수정 저장. repository에서 storage까지 갱신함
  Future<bool> updateProfile({
    String? nickname,
    String? avatarUrl,
    String? bio,
    List<String>? interestCategories,
    String? region,
  }) async {
    _error = null;
    try {
      final u = await _repository.updateProfile(
        nickname: nickname,
        avatarUrl: avatarUrl,
        bio: bio,
        interestCategories: interestCategories,
        region: region,
      );
      if (u == null) return false;
      _user = u;
      notifyListeners();
      return true;
    } catch (e) {
      _error = _errorMessage(e);
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
