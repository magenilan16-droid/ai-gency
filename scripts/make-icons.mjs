// Generate PWA icons as SVG-based PNG using pure Node.js
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

function svgIcon(size) {
  const r = Math.round(size * 0.2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
  <text x="${size/2}" y="${size*0.65}" font-size="${Math.round(size*0.52)}" text-anchor="middle" font-family="Segoe UI Emoji, Apple Color Emoji, sans-serif">✈️</text>
</svg>`;
}

writeFileSync(join(outDir, "icon-192.svg"), svgIcon(192));
writeFileSync(join(outDir, "icon-512.svg"), svgIcon(512));
console.log("SVG icons created in public/icons/");
