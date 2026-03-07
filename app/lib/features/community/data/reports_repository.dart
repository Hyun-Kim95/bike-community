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
}
