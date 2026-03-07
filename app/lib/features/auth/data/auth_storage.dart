import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/auth_user.dart';

const _keyAccessToken = 'access_token';
const _keyRefreshToken = 'refresh_token';
const _keyUserJson = 'user_json';

class AuthStorage {
  AuthStorage({SharedPreferences? prefs}) : _prefs = prefs;
  SharedPreferences? _prefs;

  Future<SharedPreferences> get _p async =>
      _prefs ??= await SharedPreferences.getInstance();

  Future<String?> getAccessToken() async {
    return (await _p).getString(_keyAccessToken);
  }

  Future<void> setTokens(String accessToken, String refreshToken) async {
    final p = await _p;
    await p.setString(_keyAccessToken, accessToken);
    await p.setString(_keyRefreshToken, refreshToken);
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

  Future<void> clear() async {
    final p = await _p;
    await p.remove(_keyAccessToken);
    await p.remove(_keyRefreshToken);
    await p.remove(_keyUserJson);
  }
}
