import 'package:flutter/material.dart';

/// Leroy AI brand color tokens — deep teal accent on slate neutrals.
class AppColors {
  AppColors._();

  // Brand
  static const Color teal = Color(0xFF0D9488);
  static const Color tealLight = Color(0xFF2DD4BF);
  static const Color tealDark = Color(0xFF0F766E);
  static const Color coral = Color(0xFFE85D4C);
  static const Color amber = Color(0xFFF59E0B);

  // Light
  static const Color lightBackground = Color(0xFFF7F9FB);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightSurfaceAlt = Color(0xFFEEF3F6);
  static const Color lightText = Color(0xFF0F172A);
  static const Color lightTextSecondary = Color(0xFF64748B);
  static const Color lightBorder = Color(0xFFD8E1E8);
  static const Color lightGradientStart = Color(0xFFE8F6F4);
  static const Color lightGradientEnd = Color(0xFFF7F9FB);

  // Dark
  static const Color darkBackground = Color(0xFF0B1220);
  static const Color darkSurface = Color(0xFF121A2A);
  static const Color darkSurfaceAlt = Color(0xFF1A2438);
  static const Color darkText = Color(0xFFF1F5F9);
  static const Color darkTextSecondary = Color(0xFF94A3B8);
  static const Color darkBorder = Color(0xFF243044);
  static const Color darkGradientStart = Color(0xFF0B1A1A);
  static const Color darkGradientEnd = Color(0xFF0B1220);

  static const LinearGradient brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [tealDark, teal, tealLight],
  );

  static const LinearGradient heroLightGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [lightGradientStart, lightGradientEnd],
  );

  static const LinearGradient heroDarkGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [darkGradientStart, darkGradientEnd],
  );
}
