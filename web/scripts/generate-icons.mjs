import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();

// Lucide "sprout" glyph (ISC), drawn as a white stroke on the brand gradient.
const SPROUT = `
  <g fill="none" stroke="#ffffff" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 20h10" />
    <path d="M10 20c5.5-2.5.8-6.4 3-10" />
    <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-3.2 2.8-.5 4.4 0 5.5.8z" />
    <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.1-2.7.1-4 1-4.9 1.5z" />
  </g>
`;

function iconSvg(
  size,
  { bleed = false, glyphRatio = 0.58 } = {},
) {
  const scale = (size * glyphRatio) / 24;
  const offset = (size - 24 * scale) / 2;
  const radius = bleed ? 0 : size * 0.22;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#4aa772" />
        <stop offset="55%" stop-color="#2f7d4f" />
        <stop offset="100%" stop-color="#1b5e39" />
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${radius}" fill="url(#bg)" />
    <g transform="translate(${offset} ${offset}) scale(${scale})">${SPROUT}</g>
  </svg>`;
}

const targets = [
  { file: "public/icons/icon-192.png", size: 192 },
  { file: "public/icons/icon-512.png", size: 512 },
  {
    file: "public/icons/maskable-192.png",
    size: 192,
    options: { bleed: true, glyphRatio: 0.48 },
  },
  {
    file: "public/icons/maskable-512.png",
    size: 512,
    options: { bleed: true, glyphRatio: 0.48 },
  },
  { file: "src/app/icon.png", size: 64 },
  {
    file: "src/app/apple-icon.png",
    size: 180,
    options: { bleed: true, glyphRatio: 0.55 },
  },
];

await mkdir(path.join(ROOT, "public/icons"), { recursive: true });
await mkdir(path.join(ROOT, "src/app"), { recursive: true });

for (const { file, size, options } of targets) {
  const output = path.join(ROOT, file);
  await sharp(Buffer.from(iconSvg(size, options)))
    .png({ compressionLevel: 9 })
    .toFile(output);
  console.log(`✓ ${file} (${size}×${size})`);
}
