import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/auth_user.dart';

const _keyAccessToken = 'access_token';
const _keyRefreshToken = 'refresh_token';
const _keyUserJson = 'user_json';
const _keyAutoLogin = 'auto_login';
const _keyLastEmail = 'last_email';
const _keyLastPassword = 'last_password';

class AuthStorage {
  AuthStorage({SharedPreferences? prefs}) : _prefs = prefs;
  SharedPreferences? _prefs;

  Future<SharedPreferences> get _p async =>
      _prefs ??= await SharedPreferences.getInstance();

  Future<String?> getAccessToken() async {
    return (await _p).getString(_keyAccessToken);
  }

  Future<String?> getRefreshToken() async {
    return (await _p).getString(_keyRefreshToken);
  }

  Future<void> setTokens(String accessToken, String refreshToken) async {
    final p = await _p;
    await p.setString(_keyAccessToken, accessToken);
    await p.setString(_keyRefreshToken, refreshToken);
  }

  Future<bool> getAutoLogin() async {
    return (await _p).getBool(_keyAutoLogin) ?? true;
  }

  Future<void> setAutoLogin(bool value) async {
    await (await _p).setBool(_keyAutoLogin, value);
  }

  Future<void> setLastEmail(String email) async {
    await (await _p).setString(_keyLastEmail, email);
  }

  Future<String?> getLastEmail() async {
    return (await _p).getString(_keyLastEmail);
  }

  Future<void> setLastPassword(String password) async {
    await (await _p).setString(_keyLastPassword, password);
  }

  Future<String?> getLastPassword() async {
    return (await _p).getString(_keyLastPassword);
  }

  Future<void> setUser(AuthUser user) async {
    await (await _p).setString(_keyUserJson, jsonEncode(user.toJson()));
  }

  Future<AuthUser?> getStoredUser() async {
    final jsonStr = (await _p).getString(_keyUserJson);
    if (jsonStr == null || jsonStr.isEmpty) return null;
    try {
      return AuthUser.fromJson(
        Map<String, dynamic>.from(jsonDecode(jsonStr) as Map),
      );
    } catch (_) {
      return null;
    }
  }

  /// 로그아웃 시 호출. 토큰·사용자만 제거하고 자동로그인 설정은 유지.
  Future<void> clear() async {
    final p = await _p;
    await p.remove(_keyAccessToken);
    await p.remove(_keyRefreshToken);
    await p.remove(_keyUserJson);
    await p.remove(_keyLastPassword);
  }
}
