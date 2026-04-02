export const runtime = "nodejs";

import sharp from "sharp";

const svg = `<svg width="180" height="180" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
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
  <text x="16" y="29.55" text-anchor="middle" font-family="Noto Sans JP, Arial, sans-serif" font-size="9.21" font-weight="bold" fill="#ffffff">OKINY</text>
</svg>`;

export async function GET() {
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
