import 'package:flutter/material.dart';

import '../../domain/entities/generated_image.dart';

class StyleSelector extends StatelessWidget {
  const StyleSelector({
    super.key,
    required this.selected,
    required this.onChanged,
  });

  final ImageStyle selected;
  final ValueChanged<ImageStyle> onChanged;

  String _label(ImageStyle s) => switch (s) {
        ImageStyle.cinematic => 'Cinematic',
        ImageStyle.illustration => 'Illustration',
        ImageStyle.photoreal => 'Photoreal',
        ImageStyle.abstractArt => 'Abstract',
        ImageStyle.product => 'Product',
      };

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: ImageStyle.values.map((style) {
        final active = style == selected;
        return ChoiceChip(
          label: Text(_label(style)),
          selected: active,
          onSelected: (_) => onChanged(style),
        );
      }).toList(),
    );
  }
}
