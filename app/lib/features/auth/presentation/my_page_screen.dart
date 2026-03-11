import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../community/data/community_repository.dart';
import '../../community/models/post.dart';
import '../../community/data/reports_repository.dart';
import '../../marketplace/data/marketplace_repository.dart';
import '../../marketplace/models/marketplace_item.dart';
import 'auth_provider.dart';

class MyPageScreen extends StatelessWidget {
  const MyPageScreen({super.key, this.embed = false, this.isCurrentTab = true});

  /// true 면 상단 AppBar 없이 내용만 그려서 탭 안에 삽입할 때 사용
  final bool embed;
  /// 홈 탭에서 사용 시, 현재 선택된 탭일 때만 하위 탭(내 게시글/거래글/신고) 로드
  final bool isCurrentTab;

  @override
  Widget build(BuildContext context) {
    if (embed && !isCurrentTab) return const SizedBox.shrink();
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final bool showInlineTabs = embed;

    final content = Column(
      children: [
        if (user != null)
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundImage: (user.profile.avatarUrl != null &&
                              user.profile.avatarUrl!.isNotEmpty)
                          ? NetworkImage(user.profile.avatarUrl!)
                          : null,
                      child: (user.profile.avatarUrl == null ||
                              user.profile.avatarUrl!.isEmpty)
                          ? Text(user.nickname.isNotEmpty ? user.nickname[0] : '?')
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(user.nickname, style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 4),
                          Text(
                            user.email,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '등급: ${user.profile.gradeName} · 포인트: ${user.profile.totalPoints}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          if (user.profile.region != null &&
                              user.profile.region!.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(
                              '지역: ${user.profile.region}',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: () => context.push('/profile/edit'),
                      child: const Text('프로필 수정'),
                    ),
                  ],
                ),
                if (user.profile.interestCategories != null &&
                    user.profile.interestCategories!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    '관심 카테고리',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: user.profile.interestCategories!
                        .map(
                          (c) => Chip(
                            label: Text(c, style: Theme.of(context).textTheme.bodySmall),
                            visualDensity: VisualDensity.compact,
                          ),
                        )
                        .toList(),
                  ),
                ],
                const SizedBox(height: 12),
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.stars),
                    title: const Text('포인트 & 출석'),
                    subtitle: Text('${user.profile.totalPoints} P'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/points'),
                  ),
                ),
                const SizedBox(height: 8),
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.logout, color: Colors.redAccent),
                    title: const Text('로그아웃'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () async {
                      await auth.logout();
                      if (context.mounted) context.go('/login');
                    },
                  ),
                ),
              ],
            ),
          ),
        if (showInlineTabs)
          const TabBar(
            tabs: [
              Tab(text: '내 게시글'),
              Tab(text: '내 거래글'),
              Tab(text: '신고 내역'),
            ],
          ),
        Expanded(
          child: TabBarView(
            children: const [
              _MyPostsTab(),
              _MyMarketplaceTab(),
              _MyReportsTab(),
            ],
          ),
        ),
      ],
    );

    if (embed) {
      // 홈 탭 안에서 사용할 때: 상단 AppBar 없이 프로필 + (내 게시글/내 거래글/신고 내역) 탭
      return DefaultTabController(
        length: 3,
        child: content,
      );
    }

    // 단독 라우트(/me)로 사용할 때: AppBar 포함
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('마이페이지'),
          bottom: const TabBar(
            tabs: [
              Tab(text: '내 게시글'),
              Tab(text: '내 거래글'),
              Tab(text: '신고 내역'),
            ],
          ),
        ),
        body: content,
      ),
    );
  }
}

class _MyPostsTab extends StatefulWidget {
  const _MyPostsTab();

  @override
  State<_MyPostsTab> createState() => _MyPostsTabState();
}

