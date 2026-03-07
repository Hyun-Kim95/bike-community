import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'auth_provider.dart';

class ProfileEditScreen extends StatefulWidget {
  const ProfileEditScreen({super.key});

  @override
  State<ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends State<ProfileEditScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nicknameController = TextEditingController();
  final _avatarUrlController = TextEditingController();
  final _bioController = TextEditingController();
  final _regionController = TextEditingController();
  final _interestController = TextEditingController();

  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _nicknameController.dispose();
    _avatarUrlController.dispose();
    _bioController.dispose();
    _regionController.dispose();
    _interestController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final auth = context.read<AuthProvider>();
    final u = auth.user;
    if (u != null) {
      _nicknameController.text = u.nickname;
      _avatarUrlController.text = u.profile.avatarUrl ?? '';
      _bioController.text = u.profile.bio ?? '';
      _regionController.text = u.profile.region ?? '';
      _interestController.text = (u.profile.interestCategories ?? []).join(', ');
    }
    setState(() => _loading = false);
    // 서버에서 최신 프로필 가져오기 (bio, region 등)
    final latest = await auth.getMe();
    if (latest != null && mounted) {
      _nicknameController.text = latest.nickname;
      _avatarUrlController.text = latest.profile.avatarUrl ?? '';
      _bioController.text = latest.profile.bio ?? '';
      _regionController.text = latest.profile.region ?? '';
      _interestController.text = (latest.profile.interestCategories ?? []).join(', ');
      setState(() {});
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _error = null;
    });
    final interestStr = _interestController.text.trim();
    final categories = interestStr.isEmpty
        ? <String>[]
        : interestStr.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();

    final ok = await context.read<AuthProvider>().updateProfile(
          nickname: _nicknameController.text.trim(),
          avatarUrl: _avatarUrlController.text.trim().isEmpty ? null : _avatarUrlController.text.trim(),
          bio: _bioController.text.trim().isEmpty ? null : _bioController.text.trim(),
          region: _regionController.text.trim().isEmpty ? null : _regionController.text.trim(),
          interestCategories: categories.isEmpty ? null : categories,
        );
    if (!mounted) return;
    if (ok) {
      context.pop();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('프로필이 수정되었습니다.')));
    } else {
      setState(() => _error = context.read<AuthProvider>().error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    if (_loading && user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('프로필 수정')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('프로필 수정')),
        body: const Center(child: Text('로그인이 필요합니다.')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('프로필 수정'),
        actions: [
          TextButton(
            onPressed: _loading ? null : _submit,
            child: const Text('저장'),
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
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  _error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            TextFormField(
              controller: _nicknameController,
              decoration: const InputDecoration(
                labelText: '닉네임',
                border: OutlineInputBorder(),
                hintText: '2~50자',
              ),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return '닉네임을 입력하세요.';
                if (v.trim().length < 2) return '닉네임은 2자 이상이어야 합니다.';
                if (v.trim().length > 50) return '닉네임은 50자 이하여야 합니다.';
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _avatarUrlController,
              decoration: const InputDecoration(
                labelText: '프로필 사진 URL',
                border: OutlineInputBorder(),
                hintText: 'https://...',
              ),
              keyboardType: TextInputType.url,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _bioController,
              decoration: const InputDecoration(
                labelText: '소개',
                border: OutlineInputBorder(),
                alignLabelWithHint: true,
                hintText: '자기소개를 입력하세요',
              ),
              maxLines: 3,
              maxLength: 500,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _regionController,
              decoration: const InputDecoration(
                labelText: '지역',
                border: OutlineInputBorder(),
                hintText: '예: 서울, 경기',
              ),
              maxLength: 100,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _interestController,
              decoration: const InputDecoration(
                labelText: '관심 카테고리',
                border: OutlineInputBorder(),
                hintText: '쉼표로 구분 (예: 로드, MTB)',
              ),
            ),
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('나의 등급', style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 4),
                    Text(user.profile.gradeName, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text('보유 포인트: ${user.profile.totalPoints} P', style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
