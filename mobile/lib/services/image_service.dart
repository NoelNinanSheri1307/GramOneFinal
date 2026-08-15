import 'dart:async';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class ImagePickerResult {
  final String path;
  final String filename;
  final int fileSizeBytes;
  final bool isCompressed;

  ImagePickerResult({
    required this.path,
    required this.filename,
    required this.fileSizeBytes,
    required this.isCompressed,
  });
}

class ImageService {
  static Future<ImagePickerResult?> pickImageFromCamera() async {
    await Future.delayed(const Duration(milliseconds: 600));
    return ImagePickerResult(
      path: 'captured_photo_${DateTime.now().millisecondsSinceEpoch}.jpg',
      filename: 'IMG_${DateTime.now().millisecondsSinceEpoch}.jpg',
      fileSizeBytes: 1024 * 450, // 450 KB post-compression
      isCompressed: true,
    );
  }

  static Future<ImagePickerResult?> pickImageFromGallery() async {
    await Future.delayed(const Duration(milliseconds: 500));
    return ImagePickerResult(
      path: 'gallery_photo_${DateTime.now().millisecondsSinceEpoch}.jpg',
      filename: 'GALLERY_${DateTime.now().millisecondsSinceEpoch}.jpg',
      fileSizeBytes: 1024 * 520, // 520 KB post-compression
      isCompressed: true,
    );
  }

  static Widget buildNetworkImageWithFallback(String? url, {double height = 180, double width = double.infinity}) {
    if (url == null || url.isEmpty) {
      return _buildPlaceholder(height: height, width: width);
    }
    return Image.network(
      url,
      height: height,
      width: width,
      fit: BoxFit.cover,
      loadingBuilder: (context, child, progress) {
        if (progress == null) return child;
        return Container(
          height: height,
          width: width,
          color: AppColors.primaryContainer.withValues(alpha: 0.2),
          child: Center(
            child: CircularProgressIndicator(
              value: progress.expectedTotalBytes != null
                  ? progress.cumulativeBytesLoaded / progress.expectedTotalBytes!
                  : null,
              strokeWidth: 2,
            ),
          ),
        );
      },
      errorBuilder: (context, error, stackTrace) => _buildPlaceholder(height: height, width: width),
    );
  }

  static Widget _buildPlaceholder({double height = 180, double width = double.infinity}) {
    return Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        color: AppColors.primaryContainer.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          Icon(Icons.photo_outlined, size: 36, color: AppColors.primary),
          SizedBox(height: 6),
          Text('GramOne Verified Media', style: TextStyle(fontSize: 12, color: AppColors.primary)),
        ],
      ),
    );
  }
}
