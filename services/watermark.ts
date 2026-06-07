import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { absoluteStoragePath } from "@/services/storage";

export async function imageMetadata(filePath: string) {
  const metadata = await sharp(filePath).metadata();
  return { width: metadata.width ?? null, height: metadata.height ?? null };
}

export async function imageMetadataFromBuffer(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata();
  return { width: metadata.width ?? null, height: metadata.height ?? null };
}

export interface WatermarkOptions {
  /** 水印文案，默认 "aiwedding.space" */
  text?: string;
  /** 透明度 0-1，默认 0.4 */
  opacity?: number;
}

export async function createWatermarkedPreviewBuffer(input: Buffer, options?: WatermarkOptions) {
  const { text: watermarkText = "aiwedding.space", opacity = 0.4 } = options ?? {};
  const resizedBuffer = await sharp(input).resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 86 }).toBuffer();
  const metadata = await sharp(resizedBuffer).metadata();
  const width = metadata.width ?? 1200;
  const height = metadata.height ?? 1600;
  const horizontalStep = 280;
  const verticalStep = 160;
  const startX = -width;
  const startY = -height;
  const columns = Math.ceil((width * 3) / horizontalStep);
  const rows = Math.ceil((height * 3) / verticalStep);
  const marks = Array.from({ length: rows }).map((_, row) => Array.from({ length: columns }).map((__, col) => `<text x="${startX + col * horizontalStep}" y="${startY + row * verticalStep}">${watermarkText}</text>`).join("")).join("");
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><style>text{font-family:Arial,sans-serif;font-size:42px;font-weight:700;fill:rgba(255,255,255,${opacity});letter-spacing:2px}</style><g transform="rotate(-28 ${width / 2} ${height / 2})">${marks}</g></svg>`;
  return sharp(resizedBuffer).composite([{ input: Buffer.from(svg), gravity: "center" }]).jpeg({ quality: 82 }).toBuffer();
}

export async function createWatermarkedPreview(inputAbsolutePath: string, outputRelativePath: string) {
  const outputAbsolutePath = absoluteStoragePath(outputRelativePath);
  await mkdir(path.dirname(outputAbsolutePath), { recursive: true });
  const preview = await createWatermarkedPreviewBuffer(await sharp(inputAbsolutePath).toBuffer());
  await sharp(preview).toFile(outputAbsolutePath);
  return outputRelativePath;
}
