import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, User, ArrowLeft, Check, CheckCircle } from 'lucide-react';

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
  onSignUp?: (name: string, email: string, password: string) => Promise<void>;
  onForgotPassword?: (email: string) => Promise<void>;
  isLoading: boolean;
  error?: string;
  successMessage?: string;
  rememberMe?: boolean;
  onRememberMeChange?: (checked: boolean) => void;
}

type CardMode = 'signin' | 'signup' | 'forgot';

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

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: '#ef4444' };
  if (score <= 2) return { score, label: 'Fair', color: '#f59e0b' };
  if (score <= 3) return { score, label: 'Good', color: '#eab308' };
  if (score <= 4) return { score, label: 'Strong', color: '#22c55e' };
  return { score, label: 'Very Strong', color: '#16a34a' };
}

function InputField({
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  focusedInput,
  setFocusedInput,
  name,
  primaryRgb,
  primaryColor,
  rightElement,
}: {
  icon: React.ElementType;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  focusedInput: string | null;
  setFocusedInput: (v: string | null) => void;
  name: string;
  primaryRgb: string;
  primaryColor: string;
  rightElement?: React.ReactNode;
}) {
  const isFocused = focusedInput === name;
  return (
    <motion.div
      className="relative"
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div className="relative flex items-center overflow-hidden rounded-lg">
        <Icon
          size={16}
          className="absolute left-3 transition-all duration-300 pointer-events-none z-10"
          style={{ color: isFocused ? primaryColor : 'rgba(255,255,255,0.35)' }}
        />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocusedInput(name)}
          onBlur={() => setFocusedInput(null)}
          className="w-full h-10 pl-10 pr-10 text-sm text-white placeholder:text-white/30 rounded-lg outline-none transition-all duration-300"
          style={{
            background: isFocused ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
            border: isFocused ? `1px solid rgba(${primaryRgb}, 0.5)` : '1px solid rgba(255,255,255,0.08)',
            boxShadow: isFocused ? `0 0 0 2px rgba(${primaryRgb}, 0.12)` : 'none',
          }}
        />
        {rightElement}
      </div>
    </motion.div>
  );
}

function PasswordToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 z-10 transition-colors duration-200"
      style={{ color: 'rgba(255,255,255,0.35)' }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
    >
      {show ? <Eye size={15} /> : <EyeOff size={15} />}
    </button>
  );
}

