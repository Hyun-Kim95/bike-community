import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../data/marketplace_repository.dart';

class MarketplaceCreateScreen extends StatefulWidget {
  const MarketplaceCreateScreen({super.key});

  @override
  State<MarketplaceCreateScreen> createState() => _MarketplaceCreateScreenState();
}

class _MarketplaceCreateScreenState extends State<MarketplaceCreateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _priceController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _regionController = TextEditingController();
  String? _category;
  List<String> _categories = [];
  final List<String> _imageUrls = [];
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadCategories());
  }

  @override
  void dispose() {
    _titleController.dispose();
    _priceController.dispose();
    _descriptionController.dispose();
    _regionController.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    try {
      final repo = context.read<MarketplaceRepository>();
      final list = await repo.getCategories();
      if (mounted) {
        setState(() {
          _categories = list;
          if (_categories.isNotEmpty && _category == null) {
            _category = _categories.first;
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_category == null || _category!.isEmpty) {
      setState(() => _error = '카테고리를 선택하세요.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = context.read<MarketplaceRepository>();
      final price = num.tryParse(_priceController.text.trim()) ?? 0;
      final item = await repo.createItem(
        title: _titleController.text.trim(),
        category: _category!,
        price: price,
        description: _descriptionController.text.trim(),
        imageUrls: _imageUrls.isEmpty ? ['https://placehold.co/400x300?text=No+Image'] : _imageUrls,
        region: _regionController.text.trim().isEmpty ? '미입력' : _regionController.text.trim(),
      );
      if (mounted) context.go('/marketplace/${item.id}');
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('판매글 등록'),
        actions: [
          TextButton(
            onPressed: _loading ? null : _submit,
            child: _loading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('등록'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
              ),
            DropdownButtonFormField<String>(
              initialValue: _category,
              decoration: const InputDecoration(labelText: '카테고리', border: OutlineInputBorder()),
              items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
              onChanged: (v) => setState(() => _category = v),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: '제목',
                border: OutlineInputBorder(),
                hintText: '상품명을 입력하세요',
              ),
              validator: (v) => v == null || v.trim().isEmpty ? '제목을 입력하세요.' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _priceController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: '가격 (원)',
                border: OutlineInputBorder(),
                hintText: '0',
              ),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return '가격을 입력하세요.';
                if (num.tryParse(v) == null || num.tryParse(v)! < 0) return '올바른 가격을 입력하세요.';
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _regionController,
              decoration: const InputDecoration(
                labelText: '거래 지역',
                border: OutlineInputBorder(),
                hintText: '예: 서울 강남',
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: '설명',
                border: OutlineInputBorder(),
                alignLabelWithHint: true,
                hintText: '상품 설명을 입력하세요',
              ),
              maxLines: 6,
              validator: (v) => v == null || v.trim().isEmpty ? '설명을 입력하세요.' : null,
            ),
            const SizedBox(height: 16),
            const Text('이미지 URL (선택, 추후 업로드 연동)', style: TextStyle(fontSize: 12)),
            const SizedBox(height: 4),
            if (_imageUrls.isNotEmpty)
              ...List.generate(_imageUrls.length, (i) => ListTile(
                title: Text(_imageUrls[i], maxLines: 1, overflow: TextOverflow.ellipsis),
                trailing: IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => setState(() => _imageUrls.removeAt(i)),
                ),
              )),
          ],
        ),
      ),
    );
  }
}
