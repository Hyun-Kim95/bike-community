import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/notices_repository.dart';

class NoticeDetailScreen extends StatefulWidget {
  const NoticeDetailScreen({super.key, required this.noticeId});

  final String noticeId;

  @override
  State<NoticeDetailScreen> createState() => _NoticeDetailScreenState();
}

class _NoticeDetailScreenState extends State<NoticeDetailScreen> {
  bool _loading = true;
  Notice? _notice;

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final repo = context.read<NoticesRepository>();
      final notice = await repo.getNotice(widget.noticeId);
      if (mounted) {
        setState(() {
          _notice = notice;
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
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('공지 상세')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (_notice == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('공지 상세')),
        body: const Center(child: Text('공지를 찾을 수 없습니다.')),
      );
    }
    final n = _notice!;
    return Scaffold(
      appBar: AppBar(
        title: const Text('공지 상세'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (n.pinned)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Chip(
                  avatar: const Icon(Icons.push_pin, size: 18, color: Colors.amber),
                  label: const Text('공지 고정'),
                ),
              ),
            Text(
              n.title,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              n.createdAt.toIso8601String().split('T')[0],
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const Divider(height: 24),
            Text(n.content, style: Theme.of(context).textTheme.bodyLarge),
          ],
        ),
      ),
    );
  }
}
