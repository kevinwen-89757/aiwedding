import sharp from "sharp";
import { GoogleGenAI } from "@google/genai";
import { appConfig } from "@/lib/config";

type GeminiPart = { inlineData?: { data?: string } };

export async function generateWeddingImage(referenceImage: Buffer, referenceMimeType: string, prompt: string, index: number) {
  if (appConfig.geminiMockGeneration || !appConfig.geminiApiKey) return createMockWeddingImage(index, prompt);
  const ai = new GoogleGenAI({ apiKey: appConfig.geminiApiKey });
  const response = await ai.models.generateContent({
    model: appConfig.geminiImageModel,
    contents: [{ role: "user", parts: [{ inlineData: { mimeType: referenceMimeType, data: referenceImage.toString("base64") } }, { text: prompt }] }]
  });
  const part = response.candidates?.[0]?.content?.parts?.find((item: GeminiPart) => item.inlineData?.data);
  if (!part?.inlineData?.data) throw new Error("Gemini did not return an image.");
  return Buffer.from(part.inlineData.data, "base64");
}

async function createMockWeddingImage(index: number, prompt: string) {
  const palette = [["#f7efe7", "#476a6f"], ["#f5f1fb", "#7c5b8a"], ["#ecf4ef", "#3f6f58"], ["#f6eee9", "#9a5d4d"], ["#eef3f7", "#445b78"]][index % 5];
  const svg = `<svg width="1200" height="1600" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="1600" fill="${palette[0]}"/><circle cx="600" cy="420" r="150" fill="#f1c6b8"/><path d="M330 1450 C390 760 810 760 870 1450 Z" fill="#fffaf7"/><path d="M420 820 C500 700 700 700 780 820 L900 1450 H300 Z" fill="#ffffff"/><path d="M380 520 C470 300 730 300 820 520 C760 455 445 455 380 520 Z" fill="${palette[1]}"/><text x="600" y="1180" text-anchor="middle" font-size="54" font-family="Arial" fill="${palette[1]}" font-weight="700">Mock Wedding ${index + 1}</text><text x="600" y="1260" text-anchor="middle" font-size="28" font-family="Arial" fill="#555">Local MVP mock mode</text><text x="600" y="1320" text-anchor="middle" font-size="22" font-family="Arial" fill="#777">${prompt.slice(0, 80).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</text></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
