/**
 * Playwrightを使ってアイコンPNGを生成するスクリプト
 * 実行: node scripts/generate-icons.mjs
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/hueym/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright/index.js");
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SVG = `<svg width="512" height="512" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  <text x="16" y="29.55" text-anchor="middle" font-family="Noto Sans JP, sans-serif" font-size="7.37" font-weight="bold" fill="#ffffff">OKINY</text>
</svg>`;

const html = (size) => `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; }
  body { width: ${size}px; height: ${size}px; overflow: hidden; background: transparent; }
  svg { width: ${size}px; height: ${size}px; }
</style>
</head>
<body>${SVG.replace('width="512" height="512"', `width="${size}" height="${size}"`)}</body>
</html>`;

const SIZES = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-icon.png", size: 180 },
];

const browser = await chromium.launch({
  executablePath: "C:/Users/hueym/AppData/Local/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-win64/chrome-headless-shell.exe",
});
const context = await browser.newContext({ deviceScaleFactor: 1 });

for (const { name, size } of SIZES) {
  const page = await context.newPage();
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(html(size), { waitUntil: "networkidle" });
  // Noto Sans JPがロードされるのを待つ
  await page.waitForTimeout(500);
  const buffer = await page.screenshot({
    type: "png",
    clip: { x: 0, y: 0, width: size, height: size },
    omitBackground: false,
  });
  const outPath = join(__dirname, "../public/icons", name);
  writeFileSync(outPath, buffer);
  console.log(`✓ ${name} (${size}x${size})`);
  await page.close();
}

await browser.close();
console.log("Done.");
