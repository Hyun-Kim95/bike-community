import '../../../core/network/api_client.dart';

class Notice {
  Notice({
    required this.id,
    required this.title,
    required this.content,
    required this.pinned,
    required this.createdAt,
  });
  final String id;
  final String title;
  final String content;
  final bool pinned;
  final DateTime createdAt;

  factory Notice.fromJson(Map<String, dynamic> json) {
    return Notice(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      content: json['content'] as String? ?? '',
      pinned: json['pinned'] as bool? ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class NoticeListResponse {
  NoticeListResponse({
    required this.items,
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });
  final List<Notice> items;
  final int total;
  final int page;
  final int limit;
  final int totalPages;

  factory NoticeListResponse.fromJson(Map<String, dynamic> json) {
    final list = json['items'] as List? ?? [];
    return NoticeListResponse(
      items: list.map((e) => Notice.fromJson(Map<String, dynamic>.from(e as Map))).toList(),
      total: json['total'] as int? ?? 0,
      page: json['page'] as int? ?? 1,
      limit: json['limit'] as int? ?? 20,
      totalPages: json['totalPages'] as int? ?? 0,
    );
  }
}

class NoticesRepository {
  NoticesRepository({required ApiClient apiClient}) : _api = apiClient;
  final ApiClient _api;

  Future<NoticeListResponse> getNotices({int page = 1, int limit = 20}) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/notices',
      queryParameters: {'page': page, 'limit': limit},
    );
    return NoticeListResponse.fromJson(res.data ?? {});
  }

  Future<Notice> getNotice(String id) async {
    final res = await _api.get<Map<String, dynamic>>('/notices/$id');
    return Notice.fromJson(res.data ?? {});
  }
}
