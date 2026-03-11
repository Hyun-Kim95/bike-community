import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../data/notices_repository.dart';

class NoticesListScreen extends StatefulWidget {
  const NoticesListScreen({super.key, this.embed = false, this.isCurrentTab = true});

  /// true면 상단 AppBar 없이 내용만 그려서 탭 안에서 사용
  final bool embed;
  /// 홈 탭에서 사용 시, 현재 선택된 탭일 때만 데이터 로드
  final bool isCurrentTab;

  @override
  State<NoticesListScreen> createState() => _NoticesListScreenState();
}

class _NoticesListScreenState extends State<NoticesListScreen> {
  bool _loading = true;
  bool _hasLoaded = false;
  NoticeListResponse? _data;

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final repo = context.read<NoticesRepository>();
      final data = await repo.getNotices();
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

  @override
  void initState() {
    super.initState();
    if (widget.isCurrentTab) {
      _hasLoaded = true;
      WidgetsBinding.instance.addPostFrameCallback((_) => _load());
    }
  }

  @override
  void didUpdateWidget(covariant NoticesListScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isCurrentTab && !_hasLoaded) {
      _hasLoaded = true;
      WidgetsBinding.instance.addPostFrameCallback((_) => _load());
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_hasLoaded) {
      if (widget.embed) return const SizedBox.shrink();
      return Scaffold(appBar: AppBar(title: const Text('공지사항')), body: const SizedBox.shrink());
    }
    if (_loading) {
      final loadingBody = const Center(child: CircularProgressIndicator());
      if (widget.embed) return loadingBody;
      return Scaffold(
        appBar: AppBar(title: const Text('공지사항')),
        body: loadingBody,
      );
    }
    final items = _data?.items ?? [];
    final body = items.isEmpty
        ? const Center(child: Text('공지가 없습니다.'))
        : RefreshIndicator(
            onRefresh: _load,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              itemBuilder: (context, i) {
                final n = items[i];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: n.pinned ? const Icon(Icons.push_pin, color: Colors.amber) : null,
                    title: Text(n.title),
                    subtitle: Text(
                      n.createdAt.toIso8601String().split('T')[0],
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    onTap: () => context.push('/notices/${n.id}'),
                  ),
                );
              },
            ),
          );

    if (widget.embed) return body;

    return Scaffold(
      appBar: AppBar(title: const Text('공지사항')),
      body: body,
    );
  }
}
