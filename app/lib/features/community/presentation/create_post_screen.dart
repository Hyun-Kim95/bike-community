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
  static const int _maxImages = 3;
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
        } else {
          if (_categories.isNotEmpty && _category == null) {
            _category = _categories.first;
          }
        }
      });
    } catch (_) {}
  }

  Future<void> _pickImage(ImageSource source) async {
    if (_pickedImages.length >= _maxImages) return;
    final picker = ImagePicker();
    final xFile = await picker.pickImage(source: source, imageQuality: 85);
    if (xFile == null || !mounted) return;
    setState(() => _pickedImages.add(xFile));
  }

  void _removeImage(int index) {
    setState(() => _pickedImages.removeAt(index));
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
      final List<String> imageUrls = [];
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
          // 이미지 수정은 새로 업로드한 경우에만 교체, 없으면 그대로 유지
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
        final msg = e is DioException && e.response?.statusCode == 401
            ? '로그인이 만료되었습니다. 다시 로그인해 주세요.'
            : e.toString();
        setState(() => _error = msg);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
            if (!_isEdit) ...[
              const Text('이미지 (선택, 최대 $_maxImages장)', style: TextStyle(fontSize: 12, color: Colors.grey)),
              const SizedBox(height: 8),
              Row(
                children: [
                  if (_pickedImages.length < _maxImages) ...[
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
                            child: FutureBuilder<dynamic>(
                              future: _pickedImages[i].readAsBytes(),
                              builder: (context, snapshot) {
                                if (snapshot.hasData) {
                                  return Image.memory(snapshot.data!, width: 100, height: 100, fit: BoxFit.cover);
                                }
                                return Container(width: 100, height: 100, color: Colors.grey.shade300, child: const Center(child: CircularProgressIndicator(strokeWidth: 2)));
                              },
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
