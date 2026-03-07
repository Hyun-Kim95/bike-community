/// 앱 환경 설정.
/// 실제 값은 빌드 플avor 또는 환경 변수로 주입 가능.
class Env {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api/v1',
  );
}
