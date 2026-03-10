import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../auth/presentation/auth_provider.dart';
import '../data/community_repository.dart';
import '../data/reports_repository.dart';
import '../models/post.dart';
import '../models/comment.dart';

class PostDetailScreen extends StatefulWidget {
  const PostDetailScreen({super.key, required this.postId});

  final String postId;

  @override
  State<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends State<PostDetailScreen> {
  Post? _post;
  List<Comment> _comments = [];
  bool _liked = false;
  bool _loading = true;
  bool _commentLoading = false;
  final _commentController = TextEditingController();

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final repo = context.read<CommunityRepository>();
      final post = await repo.getPost(widget.postId);
      final commentsRes = await repo.getComments(widget.postId);
      bool liked = false;
      try {
        liked = await repo.isLiked(widget.postId);
      } catch (_) {}
      if (mounted) {
        setState(() {
          _post = post;
          _comments = commentsRes.items;
          _liked = liked;
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggleLike() async {
    try {
      final repo = context.read<CommunityRepository>();
      final res = await repo.toggleLike(widget.postId);
      if (mounted) {
        setState(() {
          _liked = res['liked'] ?? false;
          if (_post != null) {
            _post = Post(
              id: _post!.id,
              title: _post!.title,
              content: _post!.content,
              category: _post!.category,
              imageUrls: _post!.imageUrls,
              videoUrl: _post!.videoUrl,
              viewCount: _post!.viewCount,
              likeCount: _post!.likeCount + (_liked ? 1 : -1),
              commentCount: _post!.commentCount,
              createdAt: _post!.createdAt,
              author: _post!.author,
            );
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _submitComment() async {
    final content = _commentController.text.trim();
    if (content.isEmpty) return;
    setState(() => _commentLoading = true);
    _commentController.clear();
    try {
      final repo = context.read<CommunityRepository>();
      final comment = await repo.createComment(widget.postId, content);
      if (mounted) {
        setState(() {
          _comments = [..._comments, comment];
          _commentLoading = false;
          if (_post != null) {
            _post = Post(
              id: _post!.id,
              title: _post!.title,
              content: _post!.content,
              category: _post!.category,
              imageUrls: _post!.imageUrls,
              videoUrl: _post!.videoUrl,
              viewCount: _post!.viewCount,
              likeCount: _post!.likeCount,
              commentCount: _post!.commentCount + 1,
              createdAt: _post!.createdAt,
              author: _post!.author,
            );
          }
        });
      }
    } catch (_) {
      if (mounted) setState(() => _commentLoading = false);
    }
  }

  Future<void> _deletePost() async {
    if (_post == null) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('게시글 삭제'),
        content: const Text('이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('취소'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('삭제'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      final repo = context.read<CommunityRepository>();
      await repo.deletePost(widget.postId);
      if (!mounted) return;
      context.go('/feed');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('게시글이 삭제되었습니다.')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('삭제에 실패했습니다: $e')),
      );
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
        appBar: AppBar(title: const Text('게시글')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (_post == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('게시글')),
        body: const Center(child: Text('게시글을 찾을 수 없습니다.')),
      );
    }
    final post = _post!;
    final auth = context.watch<AuthProvider>();
    final isAuthor = auth.user != null && post.author != null && auth.user!.id == post.author!.id;
    return Scaffold(
      appBar: AppBar(
        title: const Text('게시글'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            onSelected: (v) async {
              if (v == 'edit') {
                if (!mounted) return;
                context.push('/posts/${post.id}/edit');
              } else if (v == 'report') {
                await _showReportDialog(context, targetType: 'post', targetId: post.id);
              } else if (v == 'delete') {
                await _deletePost();
              }
            },
            itemBuilder: (_) {
              final items = <PopupMenuEntry<String>>[];
              if (isAuthor) {
                items.addAll(const [
                  PopupMenuItem(value: 'edit', child: Text('수정')),
                  PopupMenuItem(
                    value: 'delete',
                    child: Text('삭제', style: TextStyle(color: Colors.red)),
                  ),
                  PopupMenuDivider(),
                ]);
              }
              items.add(const PopupMenuItem(value: 'report', child: Text('신고')));
              return items;
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    post.title,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      if (post.author != null) Text(post.author!.nickname),
                      const SizedBox(width: 8),
                      Text(post.category),
                      const Spacer(),
                      Text('조회 ${post.viewCount}'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(post.content),
                  if (post.imageUrls != null && post.imageUrls!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 120,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: post.imageUrls!.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, i) {
                          final url = post.imageUrls![i];
                          return ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              url,
                              width: 120,
                              height: 120,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                width: 120,
                                height: 120,
                                color: Colors.grey.shade300,
                                child: const Icon(Icons.broken_image),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                  if (post.videoUrl != null && post.videoUrl!.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    InkWell(
                      onTap: () {
                        // url_launcher 사용 시: launchUrl(Uri.parse(post.videoUrl!));
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.videocam, color: Theme.of(context).colorScheme.primary),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                '동영상: ${post.videoUrl!.length > 40 ? '${post.videoUrl!.substring(0, 40)}...' : post.videoUrl}',
                                style: Theme.of(context).textTheme.bodySmall,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      IconButton(
                        icon: Icon(_liked ? Icons.favorite : Icons.favorite_border),
                        color: _liked ? Colors.red : null,
                        onPressed: _toggleLike,
                      ),
                      Text('${post.likeCount}'),
                      const SizedBox(width: 16),
                      Icon(Icons.chat_bubble_outline, size: 20, color: Theme.of(context).colorScheme.onSurfaceVariant),
                      const SizedBox(width: 4),
                      Text('${post.commentCount}'),
                    ],
                  ),
                  const Divider(height: 24),
                  Text('댓글 ${_comments.length}', style: Theme.of(context).textTheme.titleSmall),
                  const SizedBox(height: 8),
                  ..._comments.map((c) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CircleAvatar(
                              radius: 16,
                              backgroundImage: (c.author?.avatarUrl != null &&
                                      c.author!.avatarUrl!.isNotEmpty)
                                  ? NetworkImage(c.author!.avatarUrl!)
                                  : null,
                              child: (c.author?.avatarUrl == null ||
                                      c.author!.avatarUrl!.isEmpty)
                                  ? Text((c.author?.nickname ?? '?').isNotEmpty
                                      ? (c.author!.nickname[0])
                                      : '?')
                                  : null,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        c.author?.nickname ?? '알 수 없음',
                                        style: Theme.of(context).textTheme.labelLarge,
                                      ),
                                      const Spacer(),
                                      IconButton(
                                        icon: const Icon(Icons.flag_outlined, size: 18),
                                        padding: EdgeInsets.zero,
                                        constraints: const BoxConstraints(),
                                        onPressed: () => _showReportDialog(
                                          context,
                                          targetType: 'comment',
                                          targetId: c.id,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Text(c.content),
                                ],
                              ),
                            ),
                          ],
                        ),
                      )),
                ],
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 8,
              bottom: MediaQuery.of(context).padding.bottom + 8,
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _commentController,
                    decoration: const InputDecoration(
                      hintText: '댓글 입력',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    onSubmitted: (_) => _submitComment(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _commentLoading ? null : _submitComment,
                  icon: _commentLoading
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

  Future<void> _showReportDialog(BuildContext context, {required String targetType, required String targetId}) async {
    final reason = await showDialog<String>(
      context: context,
      builder: (ctx) {
        final ctrl = TextEditingController();
        return AlertDialog(
          title: const Text('신고하기'),
          content: TextField(
            controller: ctrl,
            decoration: const InputDecoration(
              hintText: '신고 사유 (선택)',
              border: OutlineInputBorder(),
            ),
            maxLines: 2,
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('취소')),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, ctrl.text.trim()),
              child: const Text('신고'),
            ),
          ],
        );
      },
    );
    if (reason == null || !context.mounted) return;
    try {
      final repo = context.read<ReportsRepository>();
      if (targetType == 'post') {
        await repo.reportPost(targetId, reason: reason);
      } else {
        await repo.reportComment(targetId, reason: reason);
      }
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('신고가 접수되었습니다.')));
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('신고 처리에 실패했습니다.')));
      }
    }
  }
}
