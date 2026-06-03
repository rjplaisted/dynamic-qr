import QRCode from 'qrcode';
import type { QrOptions } from '@/interfaces';

const MOD = 10;
const PAD = 2;

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function generateQrSvg(url: string, opts: Partial<QrOptions> = {}): string {
  const {
    darkColor = '#18181b',
    lightColor = '#ffffff',
    transparentBg = false,
    moduleShape = 'square',
    errorLevel = 'H',
    frameText,
    logo,
  } = opts;

  const qr = QRCode.create(url, { errorCorrectionLevel: errorLevel });
  const { data, size } = qr.modules;

  const bgColor = transparentBg ? 'none' : lightColor;
  const gridSize = size * MOD;
  const padPx = PAD * MOD;
  const svgSize = gridSize + padPx * 2;
  const frameH = frameText ? 32 : 0;
  const totalH = svgSize + frameH;

  const parts: string[] = [];
  parts.push(`<rect width="${svgSize}" height="${svgSize}" fill="${bgColor}"/>`);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!data[r * size + c]) continue;
      const x = padPx + c * MOD;
      const y = padPx + r * MOD;
      if (moduleShape === 'dot') {
        parts.push(`<circle cx="${x + MOD / 2}" cy="${y + MOD / 2}" r="${MOD * 0.45}" fill="${darkColor}"/>`);
      } else if (moduleShape === 'rounded') {
        parts.push(`<rect x="${x}" y="${y}" width="${MOD}" height="${MOD}" rx="${MOD * 0.3}" fill="${darkColor}"/>`);
      } else {
        parts.push(`<rect x="${x}" y="${y}" width="${MOD}" height="${MOD}" fill="${darkColor}"/>`);
      }
    }
  }

  if (logo) {
    const logoSz = Math.floor(svgSize * 0.22);
    const lx = (svgSize - logoSz) / 2;
    const ly = (svgSize - logoSz) / 2;
    const lpad = 4;
    parts.push(`<rect x="${lx - lpad}" y="${ly - lpad}" width="${logoSz + lpad * 2}" height="${logoSz + lpad * 2}" rx="4" fill="${bgColor === 'none' ? '#ffffff' : bgColor}"/>`);
    parts.push(`<image href="${logo}" x="${lx}" y="${ly}" width="${logoSz}" height="${logoSz}" preserveAspectRatio="xMidYMid meet"/>`);
  }

  if (frameText) {
    parts.push(`<rect x="0" y="${svgSize}" width="${svgSize}" height="${frameH}" fill="${darkColor}"/>`);
    parts.push(`<text x="${svgSize / 2}" y="${svgSize + frameH * 0.68}" text-anchor="middle" fill="${bgColor === 'none' ? '#ffffff' : lightColor}" font-family="system-ui,sans-serif" font-size="13" font-weight="600" letter-spacing="0.05em">${escapeXml(frameText)}</text>`);
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`,
    ` viewBox="0 0 ${svgSize} ${totalH}" width="${svgSize}" height="${totalH}">`,
    parts.join(''),
    `</svg>`,
  ].join('');
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
