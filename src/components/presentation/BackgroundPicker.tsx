import { useState, useRef, useEffect, useCallback } from 'react';
import { Palette, Plus, X, Check, Save, RotateCw, Trash2 } from 'lucide-react';
import type { PresentationBranding, GradientColorStop, CustomGradient } from './types';
import {
  BG_PRESETS,
  PRESET_CATEGORIES,
  CATEGORY_LABELS,
  ANGLE_OPTIONS,
  buildGradientCSS,
  parseGradientCSS,
  getDefaultGradientConfig,
} from './gradientUtils';
import { fetchSavedGradients, saveCustomGradient, deleteCustomGradient } from './gradientService';

interface BackgroundPickerProps {
  currentBackground: string | undefined;
  defaultBackground: string;
  slideId: string;
  clientId: string;
  branding: PresentationBranding;
  onApply: (slideId: string, background: string) => void;
}

type Tab = 'presets' | 'custom';

export function BackgroundPicker({
  currentBackground,
  defaultBackground,
  slideId,
  clientId,
  branding,
  onApply,
}: BackgroundPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('presets');
  const ref = useRef<HTMLDivElement>(null);

  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [colors, setColors] = useState<GradientColorStop[]>([
    { color: '#0a2540', position: 0 },
    { color: '#1e293b', position: 100 },
  ]);
  const [angle, setAngle] = useState(135);
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const [savedGradients, setSavedGradients] = useState<CustomGradient[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const activeBg = currentBackground || defaultBackground;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open && clientId) {
      setLoadingSaved(true);
      fetchSavedGradients(clientId).then(data => {
        setSavedGradients(data);
        setLoadingSaved(false);
      });
    }
  }, [open, clientId]);

  const livePreview = buildGradientCSS(gradientType, colors, angle);

  const handleApplyPreset = useCallback((value: string) => {
    onApply(slideId, value);
    setOpen(false);
  }, [onApply, slideId]);

  const handleApplyCustom = useCallback(() => {
    onApply(slideId, livePreview);
    setOpen(false);
  }, [onApply, slideId, livePreview]);

  const handleSaveGradient = useCallback(async () => {
    if (!saveName.trim()) return;
    const saved = await saveCustomGradient(clientId, saveName.trim(), gradientType, colors, angle);
    if (saved) {
      setSavedGradients(prev => [saved, ...prev]);
      setSaveName('');
      setShowSaveInput(false);
      onApply(slideId, saved.gradient_css);
      setOpen(false);
    }
  }, [clientId, saveName, gradientType, colors, angle, onApply, slideId]);

  const handleDeleteGradient = useCallback(async (id: string) => {
    const ok = await deleteCustomGradient(id);
    if (ok) setSavedGradients(prev => prev.filter(g => g.id !== id));
  }, []);

  const handleLoadGradient = useCallback((g: CustomGradient) => {
    const parsed = parseGradientCSS(g.gradient_css);
    if (parsed) {
      setGradientType(parsed.type);
      setColors(parsed.colors);
      setAngle(parsed.angle);
    }
    onApply(slideId, g.gradient_css);
    setOpen(false);
  }, [onApply, slideId]);

  const updateColor = (index: number, field: 'color' | 'position', value: string | number) => {
    setColors(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const addColorStop = () => {
    if (colors.length >= 5) return;
    const sorted = [...colors].sort((a, b) => a.position - b.position);
    const lastTwo = sorted.slice(-2);
    const midPos = Math.round((lastTwo[0].position + lastTwo[1].position) / 2);
    setColors(prev => [...prev, { color: '#475569', position: midPos }]);
  };

  const removeColorStop = (index: number) => {
    if (colors.length <= 2) return;
    setColors(prev => prev.filter((_, i) => i !== index));
  };

  const resetBuilder = () => {
    const def = getDefaultGradientConfig();
    setGradientType(def.type);
    setColors(def.colors);
    setAngle(def.angle);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
          borderRadius: 7, border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer', fontSize: 12,
        }}
      >
        <Palette size={13} /> Background
      </button>
    );
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
          borderRadius: 7, border: '1px solid rgba(255,255,255,0.25)',
          background: 'rgba(255,255,255,0.1)', color: '#fff',
          cursor: 'pointer', fontSize: 12,
        }}
      >
        <Palette size={13} /> Background
      </button>

      <div style={{
        position: 'absolute', top: '100%', left: 0, marginTop: 8, zIndex: 100,
        background: '#141c2b', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12, width: 320, maxHeight: 520, overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
      }}>
        <div style={{
          display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          {(['presets', 'custom'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px 0', fontSize: 12, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: tab === t ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.45)',
                borderBottom: tab === t ? `2px solid ${branding.primaryColor}` : '2px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {t === 'presets' ? 'Presets' : 'Custom'}
            </button>
          ))}
        </div>

        <div style={{ maxHeight: 460, overflowY: 'auto', padding: 12 }}>
          {tab === 'presets' ? (
            <PresetsTab
              activeBg={activeBg}
              defaultBackground={defaultBackground}
              branding={branding}
              onApply={handleApplyPreset}
            />
          ) : (
            <CustomTab
              gradientType={gradientType}
              colors={colors}
              angle={angle}
              livePreview={livePreview}
              saveName={saveName}
              showSaveInput={showSaveInput}
              savedGradients={savedGradients}
              loadingSaved={loadingSaved}
              branding={branding}
              onGradientTypeChange={setGradientType}
              onColorsChange={updateColor}
              onAngleChange={setAngle}
              onAddStop={addColorStop}
              onRemoveStop={removeColorStop}
              onReset={resetBuilder}
              onApply={handleApplyCustom}
              onSaveNameChange={setSaveName}
              onShowSaveInput={setShowSaveInput}
              onSave={handleSaveGradient}
              onLoadGradient={handleLoadGradient}
              onDeleteGradient={handleDeleteGradient}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PresetsTab({
  activeBg,
  defaultBackground,
  branding,
  onApply,
}: {
  activeBg: string;
  defaultBackground: string;
  branding: PresentationBranding;
  onApply: (value: string) => void;
}) {
  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Default
        </span>
        <div style={{ marginTop: 6 }}>
          <button
            onClick={() => onApply(defaultBackground)}
            style={{
              width: 64, height: 36, borderRadius: 6, cursor: 'pointer',
              border: activeBg === defaultBackground
                ? `2px solid ${branding.primaryColor}`
                : '2px solid rgba(255,255,255,0.1)',
              background: defaultBackground,
              transition: 'border-color 0.15s ease',
            }}
            title="Default"
          />
        </div>
      </div>

      {PRESET_CATEGORIES.map(cat => {
        const presets = BG_PRESETS.filter(p => p.category === cat);
        return (
          <div key={cat} style={{ marginBottom: 14 }}>
            <span style={{
              fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase', letterSpacing: 1,
            }}>
              {CATEGORY_LABELS[cat]}
            </span>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 6,
            }}>
              {presets.map(p => (
                <button
                  key={p.name}
                  onClick={() => onApply(p.value)}
                  style={{
                    width: '100%', aspectRatio: '16/10', borderRadius: 6, cursor: 'pointer',
                    border: activeBg === p.value
                      ? `2px solid ${branding.primaryColor}`
                      : '2px solid rgba(255,255,255,0.08)',
                    background: p.value,
                    transition: 'border-color 0.15s ease, transform 0.1s ease',
                  }}
                  title={p.name}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CustomTab({
  gradientType,
  colors,
  angle,
  livePreview,
  saveName,
  showSaveInput,
  savedGradients,
  loadingSaved,
  branding,
  onGradientTypeChange,
  onColorsChange,
  onAngleChange,
  onAddStop,
  onRemoveStop,
  onReset,
  onApply,
  onSaveNameChange,
  onShowSaveInput,
  onSave,
  onLoadGradient,
  onDeleteGradient,
}: {
  gradientType: 'linear' | 'radial';
  colors: GradientColorStop[];
  angle: number;
  livePreview: string;
  saveName: string;
  showSaveInput: boolean;
  savedGradients: CustomGradient[];
  loadingSaved: boolean;
  branding: PresentationBranding;
  onGradientTypeChange: (t: 'linear' | 'radial') => void;
  onColorsChange: (index: number, field: 'color' | 'position', value: string | number) => void;
  onAngleChange: (a: number) => void;
  onAddStop: () => void;
  onRemoveStop: (i: number) => void;
  onReset: () => void;
  onApply: () => void;
  onSaveNameChange: (n: string) => void;
  onShowSaveInput: (s: boolean) => void;
  onSave: () => void;
  onLoadGradient: (g: CustomGradient) => void;
  onDeleteGradient: (id: string) => void;
}) {
  return (
    <div>
      <div style={{
        width: '100%', aspectRatio: '16/9', borderRadius: 8,
        background: livePreview, marginBottom: 12,
        border: '1px solid rgba(255,255,255,0.08)',
      }} />

      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {(['linear', 'radial'] as const).map(t => (
          <button
            key={t}
            onClick={() => onGradientTypeChange(t)}
            style={{
              flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 600,
              borderRadius: 6, border: 'none', cursor: 'pointer',
              background: gradientType === t ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: gradientType === t ? '#fff' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            {t === 'linear' ? 'Linear' : 'Radial'}
          </button>
        ))}
      </div>

      {gradientType === 'linear' && (
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Angle
          </span>
          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
            {ANGLE_OPTIONS.map(a => (
              <button
                key={a}
                onClick={() => onAngleChange(a)}
                style={{
                  width: 32, height: 28, borderRadius: 5, border: 'none', cursor: 'pointer',
                  fontSize: 10, fontWeight: 600,
                  background: angle === a ? branding.primaryColor : 'rgba(255,255,255,0.06)',
                  color: angle === a ? '#fff' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.15s ease',
                }}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Color Stops
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
          {colors.map((stop, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0, position: 'relative',
              }}>
                <input
                  type="color"
                  value={stop.color}
                  onChange={e => onColorsChange(i, 'color', e.target.value)}
                  style={{
                    position: 'absolute', inset: -4,
                    width: 'calc(100% + 8px)', height: 'calc(100% + 8px)',
                    border: 'none', cursor: 'pointer', padding: 0,
                  }}
                />
              </div>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', minWidth: 50 }}>
                {stop.color}
              </span>
              <input
                type="number"
                min={0}
                max={100}
                value={stop.position}
                onChange={e => onColorsChange(i, 'position', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                style={{
                  width: 44, padding: '4px 6px', fontSize: 11, borderRadius: 5,
                  border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)',
                  color: '#fff', textAlign: 'center',
                }}
              />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>%</span>
              <button
                onClick={() => onRemoveStop(i)}
                disabled={colors.length <= 2}
                style={{
                  width: 22, height: 22, borderRadius: 5, border: 'none', cursor: colors.length > 2 ? 'pointer' : 'not-allowed',
                  background: 'transparent', color: colors.length > 2 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'color 0.15s ease',
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        {colors.length < 5 && (
          <button
            onClick={onAddStop}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, marginTop: 6,
              padding: '4px 10px', fontSize: 11, borderRadius: 5,
              border: '1px dashed rgba(255,255,255,0.15)', background: 'transparent',
              color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
              transition: 'color 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            }}
          >
            <Plus size={11} /> Add Color
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <button
          onClick={onApply}
          style={{
            flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600,
            borderRadius: 7, border: 'none', cursor: 'pointer',
            background: branding.primaryColor, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Check size={13} /> Apply
        </button>
        {!showSaveInput ? (
          <button
            onClick={() => onShowSaveInput(true)}
            style={{
              padding: '8px 12px', fontSize: 12, fontWeight: 600,
              borderRadius: 7, border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          >
            <Save size={13} /> Save
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              value={saveName}
              onChange={e => onSaveNameChange(e.target.value)}
              placeholder="Name..."
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onShowSaveInput(false); }}
              style={{
                width: 90, padding: '4px 8px', fontSize: 11, borderRadius: 5,
                border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)',
                color: '#fff',
              }}
            />
            <button
              onClick={onSave}
              disabled={!saveName.trim()}
              style={{
                padding: '4px 8px', borderRadius: 5, border: 'none', cursor: saveName.trim() ? 'pointer' : 'not-allowed',
                background: branding.primaryColor, color: '#fff', fontSize: 11, fontWeight: 600,
                opacity: saveName.trim() ? 1 : 0.4,
              }}
            >
              <Check size={11} />
            </button>
          </div>
        )}
        <button
          onClick={onReset}
          style={{
            width: 34, height: 34, borderRadius: 7,
            border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
            color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color 0.15s ease',
          }}
          title="Reset"
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >
          <RotateCw size={13} />
        </button>
      </div>

      {(savedGradients.length > 0 || loadingSaved) && (
        <div>
          <span style={{
            fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase', letterSpacing: 1,
          }}>
            Your Saved Gradients
          </span>
          {loadingSaved ? (
            <div style={{ padding: '12px 0', fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
              Loading...
            </div>
          ) : (
            <div style={{
              display: 'flex', gap: 6, marginTop: 6, overflowX: 'auto',
              paddingBottom: 4,
            }}>
              {savedGradients.map(g => (
                <div key={g.id} style={{ position: 'relative', flexShrink: 0 }}>
                  <button
                    onClick={() => onLoadGradient(g)}
                    style={{
                      width: 52, height: 34, borderRadius: 6, cursor: 'pointer',
                      border: '2px solid rgba(255,255,255,0.08)',
                      background: g.gradient_css,
                      transition: 'border-color 0.15s ease, transform 0.1s ease',
                    }}
                    title={g.name}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                  <button
                    onClick={e => { e.stopPropagation(); onDeleteGradient(g.id); }}
                    style={{
                      position: 'absolute', top: -4, right: -4,
                      width: 16, height: 16, borderRadius: 8,
                      background: '#ef4444', border: '1.5px solid #141c2b',
                      color: '#fff', cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0, transition: 'opacity 0.15s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    title="Delete"
                  >
                    <X size={9} />
                  </button>
                  <style>{`
                    div:hover > button[title="Delete"] { opacity: 1 !important; }
                  `}</style>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {savedGradients.length === 0 && !loadingSaved && (
        <div style={{
          padding: '8px 0', fontSize: 11, color: 'rgba(255,255,255,0.2)',
          textAlign: 'center', fontStyle: 'italic',
        }}>
          Save your first custom gradient
        </div>
      )}
    </div>
  );
}
