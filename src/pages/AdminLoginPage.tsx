import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, Lock, Sparkles } from 'lucide-react';
import { PageId } from '../types';

interface AdminLoginPageProps {
  onLoginSuccess: (user?: { email: string; name: string }) => void;
  onNavigate?: (page: PageId) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onNavigate }) => {
  const [email, setEmail] = useState('admin@shadcnblocks.com');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsLoading(true);
    // Smooth simulation of authentication
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        email: email || 'admin@shadcnblocks.com',
        name: email.split('@')[0] || 'Admin User'
      });
    }, 600);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        email: 'admin.google@shadcnblocks.com',
        name: 'Google Admin'
      });
    }, 600);
  };

  return (
    <div className="w-full min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 flex flex-col items-center justify-center p-4 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
      
      {/* Subtle background ambient pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06] bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Top Bar with Return to Public Site Button */}
      <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-20">
        <button
          onClick={() => onNavigate && onNavigate('home')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white/90 dark:bg-neutral-900/90 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 shadow-xs backdrop-blur-md transition-all hover:shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to website</span>
        </button>
      </div>

      {/* Main Login Card Container matching the screenshot exactly */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[390px] bg-white rounded-2xl border border-neutral-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-7 sm:p-8 flex flex-col relative z-10"
      >
        {/* 1. Header with Geometric 3D Cube Logo & Title */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          {/* Isometric Striped Cube SVG matching the screenshot */}
          <div className="w-6 h-6 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-black fill-current" aria-hidden="true">
              <path d="M12 1.5L2.5 7v10L12 22.5l9.5-5.5V7L12 1.5zm0 2.3l6.5 3.77-2.3 1.33-6.5-3.77L12 3.8zM4.5 8.17l6.5 3.77v6.86l-6.5-3.77V8.17zm8.5 10.63v-6.86l6.5-3.77v6.86L13 18.8z" />
            </svg>
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-neutral-900">
            Shadcnblocks.com
          </span>
        </div>

        {/* 2. Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-neutral-200/90 bg-white hover:bg-neutral-50 text-neutral-800 text-xs sm:text-sm font-medium transition-all shadow-2xs hover:shadow-xs active:scale-[0.99] cursor-pointer disabled:opacity-60"
        >
          {/* Official Google 'G' Multi-color SVG */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign up with Google</span>
        </button>

        {/* 3. OR Divider matching the screenshot */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative px-3 bg-white text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
            OR
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 4. Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Email Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-800 text-left">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="m@example.com"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 text-xs sm:text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
            />
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-800 text-left">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-neutral-500 hover:text-neutral-800 transition-colors"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 text-xs sm:text-sm focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all"
              />
            </div>
          </div>

          {/* 5. Solid Black Log in Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>{isSignUpMode ? 'Sign up' : 'Log in'}</span>
            )}
          </button>
        </form>

        {/* Demo Quick Access Helper */}
        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-neutral-400" />
            Admin portal protected
          </span>
          <button
            type="button"
            onClick={() => {
              setEmail('admin@shadcnblocks.com');
              setPassword('password123');
            }}
            className="text-neutral-700 hover:text-black font-medium transition-colors cursor-pointer underline"
          >
            Fill Demo Admin
          </button>
        </div>
      </motion.div>

      {/* 6. Bottom Switch Link matching the screenshot */}
      <div className="mt-5 text-center text-xs text-neutral-600 dark:text-neutral-400 relative z-10">
        <span>{isSignUpMode ? 'Already have an account? ' : "Don't have an account yet? "}</span>
        <button
          type="button"
          onClick={() => setIsSignUpMode(!isSignUpMode)}
          className="font-medium text-neutral-900 dark:text-white hover:underline transition-all cursor-pointer"
        >
          {isSignUpMode ? 'Log in' : 'Log in'}
        </button>
      </div>
    </div>
  );
};
