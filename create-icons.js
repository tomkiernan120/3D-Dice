#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseSvgBuffer = fs.readFileSync(path.join(__dirname, 'public/favicon.svg'));

(async () => {
  try {
    const sharp = (await import('sharp')).default;

    const sizes = [
      { size: 180, name: 'apple-touch-icon.png', description: 'Apple Touch Icon' },
      { size: 192, name: 'icon-192.png', description: 'PWA Icon 192x192' },
      { size: 512, name: 'icon-512.png', description: 'PWA Icon 512x512' },
    ];

    for (const { size, name, description } of sizes) {
      await sharp(baseSvgBuffer, { density: 300 })
        .resize(size, size)
        .png()
        .toFile(path.join(__dirname, 'public', name));

      console.log(`✓ Created ${description}: public/${name}`);
    }

    console.log('\n✓ All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error.message);
    console.error(error);
  }
})();
