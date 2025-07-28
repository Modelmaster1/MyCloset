// src/utils/webpNative.ts

/**
 * Converts an image File (JPEG/PNG/…) to WebP via
 * HTMLCanvasElement.toBlob, stripping all metadata.
 *
 * @param file    – input File, must be image/*
 * @param quality – [0–1] or [0–100], defaults to 0.8 (80%)
 * @returns       – new File of type image/webp
 */
export async function convertToWebpNative(
  file: File,
  quality: number = 0.02
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`Expected image/*, got ${file.type}`);
  }

  // normalize quality to [0,1]
  let q = quality > 1 ? quality / 100 : quality;
  q = Math.max(0, Math.min(1, q));

  // 1) load into an HTMLImageElement
  const img = new Image();
  const url = URL.createObjectURL(file);
  await new Promise<void>((res, rej) => {
    img.onload  = () => res();
    img.onerror = () => rej(new Error("Failed to load image"));
    img.src     = url;
  });
  URL.revokeObjectURL(url);

  // 2) draw onto canvas
  const canvas = document.createElement("canvas");
  canvas.width  = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D context");
  ctx.drawImage(img, 0, 0);

  // 3) export as WebP blob (metadata stripped)
  const blob: Blob | null = await new Promise((res) =>
    canvas.toBlob(res, "image/webp", q)
  );
  if (!blob) throw new Error("WebP conversion failed");

  // 4) wrap in File
  const base = file.name.replace(/\.[^/.]+$/, "");
  return new File([blob], `${base}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}