import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../auth/presentation/auth_provider.dart';
import '../data/points_repository.dart';

class PointsScreen extends StatefulWidget {
  const PointsScreen({super.key});

  @override
  State<PointsScreen> createState() => _PointsScreenState();
}

class _PointsScreenState extends State<PointsScreen> {
  TodayStatus? _todayStatus;
  PointHistoryResponse? _history;
  int? _totalPointsOverride;
  bool _loading = false;
  bool _checkingIn = false;

  Future<void> _load() async {
    if (_loading) return;
    setState(() => _loading = true);
    try {
      final repo = context.read<PointsRepository>();
      final status = await repo.getTodayStatus();
      final history = await repo.getHistory();
      if (mounted) {
        setState(() {
          _todayStatus = status;
          _history = history;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _checkIn() async {
    if (_checkingIn) return;
    setState(() => _checkingIn = true);
    try {
      final repo = context.read<PointsRepository>();
      final result = await repo.checkIn();
      if (mounted) {
        setState(() {
          _todayStatus = TodayStatus(
            checkedIn: true,
            consecutiveDays: result.consecutiveDays,
          );
          if (result.totalPoints != null) _totalPointsOverride = result.totalPoints;
          _checkingIn = false;
        });
        _load();
      }
    } catch (_) {
      if (mounted) setState(() => _checkingIn = false);
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final profile = auth.user?.profile;
    final totalPoints = _totalPointsOverride ?? profile?.totalPoints ?? 0;
    final gradeName = profile?.gradeName ?? '새싹 라이더';

    return Scaffold(
      appBar: AppBar(
        title: const Text('포인트 & 출석'),
      ),
      body: _loading && _todayStatus == null
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          children: [
                            Text('보유 포인트', style: Theme.of(context).textTheme.titleSmall),
                            const SizedBox(height: 4),
                            Text(
                              '$totalPoints P',
                              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: Theme.of(context).colorScheme.primary,
                                  ),
                            ),
                            const SizedBox(height: 8),
                            Text('등급: $gradeName', style: Theme.of(context).textTheme.bodyMedium),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text('출석 체크', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            if (_todayStatus != null) ...[
                              if (_todayStatus!.checkedIn) ...[
                                const Icon(Icons.check_circle, color: Colors.green, size: 48),
                                const SizedBox(height: 8),
                                Text(
                                  '오늘 출석 완료!',
                                  style: Theme.of(context).textTheme.titleMedium,
                                ),
                                if (_todayStatus!.consecutiveDays != null)
                                  Text(
                                    '연속 ${_todayStatus!.consecutiveDays}일',
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                              ] else ...[
                                FilledButton.icon(
                                  onPressed: _checkingIn ? null : _checkIn,
                                  icon: _checkingIn
                                      ? const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(strokeWidth: 2),
                                        )
                                      : const Icon(Icons.touch_app),
                                  label: Text(_checkingIn ? '처리 중...' : '출석 체크 (+10P)'),
                                  style: FilledButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '하루 1회 출석 시 10P 적립',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ],
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('포인트 내역', style: Theme.of(context).textTheme.titleMedium),
                        if (_history != null)
                          Text('총 ${_history!.total}건', style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (_history == null || _history!.items.isEmpty)
                      const Card(
                        child: Padding(
                          padding: EdgeInsets.all(24),
                          child: Center(child: Text('내역이 없습니다.')),
                        ),
                      )
                    else
                      ...(_history!.items.map((e) => Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              title: Text(e.reason),
                              subtitle: Text(
                                _formatDate(e.createdAt),
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                              trailing: Text(
                                '${e.amount >= 0 ? "+" : ""}${e.amount} P',
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: e.amount >= 0 ? Colors.green : Colors.red,
                                ),
                              ),
                            ),
                          ))),
                  ],
                ),
              ),
            ),
    );
  }

  String _formatDate(DateTime d) {
    return '${d.year}.${d.month.toString().padLeft(2, '0')}.${d.day.toString().padLeft(2, '0')} '
        '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  }
}
