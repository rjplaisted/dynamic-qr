import QRCode from 'qrcode';
import { ErrorCapture } from '../utils/error_capture';

export interface QrStyle {
  darkColor?: string;
  lightColor?: string;
  transparentBg?: boolean;
  moduleShape?: 'square' | 'dot' | 'rounded';
  errorLevel?: 'L' | 'M' | 'Q' | 'H';
  frameText?: string;
  logo?: string;
}

const MOD = 10;
const PAD = 2;

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const createQrSvg = async (url: string, style: QrStyle = {}): Promise<string> => {
  const {
    darkColor = '#18181b',
    lightColor = '#ffffff',
    transparentBg = false,
    moduleShape = 'square',
    errorLevel = 'H',
    frameText,
    logo,
  } = style;

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
};

export const createQr = async (url: string, style?: QrStyle): Promise<string> => {
  try {
    return await QRCode.toDataURL(url, {
      errorCorrectionLevel: style?.errorLevel ?? 'H',
      type: 'image/png',
      margin: 1.2,
      width: 200,
      color: {
        dark: style?.darkColor ?? '#18181b',
        light: style?.transparentBg ? '#00000000' : (style?.lightColor ?? '#ffffff'),
      },
    });
  } catch (error) {
    throw new ErrorCapture((error as Error).message, 500);
  }
};