class _MyPostsTabState extends State<_MyPostsTab> {
  PostListResponse? _data;
  Object? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final repo = context.read<CommunityRepository>();
      final res = await repo.getMyPosts();
      if (mounted) setState(() { _data = res; _loading = false; _error = null; });
    } catch (e) {
      if (mounted) setState(() { _error = e; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(child: Text('내 게시글을 불러오지 못했습니다.\n$_error', textAlign: TextAlign.center));
    }
    final posts = _data!.items;
    if (posts.isEmpty) return const Center(child: Text('작성한 게시글이 없습니다.'));
    return ListView.separated(
      itemCount: posts.length,
      separatorBuilder: (_, __) => const Divider(height: 0),
      itemBuilder: (context, i) {
        final p = posts[i];
        return ListTile(
          title: Text(p.title, maxLines: 1, overflow: TextOverflow.ellipsis),
          subtitle: Text('${p.category} · ${p.createdAt.toLocal()}'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => context.push('/posts/${p.id}'),
        );
      },
    );
  }
}

class _MyMarketplaceTab extends StatefulWidget {
  const _MyMarketplaceTab();

  @override
  State<_MyMarketplaceTab> createState() => _MyMarketplaceTabState();
}

class _MyMarketplaceTabState extends State<_MyMarketplaceTab> {
  MarketplaceListResponse? _data;
  Object? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final repo = context.read<MarketplaceRepository>();
      final res = await repo.getMyItems();
      if (mounted) setState(() { _data = res; _loading = false; _error = null; });
    } catch (e) {
      if (mounted) setState(() { _error = e; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(child: Text('내 거래글을 불러오지 못했습니다.\n$_error', textAlign: TextAlign.center));
    }
    final items = _data!.items;
    if (items.isEmpty) return const Center(child: Text('등록한 거래글이 없습니다.'));
    return ListView.separated(
      itemCount: items.length,
      separatorBuilder: (_, __) => const Divider(height: 0),
      itemBuilder: (context, i) {
        final item = items[i];
        return ListTile(
          leading: item.imageUrls.isNotEmpty
              ? Image.network(
                  item.imageUrls.first,
                  width: 56,
                  height: 56,
                  fit: BoxFit.cover,
                  cacheWidth: 112,
                  cacheHeight: 112,
                  errorBuilder: (_, __, ___) => const Icon(Icons.image_not_supported),
                )
              : const Icon(Icons.image_not_supported),
          title: Text(item.title, maxLines: 1, overflow: TextOverflow.ellipsis),
          subtitle: Text('${item.priceFormatted} · ${item.statusLabel}'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => context.push('/marketplace/${item.id}'),
        );
      },
    );
  }
}

class MyReport {
  final String id;
  final String targetType;
  final String targetId;
  final String? targetPostId;
  final String? targetChatRoomId;
  final String? targetUserId;
  final String? reason;
  final String? detail;
  final String status;
  final DateTime createdAt;

  MyReport({
    required this.id,
    required this.targetType,
    required this.targetId,
    required this.targetPostId,
    required this.targetChatRoomId,
    required this.targetUserId,
    required this.reason,
    required this.detail,
    required this.status,
    required this.createdAt,
  });

  factory MyReport.fromJson(Map<String, dynamic> json) {
    return MyReport(
      id: json['id'] as String,
      targetType: json['targetType'] as String? ?? '',
      targetId: json['targetId'] as String? ?? '',
      targetPostId: json['targetPostId'] as String?,
      targetChatRoomId: json['targetChatRoomId'] as String?,
      targetUserId: json['targetUserId'] as String?,
      reason: json['reason'] as String?,
      detail: json['detail'] as String?,
      status: json['status'] as String? ?? 'pending',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class _MyReportsTab extends StatefulWidget {
  const _MyReportsTab();

  @override
  State<_MyReportsTab> createState() => _MyReportsTabState();
}

class _MyReportsTabState extends State<_MyReportsTab> {
  List<MyReport>? _reports;
  Object? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final repo = context.read<ReportsRepository>();
      final list = await repo.getMyReports();
      final reports = list
          .map((e) => MyReport.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
      if (mounted) setState(() { _reports = reports; _loading = false; _error = null; });
    } catch (e) {
      if (mounted) setState(() { _error = e; _loading = false; });
    }
  }

  static String _targetLabel(String t) {
    switch (t) {
      case 'post': return '게시글';
      case 'comment': return '댓글';
      case 'chat': return '채팅';
      case 'user': return '사용자';
      default: return t;
    }
  }

  static String _statusLabel(String s) {
    switch (s) {
      case 'pending': return '접수';
      case 'under_review': return '검토중';
      case 'resolved': return '조치완료';
      case 'rejected': return '반려';
      default: return s;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(child: Text('신고 내역을 불러오지 못했습니다.\n$_error', textAlign: TextAlign.center));
    }
    final reports = _reports!;
    if (reports.isEmpty) return const Center(child: Text('신고한 내역이 없습니다.'));
    return ListView.separated(
      itemCount: reports.length,
      separatorBuilder: (_, __) => const Divider(height: 0),
      itemBuilder: (context, i) {
        final r = reports[i];
        return ListTile(
          leading: Icon(
            r.targetType == 'post' ? Icons.forum
                : r.targetType == 'comment' ? Icons.chat_bubble_outline
                : Icons.report,
          ),
          title: Text(r.reason ?? '(사유 없음)', maxLines: 1, overflow: TextOverflow.ellipsis),
          subtitle: Text('${_targetLabel(r.targetType)} · ${r.createdAt.toLocal()}', maxLines: 2, overflow: TextOverflow.ellipsis),
          trailing: Text(_statusLabel(r.status), style: Theme.of(context).textTheme.bodySmall),
          onTap: () {
            if (r.targetPostId != null && r.targetPostId!.isNotEmpty) {
              context.push('/posts/${r.targetPostId}');
              return;
            }
            if (r.targetChatRoomId != null && r.targetChatRoomId!.isNotEmpty) {
              context.push('/chat/${r.targetChatRoomId}');
              return;
            }
            if (r.targetUserId != null && r.targetUserId!.isNotEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('사용자 프로필 화면은 추후 제공될 예정입니다.')),
              );
              return;
            }
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('이 신고 유형은 아직 바로 이동을 지원하지 않습니다.')),
            );
          },
        );
      },
    );
  }
}

