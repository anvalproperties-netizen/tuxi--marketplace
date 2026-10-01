import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
const iconSvgPath = path.join(publicDir, 'icon.svg');
const svgBuffer = fs.readFileSync(iconSvgPath);

async function generate() {
  console.log('Generating PNG store icons and screenshots...');

  // 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 180x180 apple-touch-icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 512x512 maskable (with 15% safe padding)
  const innerIcon = await sharp(svgBuffer)
    .resize(380, 380)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 } // slate-900
    }
  })
    .composite([{ input: innerIcon, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // Desktop screenshot (1280x720)
  await sharp({
    create: {
      width: 1280,
      height: 720,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    }
  })
    .composite([{ input: innerIcon, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'screenshot-desktop.png'));

  // Mobile screenshot (750x1334)
  await sharp({
    create: {
      width: 750,
      height: 1334,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    }
  })
    .composite([{ input: innerIcon, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'screenshot-mobile.png'));

  console.log('✓ All PWA and Store icons successfully generated!');
}

generate().catch(console.error);
