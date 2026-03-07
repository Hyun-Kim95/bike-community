class MarketplaceItem {
  final String id;
  final String title;
  final String category;
  final num price;
  final String description;
  final List<String> imageUrls;
  final String region;
  final String saleStatus;
  final int viewCount;
  final int wishCount;
  final DateTime createdAt;
  final ItemSeller? seller;

  const MarketplaceItem({
    required this.id,
    required this.title,
    required this.category,
    required this.price,
    required this.description,
    required this.imageUrls,
    required this.region,
    required this.saleStatus,
    required this.viewCount,
    required this.wishCount,
    required this.createdAt,
    this.seller,
  });

  factory MarketplaceItem.fromJson(Map<String, dynamic> json) {
    List<String> images = [];
    if (json['imageUrls'] != null) {
      if (json['imageUrls'] is List) {
        images = (json['imageUrls'] as List).map((e) => e.toString()).toList();
      }
    }
    num price = 0;
    if (json['price'] != null) {
      price = json['price'] is num ? json['price'] as num : num.tryParse(json['price'].toString()) ?? 0;
    }
    return MarketplaceItem(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      category: json['category'] as String? ?? '',
      price: price,
      description: json['description'] as String? ?? '',
      imageUrls: images,
      region: json['region'] as String? ?? '',
      saleStatus: json['saleStatus'] as String? ?? 'on_sale',
      viewCount: json['viewCount'] as int? ?? 0,
      wishCount: json['wishCount'] as int? ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      seller: json['seller'] != null
          ? ItemSeller.fromJson(Map<String, dynamic>.from(json['seller'] as Map))
          : null,
    );
  }

  String get priceFormatted {
    final s = price.toInt().toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
      buf.write(s[i]);
    }
    return '$buf원';
  }
  String get statusLabel {
    switch (saleStatus) {
      case 'on_sale': return '판매중';
      case 'reserved': return '예약중';
      case 'sold': return '거래완료';
      default: return '판매중';
    }
  }
}

class ItemSeller {
  final String id;
  final String nickname;

  const ItemSeller({required this.id, required this.nickname});

  factory ItemSeller.fromJson(Map<String, dynamic> json) {
    return ItemSeller(
      id: json['id'] as String? ?? '',
      nickname: json['nickname'] as String? ?? '',
    );
  }
}

class MarketplaceListResponse {
  final List<MarketplaceItem> items;
  final int total;
  final int page;
  final int limit;
  final int totalPages;

  const MarketplaceListResponse({
    required this.items,
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });

  factory MarketplaceListResponse.fromJson(Map<String, dynamic> json) {
    final list = json['items'] as List? ?? [];
    return MarketplaceListResponse(
      items: list.map((e) => MarketplaceItem.fromJson(Map<String, dynamic>.from(e as Map))).toList(),
      total: json['total'] as int? ?? 0,
      page: json['page'] as int? ?? 1,
      limit: json['limit'] as int? ?? 20,
      totalPages: json['totalPages'] as int? ?? 0,
    );
  }
}
