function hexToHsl(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [200, 70, 50];

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));

  const sNorm = s / 100;
  const lNorm = l / 100;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);

  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

function getCssVar(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || null;
}

let cachedPalette: string[] | null = null;
let cachedInputKey = '';

export function getBrandingChartPalette(): string[] {
  const primary = getCssVar('--brand-primary') || '#06b6d4';
  const accent = getCssVar('--brand-accent') || '#14b8a6';

  const inputKey = `${primary}|${accent}`;
  if (cachedPalette && cachedInputKey === inputKey) {
    return cachedPalette;
  }

  const [pH, pS, pL] = hexToHsl(primary);
  const [aH, aS, aL] = hexToHsl(accent);

  const palette = [
    hslToHex(pH, pS, pL),
    hslToHex(aH, aS, aL),
    hslToHex(pH + 30, Math.min(pS + 5, 85), Math.min(pL + 8, 58)),
    hslToHex(pH - 40, Math.max(pS - 10, 45), pL),
    hslToHex(aH + 60, aS, Math.min(aL + 5, 55)),
    hslToHex(pH + 90, Math.max(pS - 15, 40), Math.min(pL + 3, 52)),
    hslToHex(aH - 30, Math.min(aS + 10, 80), Math.max(aL - 5, 40)),
    hslToHex(pH + 150, Math.max(pS - 5, 50), pL),
  ];

  cachedPalette = palette;
  cachedInputKey = inputKey;
  return palette;
}

export function invalidateBrandingPaletteCache(): void {
  cachedPalette = null;
  cachedInputKey = '';
}
