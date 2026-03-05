import type { GradientConfig, GradientColorStop, BackgroundPreset } from './types';

export function buildGradientCSS(
  type: 'linear' | 'radial',
  colors: GradientColorStop[],
  angle: number,
): string {
  const sorted = [...colors].sort((a, b) => a.position - b.position);
  const stops = sorted.map(s => `${s.color} ${s.position}%`).join(', ');
  if (type === 'radial') return `radial-gradient(circle, ${stops})`;
  return `linear-gradient(${angle}deg, ${stops})`;
}

export function parseGradientCSS(css: string): GradientConfig | null {
  if (!css) return null;

  const radialMatch = css.match(/^radial-gradient\(circle,\s*(.+)\)$/);
  if (radialMatch) {
    const colors = parseColorStops(radialMatch[1]);
    if (colors) return { type: 'radial', colors, angle: 0 };
  }

  const linearMatch = css.match(/^linear-gradient\((\d+)deg,\s*(.+)\)$/);
  if (linearMatch) {
    const angle = parseInt(linearMatch[1], 10);
    const colors = parseColorStops(linearMatch[2]);
    if (colors) return { type: 'linear', colors, angle };
  }

  return null;
}

function parseColorStops(stopsStr: string): GradientColorStop[] | null {
  const parts = stopsStr.split(/,\s*(?=#)/);
  if (parts.length < 2) return null;

  const stops: GradientColorStop[] = [];
  for (const part of parts) {
    const match = part.trim().match(/^(#[0-9a-fA-F]{3,8})\s+(\d+)%$/);
    if (!match) return null;
    stops.push({ color: match[1], position: parseInt(match[2], 10) });
  }
  return stops;
}

export function getDefaultGradientConfig(): GradientConfig {
  return {
    type: 'linear',
    colors: [
      { color: '#0a2540', position: 0 },
      { color: '#1e293b', position: 100 },
    ],
    angle: 135,
  };
}

export const ANGLE_OPTIONS = [0, 45, 90, 135, 180, 225, 270, 315] as const;

export const BG_PRESETS: BackgroundPreset[] = [
  { name: 'Dark Teal', value: 'linear-gradient(135deg, #0f3d3e 0%, #0d4f4f 50%, #115e59 100%)', category: 'professional' },
  { name: 'Midnight', value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)', category: 'professional' },
  { name: 'Steel Blue', value: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)', category: 'professional' },
  { name: 'Executive', value: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #374151 100%)', category: 'professional' },
  { name: 'Boardroom', value: 'linear-gradient(135deg, #0c1220 0%, #162032 50%, #1e3048 100%)', category: 'professional' },
  { name: 'Financial', value: 'linear-gradient(135deg, #0a1628 0%, #132744 50%, #1a365d 100%)', category: 'professional' },

  { name: 'Electric Blue', value: 'linear-gradient(135deg, #0c1445 0%, #1e40af 50%, #2563eb 100%)', category: 'vibrant' },
  { name: 'Sunset Amber', value: 'linear-gradient(135deg, #451a03 0%, #92400e 50%, #b45309 100%)', category: 'vibrant' },
  { name: 'Coral', value: 'linear-gradient(135deg, #4c0519 0%, #9f1239 50%, #be123c 100%)', category: 'vibrant' },
  { name: 'Emerald Energy', value: 'linear-gradient(135deg, #052e16 0%, #166534 50%, #16a34a 100%)', category: 'vibrant' },
  { name: 'Golden Hour', value: 'linear-gradient(135deg, #3b1f00 0%, #78350f 50%, #a16207 100%)', category: 'vibrant' },
  { name: 'Crimson', value: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #ef4444 100%)', category: 'vibrant' },

  { name: 'Pure Dark', value: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)', category: 'minimalist' },
  { name: 'Soft Grey', value: 'linear-gradient(135deg, #1a1a1e 0%, #2a2a30 50%, #3a3a42 100%)', category: 'minimalist' },
  { name: 'Warm Black', value: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #3c3836 100%)', category: 'minimalist' },
  { name: 'Cool Graphite', value: 'linear-gradient(135deg, #111318 0%, #1c1f26 50%, #282c34 100%)', category: 'minimalist' },
  { name: 'Matte Carbon', value: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #262626 100%)', category: 'minimalist' },
  { name: 'Charcoal', value: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)', category: 'minimalist' },

  { name: 'Deep Ocean', value: 'linear-gradient(135deg, #0a1929 0%, #0d3b66 50%, #1565c0 100%)', category: 'nature' },
  { name: 'Forest Canopy', value: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #22c55e 100%)', category: 'nature' },
  { name: 'Mountain Twilight', value: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)', category: 'nature' },
  { name: 'Desert Dusk', value: 'linear-gradient(135deg, #2c1810 0%, #5c3d2e 50%, #8b6f47 100%)', category: 'nature' },
  { name: 'Northern Sky', value: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #2563eb 100%)', category: 'nature' },
  { name: 'Volcanic Earth', value: 'linear-gradient(135deg, #1a0a00 0%, #4a1c00 50%, #7c2d12 100%)', category: 'nature' },
];

export const PRESET_CATEGORIES = ['professional', 'vibrant', 'minimalist', 'nature'] as const;
export type PresetCategory = typeof PRESET_CATEGORIES[number];

export const CATEGORY_LABELS: Record<PresetCategory, string> = {
  professional: 'Professional',
  vibrant: 'Vibrant',
  minimalist: 'Minimalist',
  nature: 'Nature',
};
