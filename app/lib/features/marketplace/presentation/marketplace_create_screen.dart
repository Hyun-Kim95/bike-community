import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../../core/upload/upload_repository.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../auth/data/regions_repository.dart';
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
  bool _regionsLoading = false;
  String? _error;

  List<RegionOption> _regionsLevel1 = [];
  List<RegionOption> _regionsLevel2 = [];
  RegionOption? _selectedRegion1;
  RegionOption? _selectedRegion2;

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
      final defaultRegion = existing?.region ?? context.read<AuthProvider>().user?.profile.region;
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
      if (!mounted) return;
      await _loadRegions(defaultRegion);
    } catch (_) {}
  }

  Future<void> _loadRegions(String? currentRegion) async {
    final repo = context.read<RegionsRepository>();
    setState(() => _regionsLoading = true);
    try {
      final parents = await repo.getParents();
      RegionOption? selected1;
      RegionOption? selected2;
      List<RegionOption> children = [];

      String? parentName;
      String? childName;
      if (currentRegion != null && currentRegion.isNotEmpty) {
        final parts = currentRegion.split(RegExp(r'\s+'));
        if (parts.isNotEmpty) parentName = parts[0];
        if (parts.length > 1) childName = parts[1];
      }

      if (parentName != null) {
        for (final p in parents) {
          if (p.name == parentName) {
            selected1 = p;
            break;
          }
        }
      }
      selected1 ??= parents.isNotEmpty ? parents.first : null;

      if (selected1 != null) {
        children = await repo.getChildren(selected1.code);
        if (childName != null) {
          for (final c in children) {
            if (c.name == childName) {
              selected2 = c;
              break;
            }
          }
        }
      }
      selected2 ??= children.isNotEmpty ? children.first : null;

      if (!mounted) return;
      setState(() {
        _regionsLevel1 = parents;
        _regionsLevel2 = children;
        _selectedRegion1 = selected1;
        _selectedRegion2 = selected2;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _regionsLevel1 = [];
        _regionsLevel2 = [];
        _selectedRegion1 = null;
        _selectedRegion2 = null;
        _regionController.text = currentRegion ?? '';
      });
    } finally {
      if (mounted) setState(() => _regionsLoading = false);
    }
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
        final msg = _uploadErrorMessage(e);
        setState(() => _error = msg);
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  void _removeImage(int index) {
    setState(() => _imageUrls.removeAt(index));
  }

  static String _uploadErrorMessage(Object e) {
    if (e is DioException) {
      if (e.response?.statusCode == 401) {
        return '로그인이 만료되었습니다. 다시 로그인해 주세요.';
      }
      switch (e.type) {
        case DioExceptionType.receiveTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.connectionTimeout:
          return '요청 시간이 초과되었습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.';
        default:
          break;
      }
    }
    return e.toString();
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
      final region = _regionsLevel1.isEmpty
          ? (_regionController.text.trim().isEmpty ? '미입력' : _regionController.text.trim())
          : (_selectedRegion1 == null
              ? '미입력'
              : _selectedRegion2 == null
                  ? _selectedRegion1!.name
                  : '${_selectedRegion1!.name} ${_selectedRegion2!.name}');

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
      resizeToAvoidBottomInset: true,
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
            if (_regionsLevel1.isEmpty)
              TextFormField(
                controller: _regionController,
                decoration: const InputDecoration(
                  labelText: '거래 지역',
                  border: OutlineInputBorder(),
                  hintText: '예: 서울 강남',
                  helperText: '지역 목록을 불러오지 못한 경우 수동으로 입력하세요.',
                ),
              )
            else
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _selectedRegion1?.code,
                      decoration: const InputDecoration(
                        labelText: '거래 지역 (시/도)',
                        border: OutlineInputBorder(),
                      ),
                      items: _regionsLevel1
                          .map(
                            (r) => DropdownMenuItem(
                              value: r.code,
                              child: Text(r.name),
                            ),
                          )
                          .toList(),
                      onChanged: (code) async {
                        if (code == null) return;
                        final regionsRepo = context.read<RegionsRepository>();
                        final selected = _regionsLevel1.firstWhere(
                          (r) => r.code == code,
                          orElse: () => _regionsLevel1.first,
                        );
                        setState(() {
                          _selectedRegion1 = selected;
                          _regionsLevel2 = [];
                          _selectedRegion2 = null;
                          _regionsLoading = true;
                        });
                        try {
                          final children = await regionsRepo.getChildren(code);
                          if (!mounted) return;
                          setState(() {
                            _regionsLevel2 = children;
                            _selectedRegion2 = children.isNotEmpty ? children.first : null;
                          });
                        } finally {
                          if (mounted) setState(() => _regionsLoading = false);
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _selectedRegion2?.code,
                      decoration: InputDecoration(
                        labelText: '거래 지역 (구/군)',
                        border: const OutlineInputBorder(),
                        suffixIcon: _regionsLoading ? const SizedBox(width: 20, height: 20, child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2))) : null,
                      ),
                      items: _regionsLevel2
                          .map(
                            (r) => DropdownMenuItem(
                              value: r.code,
                              child: Text(r.name),
                            ),
                          )
                          .toList(),
                      onChanged: (_regionsLevel2.isEmpty || _regionsLoading)
                          ? null
                          : (code) {
                              if (code == null) return;
                              final selected = _regionsLevel2.firstWhere(
                                (r) => r.code == code,
                                orElse: () => _regionsLevel2.first,
                              );
                              setState(() => _selectedRegion2 = selected);
                            },
                    ),
                  ),
                ],
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
                            cacheWidth: 200,
                            cacheHeight: 200,
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
