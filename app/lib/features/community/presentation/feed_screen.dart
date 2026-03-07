import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../data/community_repository.dart';
import '../models/post.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final _scrollController = ScrollController();
  String _sort = 'latest';
  String? _category;
  List<Post> _items = [];
  int _page = 1;
  int _totalPages = 1;
  bool _loading = false;
  bool _loadingMore = false;

  Future<void> _load({bool refresh = true}) async {
    if (_loading) return;
    setState(() {
      _loading = true;
      if (refresh) _page = 1;
    });
    try {
      final repo = context.read<CommunityRepository>();
      final res = await repo.getPosts(
        page: refresh ? 1 : _page,
        limit: 20,
        sort: _sort,
        category: _category,
      );
      if (mounted) {
        setState(() {
          if (refresh) {
            _items = res.items;
          } else {
            _items = [..._items, ...res.items];
          }
          _totalPages = res.totalPages;
          _page = res.page;
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _loadMore() {
    if (_loadingMore || _loading || _page >= _totalPages) {
      return;
    }
    setState(() => _loadingMore = true);
    final repo = context.read<CommunityRepository>();
    repo.getPosts(
      page: _page + 1,
      limit: 20,
      sort: _sort,
      category: _category,
    ).then((res) {
      if (mounted) {
        setState(() {
          _items = [..._items, ...res.items];
          _page = res.page;
          _totalPages = res.totalPages;
          _loadingMore = false;
        });
      }
    });
  }

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      _loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('커뮤니티'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.sort),
            onSelected: (v) {
              setState(() {
                _sort = v;
                _load();
              });
            },
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'latest', child: Text('최신순')),
              const PopupMenuItem(value: 'popular', child: Text('인기순')),
            ],
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _load(refresh: true),
        child: _loading && _items.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: _items.length + (_loadingMore ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index >= _items.length) {
                    return const Padding(
                      padding: EdgeInsets.all(16),
                      child: Center(child: CircularProgressIndicator()),
                    );
                  }
                  final post = _items[index];
                  return Card(
                    margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    child: ListTile(
                      title: Text(
                        post.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      subtitle: Row(
                        children: [
                          if (post.author != null) Text(post.author!.nickname),
                          const SizedBox(width: 8),
                          Text(post.category),
                          const Spacer(),
                          Text('${post.likeCount} 좋아요'),
                          const SizedBox(width: 8),
                          Text('${post.commentCount} 댓글'),
                        ],
                      ),
                      onTap: () => context.push('/posts/${post.id}'),
                    ),
                  );
                },
              ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/posts/create'),
        child: const Icon(Icons.edit),
      ),
    );
  }
}
