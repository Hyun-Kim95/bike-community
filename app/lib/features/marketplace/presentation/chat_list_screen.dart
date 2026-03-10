import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../auth/presentation/auth_provider.dart';
import '../data/chat_repository.dart';
import '../models/chat_room.dart';

class ChatListScreen extends StatefulWidget {
  const ChatListScreen({super.key, this.embed = false});

  /// true면 상단 AppBar 없이 내용만 그려서 탭 안에서 사용
  final bool embed;

  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  List<ChatRoom> _rooms = [];
  bool _loading = true;

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final repo = context.read<ChatRepository>();
      final list = await repo.getMyRooms();
      if (mounted) {
        setState(() {
          _rooms = list;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final myId = auth.user?.id ?? '';

    final body = _loading
        ? const Center(child: CircularProgressIndicator())
        : _rooms.isEmpty
            ? const Center(child: Text('채팅 목록이 비어 있습니다.'))
            : RefreshIndicator(
                onRefresh: _load,
                child: ListView.builder(
                  itemCount: _rooms.length,
                  itemBuilder: (context, index) {
                    final room = _rooms[index];
                    final other = room.buyerId == myId ? room.seller : room.buyer;
                    final title = room.item?.title ?? '상품';
                    return ListTile(
                      leading: room.item != null && room.item!.imageUrls.isNotEmpty
                          ? Image.network(
                              room.item!.imageUrls.first,
                              width: 48,
                              height: 48,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => const Icon(Icons.chat),
                            )
                          : const Icon(Icons.chat),
                      title: Text(other?.nickname ?? '알 수 없음'),
                      subtitle: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
                      onTap: () => context.push('/chat/${room.id}'),
                    );
                  },
                ),
              );

    if (widget.embed) {
      return body;
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('채팅'),
      ),
      body: body,
    );
  }
}
