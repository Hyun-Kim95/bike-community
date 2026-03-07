class Review {
  Review({
    required this.id,
    required this.itemId,
    required this.reviewerId,
    required this.revieweeId,
    required this.rating,
    this.content,
    required this.createdAt,
    this.reviewer,
    this.reviewee,
  });
  final String id;
  final String itemId;
  final String reviewerId;
  final String revieweeId;
  final int rating;
  final String? content;
  final DateTime createdAt;
  final ReviewUserInfo? reviewer;
  final ReviewUserInfo? reviewee;

  String get reviewerNickname => reviewer?.nickname ?? '익명';

  factory Review.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic>? r = json['reviewer'] as Map<String, dynamic>?;
    Map<String, dynamic>? re = json['reviewee'] as Map<String, dynamic>?;
    return Review(
      id: json['id'] as String? ?? '',
      itemId: json['itemId'] as String? ?? '',
      reviewerId: json['reviewerId'] as String? ?? '',
      revieweeId: json['revieweeId'] as String? ?? '',
      rating: (json['rating'] is num) ? (json['rating'] as num).toInt() : 0,
      content: json['content'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      reviewer: r != null ? ReviewUserInfo.fromJson(r) : null,
      reviewee: re != null ? ReviewUserInfo.fromJson(re) : null,
    );
  }
}

class ReviewUserInfo {
  ReviewUserInfo({required this.id, this.nickname});
  final String id;
  final String? nickname;

  factory ReviewUserInfo.fromJson(Map<String, dynamic> json) {
    return ReviewUserInfo(
      id: json['id'] as String? ?? '',
      nickname: json['nickname'] as String?,
    );
  }
}
