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

  const CommentAuthor({required this.id, required this.nickname});

  factory CommentAuthor.fromJson(Map<String, dynamic> json) {
    return CommentAuthor(
      id: json['id'] as String? ?? '',
      nickname: json['nickname'] as String? ?? '',
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
