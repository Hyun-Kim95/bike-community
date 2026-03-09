import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../config/env.dart';
import '../theme/theme_mode_provider.dart';
import '../../features/auth/presentation/auth_provider.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/profile_edit_screen.dart';
import '../../features/auth/presentation/signup_screen.dart';
import '../../features/auth/presentation/my_page_screen.dart';
import '../../features/community/presentation/feed_screen.dart';
import '../../features/community/presentation/post_detail_screen.dart';
import '../../features/community/presentation/create_post_screen.dart';
import '../../features/marketplace/presentation/marketplace_list_screen.dart';
import '../../features/marketplace/presentation/marketplace_detail_screen.dart';
import '../../features/marketplace/presentation/marketplace_create_screen.dart';
import '../../features/points/presentation/points_screen.dart';
import '../../features/marketplace/presentation/chat_list_screen.dart';
import '../../features/marketplace/presentation/chat_room_screen.dart';
import '../../features/notices/presentation/notices_list_screen.dart';
import '../../features/notices/presentation/notice_detail_screen.dart';
import '../../features/notifications/presentation/notifications_screen.dart';

GoRouter createAppRouter(ChangeNotifier authProvider) {
  return GoRouter(
    initialLocation: '/',
    refreshListenable: authProvider as Listenable,
    redirect: (context, state) {
      final auth = authProvider as AuthProvider;
      final loc = state.matchedLocation;
      // 저장된 로그인 상태를 읽을 때까지 리다이렉트 보류 (디버깅/초기화 시 멈춤 방지)
      if (!auth.initialized) return null;
      if (!auth.isLoggedIn && loc != '/login' && loc != '/signup') return '/login';
      if (auth.isLoggedIn && (loc == '/login' || loc == '/signup')) return '/';
      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const HomeWrapper(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignupScreen(),
      ),
      GoRoute(
        path: '/me',
        builder: (context, state) => const BackToHomeWrapper(child: MyPageScreen()),
      ),
      GoRoute(
        path: '/profile/edit',
        builder: (context, state) => const BackToHomeWrapper(child: ProfileEditScreen()),
      ),
      GoRoute(
        path: '/feed',
        builder: (context, state) => const BackToHomeWrapper(child: FeedScreen()),
      ),
      GoRoute(
        path: '/posts/create',
        builder: (context, state) => const BackToHomeWrapper(child: CreatePostScreen()),
      ),
      GoRoute(
        path: '/posts/:id/edit',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return BackToHomeWrapper(child: CreatePostScreen(postId: id));
        },
      ),
      GoRoute(
        path: '/posts/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return BackToHomeWrapper(child: PostDetailScreen(postId: id));
        },
      ),
      GoRoute(
        path: '/marketplace',
        builder: (context, state) => const BackToHomeWrapper(child: MarketplaceListScreen()),
      ),
      GoRoute(
        path: '/marketplace/create',
        builder: (context, state) => const BackToHomeWrapper(child: MarketplaceCreateScreen()),
      ),
      GoRoute(
        path: '/marketplace/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return BackToHomeWrapper(child: MarketplaceDetailScreen(itemId: id));
        },
      ),
      GoRoute(
        path: '/marketplace/:id/edit',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return BackToHomeWrapper(child: MarketplaceCreateScreen(itemId: id));
        },
      ),
      GoRoute(
        path: '/points',
        builder: (context, state) => const BackToHomeWrapper(child: PointsScreen()),
      ),
      GoRoute(
        path: '/chat',
        builder: (context, state) => const BackToHomeWrapper(child: ChatListScreen()),
      ),
      GoRoute(
        path: '/chat/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return BackToHomeWrapper(child: ChatRoomScreen(roomId: id));
        },
      ),
      GoRoute(
        path: '/notices',
        builder: (context, state) => const BackToHomeWrapper(child: NoticesListScreen()),
      ),
      GoRoute(
        path: '/notices/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return BackToHomeWrapper(child: NoticeDetailScreen(noticeId: id));
        },
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const BackToHomeWrapper(child: NotificationsScreen()),
      ),
    ],
  );
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final themeMode = context.watch<ThemeModeProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bike Community'),
        actions: [
          IconButton(
            icon: Icon(themeMode.isDark ? Icons.light_mode : Icons.dark_mode),
            onPressed: () => context.read<ThemeModeProvider>().toggle(),
            tooltip: themeMode.isDark ? '라이트 모드' : '다크 모드',
          ),
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () => context.push('/me'),
            tooltip: '마이페이지',
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await auth.logout();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (auth.user != null) ...[
              Text('안녕하세요, ${auth.user!.nickname}님'),
              const SizedBox(height: 8),
              Text(
                '등급: ${auth.user!.profile.gradeName} | 포인트: ${auth.user!.profile.totalPoints}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () => context.push('/profile/edit'),
                icon: const Icon(Icons.edit),
                label: const Text('프로필 수정'),
              ),
            ] else
              const Text('자전거 커뮤니티 & 중고 거래'),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () => context.push('/feed'),
              icon: const Icon(Icons.forum),
              label: const Text('커뮤니티 피드'),
            ),
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: () => context.push('/marketplace'),
              icon: const Icon(Icons.shopping_bag),
              label: const Text('중고 거래'),
            ),
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: () => context.push('/points'),
              icon: const Icon(Icons.stars),
              label: const Text('포인트 & 출석'),
            ),
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: () => context.push('/chat'),
              icon: const Icon(Icons.chat),
              label: const Text('채팅 목록'),
            ),
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: () => context.push('/notices'),
              icon: const Icon(Icons.campaign),
              label: const Text('공지사항'),
            ),
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: () => context.push('/notifications'),
              icon: const Icon(Icons.notifications),
              label: const Text('알림함'),
            ),
            const SizedBox(height: 8),
            Text(
              'API: ${Uri.parse(Env.apiBaseUrl).host}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}

/// 홈 화면용 wrapper - 두 번 뒤로가기 시 종료
class HomeWrapper extends StatefulWidget {
  const HomeWrapper({super.key});

  @override
  State<HomeWrapper> createState() => _HomeWrapperState();
}

class _HomeWrapperState extends State<HomeWrapper> {
  DateTime? _lastBackPressed;

  Future<bool> _onWillPop() async {
    final now = DateTime.now();
    if (_lastBackPressed == null ||
        now.difference(_lastBackPressed!) > const Duration(seconds: 2)) {
      _lastBackPressed = now;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('한 번 더 누르면 앱이 종료됩니다.')),
        );
      }
      return false;
    }
    return true; // 실제 종료
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: const HomeScreen(),
    );
  }
}

/// 하단 뒤로가기를 누르면 항상 메인으로 이동하게 하는 wrapper
class BackToHomeWrapper extends StatelessWidget {
  const BackToHomeWrapper({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        // 이 wrapper가 적용된 화면에서는 항상 홈으로 이동
        GoRouter.of(context).go('/');
        return false;
      },
      child: child,
    );
  }
}
