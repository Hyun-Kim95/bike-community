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
      _user = await _repository.getStoredUser();
    } catch (_) {
      _user = null;
    } finally {
      _initialized = true;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final result = await _repository.login(email, password);
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
