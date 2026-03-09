import 'dart:io';

import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';

import '../config/env.dart';
import '../network/api_client.dart';

typedef GetToken = Future<String?> Function();

class UploadRepository {
  UploadRepository({
    required ApiClient apiClient,
    GetToken? getToken,
  })  : _api = apiClient,
        _getToken = getToken;

  final ApiClient _api;
  final GetToken? _getToken;

  /// 에뮬레이터/기기에서 접근 가능하도록 loopback URL을 API 호스트 기준으로 치환
  static String _rewriteUploadUrl(String url) {
    final base = Env.apiBaseUrl.replaceFirst(RegExp(r'/api/v1$'), '').replaceFirst(RegExp(r'/$'), '');
    final lower = url.toLowerCase();
    if (lower.startsWith('http://localhost:') ||
        lower.startsWith('https://localhost:') ||
        lower.startsWith('http://127.0.0.1:') ||
        lower.startsWith('https://127.0.0.1:')) {
      final uri = Uri.parse(url);
      return '$base${uri.path}${uri.query.isEmpty ? '' : '?${uri.query}'}';
    }
    return url;
  }

  /// [XFile]에서 바이트로 읽어 업로드. 카메라/갤러리 선택 시 경로 접근 없이 사용해 에뮬레이터에서 Connection refused 방지.
  Future<String> uploadImageFromXFile(XFile xFile) async {
    final bytes = await xFile.readAsBytes();
    final name = xFile.name.isNotEmpty ? xFile.name : 'image.jpg';
    return _uploadBytes(bytes, name);
  }

  /// 이미지 파일을 업로드하고 서버에서 반환한 URL을 돌려줍니다.
  /// 에뮬레이터 호환: 파일을 바이트로 읽어 전송하고, localhost URL은 API 호스트로 치환합니다.
  Future<String> uploadImage(File file) async {
    final bytes = await file.readAsBytes();
    final fileName = file.path.split(RegExp(r'[/\\]')).last;
    final name = fileName.isNotEmpty ? fileName : 'image.jpg';
    return _uploadBytes(bytes, name);
  }

  Future<String> _uploadBytes(List<int> bytes, String filename) async {
    final formData = FormData.fromMap({
      'file': MultipartFile.fromBytes(bytes, filename: filename),
    });
    final headers = <String, dynamic>{};
    final getToken = _getToken;
    if (getToken != null) {
      final token = await getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    final res = await _api.dio.post<Map<String, dynamic>>(
      '/upload/image',
      data: formData,
      options: Options(
        sendTimeout: const Duration(seconds: 30),
        headers: headers,
      ),
    );
    final url = res.data?['url'] as String?;
    if (url == null || url.isEmpty) throw Exception('업로드 응답에 url이 없습니다.');
    return _rewriteUploadUrl(url);
  }
}
