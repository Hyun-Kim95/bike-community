class Post {
  final String id;
  final String title;
  final String content;
  final String category;
  final List<String>? imageUrls;
  final String? videoUrl;
  final int viewCount;
  final int likeCount;
  final int commentCount;
  final DateTime createdAt;
  final PostAuthor? author;

  const Post({
    required this.id,
    required this.title,
    required this.content,
    required this.category,
    this.imageUrls,
    this.videoUrl,
    required this.viewCount,
    required this.likeCount,
    required this.commentCount,
    required this.createdAt,
    this.author,
  });

  factory Post.fromJson(Map<String, dynamic> json) {
    List<String>? images;
    if (json['imageUrls'] != null) {
      if (json['imageUrls'] is List) {
        images = (json['imageUrls'] as List).map((e) => e.toString()).toList();
      }
    }
    return Post(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      content: json['content'] as String? ?? '',
      category: json['category'] as String? ?? '',
      imageUrls: images,
      videoUrl: json['videoUrl'] as String?,
      viewCount: json['viewCount'] as int? ?? 0,
      likeCount: json['likeCount'] as int? ?? 0,
      commentCount: json['commentCount'] as int? ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      author: json['author'] != null
          ? PostAuthor.fromJson(
              Map<String, dynamic>.from(json['author'] as Map))
          : null,
    );
  }
}

class PostAuthor {
  final String id;
  final String nickname;

  const PostAuthor({required this.id, required this.nickname});

  factory PostAuthor.fromJson(Map<String, dynamic> json) {
    return PostAuthor(
      id: json['id'] as String? ?? '',
      nickname: json['nickname'] as String? ?? '',
    );
  }
}

class PostListResponse {
  final List<Post> items;
  final int total;
  final int page;
  final int limit;
  final int totalPages;

  const PostListResponse({
    required this.items,
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });

  factory PostListResponse.fromJson(Map<String, dynamic> json) {
    final list = json['items'] as List? ?? [];
    return PostListResponse(
      items: list.map((e) => Post.fromJson(Map<String, dynamic>.from(e as Map))).toList(),
      total: json['total'] as int? ?? 0,
      page: json['page'] as int? ?? 1,
      limit: json['limit'] as int? ?? 20,
      totalPages: json['totalPages'] as int? ?? 0,
    );
  }
}
