import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../auth/presentation/auth_provider.dart';
import '../data/chat_repository.dart';
import '../data/marketplace_repository.dart';
import '../models/marketplace_item.dart';
import '../models/review.dart';

class MarketplaceDetailScreen extends StatefulWidget {
  const MarketplaceDetailScreen({super.key, required this.itemId});

  final String itemId;

  @override
  State<MarketplaceDetailScreen> createState() => _MarketplaceDetailScreenState();
}

class _MarketplaceDetailScreenState extends State<MarketplaceDetailScreen> {
  MarketplaceItem? _item;
  bool _wished = false;
  bool _loading = true;
  List<Review> _reviews = [];
  String? _avgRating;

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final repo = context.read<MarketplaceRepository>();
      final item = await repo.getItem(widget.itemId);
      bool wished = false;
      try {
        wished = await repo.isWished(widget.itemId);
      } catch (_) {}
      Map<String, dynamic>? reviewsData;
      try {
        reviewsData = await repo.getReviews(widget.itemId);
      } catch (_) {}
      if (mounted) {
        setState(() {
          _item = item;
          _wished = wished;
          _reviews = (reviewsData?['items'] as List<Review>?) ?? [];
          _avgRating = reviewsData?['averageRating'] as String?;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggleWish() async {
    try {
      final repo = context.read<MarketplaceRepository>();
      final res = await repo.toggleWish(widget.itemId);
      if (mounted && _item != null) {
        setState(() {
          _wished = res['wished'] ?? false;
          _item = MarketplaceItem(
            id: _item!.id,
            title: _item!.title,
            category: _item!.category,
            price: _item!.price,
            description: _item!.description,
            imageUrls: _item!.imageUrls,
            region: _item!.region,
            saleStatus: _item!.saleStatus,
            viewCount: _item!.viewCount,
            wishCount: _item!.wishCount + (_wished ? 1 : -1),
            createdAt: _item!.createdAt,
            seller: _item!.seller,
          );
        });
      }
    } catch (_) {}
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
        appBar: AppBar(title: const Text('상품 상세')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (_item == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('상품 상세')),
        body: const Center(child: Text('상품을 찾을 수 없습니다.')),
      );
    }
    final item = _item!;
    return Scaffold(
      appBar: AppBar(
        title: const Text('상품 상세'),
        actions: [
          IconButton(
            icon: Icon(_wished ? Icons.favorite : Icons.favorite_border),
            color: _wished ? Colors.red : null,
            onPressed: _toggleWish,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
            if (item.imageUrls.isNotEmpty)
              SizedBox(
                height: 240,
                child: PageView.builder(
                  itemCount: item.imageUrls.length,
                  itemBuilder: (context, i) => Image.network(
                    item.imageUrls[i],
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => const Center(child: Icon(Icons.broken_image, size: 48)),
                  ),
                ),
              )
            else
              const SizedBox(
                height: 160,
                child: ColoredBox(
                  color: Colors.grey,
                  child: Center(child: Icon(Icons.two_wheeler, size: 64)),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.priceFormatted, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(item.title, style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text(item.region, style: Theme.of(context).textTheme.bodySmall),
                      const SizedBox(width: 8),
                      Text(item.statusLabel),
                      const Spacer(),
                      Text('조회 ${item.viewCount}'),
                      const SizedBox(width: 8),
                      Text('찜 ${item.wishCount}'),
                    ],
                  ),
                  const Divider(height: 24),
                  if (item.seller != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Row(
                        children: [
                          CircleAvatar(child: Text((item.seller!.nickname).isNotEmpty ? item.seller!.nickname[0] : '?')),
                          const SizedBox(width: 12),
                          Text(item.seller!.nickname, style: Theme.of(context).textTheme.titleSmall),
                        ],
                      ),
                    ),
                  Text(item.description),
                  const Divider(height: 24),
                  Row(
                    children: [
                      Text('후기 ${_reviews.length}', style: Theme.of(context).textTheme.titleMedium),
                      if (_avgRating != null) ...[
                        const SizedBox(width: 8),
                        Icon(Icons.star, size: 18, color: Colors.amber[700]),
                        Text(_avgRating!),
                      ],
                      const Spacer(),
                      if (_item?.seller != null &&
                          context.watch<AuthProvider>().user?.id != _item!.seller!.id)
                        TextButton.icon(
                          onPressed: () => _showReviewDialog(),
                          icon: const Icon(Icons.rate_review, size: 18),
                          label: const Text('후기 작성'),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ..._reviews.map((r) => Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              ...List.generate(5, (i) => Icon(
                                i < r.rating ? Icons.star : Icons.star_border,
                                size: 16,
                                color: Colors.amber[700],
                              )),
                              const SizedBox(width: 8),
                              Text(
                                r.reviewerNickname,
                                style: Theme.of(context).textTheme.labelMedium,
                              ),
                            ],
                          ),
                          if (r.content != null && r.content!.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(r.content!),
                          ],
                        ],
                      ),
                    ),
                  )),
                ],
              ),
            ),
                ],
              ),
            ),
          ),
          if (context.watch<AuthProvider>().user?.id != item.seller?.id)
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _openChat,
                    icon: const Icon(Icons.chat),
                    label: const Text('채팅하기'),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _showReviewDialog() async {
    if (_item == null || _item!.seller == null) return;
    final auth = context.read<AuthProvider>();
    if (auth.user?.id == _item!.seller!.id) return;
    int rating = 5;
    final contentCtrl = TextEditingController();
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('후기 작성'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('평점'),
                Row(
                  children: List.generate(5, (i) => IconButton(
                    icon: Icon(i < rating ? Icons.star : Icons.star_border, color: Colors.amber),
                    onPressed: () => setState(() => rating = i + 1),
                  )),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: contentCtrl,
                  decoration: const InputDecoration(
                    hintText: '내용 (선택)',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 3,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('취소')),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('등록'),
            ),
          ],
        ),
      ),
    );
    if (result != true || !mounted) return;
    try {
      final repo = context.read<MarketplaceRepository>();
      final sellerId = _item!.seller!.id;
      await repo.createReview(widget.itemId, sellerId, rating, content: contentCtrl.text.trim());
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('후기가 등록되었습니다.')));
        _load();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('후기 등록에 실패했습니다.')));
      }
    }
  }

  Future<void> _openChat() async {
    if (_item == null) return;
    try {
      final repo = context.read<ChatRepository>();
      final room = await repo.getOrCreateRoom(_item!.id);
      if (mounted) context.push('/chat/${room.id}');
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('채팅방을 열 수 없습니다.')),
        );
      }
    }
  }
}
