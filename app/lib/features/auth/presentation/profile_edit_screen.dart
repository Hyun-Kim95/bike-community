import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../../core/upload/upload_repository.dart';
import 'auth_provider.dart';
import '../data/regions_repository.dart';

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

  bool _loading = true;
  bool _uploadingAvatar = false;
  String? _displayAvatarUrl;
  String? _error;

  List<RegionOption> _regionsLevel1 = [];
  List<RegionOption> _regionsLevel2 = [];
  RegionOption? _selectedRegion1;
  RegionOption? _selectedRegion2;
  // 지역 로딩 상태 (현재는 UI에는 직접 사용하지 않지만 확장용으로 유지)
  bool _regionsLoading = false;

  // 관심 카테고리 체크박스용
  static const List<String> _interestOptions = [
    '로드',
    'MTB',
    'BMX',
    '미니벨로',
    '부품/용품',
    '정비/튜닝',
    '라이딩 후기',
    '자유게시판',
  ];
  final Map<String, bool> _interestSelected = {
    for (final o in _interestOptions) o: false,
  };

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
    super.dispose();
  }

  Future<void> _load() async {
    final auth = context.read<AuthProvider>();
    final u = auth.user;
    if (u != null) {
      _nicknameController.text = u.nickname;
      final avatar = u.profile.avatarUrl ?? '';
      _avatarUrlController.text = avatar;
      _displayAvatarUrl = avatar.isEmpty ? null : avatar;
      _bioController.text = u.profile.bio ?? '';
      _applyInterestCategories(u.profile.interestCategories);
    }
    setState(() => _loading = false);
    // 서버에서 최신 프로필 가져오기 (bio, region 등)
    final latest = await auth.getMe();
    if (latest != null && mounted) {
      _nicknameController.text = latest.nickname;
      final avatar = latest.profile.avatarUrl ?? '';
      _avatarUrlController.text = avatar;
      _displayAvatarUrl = avatar.isEmpty ? null : avatar;
      _bioController.text = latest.profile.bio ?? '';
      _applyInterestCategories(latest.profile.interestCategories);
      setState(() {});
    }
    // 지역 선택용 데이터 로드
    final regionStr = (latest ?? u)?.profile.region;
    await _loadRegions(regionStr);
  }

  void _applyInterestCategories(List<String>? interest) {
    final set = <String>{...(interest ?? const [])};
    for (final key in _interestSelected.keys.toList()) {
      _interestSelected[key] = set.contains(key);
    }
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
        final parts = currentRegion.split(RegExp(r'\\s+'));
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
      });
    } finally {
      if (mounted) setState(() => _regionsLoading = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _error = null;
    });
    final categories = _interestSelected.entries
        .where((e) => e.value)
        .map((e) => e.key)
        .toList();

    final ok = await context.read<AuthProvider>().updateProfile(
          nickname: _nicknameController.text.trim(),
          avatarUrl: _avatarUrlController.text.trim().isEmpty ? null : _avatarUrlController.text.trim(),
          bio: _bioController.text.trim().isEmpty ? null : _bioController.text.trim(),
          region: _selectedRegion1 == null
              ? null
              : _selectedRegion2 == null
                  ? _selectedRegion1!.name
                  : '${_selectedRegion1!.name} ${_selectedRegion2!.name}',
          interestCategories: categories.isEmpty ? null : categories,
        );
    if (!mounted) return;
    if (ok) {
      context.go('/');
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('프로필이 수정되었습니다.')));
    } else {
      setState(() => _error = context.read<AuthProvider>().error);
    }
  }

  Future<void> _pickAvatar(ImageSource source) async {
    final picker = ImagePicker();
    final xFile = await picker.pickImage(source: source, imageQuality: 85);
    if (xFile == null || !mounted) return;
    setState(() => _uploadingAvatar = true);
    try {
      final url = await context.read<UploadRepository>().uploadImageFromXFile(xFile);
      if (mounted) {
        _avatarUrlController.text = url;
        _displayAvatarUrl = url;
        setState(() {});
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _uploadingAvatar = false);
    }
  }

  void _showAvatarSourcePicker() {
    showModalBottomSheet<void>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('갤러리에서 선택'),
              onTap: () {
                Navigator.pop(ctx);
                _pickAvatar(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('카메라로 촬영'),
              onTap: () {
                Navigator.pop(ctx);
                _pickAvatar(ImageSource.camera);
              },
            ),
          ],
        ),
      ),
    );
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
            Row(
              children: [
                Stack(
                  alignment: Alignment.center,
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundImage: (_displayAvatarUrl != null && _displayAvatarUrl!.isNotEmpty)
                          ? NetworkImage(_displayAvatarUrl!)
                          : (user.profile.avatarUrl != null && user.profile.avatarUrl!.isNotEmpty
                              ? NetworkImage(user.profile.avatarUrl!)
                              : null),
                      child: (_displayAvatarUrl == null || _displayAvatarUrl!.isEmpty) &&
                              (user.profile.avatarUrl == null || user.profile.avatarUrl!.isEmpty)
                          ? const Icon(Icons.person, size: 40)
                          : null,
                    ),
                    if (_uploadingAvatar)
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(color: Colors.black45, shape: BoxShape.circle),
                        child: const Center(child: SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))),
                      ),
                  ],
                ),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('프로필 사진', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    const SizedBox(height: 4),
                    FilledButton.icon(
                      onPressed: _uploadingAvatar ? null : _showAvatarSourcePicker,
                      icon: const Icon(Icons.add_photo_alternate, size: 20),
                      label: const Text('사진 선택'),
                    ),
                  ],
                ),
              ],
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
            if (_regionsLevel1.isEmpty)
              TextFormField(
                decoration: const InputDecoration(
                  labelText: '지역',
                  border: OutlineInputBorder(),
                  hintText: '예: 서울특별시 부평구',
                  helperText: '지역 목록을 불러오지 못한 경우 수동으로 입력하세요.',
                ),
                maxLength: 100,
                onChanged: (v) {
                  _selectedRegion1 = null;
                  _selectedRegion2 = null;
                },
              )
            else
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _selectedRegion1?.code,
                      decoration: const InputDecoration(
                        labelText: '지역 (시/도)',
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
                        final repo = context.read<RegionsRepository>();
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
                          final children = await repo.getChildren(code);
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
                      decoration: const InputDecoration(
                        labelText: '지역 (구/군)',
                        border: OutlineInputBorder(),
                      ),
                      items: _regionsLevel2
                          .map(
                            (r) => DropdownMenuItem(
                              value: r.code,
                              child: Text(r.name),
                            ),
                          )
                          .toList(),
                      onChanged: _regionsLevel2.isEmpty
                          ? null
                          : (code) {
                              if (code == null) return;
                              final selected = _regionsLevel2.firstWhere(
                                (r) => r.code == code,
                                orElse: () => _regionsLevel2.first,
                              );
                              setState(() {
                                _selectedRegion2 = selected;
                              });
                            },
                    ),
                  ),
                ],
              ),
            const SizedBox(height: 16),
            Text('관심 카테고리', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: _interestOptions.map((opt) {
                final selected = _interestSelected[opt] ?? false;
                return FilterChip(
                  label: Text(opt),
                  selected: selected,
                  onSelected: (v) {
                    setState(() {
                      _interestSelected[opt] = v;
                    });
                  },
                );
              }).toList(),
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
