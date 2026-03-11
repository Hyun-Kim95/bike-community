import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../auth/presentation/auth_provider.dart';
import '../data/chat_repository.dart';
import '../models/chat_message.dart';
import '../models/chat_room.dart';

class ChatRoomScreen extends StatefulWidget {
  const ChatRoomScreen({super.key, required this.roomId});

  final String roomId;

  @override
  State<ChatRoomScreen> createState() => _ChatRoomRoomScreenState();
}

class _ChatRoomRoomScreenState extends State<ChatRoomScreen> {
  ChatRoom? _room;
  List<ChatMessage> _messages = [];
  bool _loading = true;
  bool _sending = false;
  final _textController = TextEditingController();
  final _scrollController = ScrollController();

  Future<void> _loadRoom() async {
    try {
      final repo = context.read<ChatRepository>();
      final room = await repo.getRoom(widget.roomId);
      if (mounted) setState(() => _room = room);
    } catch (_) {}
  }

  Future<void> _loadMessages() async {
    setState(() => _loading = true);
    try {
      final repo = context.read<ChatRepository>();
      final res = await repo.getMessages(widget.roomId);
      if (mounted) {
        setState(() {
          _messages = res.items;
          _loading = false;
        });
        _scrollToBottom();
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      Future.delayed(const Duration(milliseconds: 100), () {
        if (_scrollController.hasClients) {
          _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
        }
      });
    }
  }

  Future<void> _send() async {
    final text = _textController.text.trim();
    if (text.isEmpty || _sending) return;
    _textController.clear();
    setState(() => _sending = true);
    try {
      final repo = context.read<ChatRepository>();
      final msg = await repo.sendMessage(widget.roomId, text);
      if (mounted) {
        setState(() {
          _messages = [..._messages, msg];
          _sending = false;
        });
        _scrollToBottom();
      }
    } catch (_) {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _textController.addListener(() => setState(() {}));
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadRoom();
      _loadMessages();
    });
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final myId = context.watch<AuthProvider>().user?.id ?? '';
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_room?.item?.title ?? '채팅', style: const TextStyle(fontSize: 18)),
            if (_room != null)
              Text(
                _room!.buyerId == myId ? (_room!.seller?.nickname ?? '') : (_room!.buyer?.nickname ?? ''),
                style: Theme.of(context).textTheme.bodySmall,
              ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading && _messages.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final msg = _messages[index];
                      final isMe = msg.senderId == myId;
                      final bubbleTextColor = isMe ? colorScheme.onPrimary : colorScheme.onSurface;
                      // 시간 텍스트는 말풍선 배경과 확실히 대비되도록 고정 색상 사용
                      final timeTextColor = isMe ? Colors.white70 : Colors.black54;
                      return Align(
                        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                          decoration: BoxDecoration(
                            color: isMe ? Theme.of(context).colorScheme.primaryContainer : Theme.of(context).colorScheme.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (msg.content.isNotEmpty)
                                Text(
                                  msg.content,
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyMedium
                                      ?.copyWith(color: bubbleTextColor),
                                ),
                              if (msg.imageUrl != null && msg.imageUrl!.isNotEmpty)
                                Image.network(msg.imageUrl!, width: 120, fit: BoxFit.cover, cacheWidth: 240, cacheHeight: 240, errorBuilder: (c, e, s) => const SizedBox.shrink()),
                              Text(
                                '${msg.createdAt.hour.toString().padLeft(2, '0')}:${msg.createdAt.minute.toString().padLeft(2, '0')}',
                                style: Theme.of(context)
                                    .textTheme
                                    .labelSmall
                                    ?.copyWith(
                                      color: timeTextColor,
                                      fontSize: 11,
                                    ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
          Padding(
            padding: EdgeInsets.only(
              left: 12,
              right: 12,
              top: 8,
              bottom: MediaQuery.of(context).padding.bottom + 8,
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _textController,
                    decoration: const InputDecoration(
                      hintText: '메시지 입력',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    onSubmitted: (_) => _send(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: (_textController.text.trim().isEmpty || _sending) ? null : _send,
                  icon: _sending
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.send),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

