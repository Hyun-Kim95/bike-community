class AuthUser {
  final String id;
  final String email;
  final String nickname;
  final String status;
  final AuthUserProfile profile;

  const AuthUser({
    required this.id,
    required this.email,
    required this.nickname,
    required this.status,
    required this.profile,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'nickname': nickname,
        'status': status,
        'profile': profile.toJson(),
      };

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      email: json['email'] as String,
      nickname: json['nickname'] as String,
      status: json['status'] as String,
      profile: AuthUserProfile.fromJson(
        Map<String, dynamic>.from(json['profile'] as Map),
      ),
    );
  }
}

class AuthUserProfile {
  final String? avatarUrl;
  final String gradeName;
  final int totalPoints;
  final String? bio;
  final String? region;
  final List<String>? interestCategories;

  const AuthUserProfile({
    this.avatarUrl,
    required this.gradeName,
    required this.totalPoints,
    this.bio,
    this.region,
    this.interestCategories,
  });

  factory AuthUserProfile.fromJson(Map<String, dynamic> json) {
    List<String>? categories;
    final raw = json['interestCategories'];
    if (raw is List) {
      categories = raw.map((e) => e.toString()).toList();
    }
    return AuthUserProfile(
      avatarUrl: json['avatarUrl'] as String?,
      gradeName: json['gradeName'] as String? ?? '새싹 라이더',
      totalPoints: json['totalPoints'] as int? ?? 0,
      bio: json['bio'] as String?,
      region: json['region'] as String?,
      interestCategories: categories,
    );
  }

  Map<String, dynamic> toJson() => {
        'avatarUrl': avatarUrl,
        'gradeName': gradeName,
        'totalPoints': totalPoints,
        if (bio != null) 'bio': bio,
        if (region != null) 'region': region,
        if (interestCategories != null) 'interestCategories': interestCategories,
      };
}

class AuthResult {
  final String accessToken;
  final String refreshToken;
  final int expiresIn;
  final AuthUser user;

  const AuthResult({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresIn,
    required this.user,
  });

  factory AuthResult.fromJson(Map<String, dynamic> json) {
    return AuthResult(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      expiresIn: json['expiresIn'] as int,
      user: AuthUser.fromJson(Map<String, dynamic>.from(json['user'] as Map)),
    );
  }
}
