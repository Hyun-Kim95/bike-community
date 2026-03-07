import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../data/notifications_repository.dart' show AppNotification, NotificationListResponse, NotificationsRepository;

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _loading = true;
  NotificationListResponse? _data;

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final repo = context.read<NotificationsRepository>();
      final data = await repo.getNotifications();
      if (mounted) {
        setState(() {
          _data = data;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _markAsRead(AppNotification n) async {
    if (n.read) return;
    try {
      final repo = context.read<NotificationsRepository>();
      await repo.markAsRead(n.id);
      if (mounted) _load();
    } catch (_) {}
  }

  Future<void> _markAllRead() async {
    try {
      final repo = context.read<NotificationsRepository>();
      await repo.markAllAsRead();
      if (mounted) _load();
    } catch (_) {}
  }

  void _onTapNotification(AppNotification n) {
    _markAsRead(n);
    final payload = n.payload;
    if (payload == null) return;
    final postId = payload['postId'];
    final roomId = payload['roomId'];
    final itemId = payload['itemId'];
    if (postId != null) context.push('/posts/$postId');
    if (roomId != null) context.push('/chat/$roomId');
    if (itemId != null && postId == null && roomId == null) context.push('/marketplace/$itemId');
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('알림')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    final items = _data?.items ?? [];
    final unreadCount = items.where((n) => !n.read).length;
    return Scaffold(
      appBar: AppBar(
        title: const Text('알림'),
        actions: [
          if (unreadCount > 0)
            TextButton(
              onPressed: _markAllRead,
              child: const Text('전체 읽음'),
            ),
        ],
      ),
      body: items.isEmpty
          ? const Center(child: Text('알림이 없습니다.'))
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                itemBuilder: (context, i) {
                  final n = items[i];
                  return Card(
                    color: n.read ? null : Theme.of(context).colorScheme.surfaceContainerHighest,
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: Icon(
                        n.type == 'chat' ? Icons.chat : n.type == 'like' ? Icons.favorite : Icons.comment,
                        color: n.read ? null : Theme.of(context).colorScheme.primary,
                      ),
                      title: Text(n.title),
                      subtitle: n.body != null ? Text(n.body!, maxLines: 2, overflow: TextOverflow.ellipsis) : null,
                      trailing: Text(
                        _formatDate(n.createdAt),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      onTap: () => _onTapNotification(n),
                    ),
                  );
                },
              ),
            ),
    );
  }

  String _formatDate(DateTime d) {
    final now = DateTime.now();
    final diff = now.difference(d);
    if (diff.inMinutes < 60) return '${diff.inMinutes}분 전';
    if (diff.inHours < 24) return '${diff.inHours}시간 전';
    if (diff.inDays < 7) return '${diff.inDays}일 전';
    return d.toIso8601String().split('T')[0];
  }
}
