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
      final lastEmail = await _repository.getLastEmail();
      final lastPassword = await _repository.getLastPassword();

      // 자동로그인 켜져 있고, 마지막 로그인 정보가 있으면
      // 앱 시작 시 조용히 다시 로그인 시도
      if (autoLogin && lastEmail != null && lastPassword != null) {
        try {
          final result = await _repository.login(
            lastEmail,
            lastPassword,
            autoLogin: true,
          );
          _user = result?.user;
          return;
        } catch (_) {
          // 자동 로그인 실패 시에는 아래 로컬 사용자 복원 로직으로 이동
        }
      }

      // 위에서 자동 로그인에 실패했거나, 자동 로그인 설정이 꺼져 있는 경우:
      // 로컬에 저장된 사용자 정보를 우선 사용
      _user = await _repository.getStoredUser();
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
