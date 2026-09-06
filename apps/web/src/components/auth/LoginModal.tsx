import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  KeyRound,
  Building2,
  LogOut,
} from 'lucide-react';
import { authApi, CurrentAuthUser } from '../../lib/api/auth.api';
import { useApp } from '../../context/AppContext';
import { FirmLogo } from '../common/FirmLogo';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: CurrentAuthUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser, notify } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both your firm email address and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await authApi.login(email.trim(), password);
      if (res?.user) {
        setSuccessMessage(`Authenticated as ${res.user.fullName}`);
        notify(res.user.id, 'Session Authenticated', `Logged in via KKA Fastify Engine as ${res.user.fullName}`, 'system');
        if (onSuccess) onSuccess(res.user);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setErrorMessage('Authentication succeeded but user profile was not returned.');
      }
    } catch (err: any) {
      const msg = err?.message || 'Invalid credentials or backend service unreachable.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('FirmAdmin@2026!');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-slate-950/80 overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Amber Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header Brand */}
          <div className="mb-6">
            <FirmLogo
              variant="badge"
              size="md"
              showText={true}
              responsive={false}
              subtext="Advocates OS • Secure Authentication"
            />
          </div>

          {/* Status Banners */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/80 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="leading-relaxed flex-1">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/80 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <div className="leading-relaxed flex-1">{successMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Firm Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. jkariuki@kklaw.co.ke"
                  required
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-[0.99] text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-amber-950/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Sign In with Session Cookie</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Persona Pre-Fill (Dev Mode)
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickFill('jkariuki@kklaw.co.ke')}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-amber-500/10 hover:border-amber-500/40 border border-slate-200 dark:border-slate-700/60 text-left transition flex items-center gap-2"
              >
                <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <div className="truncate">
                  <div className="font-semibold truncate">Managing Partner</div>
                  <div className="text-[9px] text-slate-400 truncate">jkariuki@kklaw.co.ke</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('gmutua@kklaw.co.ke')}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-amber-500/10 hover:border-amber-500/40 border border-slate-200 dark:border-slate-700/60 text-left transition flex items-center gap-2"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <div className="truncate">
                  <div className="font-semibold truncate">Senior Advocate</div>
                  <div className="text-[9px] text-slate-400 truncate">gmutua@kklaw.co.ke</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('bochieng@kklaw.co.ke')}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-amber-500/10 hover:border-amber-500/40 border border-slate-200 dark:border-slate-700/60 text-left transition flex items-center gap-2"
              >
                <Building2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <div className="truncate">
                  <div className="font-semibold truncate">Paralegal</div>
                  <div className="text-[9px] text-slate-400 truncate">bochieng@kklaw.co.ke</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('fchebet@kklaw.co.ke')}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 hover:bg-amber-500/10 hover:border-amber-500/40 border border-slate-200 dark:border-slate-700/60 text-left transition flex items-center gap-2"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <div className="truncate">
                  <div className="font-semibold truncate">Administrator</div>
                  <div className="text-[9px] text-slate-400 truncate">fchebet@kklaw.co.ke</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
