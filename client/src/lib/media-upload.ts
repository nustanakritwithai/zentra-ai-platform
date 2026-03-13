/**
 * Media upload utilities with auto-resize for images and video support.
 * Handles the full pipeline: validate → resize (images) → base64 → upload to API.
 */

const MAX_IMAGE_DIMENSION = 1920; // Max width or height
const IMAGE_QUALITY = 0.85; // JPEG/WebP quality
const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024; // 10MB before resize
const MAX_VIDEO_FILE_SIZE = 50 * 1024 * 1024; // 50MB for video

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];

interface UploadResult {
  url: string;
  type: "image" | "video";
  fileName: string;
}

/**
 * Resize an image to fit within MAX_IMAGE_DIMENSION while maintaining aspect ratio.
 * Returns a base64 string (without the data:... prefix).
 */
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        let { width, height } = img;

        // Only resize if exceeds max dimension
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Output as JPEG for photos, PNG for transparent images
        const outputType = file.type === "image/png" || file.type === "image/svg+xml" || file.type === "image/gif"
          ? "image/png"
          : "image/jpeg";
        const dataUrl = canvas.toDataURL(outputType, IMAGE_QUALITY);
        const base64 = dataUrl.split(",")[1];
        resolve(base64);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Read a file as base64 (no resize, for video).
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Validate and prepare a media file for upload.
 * Images are auto-resized to MAX_IMAGE_DIMENSION.
 * Videos are validated for size.
 */
export async function prepareMediaUpload(file: File): Promise<{
  base64: string;
  contentType: string;
  fileName: string;
  type: "image" | "video";
}> {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    throw new Error(`ไม่รองรับไฟล์ประเภท ${file.type}\nรองรับ: รูปภาพ (JPEG, PNG, GIF, WebP) และวิดีโอ (MP4, WebM)`);
  }

  if (isImage) {
    if (file.size > MAX_IMAGE_FILE_SIZE) {
      throw new Error(`ไฟล์รูปภาพใหญ่เกินไป (${(file.size / 1024 / 1024).toFixed(1)}MB) ขนาดสูงสุด ${MAX_IMAGE_FILE_SIZE / 1024 / 1024}MB`);
    }
    const base64 = await resizeImage(file);
    // Determine output content type
    const outputType = file.type === "image/png" || file.type === "image/svg+xml" || file.type === "image/gif"
      ? "image/png"
      : "image/jpeg";
    return { base64, contentType: outputType, fileName: file.name, type: "image" };
  }

  // Video
  if (file.size > MAX_VIDEO_FILE_SIZE) {
    throw new Error(`ไฟล์วิดีโอใหญ่เกินไป (${(file.size / 1024 / 1024).toFixed(1)}MB) ขนาดสูงสุด ${MAX_VIDEO_FILE_SIZE / 1024 / 1024}MB`);
  }
  const base64 = await fileToBase64(file);
  return { base64, contentType: file.type, fileName: file.name, type: "video" };
}

/**
 * Get the accept attribute string for file input elements.
 */
export function getMediaAcceptString(options?: { imagesOnly?: boolean; videosOnly?: boolean }): string {
  if (options?.imagesOnly) return ALLOWED_IMAGE_TYPES.join(",");
  if (options?.videosOnly) return ALLOWED_VIDEO_TYPES.join(",");
  return [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(",");
}

/**
 * Check if a content type is a video type.
 */
export function isVideoType(contentType: string): boolean {
  return ALLOWED_VIDEO_TYPES.includes(contentType);
}
