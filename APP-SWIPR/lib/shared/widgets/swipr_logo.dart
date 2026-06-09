import 'package:flutter/material.dart';

/// Swipr logo — tre forme dal design originale SVG (viewBox 0 0 403 538).
///
///   ██████████████████  verde  (#168200) — barra superiore diagonale
///      ████████████     grigio (#D9D9D9) — barra centrale arrotondata
///   ██████████████████  rosso  (#9A0808) — barra inferiore a freccia
class SwiprLogo extends StatelessWidget {
  const SwiprLogo({super.key, this.size = 64.0});

  /// Altezza del logo; la larghezza si adatta al rapporto 403:538.
  final double size;

  @override
  Widget build(BuildContext context) {
    const aspectRatio = 403.0 / 538.0;
    return SizedBox(
      width: size * aspectRatio,
      height: size,
      child: CustomPaint(painter: _SwiprLogoPainter()),
    );
  }
}

class _SwiprLogoPainter extends CustomPainter {
  // SVG viewBox: 0 0 403 538
  static const _svgW = 403.0;
  static const _svgH = 538.0;

  @override
  void paint(Canvas canvas, Size size) {
    final sx = size.width / _svgW;
    final sy = size.height / _svgH;

    canvas.save();
    canvas.scale(sx, sy);

    // ── Verde — barra superiore ──────────────────────────────────────────────
    final greenPath = Path()
      ..moveTo(2.146, 136.118)
      ..cubicTo(-2.276, 128.458, 0.356, 118.663, 8.022, 114.251)
      ..lineTo(189.316, 9.914)
      ..cubicTo(191.550, 8.628, 194.062, 7.901, 196.638, 7.795)
      ..lineTo(385.491, 0.016)
      ..cubicTo(402.198, -0.673, 408.631, 21.498, 394.150, 29.859)
      ..lineTo(67.992, 218.166)
      ..cubicTo(60.339, 222.584, 50.554, 219.962, 46.135, 212.310)
      ..lineTo(2.146, 136.118)
      ..close();

    // ── Rosso scuro — barra inferiore ────────────────────────────────────────
    final redPath = Path()
      ..moveTo(292.503, 246.358)
      ..cubicTo(299.921, 242.029, 309.446, 244.557, 313.740, 251.995)
      ..lineTo(357.703, 328.140)
      ..cubicTo(361.983, 335.553, 359.442, 345.033, 352.029, 349.313)
      ..lineTo(30.015, 535.228)
      ..cubicTo(15.768, 543.453, 0.209, 526.744, 9.427, 513.118)
      ..lineTo(121.008, 348.212)
      ..cubicTo(122.310, 346.289, 124.027, 344.682, 126.033, 343.511)
      ..lineTo(292.503, 246.358)
      ..close();

    // ── Grigio — barra centrale ───────────────────────────────────────────────
    final grayPath = Path()
      ..moveTo(76.960, 263.187)
      ..cubicTo(71.990, 254.578, 74.940, 243.570, 83.549, 238.599)
      ..lineTo(233.935, 151.774)
      ..cubicTo(242.544, 146.803, 253.553, 149.753, 258.523, 158.362)
      ..lineTo(285.693, 205.421)
      ..cubicTo(290.663, 214.031, 287.714, 225.039, 279.104, 230.010)
      ..lineTo(128.718, 316.835)
      ..cubicTo(120.109, 321.806, 109.101, 318.856, 104.130, 310.247)
      ..lineTo(76.960, 263.187)
      ..close();

    canvas.drawPath(greenPath, Paint()..color = const Color(0xFF168200));
    canvas.drawPath(redPath,   Paint()..color = const Color(0xFF9A0808));
    canvas.drawPath(grayPath,  Paint()..color = const Color(0xFFD9D9D9));

    canvas.restore();
  }

  @override
  bool shouldRepaint(_SwiprLogoPainter old) => false;
}
