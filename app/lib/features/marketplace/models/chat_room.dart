import 'marketplace_item.dart';

class ChatRoom {
  final String id;
  final String itemId;
  final String buyerId;
  final String sellerId;
  final DateTime updatedAt;
  final MarketplaceItem? item;
  final ChatRoomUser? buyer;
  final ChatRoomUser? seller;
  final int unreadCount;

  const ChatRoom({
    required this.id,
    required this.itemId,
    required this.buyerId,
    required this.sellerId,
    required this.updatedAt,
    this.item,
    this.buyer,
    this.seller,
    this.unreadCount = 0,
  });

  factory ChatRoom.fromJson(Map<String, dynamic> json) {
    return ChatRoom(
      id: json['id'] as String? ?? '',
      itemId: json['itemId'] as String? ?? '',
      buyerId: json['buyerId'] as String? ?? '',
      sellerId: json['sellerId'] as String? ?? '',
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      item: json['item'] != null
          ? MarketplaceItem.fromJson(Map<String, dynamic>.from(json['item'] as Map))
          : null,
      buyer: json['buyer'] != null
          ? ChatRoomUser.fromJson(Map<String, dynamic>.from(json['buyer'] as Map))
          : null,
      seller: json['seller'] != null
          ? ChatRoomUser.fromJson(Map<String, dynamic>.from(json['seller'] as Map))
          : null,
      unreadCount: json['unreadCount'] as int? ?? 0,
    );
  }
}

class ChatRoomUser {
  final String id;
  final String nickname;

  const ChatRoomUser({required this.id, required this.nickname});

  factory ChatRoomUser.fromJson(Map<String, dynamic> json) {
    return ChatRoomUser(
      id: json['id'] as String? ?? '',
      nickname: json['nickname'] as String? ?? '',
    );
  }
}
