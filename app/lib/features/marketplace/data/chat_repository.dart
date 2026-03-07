import '../../../core/network/api_client.dart';
import '../models/chat_room.dart';
import '../models/chat_message.dart';

class ChatRepository {
  ChatRepository({required ApiClient apiClient}) : _api = apiClient;
  final ApiClient _api;

  /// 상품 기준 채팅방 생성 또는 기존 방 조회
  Future<ChatRoom> getOrCreateRoom(String itemId) async {
    final res = await _api.post<Map<String, dynamic>>('/marketplace/items/$itemId/chat-room');
    return ChatRoom.fromJson(res.data ?? {});
  }

  /// 내 채팅방 목록
  Future<List<ChatRoom>> getMyRooms() async {
    final res = await _api.get<List<dynamic>>('/marketplace/chat-rooms');
    final list = res.data ?? [];
    return list.map((e) => ChatRoom.fromJson(Map<String, dynamic>.from(e as Map))).toList();
  }

  /// 채팅방 상세
  Future<ChatRoom> getRoom(String roomId) async {
    final res = await _api.get<Map<String, dynamic>>('/marketplace/chat-rooms/$roomId');
    return ChatRoom.fromJson(res.data ?? {});
  }

  /// 메시지 목록
  Future<ChatMessagesResponse> getMessages(String roomId, {int page = 1, int limit = 50}) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/marketplace/chat-rooms/$roomId/messages',
      queryParameters: {'page': page, 'limit': limit},
    );
    return ChatMessagesResponse.fromJson(res.data ?? {});
  }

  /// 메시지 전송
  Future<ChatMessage> sendMessage(String roomId, String content, {String? imageUrl}) async {
    final data = <String, dynamic>{'content': content};
    if (imageUrl != null) data['imageUrl'] = imageUrl;
    final res = await _api.post<Map<String, dynamic>>(
      '/marketplace/chat-rooms/$roomId/messages',
      data: data,
    );
    return ChatMessage.fromJson(res.data ?? {});
  }
}
