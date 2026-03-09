import '../../../core/network/api_client.dart';

class RegionOption {
  final String code;
  final String name;

  const RegionOption({required this.code, required this.name});

  factory RegionOption.fromJson(Map<String, dynamic> json) {
    return RegionOption(
      code: json['code'] as String,
      name: json['name'] as String? ?? '',
    );
  }
}

class RegionsRepository {
  RegionsRepository({required ApiClient apiClient}) : _api = apiClient;
  final ApiClient _api;

  Future<List<RegionOption>> getParents() async {
    final res = await _api.get<Map<String, dynamic>>('/regions/parents');
    final list = res.data?['items'] as List? ?? [];
    return list
        .map((e) => RegionOption.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<List<RegionOption>> getChildren(String parentCode) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/regions/children',
      queryParameters: {'parentCode': parentCode},
    );
    final list = res.data?['items'] as List? ?? [];
    return list
        .map((e) => RegionOption.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }
}

