import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../config/env.dart';

typedef GetToken = Future<String?> Function();
typedef RefreshToken = Future<String?> Function();

/// API HTTP 클라이언트. getToken이 있으면 요청 시 Bearer 토큰 첨부.
/// refreshToken이 있으면 401 시 토큰 갱신 후 1회 재시도.
/// 갱신 실패 시 onUnauthorized 호출(로그아웃 후 로그인 페이지 이동용).
class ApiClient {
  late final Dio _dio;
  void Function()? _onUnauthorized;

  ApiClient({
    String? baseUrl,
    GetToken? getToken,
    RefreshToken? refreshToken,
    void Function()? onUnauthorized,
  }) : _onUnauthorized = onUnauthorized {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl ?? Env.apiBaseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 60),
      sendTimeout: const Duration(seconds: 60),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    ));
    if (getToken != null) {
      _dio.interceptors.add(
        InterceptorsWrapper(
          onRequest: (options, handler) async {
            // 로그인/회원가입/토큰갱신 요청에는 Authorization 헤더를 붙이지 않는다.
            final path = options.path;
            final isAuthPath = path.contains('/auth/login') ||
                path.contains('/auth/register') ||
                path.contains('/auth/refresh');
            if (!isAuthPath) {
              final token = await getToken();
              if (token != null && token.isNotEmpty) {
                options.headers['Authorization'] = 'Bearer $token';
              }
            }
            handler.next(options);
          },
        ),
      );
    }
    if (getToken != null && refreshToken != null) {
      _dio.interceptors.add(
        InterceptorsWrapper(
          onError: (err, handler) async {
            // 401이 아니면 토큰 갱신 시도 안 함
            if (err.response?.statusCode != 401) {
              return handler.next(err);
            }

            final path = err.requestOptions.path;
            // 로그인/회원가입/토큰갱신 요청에서 발생한 401은 재시도하지 않는다.
            final isAuthPath = path.contains('/auth/login') ||
                path.contains('/auth/register') ||
                path.contains('/auth/refresh');
            if (isAuthPath) {
              return handler.next(err);
            }

            final newToken = await refreshToken();
            if (newToken == null || newToken.isEmpty) {
              _onUnauthorized?.call();
              return handler.next(err);
            }
            final opts = err.requestOptions;
            opts.headers['Authorization'] = 'Bearer $newToken';
            try {
              final response = await _dio.fetch(opts);
              return handler.resolve(response);
            } catch (_) {
              return handler.next(err);
            }
          },
        ),
      );
    }
    _dio.interceptors.add(
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        logPrint: (o) => debugPrint(o.toString()),
      ),
    );
  }

  Dio get dio => _dio;

  void setOnUnauthorized(void Function()? cb) {
    _onUnauthorized = cb;
  }

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) =>
      _dio.get<T>(path, queryParameters: queryParameters, options: options);

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Options? options,
  }) =>
      _dio.post<T>(path, data: data, options: options);

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Options? options,
  }) =>
      _dio.put<T>(path, data: data, options: options);

  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Options? options,
  }) =>
      _dio.patch<T>(path, data: data, options: options);

  Future<Response<T>> delete<T>(String path, {Options? options}) =>
      _dio.delete<T>(path, options: options);
}
