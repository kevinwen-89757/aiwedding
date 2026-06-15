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
  const { text: watermarkText = "www.aiwedding.space", opacity = 0.5 } = options ?? {};
  const resizedBuffer = await sharp(input).resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 86 }).toBuffer();
  const metadata = await sharp(resizedBuffer).metadata();
  const width = metadata.width ?? 1200;
  const height = metadata.height ?? 1600;
  // 大字、稀疏排列，每个水印独立清晰
  const fontSize = 56;
  const horizontalStep = 360;
  const verticalStep = 220;
  const startX = -width;
  const startY = -height;
  const columns = Math.ceil((width * 3) / horizontalStep);
  const rows = Math.ceil((height * 3) / verticalStep);
  const marks = Array.from({ length: rows }).map((_, row) => Array.from({ length: columns }).map((__, col) => `<text x="${startX + col * horizontalStep}" y="${startY + row * verticalStep}">${watermarkText}</text>`).join("")).join("");
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><style>text{font-family:Arial,sans-serif;font-size:${fontSize}px;font-weight:900;fill:rgba(255,255,255,${opacity});letter-spacing:3px}</style><g transform="rotate(-28 ${width / 2} ${height / 2})">${marks}</g></svg>`;
  return sharp(resizedBuffer).composite([{ input: Buffer.from(svg), gravity: "center" }]).jpeg({ quality: 82 }).toBuffer();
}

/** 4K 带水印预览：保持原始分辨率，不缩小，添加大号稀疏 www.aiwedding.space 水印。 */
export async function createWatermarked4KBuffer(input: Buffer, options?: WatermarkOptions) {
  const { text: watermarkText = "www.aiwedding.space", opacity = 0.5 } = options ?? {};
  const metadata = await sharp(input).metadata();
  const width = metadata.width ?? 3840;
  const height = metadata.height ?? 5760;
  // 大号字体，间隔疏朗，每行每列水印数更少，每个水印醒目
  const fontSize = Math.round(Math.min(width, height) / 10);
  const horizontalStep = Math.round(width * 0.35);
  const verticalStep = Math.round(height * 0.18);
  const startX = -width;
  const startY = -height;
  const columns = Math.ceil((width * 3) / horizontalStep);
  const rows = Math.ceil((height * 3) / verticalStep);
  const marks = Array.from({ length: rows }).map((_, row) => Array.from({ length: columns }).map((__, col) => `<text x="${startX + col * horizontalStep}" y="${startY + row * verticalStep}">${watermarkText}</text>`).join("")).join("");
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><style>text{font-family:Arial,sans-serif;font-size:${fontSize}px;font-weight:900;fill:rgba(255,255,255,${opacity});letter-spacing:4px}</style><g transform="rotate(-28 ${width / 2} ${height / 2})">${marks}</g></svg>`;
  return sharp(input).composite([{ input: Buffer.from(svg), gravity: "center" }]).jpeg({ quality: 85 }).toBuffer();
}

export async function createWatermarkedPreview(inputAbsolutePath: string, outputRelativePath: string) {
  const outputAbsolutePath = absoluteStoragePath(outputRelativePath);
  await mkdir(path.dirname(outputAbsolutePath), { recursive: true });
  const preview = await createWatermarkedPreviewBuffer(await sharp(inputAbsolutePath).toBuffer());
  await sharp(preview).toFile(outputAbsolutePath);
  return outputRelativePath;
}
