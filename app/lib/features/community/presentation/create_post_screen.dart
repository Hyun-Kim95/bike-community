import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../../core/upload/upload_repository.dart';
import '../data/community_repository.dart';
import '../models/post.dart';

class CreatePostScreen extends StatefulWidget {
  const CreatePostScreen({super.key, this.postId});

  /// null 이면 새 글쓰기, 값이 있으면 해당 게시글 수정
  final String? postId;

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  final _videoUrlController = TextEditingController();
  final List<XFile> _pickedImages = [];
  final List<Uint8List?> _pickedImageBytes = [];
  static const int _maxImages = 3;
  List<String> _existingImageUrls = [];
  String? _category;
  List<String> _categories = [];
  bool _loading = false;
  String? _error;

  bool get _isEdit => widget.postId != null;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadCategoriesAndMaybePost());
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    _videoUrlController.dispose();
    super.dispose();
  }

  Future<void> _loadCategoriesAndMaybePost() async {
    try {
      final repo = context.read<CommunityRepository>();
      final categoriesFuture = repo.getCategories();
      Post? existing;
      if (_isEdit && widget.postId != null) {
        existing = await repo.getPost(widget.postId!);
      }
      final list = await categoriesFuture;
      if (!mounted) return;
      setState(() {
        _categories = list;
        if (existing != null) {
          _titleController.text = existing.title;
          _contentController.text = existing.content;
          _videoUrlController.text = existing.videoUrl ?? '';
          _category = existing.category;
          _existingImageUrls = existing.imageUrls ?? [];
        } else {
          if (_categories.isNotEmpty && _category == null) {
            _category = _categories.first;
          }
        }
      });
    } catch (_) {}
  }

  Future<void> _pickImage(ImageSource source) async {
    if (_pickedImages.length + _existingImageUrls.length >= _maxImages) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('이미지는 최대 $_maxImages장까지 등록할 수 있습니다.')),
        );
      }
      return;
    }
    final picker = ImagePicker();
    final xFile = await picker.pickImage(source: source, imageQuality: 85);
    if (xFile == null || !mounted) return;
    final bytes = await xFile.readAsBytes();
    if (!mounted) return;
    setState(() {
      _pickedImages.add(xFile);
      _pickedImageBytes.add(bytes);
    });
  }

  void _removeImage(int index) {
    setState(() {
      _pickedImages.removeAt(index);
      _pickedImageBytes.removeAt(index);
    });
  }

  static String _requestErrorMessage(Object e) {
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
      final uploadRepo = context.read<UploadRepository>();
      final communityRepo = context.read<CommunityRepository>();
      // 기존 이미지 + 새로 업로드한 이미지 URL을 합쳐서 전송
      final List<String> imageUrls = List.of(_existingImageUrls);
      for (final xFile in _pickedImages) {
        final url = await uploadRepo.uploadImageFromXFile(xFile);
        imageUrls.add(url);
      }
      final videoUrl = _videoUrlController.text.trim();
      final title = _titleController.text.trim();
      final content = _contentController.text.trim();
      final category = _category!;

      Post post;
      if (_isEdit && widget.postId != null) {
        post = await communityRepo.updatePost(
          id: widget.postId!,
          title: title,
          content: content,
          category: category,
          imageUrls: imageUrls.isEmpty ? null : imageUrls,
          videoUrl: videoUrl.isEmpty ? null : videoUrl,
        );
      } else {
        post = await communityRepo.createPost(
          title: title,
          content: content,
          category: category,
          imageUrls: imageUrls.isEmpty ? null : imageUrls,
          videoUrl: videoUrl.isEmpty ? null : videoUrl,
        );
      }
      if (mounted) context.go('/posts/${post.id}');
    } catch (e) {
      if (mounted) {
        final msg = _requestErrorMessage(e);
        setState(() => _error = msg);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        title: Text(_isEdit ? '글 수정' : '글쓰기'),
        actions: [
          TextButton(
            onPressed: _loading ? null : _submit,
            child: _loading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('완료'),
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
                hintText: '제목을 입력하세요',
              ),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return '제목을 입력하세요.';
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _contentController,
              decoration: const InputDecoration(
                labelText: '내용',
                border: OutlineInputBorder(),
                alignLabelWithHint: true,
                hintText: '내용을 입력하세요',
              ),
              maxLines: 8,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return '내용을 입력하세요.';
                return null;
              },
            ),
            const SizedBox(height: 16),
            if (_isEdit && _existingImageUrls.isNotEmpty) ...[
              const Text(
                '등록된 이미지',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 100,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _existingImageUrls.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, i) {
                    final url = _existingImageUrls[i];
                    return Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            url,
                            width: 100,
                            height: 100,
                            fit: BoxFit.cover,
                            cacheWidth: 200,
                            cacheHeight: 200,
                            errorBuilder: (context, error, stack) => Container(
                              width: 100,
                              height: 100,
                              color: Colors.grey.shade300,
                              alignment: Alignment.center,
                              child: const Icon(Icons.broken_image),
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
                            onPressed: () {
                              setState(() {
                                _existingImageUrls.removeAt(i);
                              });
                            },
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
            ],
            const Text('이미지 (선택, 최대 $_maxImages장)', style: TextStyle(fontSize: 12, color: Colors.grey)),
            const SizedBox(height: 8),
            Row(
              children: [
                if (_pickedImages.length + _existingImageUrls.length < _maxImages) ...[
                  OutlinedButton.icon(
                    onPressed: () => _pickImage(ImageSource.gallery),
                    icon: const Icon(Icons.photo_library),
                    label: const Text('갤러리'),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    onPressed: () => _pickImage(ImageSource.camera),
                    icon: const Icon(Icons.camera_alt),
                    label: const Text('카메라'),
                  ),
                ],
              ],
            ),
            if (_pickedImages.isNotEmpty) ...[
              const SizedBox(height: 8),
              SizedBox(
                height: 100,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _pickedImages.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, i) {
                    return Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: _pickedImageBytes.length > i && _pickedImageBytes[i] != null
                              ? Image.memory(_pickedImageBytes[i]!, width: 100, height: 100, fit: BoxFit.cover)
                              : Container(
                                  width: 100,
                                  height: 100,
                                  color: Colors.grey.shade300,
                                  child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
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
              const SizedBox(height: 16),
            ],
            TextFormField(
              controller: _videoUrlController,
              decoration: const InputDecoration(
                labelText: '동영상 URL (선택)',
                border: OutlineInputBorder(),
                hintText: 'https://...',
              ),
              keyboardType: TextInputType.url,
            ),
          ],
        ),
      ),
    );
  }
}