function SubmitButton({
  isLoading,
  disabled,
  label,
  primaryColor,
  accentColor,
  primaryRgb,
  buttonTextColor,
}: {
  isLoading: boolean;
  disabled: boolean;
  label: string;
  primaryColor: string;
  accentColor: string;
  primaryRgb: string;
  buttonTextColor: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type="submit"
      disabled={disabled}
      className="w-full relative group/btn mt-1"
    >
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 blur-md"
        style={{ background: `rgba(${primaryRgb}, 0.4)` }}
      />
      <div
        className="relative h-10 rounded-lg flex items-center justify-center overflow-hidden transition-all duration-300"
        style={{
          background: disabled
            ? `rgba(${primaryRgb}, 0.4)`
            : `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
          cursor: disabled ? 'not-allowed' : 'pointer',
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
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
              {label}
              <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform duration-300" />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

export function SignInCard({
  branding,
  onSubmit,
  onQuickLogin,
  onSignUp,
  onForgotPassword,
  isLoading,
  error,
  successMessage,
  rememberMe,
  onRememberMeChange,
}: SignInCardProps) {
  const [mode, setMode] = useState<CardMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [localError, setLocalError] = useState('');

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

  const buttonTextColor = isLightColor(primaryColor) ? '#0f172a' : '#ffffff';

  const passwordStrength = useMemo(() => getPasswordStrength(signupPassword), [signupPassword]);

  const passwordRequirements = useMemo(() => [
    { met: signupPassword.length >= 8, label: '8+ characters' },
    { met: /[A-Z]/.test(signupPassword), label: 'Uppercase letter' },
    { met: /[0-9]/.test(signupPassword), label: 'Number' },
    { met: /[^A-Za-z0-9]/.test(signupPassword), label: 'Special character' },
  ], [signupPassword]);

  const signupValid = signupName.trim() &&
    signupEmail.includes('@') &&
    signupPassword.length >= 8 &&
    signupPassword === signupConfirm;

  const switchMode = (newMode: CardMode) => {
    setLocalError('');
    setMode(newMode);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || isLoading) return;
    await onSubmit(email, password);
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!signupName.trim()) {
      setLocalError('Name is required.');
      return;
    }
    if (!signupEmail.includes('@')) {
      setLocalError('Please enter a valid email.');
      return;
    }
    if (signupPassword.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }
    if (signupPassword !== signupConfirm) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (onSignUp) {
      await onSignUp(signupName, signupEmail, signupPassword);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!forgotEmail.includes('@')) {
      setLocalError('Please enter a valid email.');
      return;
    }
    if (onForgotPassword) {
      await onForgotPassword(forgotEmail);
    }
  };

  const displayError = localError || error;

  const headerConfig = {
    signin: { title: 'Welcome Back', subtitle: `Sign in to continue to ${branding.platformName || 'Dashboard'}` },
    signup: { title: 'Create Account', subtitle: `Sign up to get started with ${branding.platformName || 'Dashboard'}` },
    forgot: { title: 'Reset Password', subtitle: "Enter your email and we'll send you a reset link" },
  };

  const currentHeader = headerConfig[mode];

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
          top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100vh', height: '55vh', borderRadius: '0 0 50% 50%',
          background: `rgba(${primaryRgb}, 0.15)`, filter: 'blur(60px)',
        }}
        animate={{ opacity: [0.15, 0.3, 0.15], scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror' }}
      />
      <motion.div
        className="absolute"
        style={{
          bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '80vh', height: '80vh', borderRadius: '50% 50% 0 0',
          background: `rgba(${accentRgb}, 0.15)`, filter: 'blur(60px)',
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
                        duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: i * 0.6,
                      },
                      opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror', delay: i * 0.6 },
                    }}
                  />
                );
              })}
            </div>

            <motion.div
              layout
              transition={{ layout: { duration: 0.35, ease: 'easeInOut' } }}
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

                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h1 className="text-xl font-bold text-white">{currentHeader.title}</h1>
                    <p className="text-white/55 text-xs mt-1">{currentHeader.subtitle}</p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <AnimatePresence mode="wait">
                {/* ===== SIGN IN MODE ===== */}
                {mode === 'signin' && (
                  <motion.form
                    key="signin"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleSignIn}
                    className="space-y-4 relative"
                  >
                    {displayError && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-300 bg-red-900/30 border border-red-500/20 rounded-lg px-3 py-2"
                      >
                        {displayError}
                      </motion.div>
                    )}

                    <div className="space-y-3">
                      <InputField
                        icon={Mail} type="email" placeholder="Email address"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        focusedInput={focusedInput} setFocusedInput={setFocusedInput}
                        name="email" primaryRgb={primaryRgb} primaryColor={primaryColor}
                      />
                      <InputField
                        icon={Lock} type={showPassword ? 'text' : 'password'} placeholder="Password"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        focusedInput={focusedInput} setFocusedInput={setFocusedInput}
                        name="password" primaryRgb={primaryRgb} primaryColor={primaryColor}
                        rightElement={<PasswordToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
                      />
                    </div>

                    <div className="flex items-center justify-between px-0.5">
                      <label className="flex items-center gap-2 cursor-pointer group/check">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={rememberMe || false}
                            onChange={(e) => onRememberMeChange?.(e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className="w-4 h-4 rounded flex items-center justify-center transition-all duration-200"
                            style={{
                              background: rememberMe ? primaryColor : 'rgba(255,255,255,0.08)',
                              border: rememberMe ? `1px solid ${primaryColor}` : '1px solid rgba(255,255,255,0.2)',
                            }}
                          >
                            {rememberMe && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                                <Check size={10} color={buttonTextColor} strokeWidth={3} />
                              </motion.div>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-white/50 group-hover/check:text-white/70 transition-colors select-none">
                          Remember me
                        </span>
                      </label>

                      {onForgotPassword && (
                        <button
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className="text-xs transition-colors duration-200"
                          style={{ color: 'rgba(255,255,255,0.5)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>

                    <SubmitButton
                      isLoading={isLoading} disabled={isLoading || !email || !password}
                      label="Sign In" primaryColor={primaryColor} accentColor={accentColor}
                      primaryRgb={primaryRgb} buttonTextColor={buttonTextColor}
                    />

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

                    {onSignUp && (
                      <div className="text-center pt-1">
                        <span className="text-xs text-white/40">Don't have an account? </span>
                        <button
                          type="button"
                          onClick={() => switchMode('signup')}
                          className="text-xs font-medium transition-colors duration-200"
                          style={{ color: primaryColor }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                        >
                          Sign up
                        </button>
                      </div>
                    )}
                  </motion.form>
                )}

                {/* ===== SIGN UP MODE ===== */}
                {mode === 'signup' && (
                  <motion.form
                    key="signup"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleSignUpSubmit}
                    className="space-y-3 relative"
                  >
                    {(displayError) && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-300 bg-red-900/30 border border-red-500/20 rounded-lg px-3 py-2"
                      >
                        {displayError}
                      </motion.div>
                    )}

                    <div className="space-y-3">
                      <InputField
                        icon={User} placeholder="Full name"
                        value={signupName} onChange={(e) => setSignupName(e.target.value)}
                        focusedInput={focusedInput} setFocusedInput={setFocusedInput}
                        name="signupName" primaryRgb={primaryRgb} primaryColor={primaryColor}
                      />
                      <InputField
                        icon={Mail} type="email" placeholder="Email address"
                        value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)}
                        focusedInput={focusedInput} setFocusedInput={setFocusedInput}
                        name="signupEmail" primaryRgb={primaryRgb} primaryColor={primaryColor}
                      />
                      <div>
                        <InputField
                          icon={Lock} type={showPassword ? 'text' : 'password'} placeholder="Password"
                          value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)}
                          focusedInput={focusedInput} setFocusedInput={setFocusedInput}
                          name="signupPassword" primaryRgb={primaryRgb} primaryColor={primaryColor}
                          rightElement={<PasswordToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />}
                        />
                        {signupPassword.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-2 space-y-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                <motion.div
                                  className="h-full rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                  transition={{ duration: 0.3 }}
                                  style={{ background: passwordStrength.color }}
                                />
                              </div>
                              <span className="text-[10px] font-medium" style={{ color: passwordStrength.color }}>
                                {passwordStrength.label}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                              {passwordRequirements.map((req) => (
                                <span
                                  key={req.label}
                                  className="text-[10px] flex items-center gap-1"
                                  style={{ color: req.met ? '#22c55e' : 'rgba(255,255,255,0.35)' }}
                                >
                                  {req.met ? <Check size={8} strokeWidth={3} /> : <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'rgba(255,255,255,0.2)' }} />}
                                  {req.label}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>
                      <InputField
                        icon={Lock} type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm password"
                        value={signupConfirm} onChange={(e) => setSignupConfirm(e.target.value)}
                        focusedInput={focusedInput} setFocusedInput={setFocusedInput}
                        name="signupConfirm" primaryRgb={primaryRgb} primaryColor={primaryColor}
                        rightElement={<PasswordToggle show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />}
                      />
                      {signupConfirm.length > 0 && signupPassword !== signupConfirm && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-[10px] text-red-400 px-1 -mt-1"
                        >
                          Passwords do not match
                        </motion.p>
                      )}
                    </div>

                    <SubmitButton
                      isLoading={isLoading} disabled={isLoading || !signupValid}
                      label="Create Account" primaryColor={primaryColor} accentColor={accentColor}
                      primaryRgb={primaryRgb} buttonTextColor={buttonTextColor}
                    />

                    <div className="text-center pt-1">
                      <span className="text-xs text-white/40">Already have an account? </span>
                      <button
                        type="button"
                        onClick={() => switchMode('signin')}
                        className="text-xs font-medium transition-colors duration-200"
                        style={{ color: primaryColor }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                      >
                        Sign in
                      </button>
                    </div>
                  </motion.form>
                )}

                {/* ===== FORGOT PASSWORD MODE ===== */}
                {mode === 'forgot' && (
                  <motion.form
                    key="forgot"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleForgotSubmit}
                    className="space-y-4 relative"
                  >
                    {displayError && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-300 bg-red-900/30 border border-red-500/20 rounded-lg px-3 py-2"
                      >
                        {displayError}
                      </motion.div>
                    )}

                    {successMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-emerald-300 bg-emerald-900/30 border border-emerald-500/20 rounded-lg px-3 py-2.5 flex items-start gap-2"
                      >
                        <CheckCircle size={14} className="mt-0.5 shrink-0" />
                        <span>{successMessage}</span>
                      </motion.div>
                    )}

                    <div className="space-y-3">
                      <InputField
                        icon={Mail} type="email" placeholder="Email address"
                        value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                        focusedInput={focusedInput} setFocusedInput={setFocusedInput}
                        name="forgotEmail" primaryRgb={primaryRgb} primaryColor={primaryColor}
                      />
                    </div>

                    <SubmitButton
                      isLoading={isLoading} disabled={isLoading || !forgotEmail.includes('@')}
                      label="Send Reset Link" primaryColor={primaryColor} accentColor={accentColor}
                      primaryRgb={primaryRgb} buttonTextColor={buttonTextColor}
                    />

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => switchMode('signin')}
                        className="text-xs font-medium flex items-center gap-1 mx-auto transition-colors duration-200"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                      >
                        <ArrowLeft size={12} />
                        Back to Sign In
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
