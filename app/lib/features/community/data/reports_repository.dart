import '../../../core/network/api_client.dart';

class ReportsRepository {
  ReportsRepository({required ApiClient apiClient}) : _api = apiClient;
  final ApiClient _api;

  Future<void> reportPost(String postId, {String? reason, String? detail}) async {
    await _api.post('/reports', data: {
      'targetType': 'post',
      'targetId': postId,
      if (reason != null && reason.isNotEmpty) 'reason': reason,
      if (detail != null && detail.isNotEmpty) 'detail': detail,
    });
  }

  Future<void> reportComment(String commentId, {String? reason, String? detail}) async {
    await _api.post('/reports', data: {
      'targetType': 'comment',
      'targetId': commentId,
      if (reason != null && reason.isNotEmpty) 'reason': reason,
      if (detail != null && detail.isNotEmpty) 'detail': detail,
    });
  }

  Future<List<Map<String, dynamic>>> getMyReportsRaw({int page = 1, int limit = 20}) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/reports/mine',
      queryParameters: {'page': page, 'limit': limit},
    );
    final list = res.data?['items'] as List? ?? [];
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<List<dynamic>> getMyReports() async {
    // 실제 모델은 MyPageScreen에서 정의된 MyReport를 사용
    final list = await getMyReportsRaw();
    return list;
  }
}
