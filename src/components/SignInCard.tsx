import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';

interface Branding {
  platformName?: string;
  platformTagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  sidebarBg?: string;
  fontFamily?: string;
  logoMode?: string;
  logoUrl?: string;
}

interface SignInCardProps {
  branding: Branding;
  onSubmit: (email: string, password: string) => Promise<void>;
  onQuickLogin?: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '6, 182, 212';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

function isLightColor(hex: string): boolean {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return false;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

export function SignInCard({ branding, onSubmit, onQuickLogin, isLoading, error }: SignInCardProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const primaryColor = branding.primaryColor || '#06b6d4';
  const secondaryColor = branding.secondaryColor || '#0f172a';
  const accentColor = branding.accentColor || '#14b8a6';
  const primaryRgb = hexToRgb(primaryColor);
  const accentRgb = hexToRgb(accentColor);
  const fontFamily = branding.fontFamily || 'Inter';

  const pageBackground = branding.sidebarBg ||
    `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 50%, ${accentColor} 100%)`;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [8, -8]);
  const rotateY = useTransform(mouseX, [-300, 300], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || isLoading) return;
    await onSubmit(email, password);
  };

  const buttonTextColor = isLightColor(primaryColor) ? '#0f172a' : '#ffffff';

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden flex items-center justify-center"
      style={{ background: pageBackground, fontFamily: `'${fontFamily}', sans-serif` }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(${primaryRgb}, 0.4) 0%, transparent 70%)`,
        }}
      />
      <motion.div
        className="absolute"
        style={{
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100vh',
          height: '55vh',
          borderRadius: '0 0 50% 50%',
          background: `rgba(${primaryRgb}, 0.15)`,
          filter: 'blur(60px)',
        }}
        animate={{ opacity: [0.15, 0.3, 0.15], scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror' }}
      />
      <motion.div
        className="absolute"
        style={{
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80vh',
          height: '80vh',
          borderRadius: '50% 50% 0 0',
          background: `rgba(${accentRgb}, 0.15)`,
          filter: 'blur(60px)',
        }}
        animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, repeatType: 'mirror', delay: 1 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-sm relative z-10 px-4"
        style={{ perspective: 1400 }}
      >
        <motion.div
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative group">
            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden pointer-events-none">
              {(['top', 'right', 'bottom', 'left'] as const).map((side, i) => {
                const isHorizontal = side === 'top' || side === 'bottom';
                const posStyle: React.CSSProperties = {
                  position: 'absolute',
                  ...(side === 'top' ? { top: 0, left: 0 } : {}),
                  ...(side === 'right' ? { top: 0, right: 0 } : {}),
                  ...(side === 'bottom' ? { bottom: 0, right: 0 } : {}),
                  ...(side === 'left' ? { bottom: 0, left: 0 } : {}),
                  height: isHorizontal ? 2 : '50%',
                  width: isHorizontal ? '50%' : 2,
                  background: isHorizontal
                    ? `linear-gradient(to right, transparent, rgba(${primaryRgb}, 0.8), transparent)`
                    : `linear-gradient(to bottom, transparent, rgba(${primaryRgb}, 0.8), transparent)`,
                };
                return (
                  <motion.div
                    key={side}
                    style={posStyle}
                    animate={{
                      [isHorizontal ? (side === 'top' ? 'left' : 'right') : (side === 'right' ? 'top' : 'bottom')]: ['-50%', '100%'],
                      opacity: [0.3, 0.7, 0.3],
                    }}
                    transition={{
                      [isHorizontal ? (side === 'top' ? 'left' : 'right') : (side === 'right' ? 'top' : 'bottom')]: {
                        duration: 2.5,
                        ease: 'easeInOut',
                        repeat: Infinity,
                        repeatDelay: 1,
                        delay: i * 0.6,
                      },
                      opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror', delay: i * 0.6 },
                    }}
                  />
                );
              })}
            </div>

            <div
              className="relative backdrop-blur-xl rounded-2xl p-6 border shadow-2xl overflow-hidden"
              style={{
                background: 'rgba(0, 0, 0, 0.45)',
                borderColor: `rgba(${primaryRgb}, 0.12)`,
              }}
            >
              <div
                className="absolute inset-0 opacity-[0.025]"
                style={{
                  backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                  backgroundSize: '30px 30px',
                }}
              />

              <div className="text-center space-y-1 mb-5 relative">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', duration: 0.8 }}
                  className="mx-auto w-11 h-11 rounded-full flex items-center justify-center relative overflow-hidden"
                  style={{
                    border: `1px solid rgba(${primaryRgb}, 0.3)`,
                    background: `linear-gradient(135deg, rgba(${primaryRgb}, 0.2), rgba(${accentRgb}, 0.1))`,
                  }}
                >
                  {branding.logoMode === 'icon-text' && branding.logoUrl ? (
                    <img src={branding.logoUrl} alt="" style={{ maxWidth: 36, maxHeight: 36, objectFit: 'contain' }} />
                  ) : branding.logoMode === 'full-image' && branding.logoUrl ? (
                    <img src={branding.logoUrl} alt="" style={{ maxWidth: 36, maxHeight: 36, objectFit: 'contain' }} />
                  ) : (
                    <Shield size={20} style={{ color: primaryColor }} />
                  )}
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{ background: `linear-gradient(135deg, rgba(${primaryRgb}, 0.15), transparent)` }}
                  />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold text-white"
                >
                  Welcome Back
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/55 text-xs"
                >
                  Sign in to continue to {branding.platformName || 'Dashboard'}
                </motion.p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 relative">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-300 bg-red-900/30 border border-red-500/20 rounded-lg px-3 py-2"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="space-y-3">
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <Mail
                        size={16}
                        className="absolute left-3 transition-all duration-300 pointer-events-none z-10"
                        style={{ color: focusedInput === 'email' ? primaryColor : 'rgba(255,255,255,0.35)' }}
                      />
                      <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedInput('email')}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full h-10 pl-10 pr-3 text-sm text-white placeholder:text-white/30 rounded-lg outline-none transition-all duration-300"
                        style={{
                          background: focusedInput === 'email' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
                          border: focusedInput === 'email' ? `1px solid rgba(${primaryRgb}, 0.5)` : '1px solid rgba(255,255,255,0.08)',
                          boxShadow: focusedInput === 'email' ? `0 0 0 2px rgba(${primaryRgb}, 0.12)` : 'none',
                        }}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <Lock
                        size={16}
                        className="absolute left-3 transition-all duration-300 pointer-events-none z-10"
                        style={{ color: focusedInput === 'password' ? primaryColor : 'rgba(255,255,255,0.35)' }}
                      />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedInput('password')}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full h-10 pl-10 pr-10 text-sm text-white placeholder:text-white/30 rounded-lg outline-none transition-all duration-300"
                        style={{
                          background: focusedInput === 'password' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
                          border: focusedInput === 'password' ? `1px solid rgba(${primaryRgb}, 0.5)` : '1px solid rgba(255,255,255,0.08)',
                          boxShadow: focusedInput === 'password' ? `0 0 0 2px rgba(${primaryRgb}, 0.12)` : 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 z-10 transition-colors duration-200"
                        style={{ color: 'rgba(255,255,255,0.35)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                      >
                        {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                    </div>
                  </motion.div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full relative group/btn mt-1"
                >
                  <div
                    className="absolute inset-0 rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 blur-md"
                    style={{ background: `rgba(${primaryRgb}, 0.4)` }}
                  />
                  <div
                    className="relative h-10 rounded-lg flex items-center justify-center overflow-hidden transition-all duration-300"
                    style={{
                      background: isLoading || !email || !password
                        ? `rgba(${primaryRgb}, 0.4)`
                        : `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                      cursor: isLoading || !email || !password ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <motion.div
                      className="absolute inset-0"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 }}
                      style={{
                        opacity: isLoading ? 1 : 0,
                        background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)',
                      }}
                    />
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <div
                            className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                            style={{ borderColor: `${buttonTextColor}70`, borderTopColor: 'transparent' }}
                          />
                        </motion.div>
                      ) : (
                        <motion.span
                          key="text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1.5 text-sm font-semibold"
                          style={{ color: buttonTextColor }}
                        >
                          Sign In
                          <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform duration-300" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>

                {onQuickLogin && (
                  <>
                    <div className="relative flex items-center my-2">
                      <div className="flex-grow border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                      <span className="mx-3 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Quick Demo</span>
                      <div className="flex-grow border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Admin', desc: 'Full access', email: 'admin@prysmcs.com', pw: 'Admin123!' },
                        { label: 'Data Entry', desc: 'Data mgmt', email: 'dataentry@prysmcs.com', pw: 'DataEntry123!' },
                        { label: 'View Only', desc: 'Read-only', email: 'viewer@prysmcs.com', pw: 'Viewer123!' },
                      ].map((demo) => (
                        <motion.button
                          key={demo.label}
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          disabled={isLoading}
                          onClick={() => onQuickLogin(demo.email, demo.pw)}
                          className="flex flex-col items-center py-2 px-1 rounded-lg text-center transition-all duration-200 disabled:opacity-50"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: `1px solid rgba(${primaryRgb}, 0.12)`,
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = `rgba(${primaryRgb}, 0.1)`;
                            (e.currentTarget as HTMLButtonElement).style.borderColor = `rgba(${primaryRgb}, 0.3)`;
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                            (e.currentTarget as HTMLButtonElement).style.borderColor = `rgba(${primaryRgb}, 0.12)`;
                          }}
                        >
                          <span className="text-xs font-semibold text-white/80">{demo.label}</span>
                          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{demo.desc}</span>
                        </motion.button>
                      ))}
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
