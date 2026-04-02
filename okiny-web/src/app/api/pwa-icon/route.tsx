export const runtime = "nodejs";

import sharp from "sharp";
import { NextRequest } from "next/server";

const makeSvg = (size: number) => `<svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>@font-face { font-family: 'NotoSansJP'; src: url('C:/Windows/Fonts/NotoSansJP-VF.ttf') format('truetype'); font-weight: 700; }</style>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#005fcc"/>
      <stop offset="100%" stop-color="#00b4d8"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="url(#bgGrad)"/>
  <path d="M4.34,18.49V7.66l5.83,3.33 5.83,-6.66 5.83,6.66 5.83,-3.33v10.83H4.34z" fill="#ffffff"/>
  <circle cx="4.34" cy="6.83" r="1.67" fill="#ffffff"/>
  <circle cx="16" cy="2.67" r="1.67" fill="#ffffff"/>
  <circle cx="27.66" cy="6.83" r="1.67" fill="#ffffff"/>
  <rect x="4.34" y="18.49" width="23.33" height="1.67" rx="0.83" fill="#ffffff"/>
  <text x="16" y="29.55" text-anchor="middle" font-family="NotoSansJP, sans-serif" font-weight="700" font-size="9.21" fill="#ffffff">OKINY</text>
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
