export const runtime = "nodejs";

import sharp from "sharp";

const svg = `<svg width="180" height="180" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
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
  <text x="16" y="26.84" text-anchor="middle" font-family="Noto Sans JP, Arial, sans-serif" font-size="7.37" font-weight="bold" fill="#ffffff">OKINY</text>
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
