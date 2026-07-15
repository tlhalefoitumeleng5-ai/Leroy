import 'package:flutter/material.dart';

/// Leroy AI brand palette — deep teal + luminous aqua.
/// Intentionally avoids purple-gradient and cream/terracotta AI defaults.
abstract final class AppColors {
  // Brand
  static const Color brandTeal = Color(0xFF0B3D3A);
  static const Color brandTealDeep = Color(0xFF062825);
  static const Color brandAqua = Color(0xFF2EE6A6);
  static const Color brandAquaSoft = Color(0xFF7FFFD0);
  static const Color brandInk = Color(0xFF0A1A1C);
  static const Color brandSand = Color(0xFFE8F0EE);

  // Light
  static const Color lightBackground = Color(0xFFF2F7F6);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightSurfaceAlt = Color(0xFFE6F0EE);
  static const Color lightOnBackground = Color(0xFF0A1A1C);
  static const Color lightOnSurface = Color(0xFF1A2E30);
  static const Color lightOutline = Color(0xFFC5D5D2);
  static const Color lightMuted = Color(0xFF5A7370);

  // Dark
  static const Color darkBackground = Color(0xFF061312);
  static const Color darkSurface = Color(0xFF0C2220);
  static const Color darkSurfaceAlt = Color(0xFF12332F);
  static const Color darkOnBackground = Color(0xFFEAF6F3);
  static const Color darkOnSurface = Color(0xFFD5E8E4);
  static const Color darkOutline = Color(0xFF2A4A46);
  static const Color darkMuted = Color(0xFF8AABA5);

  // Semantic
  static const Color success = Color(0xFF1DBF73);
  static const Color warning = Color(0xFFE6A23C);
  static const Color error = Color(0xFFE05A5A);
  static const Color info = Color(0xFF3BA3C7);

  // Gradients
  static const LinearGradient heroLight = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFE8F5F2), Color(0xFFD4EBE6), Color(0xFFC2E4DC)],
  );

  static const LinearGradient heroDark = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF061312), Color(0xFF0B2A27), Color(0xFF0F3D38)],
  );

  static const LinearGradient accentGlow = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF2EE6A6), Color(0xFF1ABF8A)],
  );

  static const LinearGradient brandMark = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF0B3D3A), Color(0xFF167A6F), Color(0xFF2EE6A6)],
  );
}
