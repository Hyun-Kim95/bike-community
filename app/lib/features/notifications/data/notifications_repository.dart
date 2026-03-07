import '../../../core/network/api_client.dart';

class AppNotification {
  AppNotification({
    required this.id,
    required this.type,
    required this.title,
    this.body,
    required this.read,
    this.payload,
    required this.createdAt,
  });
  final String id;
  final String type;
  final String title;
  final String? body;
  final bool read;
  final Map<String, dynamic>? payload;
  final DateTime createdAt;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? '',
      title: json['title'] as String? ?? '',
      body: json['body'] as String?,
      read: json['read'] as bool? ?? false,
      payload: json['payload'] as Map<String, dynamic>?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class NotificationListResponse {
  NotificationListResponse({
    required this.items,
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });
  final List<AppNotification> items;
  final int total;
  final int page;
  final int limit;
  final int totalPages;

  factory NotificationListResponse.fromJson(Map<String, dynamic> json) {
    final list = json['items'] as List? ?? [];
    return NotificationListResponse(
      items: list.map((e) => AppNotification.fromJson(Map<String, dynamic>.from(e as Map))).toList(),
      total: json['total'] as int? ?? 0,
      page: json['page'] as int? ?? 1,
      limit: json['limit'] as int? ?? 20,
      totalPages: json['totalPages'] as int? ?? 0,
    );
  }
}

class NotificationsRepository {
  NotificationsRepository({required ApiClient apiClient}) : _api = apiClient;
  final ApiClient _api;

  Future<NotificationListResponse> getNotifications({int page = 1, int limit = 20}) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/notifications',
      queryParameters: {'page': page, 'limit': limit},
    );
    return NotificationListResponse.fromJson(res.data ?? {});
  }

  Future<void> markAsRead(String id) async {
    await _api.patch('/notifications/$id/read');
  }

  Future<void> markAllAsRead() async {
    await _api.patch('/notifications/read-all');
  }
}
