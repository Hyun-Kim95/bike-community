import '../../../core/network/api_client.dart';

class PointsRepository {
  PointsRepository({required ApiClient apiClient}) : _api = apiClient;
  final ApiClient _api;

  /// 출석 체크 (1일 1회)
  Future<AttendanceResult> checkIn() async {
    final res = await _api.post<Map<String, dynamic>>('/points/attendance');
    final data = res.data ?? {};
    return AttendanceResult(
      alreadyCheckedIn: data['alreadyCheckedIn'] as bool? ?? false,
      points: data['points'] as int?,
      consecutiveDays: data['consecutiveDays'] as int?,
      totalPoints: data['totalPoints'] as int?,
    );
  }

  /// 오늘 출석 여부
  Future<TodayStatus> getTodayStatus() async {
    final res = await _api.get<Map<String, dynamic>>('/points/attendance/today');
    final data = res.data ?? {};
    return TodayStatus(
      checkedIn: data['checkedIn'] as bool? ?? false,
      consecutiveDays: data['consecutiveDays'] as int?,
    );
  }

  /// 포인트 내역
  Future<PointHistoryResponse> getHistory({int page = 1, int limit = 20}) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/points/history',
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = res.data ?? {};
    final list = data['items'] as List? ?? [];
    return PointHistoryResponse(
      items: list.map((e) => PointHistoryItem.fromJson(Map<String, dynamic>.from(e as Map))).toList(),
      total: data['total'] as int? ?? 0,
      page: data['page'] as int? ?? 1,
      limit: data['limit'] as int? ?? 20,
      totalPages: data['totalPages'] as int? ?? 0,
    );
  }
}

class AttendanceResult {
  final bool alreadyCheckedIn;
  final int? points;
  final int? consecutiveDays;
  final int? totalPoints;

  const AttendanceResult({
    required this.alreadyCheckedIn,
    this.points,
    this.consecutiveDays,
    this.totalPoints,
  });
}

class TodayStatus {
  final bool checkedIn;
  final int? consecutiveDays;

  const TodayStatus({required this.checkedIn, this.consecutiveDays});
}

class PointHistoryItem {
  final String id;
  final int amount;
  final String reason;
  final int balanceAfter;
  final DateTime createdAt;

  const PointHistoryItem({
    required this.id,
    required this.amount,
    required this.reason,
    required this.balanceAfter,
    required this.createdAt,
  });

  factory PointHistoryItem.fromJson(Map<String, dynamic> json) {
    return PointHistoryItem(
      id: json['id'] as String? ?? '',
      amount: json['amount'] as int? ?? 0,
      reason: json['reason'] as String? ?? '',
      balanceAfter: json['balanceAfter'] as int? ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class PointHistoryResponse {
  final List<PointHistoryItem> items;
  final int total;
  final int page;
  final int limit;
  final int totalPages;

  const PointHistoryResponse({
    required this.items,
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });
}
