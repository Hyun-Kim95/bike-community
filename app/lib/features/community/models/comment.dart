class Comment {
  final String id;
  final String content;
  final DateTime createdAt;
  final CommentAuthor? author;

  const Comment({
    required this.id,
    required this.content,
    required this.createdAt,
    this.author,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['id'] as String,
      content: json['content'] as String? ?? '',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      author: json['author'] != null
          ? CommentAuthor.fromJson(
              Map<String, dynamic>.from(json['author'] as Map))
          : null,
    );
  }
}

class CommentAuthor {
  final String id;
  final String nickname;
  final String? avatarUrl;

  const CommentAuthor({
    required this.id,
    required this.nickname,
    this.avatarUrl,
  });

  factory CommentAuthor.fromJson(Map<String, dynamic> json) {
    String? avatar;
    // 백엔드에서 author.profile.avatarUrl 구조로 내려오므로 우선 거기서 읽는다.
    final profile = json['profile'];
    if (profile is Map && profile['avatarUrl'] != null) {
      avatar = profile['avatarUrl'] as String?;
    } else {
      // 혹시 평탄화되어 올 수도 있으니 fallback
      avatar = json['avatarUrl'] as String?;
    }
    return CommentAuthor(
      id: json['id'] as String? ?? '',
      nickname: json['nickname'] as String? ?? '',
      avatarUrl: avatar,
    );
  }
}

class CommentListResponse {
  final List<Comment> items;
  final int total;

  const CommentListResponse({required this.items, required this.total});

  factory CommentListResponse.fromJson(Map<String, dynamic> json) {
    final list = json['items'] as List? ?? [];
    return CommentListResponse(
      items: list.map((e) => Comment.fromJson(Map<String, dynamic>.from(e as Map))).toList(),
      total: json['total'] as int? ?? 0,
    );
  }
}
