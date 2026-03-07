class ChatMessage {
  final String id;
  final String roomId;
  final String senderId;
  final String content;
  final String? imageUrl;
  final DateTime createdAt;
  final ChatMessageSender? sender;

  const ChatMessage({
    required this.id,
    required this.roomId,
    required this.senderId,
    required this.content,
    this.imageUrl,
    required this.createdAt,
    this.sender,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String? ?? '',
      roomId: json['roomId'] as String? ?? '',
      senderId: json['senderId'] as String? ?? '',
      content: json['content'] as String? ?? '',
      imageUrl: json['imageUrl'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      sender: json['sender'] != null
          ? ChatMessageSender.fromJson(Map<String, dynamic>.from(json['sender'] as Map))
          : null,
    );
  }
}

class ChatMessageSender {
  final String id;
  final String nickname;

  const ChatMessageSender({required this.id, required this.nickname});

  factory ChatMessageSender.fromJson(Map<String, dynamic> json) {
    return ChatMessageSender(
      id: json['id'] as String? ?? '',
      nickname: json['nickname'] as String? ?? '',
    );
  }
}

class ChatMessagesResponse {
  final List<ChatMessage> items;
  final int total;
  final int page;
  final int limit;
  final int totalPages;

  const ChatMessagesResponse({
    required this.items,
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });

  factory ChatMessagesResponse.fromJson(Map<String, dynamic> json) {
    final list = json['items'] as List? ?? [];
    return ChatMessagesResponse(
      items: list.map((e) => ChatMessage.fromJson(Map<String, dynamic>.from(e as Map))).toList(),
      total: json['total'] as int? ?? 0,
      page: json['page'] as int? ?? 1,
      limit: json['limit'] as int? ?? 50,
      totalPages: json['totalPages'] as int? ?? 0,
    );
  }
}
