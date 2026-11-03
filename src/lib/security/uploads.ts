import "server-only";

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"] as const;
export type ImageMime = (typeof IMAGE_MIME_TYPES)[number];

const EXTENSIONS: Record<ImageMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

/** Detects the real image type from magic bytes (never trust file names). */
export function sniffImageType(bytes: Uint8Array): ImageMime | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return "image/gif";
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp" && /avi[fs]/.test(ascii(8, 12))) return "image/avif";
  return null;
}

export type ValidatedUpload = { bytes: Uint8Array; mime: ImageMime; extension: string; size: number };

export async function validateImageUpload(
  file: File | null | undefined,
  options: { maxBytes: number; allowed?: readonly ImageMime[] },
): Promise<{ ok: true; value: ValidatedUpload } | { ok: false; error: string }> {
  if (!file || typeof file === "string" || file.size === 0) return { ok: false, error: "Please choose an image file." };
  if (file.size > options.maxBytes) {
    return { ok: false, error: `Image is too large. Maximum size is ${Math.round(options.maxBytes / 1024 / 1024)} MB.` };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImageType(bytes);
  const allowed = options.allowed ?? IMAGE_MIME_TYPES;
  if (!mime || !allowed.includes(mime)) {
    return { ok: false, error: "Unsupported image. Use JPEG, PNG, WebP, AVIF or GIF (SVG is not allowed)." };
  }
  return { ok: true, value: { bytes, mime, extension: EXTENSIONS[mime], size: file.size } };
}
