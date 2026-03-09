import '../../../core/network/api_client.dart';
import '../models/marketplace_item.dart';
import '../models/review.dart';

class MarketplaceRepository {
  MarketplaceRepository({required ApiClient apiClient}) : _api = apiClient;
  final ApiClient _api;

  Future<List<String>> getCategories() async {
    final res = await _api.get<Map<String, dynamic>>('/marketplace/items/categories');
    final list = res.data?['categories'] as List? ?? [];
    return list.map((e) => e.toString()).toList();
  }

  Future<MarketplaceListResponse> getItems({
    int page = 1,
    int limit = 20,
    String sort = 'latest',
    String? category,
    num? minPrice,
    num? maxPrice,
    String? region,
  }) async {
    final query = <String, dynamic>{
      'page': page,
      'limit': limit,
      'sort': sort,
    };
    if (category != null && category.isNotEmpty) query['category'] = category;
    if (minPrice != null) query['minPrice'] = minPrice;
    if (maxPrice != null) query['maxPrice'] = maxPrice;
    if (region != null && region.isNotEmpty) query['region'] = region;
    final res = await _api.get<Map<String, dynamic>>('/marketplace/items', queryParameters: query);
    return MarketplaceListResponse.fromJson(res.data ?? {});
  }

  Future<MarketplaceItem> getItem(String id) async {
    final res = await _api.get<Map<String, dynamic>>('/marketplace/items/$id');
    return MarketplaceItem.fromJson(res.data ?? {});
  }

  Future<MarketplaceItem> createItem({
    required String title,
    required String category,
    required num price,
    required String description,
    required List<String> imageUrls,
    required String region,
  }) async {
    final res = await _api.post<Map<String, dynamic>>('/marketplace/items', data: {
      'title': title,
      'category': category,
      'price': price,
      'description': description,
      'imageUrls': imageUrls,
      'region': region,
    });
    return MarketplaceItem.fromJson(res.data ?? {});
  }

  Future<MarketplaceItem> updateItem({
    required String id,
    String? title,
    String? category,
    num? price,
    String? description,
    List<String>? imageUrls,
    String? region,
    String? saleStatus,
  }) async {
    final data = <String, dynamic>{};
    if (title != null) data['title'] = title;
    if (category != null) data['category'] = category;
    if (price != null) data['price'] = price;
    if (description != null) data['description'] = description;
    if (imageUrls != null) data['imageUrls'] = imageUrls;
    if (region != null) data['region'] = region;
    if (saleStatus != null) data['saleStatus'] = saleStatus;
    final res = await _api.patch<Map<String, dynamic>>('/marketplace/items/$id', data: data);
    return MarketplaceItem.fromJson(res.data ?? {});
  }

  Future<void> deleteItem(String id) async {
    await _api.delete('/marketplace/items/$id');
  }

  Future<Map<String, bool>> toggleWish(String itemId) async {
    final res = await _api.post<Map<String, dynamic>>('/marketplace/items/$itemId/wish');
    final wished = res.data?['wished'] as bool? ?? false;
    return {'wished': wished};
  }

  Future<bool> isWished(String itemId) async {
    final res = await _api.get<Map<String, dynamic>>('/marketplace/items/$itemId/wish');
    return res.data?['wished'] as bool? ?? false;
  }

  Future<Map<String, dynamic>> getReviews(String itemId, {int page = 1, int limit = 20}) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/marketplace/items/$itemId/reviews',
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = res.data ?? {};
    final list = data['items'] as List? ?? [];
    return {
      'items': list.map((e) => Review.fromJson(Map<String, dynamic>.from(e as Map))).toList(),
      'total': data['total'] as int? ?? 0,
      'page': data['page'] as int? ?? 1,
      'limit': data['limit'] as int? ?? 20,
      'totalPages': data['totalPages'] as int? ?? 0,
      'averageRating': data['averageRating'] as String?,
    };
  }

  Future<Review> createReview(String itemId, String revieweeId, int rating, {String? content}) async {
    final data = <String, dynamic>{'revieweeId': revieweeId, 'rating': rating};
    if (content != null && content.isNotEmpty) data['content'] = content;
    final res = await _api.post<Map<String, dynamic>>('/marketplace/items/$itemId/reviews', data: data);
    return Review.fromJson(res.data ?? {});
  }

  Future<MarketplaceListResponse> getMyWishes({int page = 1, int limit = 20}) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/marketplace/wishes',
      queryParameters: {'page': page, 'limit': limit},
    );
    final list = res.data?['items'] as List? ?? [];
    return MarketplaceListResponse(
      items: list.map((e) => MarketplaceItem.fromJson(Map<String, dynamic>.from(e as Map))).toList(),
      total: res.data?['total'] as int? ?? 0,
      page: res.data?['page'] as int? ?? 1,
      limit: res.data?['limit'] as int? ?? 20,
      totalPages: res.data?['totalPages'] as int? ?? 0,
    );
  }

  Future<MarketplaceListResponse> getMyItems({int page = 1, int limit = 20}) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/marketplace/my-items',
      queryParameters: {'page': page, 'limit': limit},
    );
    return MarketplaceListResponse.fromJson(res.data ?? {});
  }
}
