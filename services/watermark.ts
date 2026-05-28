import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { absoluteStoragePath } from "@/services/storage";

export async function imageMetadata(filePath: string) {
  const metadata = await sharp(filePath).metadata();
  return { width: metadata.width ?? null, height: metadata.height ?? null };
}

export async function createWatermarkedPreview(inputAbsolutePath: string, outputRelativePath: string) {
  const outputAbsolutePath = absoluteStoragePath(outputRelativePath);
  await mkdir(path.dirname(outputAbsolutePath), { recursive: true });
  const resizedBuffer = await sharp(inputAbsolutePath).resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 86 }).toBuffer();
  const metadata = await sharp(resizedBuffer).metadata();
  const width = metadata.width ?? 1200;
  const height = metadata.height ?? 1600;
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><style>text{font-family:Arial,sans-serif;font-size:42px;font-weight:700;fill:rgba(255,255,255,0.1)}</style><g transform="rotate(-28 ${width / 2} ${height / 2})">${Array.from({ length: 9 }).map((_, row) => Array.from({ length: 4 }).map((__, col) => `<text x="${col * 420 - 120}" y="${row * 260}">AI WEDDING PREVIEW</text>`).join("")).join("")}</g></svg>`;
  await sharp(resizedBuffer).composite([{ input: Buffer.from(svg), gravity: "center" }]).jpeg({ quality: 82 }).toFile(outputAbsolutePath);
  return outputRelativePath;
}
