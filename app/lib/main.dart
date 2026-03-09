import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme/app_theme.dart';
import 'core/theme/theme_mode_provider.dart';
import 'core/network/api_client.dart';
import 'core/upload/upload_repository.dart';
import 'core/router/app_router.dart';
import 'features/auth/data/auth_repository.dart' show AuthRepository, refreshAccessToken;
import 'features/auth/data/auth_storage.dart';
import 'features/auth/data/regions_repository.dart';
import 'features/auth/presentation/auth_provider.dart';
import 'features/community/data/community_repository.dart';
import 'features/community/data/reports_repository.dart';
import 'features/marketplace/data/marketplace_repository.dart';
import 'features/marketplace/data/chat_repository.dart';
import 'features/points/data/points_repository.dart';
import 'features/notices/data/notices_repository.dart';
import 'features/notifications/data/notifications_repository.dart';

void main() {
  final storage = AuthStorage();
  final apiClient = ApiClient(
    getToken: storage.getAccessToken,
    refreshToken: () => refreshAccessToken(storage),
  );
  final authRepository = AuthRepository(apiClient: apiClient, storage: storage);
  final authProvider = AuthProvider(repository: authRepository);
  final regionsRepository = RegionsRepository(apiClient: apiClient);
  final communityRepository = CommunityRepository(apiClient: apiClient);
  final reportsRepository = ReportsRepository(apiClient: apiClient);
  final marketplaceRepository = MarketplaceRepository(apiClient: apiClient);
  final chatRepository = ChatRepository(apiClient: apiClient);
  final pointsRepository = PointsRepository(apiClient: apiClient);
  final noticesRepository = NoticesRepository(apiClient: apiClient);
  final notificationsRepository = NotificationsRepository(apiClient: apiClient);
  final uploadRepository = UploadRepository(
    apiClient: apiClient,
    getToken: storage.getAccessToken,
  );
  final router = createAppRouter(authProvider);

  final themeModeProvider = ThemeModeProvider();
  themeModeProvider.load();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<ThemeModeProvider>.value(value: themeModeProvider),
        ChangeNotifierProvider<AuthProvider>.value(value: authProvider),
        Provider<RegionsRepository>.value(value: regionsRepository),
        Provider<CommunityRepository>.value(value: communityRepository),
        Provider<ReportsRepository>.value(value: reportsRepository),
        Provider<MarketplaceRepository>.value(value: marketplaceRepository),
        Provider<ChatRepository>.value(value: chatRepository),
        Provider<PointsRepository>.value(value: pointsRepository),
        Provider<NoticesRepository>.value(value: noticesRepository),
        Provider<NotificationsRepository>.value(value: notificationsRepository),
        Provider<UploadRepository>.value(value: uploadRepository),
      ],
      child: Consumer<ThemeModeProvider>(
        builder: (context, themeMode, _) => MaterialApp.router(
          title: 'Bike Community',
          theme: AppTheme.light,
          darkTheme: AppTheme.dark,
          themeMode: themeMode.themeMode,
          routerConfig: router,
        ),
      ),
    ),
  );
}
