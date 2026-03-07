import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/network/api_client.dart';
import 'core/router/app_router.dart';
import 'features/auth/data/auth_repository.dart';
import 'features/auth/data/auth_storage.dart';
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
  final apiClient = ApiClient(getToken: storage.getAccessToken);
  final authRepository = AuthRepository(apiClient: apiClient, storage: storage);
  final authProvider = AuthProvider(repository: authRepository);
  final communityRepository = CommunityRepository(apiClient: apiClient);
  final reportsRepository = ReportsRepository(apiClient: apiClient);
  final marketplaceRepository = MarketplaceRepository(apiClient: apiClient);
  final chatRepository = ChatRepository(apiClient: apiClient);
  final pointsRepository = PointsRepository(apiClient: apiClient);
  final noticesRepository = NoticesRepository(apiClient: apiClient);
  final notificationsRepository = NotificationsRepository(apiClient: apiClient);
  final router = createAppRouter(authProvider);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>.value(value: authProvider),
        Provider<CommunityRepository>.value(value: communityRepository),
        Provider<ReportsRepository>.value(value: reportsRepository),
        Provider<MarketplaceRepository>.value(value: marketplaceRepository),
        Provider<ChatRepository>.value(value: chatRepository),
        Provider<PointsRepository>.value(value: pointsRepository),
        Provider<NoticesRepository>.value(value: noticesRepository),
        Provider<NotificationsRepository>.value(value: notificationsRepository),
      ],
      child: MaterialApp.router(
        title: 'Bike Community',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
          useMaterial3: true,
        ),
        routerConfig: router,
      ),
    ),
  );
}
