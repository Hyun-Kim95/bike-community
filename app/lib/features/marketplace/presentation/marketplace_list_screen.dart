import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../data/marketplace_repository.dart';
import '../models/marketplace_item.dart';

class MarketplaceListScreen extends StatefulWidget {
  const MarketplaceListScreen({super.key, this.embed = false, this.isCurrentTab = true});

  /// true면 상단 AppBar 없이 내용만, FAB만 포함해서 탭 내에서 사용
  final bool embed;
  /// 홈 탭에서 사용 시, 현재 선택된 탭일 때만 데이터 로드
  final bool isCurrentTab;

  @override
  State<MarketplaceListScreen> createState() => _MarketplaceListScreenState();
}

class _MarketplaceListScreenState extends State<MarketplaceListScreen> {
  final _scrollController = ScrollController();
  String _sort = 'latest';
  String? _category;
  List<MarketplaceItem> _items = [];
  int _page = 1;
  int _totalPages = 1;
  bool _loading = false;
  bool _loadingMore = false;
  bool _hasLoaded = false;

  Future<void> _load({bool refresh = true}) async {
    if (_loading) return;
    setState(() {
      _loading = true;
      if (refresh) _page = 1;
    });
    try {
      final repo = context.read<MarketplaceRepository>();
      final res = await repo.getItems(
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
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _loadMore() {
    if (_loadingMore || _loading || _page >= _totalPages) return;
    setState(() => _loadingMore = true);
    context.read<MarketplaceRepository>().getItems(
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
    _scrollController.addListener(() {
      if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
        _loadMore();
      }
    });
    if (widget.isCurrentTab) {
      _hasLoaded = true;
      WidgetsBinding.instance.addPostFrameCallback((_) => _load());
    }
  }

  @override
  void didUpdateWidget(covariant MarketplaceListScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isCurrentTab && !_hasLoaded) {
      _hasLoaded = true;
      WidgetsBinding.instance.addPostFrameCallback((_) => _load());
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_hasLoaded) {
      if (widget.embed) return const SizedBox.shrink();
      return Scaffold(appBar: AppBar(title: const Text('중고 거래')), body: const SizedBox.shrink());
    }
    final body = RefreshIndicator(
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
                final item = _items[index];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  child: ListTile(
                    leading: item.imageUrls.isNotEmpty
                        ? Image.network(
                            item.imageUrls.first,
                            width: 56,
                            height: 56,
                            fit: BoxFit.cover,
                            cacheWidth: 112,
                            cacheHeight: 112,
                            errorBuilder: (context, error, stackTrace) =>
                                const Icon(Icons.image_not_supported),
                          )
                        : const Icon(Icons.two_wheeler, size: 40),
                    title: Text(
                      item.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Text('${item.priceFormatted} · ${item.region}'),
                    trailing: Text(
                      item.statusLabel,
                      style: Theme.of(context).textTheme.labelSmall,
                    ),
                    onTap: () => context.push('/marketplace/${item.id}'),
                  ),
                );
              },
            ),
    );

    if (widget.embed) {
      return Scaffold(
        body: body,
        floatingActionButton: FloatingActionButton(
          onPressed: () => context.push('/marketplace/create'),
          child: const Icon(Icons.add),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('중고 거래'),
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
      body: body,
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/marketplace/create'),
        child: const Icon(Icons.add),
      ),
    );
  }
}
