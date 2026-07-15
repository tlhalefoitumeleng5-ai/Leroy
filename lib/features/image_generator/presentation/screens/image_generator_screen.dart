import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';

import '../../../../core/constants/app_strings.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/primary_button.dart';
import '../../domain/entities/generated_image.dart';
import '../providers/image_providers.dart';
import '../widgets/style_selector.dart';

class ImageGeneratorScreen extends ConsumerStatefulWidget {
  const ImageGeneratorScreen({super.key});

  @override
  ConsumerState<ImageGeneratorScreen> createState() => _ImageGeneratorScreenState();
}

class _ImageGeneratorScreenState extends ConsumerState<ImageGeneratorScreen> {
  late final TextEditingController _prompt;

  @override
  void initState() {
    super.initState();
    _prompt = TextEditingController();
  }

  @override
  void dispose() {
    _prompt.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(imageGenControllerProvider);
    final notifier = ref.read(imageGenControllerProvider.notifier);
    ref.listen(imageGenControllerProvider, (prev, next) {
      if (next.error != null) context.showSnack(next.error!, isError: true);
    });

    return Scaffold(
      appBar: AppBar(title: const Text(AppStrings.imageGen)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          Text('Describe your vision', style: context.textTheme.headlineSmall),
          const SizedBox(height: 12),
          TextField(
            controller: _prompt,
            minLines: 3,
            maxLines: 5,
            onChanged: notifier.setPrompt,
            decoration: const InputDecoration(
              hintText: AppStrings.describeImage,
            ),
          ),
          const SizedBox(height: 20),
          Text('Style', style: context.textTheme.titleMedium),
          const SizedBox(height: 10),
          StyleSelector(selected: state.style, onChanged: notifier.setStyle),
          const SizedBox(height: 20),
          Text('Aspect ratio', style: context.textTheme.titleMedium),
          const SizedBox(height: 10),
          SegmentedButton<ImageAspectRatio>(
            segments: const [
              ButtonSegment(value: ImageAspectRatio.square, label: Text('1:1'), icon: Icon(Icons.crop_square)),
              ButtonSegment(value: ImageAspectRatio.portrait, label: Text('3:4'), icon: Icon(Icons.crop_portrait)),
              ButtonSegment(value: ImageAspectRatio.landscape, label: Text('4:3'), icon: Icon(Icons.crop_landscape)),
            ],
            selected: {state.aspectRatio},
            onSelectionChanged: (s) => notifier.setAspect(s.first),
          ),
          const SizedBox(height: 24),
          PrimaryButton(
            label: AppStrings.generate,
            isLoading: state.isGenerating,
            icon: Icons.auto_awesome,
            onPressed: () {
              notifier.setPrompt(_prompt.text);
              notifier.generate();
            },
          ),
          const SizedBox(height: 28),
          if (state.isGenerating)
            _ShimmerPreview(aspect: state.aspectRatio)
          else if (state.latest != null)
            _ResultPreview(image: state.latest!)
                .animate()
                .fadeIn(duration: 400.ms)
                .scale(begin: const Offset(0.96, 0.96)),
          if (state.history.length > 1) ...[
            const SizedBox(height: 28),
            Text('Recent', style: context.textTheme.headlineSmall),
            const SizedBox(height: 12),
            SizedBox(
              height: 100,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: state.history.length,
                separatorBuilder: (_, __) => const SizedBox(width: 10),
                itemBuilder: (_, i) {
                  final img = state.history[i];
                  return ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: CachedNetworkImage(
                      imageUrl: img.imageUrl,
                      width: 100,
                      height: 100,
                      fit: BoxFit.cover,
                    ),
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ShimmerPreview extends StatelessWidget {
  const _ShimmerPreview({required this.aspect});
  final ImageAspectRatio aspect;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final ratio = switch (aspect) {
      ImageAspectRatio.square => 1.0,
      ImageAspectRatio.portrait => 3 / 4,
      ImageAspectRatio.landscape => 4 / 3,
    };
    return Shimmer.fromColors(
      baseColor: isDark ? AppColors.darkSurfaceAlt : const Color(0xFFE0E8E6),
      highlightColor: isDark ? AppColors.darkOutline : Colors.white,
      child: AspectRatio(
        aspectRatio: ratio,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
          ),
        ),
      ),
    );
  }
}

class _ResultPreview extends StatelessWidget {
  const _ResultPreview({required this.image});
  final GeneratedImage image;

  @override
  Widget build(BuildContext context) {
    final ratio = switch (image.aspectRatio) {
      ImageAspectRatio.square => 1.0,
      ImageAspectRatio.portrait => 3 / 4,
      ImageAspectRatio.landscape => 4 / 3,
    };
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Result', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 12),
        ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: AspectRatio(
            aspectRatio: ratio,
            child: CachedNetworkImage(
              imageUrl: image.imageUrl,
              fit: BoxFit.cover,
              placeholder: (_, __) => Container(color: AppColors.lightSurfaceAlt),
              errorWidget: (_, __, ___) => const Center(child: Icon(Icons.broken_image_outlined)),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(image.prompt, style: Theme.of(context).textTheme.bodyMedium),
      ],
    );
  }
}
