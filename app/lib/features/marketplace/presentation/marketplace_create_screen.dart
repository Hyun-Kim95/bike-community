import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../../core/upload/upload_repository.dart';
import '../data/marketplace_repository.dart';
import '../models/marketplace_item.dart';

class MarketplaceCreateScreen extends StatefulWidget {
  const MarketplaceCreateScreen({super.key, this.itemId});

  /// null이면 새 판매글, 값이 있으면 해당 판매글 수정
  final String? itemId;

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
  static const int _maxImages = 5;
  bool _loading = false;
  bool _uploading = false;
  String? _error;

  bool get _isEdit => widget.itemId != null;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadCategoriesAndMaybeItem());
  }

  @override
  void dispose() {
    _titleController.dispose();
    _priceController.dispose();
    _descriptionController.dispose();
    _regionController.dispose();
    super.dispose();
  }

  Future<void> _loadCategoriesAndMaybeItem() async {
    try {
      final repo = context.read<MarketplaceRepository>();
      final categoriesFuture = repo.getCategories();
      MarketplaceItem? existing;
      if (_isEdit && widget.itemId != null) {
        existing = await repo.getItem(widget.itemId!);
      }
      final list = await categoriesFuture;
      if (!mounted) return;
      setState(() {
        _categories = list;
        if (existing != null) {
          _titleController.text = existing.title;
          _priceController.text = existing.price.toInt().toString();
          _descriptionController.text = existing.description;
          _regionController.text = existing.region;
          _category = existing.category;
          _imageUrls
            ..clear()
            ..addAll(existing.imageUrls);
        } else {
          if (_categories.isNotEmpty && _category == null) {
            _category = _categories.first;
          }
        }
      });
    } catch (_) {}
  }

  Future<void> _pickAndUploadImage(ImageSource source) async {
    if (_imageUrls.length >= _maxImages) return;
    final picker = ImagePicker();
    final xFile = await picker.pickImage(source: source, imageQuality: 85);
    if (xFile == null || !mounted) return;
    setState(() {
      _uploading = true;
      _error = null;
    });
    try {
      final uploadRepo = context.read<UploadRepository>();
      final url = await uploadRepo.uploadImageFromXFile(xFile);
      if (mounted) setState(() => _imageUrls.add(url));
    } catch (e) {
      if (mounted) {
        final msg = e is DioException && e.response?.statusCode == 401
            ? '로그인이 만료되었습니다. 다시 로그인해 주세요.'
            : e.toString();
        setState(() => _error = msg);
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  void _removeImage(int index) {
    setState(() => _imageUrls.removeAt(index));
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
      final title = _titleController.text.trim();
      final description = _descriptionController.text.trim();
      final region = _regionController.text.trim().isEmpty ? '미입력' : _regionController.text.trim();

      MarketplaceItem item;
      if (_isEdit && widget.itemId != null) {
        item = await repo.updateItem(
          id: widget.itemId!,
          title: title,
          category: _category!,
          price: price,
          description: description,
          imageUrls: _imageUrls,
          region: region,
        );
      } else {
        item = await repo.createItem(
          title: title,
          category: _category!,
          price: price,
          description: description,
          imageUrls: _imageUrls.isEmpty ? ['https://placehold.co/400x300?text=No+Image'] : _imageUrls,
          region: region,
        );
      }
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
        title: Text(_isEdit ? '판매글 수정' : '판매글 등록'),
        actions: [
          TextButton(
            onPressed: _loading ? null : _submit,
            child: _loading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : Text(_isEdit ? '수정' : '등록'),
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
              value: _category,
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
            const Text('이미지 (선택, 최대 $_maxImages장)', style: TextStyle(fontSize: 12, color: Colors.grey)),
            const SizedBox(height: 8),
            Row(
              children: [
                if (_imageUrls.length < _maxImages) ...[
                  OutlinedButton.icon(
                    onPressed: _uploading ? null : () => _pickAndUploadImage(ImageSource.gallery),
                    icon: const Icon(Icons.photo_library),
                    label: const Text('갤러리'),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    onPressed: _uploading ? null : () => _pickAndUploadImage(ImageSource.camera),
                    icon: const Icon(Icons.camera_alt),
                    label: const Text('카메라'),
                  ),
                  if (_uploading) ...[const SizedBox(width: 8), const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))],
                ],
              ],
            ),
            if (_imageUrls.isNotEmpty) ...[
              const SizedBox(height: 8),
              SizedBox(
                height: 100,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _imageUrls.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, i) {
                    return Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            _imageUrls[i],
                            width: 100,
                            height: 100,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              width: 100,
                              height: 100,
                              color: Colors.grey.shade300,
                              child: const Icon(Icons.broken_image_outlined),
                            ),
                          ),
                        ),
                        Positioned(
                          top: 4,
                          right: 4,
                          child: IconButton(
                            icon: const Icon(Icons.close, color: Colors.white, size: 20),
                            style: IconButton.styleFrom(
                              backgroundColor: Colors.black54,
                              padding: const EdgeInsets.all(4),
                              minimumSize: const Size(28, 28),
                            ),
                            onPressed: () => _removeImage(i),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
