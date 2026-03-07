import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Admin index.css 디자인 토큰과 동일한 앱 테마
/// (:root / .dark oklch → sRGB 근사값)
class AppTheme {
  // :root (light)
  static const Color background = Color(0xFFFAFAFA);
  static const Color foreground = Color(0xFF525252);
  static const Color card = Color(0xFFFFFFFF);
  static const Color primary = Color(0xFF6B4EAA); // oklch(0.5676 0.2021 283.0838)
  static const Color primaryForeground = Color(0xFFFFFFFF);
  static const Color secondary = Color(0xFFC4C0E8); // oklch(0.8214 0.0720 249)
  static const Color secondaryForeground = Color(0xFF525252);
  static const Color muted = Color(0xFFD1D0C7); // oklch(0.8202 0.0213 91.6)
  static const Color mutedForeground = Color(0xFF898989);
  static const Color border = Color(0xFFDEDEDE);
  static const Color destructive = Color(0xFFE04B4B); // oklch(0.6368 0.2078 25.3)

  // .dark
  static const Color darkBackground = Color(0xFF36364A); // oklch(0.2303 0.0125 264.3)
  static const Color darkForeground = Color(0xFFEBEBEB);
  static const Color darkCard = Color(0xFF4A4A5C);
  static const Color darkPrimary = Color(0xFF6B4EAA); // 동일 primary
  static const Color darkPrimaryForeground = Color(0xFFFFFFFF);
  static const Color darkSecondary = Color(0xFF5C3D7A); // oklch(0.3390 0.1793 301.7)
  static const Color darkMuted = Color(0xFF626262);
  static const Color darkMutedForeground = Color(0xFFB6B6B6);
  static const Color darkBorder = Color(0xFF626262);
  static const Color darkDestructive = Color(0xFFE04B4B);

  static ThemeData get light {
    final baseText = Typography.material2021(platform: TargetPlatform.android).black;
    final textTheme = GoogleFonts.montserratTextTheme(baseText).apply(bodyColor: foreground, displayColor: foreground);
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.light(
        surface: background,
        onSurface: foreground,
        primary: primary,
        onPrimary: primaryForeground,
        secondary: secondary,
        onSecondary: secondaryForeground,
        surfaceContainerHighest: muted,
        outline: border,
        error: destructive,
        onError: primaryForeground,
      ),
      scaffoldBackgroundColor: background,
      fontFamily: GoogleFonts.montserrat().fontFamily,
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: background,
        foregroundColor: foreground,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.montserrat(color: foreground, fontWeight: FontWeight.w600, fontSize: 20),
      ),
      cardTheme: CardThemeData(
        color: card,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: background,
        border: const OutlineInputBorder(),
        enabledBorder: const OutlineInputBorder(borderSide: BorderSide(color: border)),
        focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: primary, width: 2)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: primaryForeground,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primary,
          side: const BorderSide(color: border),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: primary,
        foregroundColor: primaryForeground,
      ),
    );
  }

  static ThemeData get dark {
    final baseText = Typography.material2021(platform: TargetPlatform.android).white;
    final textTheme = GoogleFonts.montserratTextTheme(baseText).apply(bodyColor: darkForeground, displayColor: darkForeground);
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.dark(
        surface: darkBackground,
        onSurface: darkForeground,
        primary: darkPrimary,
        onPrimary: darkPrimaryForeground,
        secondary: darkSecondary,
        onSecondary: darkForeground,
        surfaceContainerHighest: darkMuted,
        outline: darkBorder,
        error: darkDestructive,
        onError: darkPrimaryForeground,
      ),
      scaffoldBackgroundColor: darkBackground,
      fontFamily: GoogleFonts.montserrat().fontFamily,
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: darkBackground,
        foregroundColor: darkForeground,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.montserrat(color: darkForeground, fontWeight: FontWeight.w600, fontSize: 20),
      ),
      cardTheme: CardThemeData(
        color: darkCard,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkMuted,
        border: const OutlineInputBorder(),
        enabledBorder: const OutlineInputBorder(borderSide: BorderSide(color: darkBorder)),
        focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: darkPrimary, width: 2)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: darkPrimary,
          foregroundColor: darkPrimaryForeground,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: darkPrimary,
          side: const BorderSide(color: darkBorder),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: darkPrimary,
        foregroundColor: darkPrimaryForeground,
      ),
    );
  }
}
