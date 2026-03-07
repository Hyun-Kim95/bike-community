import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../data/community_repository.dart';

class CreatePostScreen extends StatefulWidget {
  const CreatePostScreen({super.key});

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  final _videoUrlController = TextEditingController();
  final List<TextEditingController> _imageUrlControllers = [
    TextEditingController(),
    TextEditingController(),
    TextEditingController(),
  ];
  String? _category;
  List<String> _categories = [];
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
    _contentController.dispose();
    _videoUrlController.dispose();
    for (final c in _imageUrlControllers) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _loadCategories() async {
    try {
      final repo = context.read<CommunityRepository>();
      final list = await repo.getCategories();
      if (mounted) {
        setState(() {
          _categories = list;
          if (_categories.isNotEmpty && _category == null) _category = _categories.first;
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
      final repo = context.read<CommunityRepository>();
      final imageUrls = _imageUrlControllers
          .map((c) => c.text.trim())
          .where((s) => s.isNotEmpty)
          .toList();
      final videoUrl = _videoUrlController.text.trim();
      final post = await repo.createPost(
        title: _titleController.text.trim(),
        content: _contentController.text.trim(),
        category: _category!,
        imageUrls: imageUrls.isEmpty ? null : imageUrls,
        videoUrl: videoUrl.isEmpty ? null : videoUrl,
      );
      if (mounted) context.go('/posts/${post.id}');
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
        title: const Text('글쓰기'),
        actions: [
          TextButton(
            onPressed: _loading ? null : _submit,
            child: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('완료'),
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
            const Text('이미지 URL (선택, 최대 3개)', style: TextStyle(fontSize: 12, color: Colors.grey)),
            const SizedBox(height: 4),
            ..._imageUrlControllers.asMap().entries.map((e) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: TextFormField(
                    controller: e.value,
                    decoration: InputDecoration(
                      labelText: '이미지 ${e.key + 1}',
                      border: const OutlineInputBorder(),
                      hintText: 'https://...',
                    ),
                    keyboardType: TextInputType.url,
                  ),
                )),
            const SizedBox(height: 8),
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
