export const runtime = "nodejs";

import sharp from "sharp";
import { NextRequest } from "next/server";

const makeSvg = (size: number) => `<svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>@font-face { font-family: 'NotoSansJP'; src: url('C:/Windows/Fonts/NotoSansJP-VF.ttf') format('truetype'); font-weight: 700; }</style>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#005fcc"/>
      <stop offset="100%" stop-color="#3399ff"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="url(#bgGrad)"/>
  <path d="M6.67,17.99V9.33l4.66,2.66 4.66,-5.33 4.66,5.33 4.66,-2.66v8.66H6.67z" fill="#ffffff"/>
  <circle cx="6.67" cy="8.66" r="1.34" fill="#ffffff"/>
  <circle cx="16" cy="5.34" r="1.34" fill="#ffffff"/>
  <circle cx="25.33" cy="8.66" r="1.34" fill="#ffffff"/>
  <rect x="6.67" y="17.99" width="18.66" height="1.34" rx="0.66" fill="#ffffff"/>
  <text x="16" y="26.84" text-anchor="middle" font-family="NotoSansJP, sans-serif" font-weight="700" font-size="7.37" fill="#ffffff">OKINY</text>
</svg>`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const size = Math.min(512, Math.max(16, parseInt(searchParams.get("size") ?? "192")));
  const png = await sharp(Buffer.from(makeSvg(size))).png().toBuffer();
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
