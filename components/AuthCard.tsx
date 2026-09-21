'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getStoreData, saveStoreData, setActiveStoreUser, clearStoreData } from '@/lib/store';
import { persistenceManager } from '@/lib/persistence';
import { getNextStep } from '@/lib/onboarding';
import { Eye, EyeOff, Compass, Mail, Lock, AlertCircle, LogOut, ArrowRight } from 'lucide-react';

interface AuthCardProps {
  initialMode?: 'signin' | 'signup';
  initialError?: string | null;
}

export const AuthCard: React.FC<AuthCardProps> = ({ initialMode = 'signin', initialError = null }) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(initialMode === 'signup');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(initialError);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [resetSent, setResetSent] = useState<boolean>(false);
  const [confirmationSent, setConfirmationSent] = useState<string | null>(null);
  const [existingSession, setExistingSession] = useState<{ email: string; targetUrl: string } | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);

  // Check if returning user is already authenticated without forced redirect
  useEffect(() => {
    const checkExistingSession = async () => {
      if (!isSupabaseConfigured || !supabase) return;
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          const userId = data.session.user.id;
          setActiveStoreUser(userId);
          persistenceManager.setActiveUserId(userId);
          const store = await persistenceManager.loadUserStore(userId);
          saveStoreData(store, userId);
          const next = getNextStep(store);
          const targetUrl = next === 'goal' ? '/onboarding' : next === 'calibrate' ? '/calibrate' : '/home';
          setExistingSession({
            email: data.session.user.email || 'Authenticated User',
            targetUrl,
          });
        }
      } catch {
        // Silent session check
      }
    };

    checkExistingSession();
  }, []);

  const handleSignOutExisting = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }
    setActiveStoreUser(null);
    clearStoreData();
    setExistingSession(null);
  };

  // Validate Supabase URL format at startup before credential entry
  const urlValidation = useMemo(() => {
    const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
    if (!rawUrl) {
      return { isValid: true, isLocalMode: true, message: null };
    }

    if (rawUrl.includes('/dashboard/') || rawUrl.includes('/settings/')) {
      return {
        isValid: false,
        isLocalMode: false,
        message: 'Your NEXT_PUBLIC_SUPABASE_URL is set to the dashboard web page. Use https://<project-ref>.supabase.co instead.',
      };
    }

    // Standard Supabase project API URL regex matcher: https://<ref>.supabase.co
    const supabaseUrlRegex = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i;
    if (!supabaseUrlRegex.test(rawUrl)) {
      return {
        isValid: false,
        isLocalMode: false,
        message: `Invalid NEXT_PUBLIC_SUPABASE_URL format ("${rawUrl}"). Expected https://<project-ref>.supabase.co`,
      };
    }

    return { isValid: true, isLocalMode: false, message: null };
  }, []);

  // Switch between Sign In and Create Account with smooth cross-fade
  const toggleAuthMode = (mode: boolean) => {
    if (mode === isSignUp && !confirmationSent) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setIsSignUp(mode);
      setFormError(null);
      setResetSent(false);
      setConfirmationSent(null);
      setIsTransitioning(false);
    }, 150);
  };

  // Map raw Supabase auth error codes to plain, accurate human language
  const mapSupabaseError = (error: any): string => {
    if (!error) return 'An unexpected authentication error occurred.';

    console.error('Supabase Auth Error Details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name,
      error,
    });

    const code = error.code || '';
    const msg = (error.message || '').toLowerCase();

    if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
      return "That email and password don't match.";
    }
    if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
      return 'Please check your inbox to confirm your email before logging in.';
    }
    if (code === 'user_already_exists' || msg.includes('user already registered') || msg.includes('already registered')) {
      return 'An account with this email already exists. Please log in.';
    }
    if (code === 'user_not_found' || msg.includes('user not found')) {
      return 'No account with that email. Create one below?';
    }
    if (code === 'anonymous_provider_disabled' || msg.includes('anonymous sign-ins are disabled')) {
      return 'Anonymous sign-in is disabled.';
    }
    if (code === 'over_email_send_rate_limit' || msg.includes('rate limit exceeded')) {
      return 'Too many attempts. Please try again shortly.';
    }
    if (
      msg.includes('failed to fetch') ||
      msg.includes('networkerror') ||
      msg.includes('network error') ||
      error.status === 0
    ) {
      return "Unable to connect to the authentication service.";
    }

    return error.message || 'Authentication failed. Please try again.';
  };

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured || !supabase || !urlValidation.isValid) {
      setFormError(urlValidation.message || 'Local mode — add Supabase keys to enable cloud accounts.');
      return;
    }

    try {
      setIsGoogleLoading(true);
      setFormError(null);
      const origin = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin) : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/home`,
        },
      });

      if (error) {
        setFormError(mapSupabaseError(error));
        emailInputRef.current?.focus();
      }
    } catch (err: any) {
      setFormError(mapSupabaseError(err));
      emailInputRef.current?.focus();
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) {
      setFormError('Please enter your email above to receive a password reset link.');
      emailInputRef.current?.focus();
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setResetSent(true);
      return;
    }

    try {
      const origin = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin) : '';
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/login?reset=true`,
      });

      if (error) {
        setFormError(mapSupabaseError(error));
      } else {
        setResetSent(true);
      }
    } catch (err: any) {
      setFormError(mapSupabaseError(err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setResetSent(false);
    setConfirmationSent(null);

    if (!urlValidation.isValid) {
      setFormError(urlValidation.message);
      return;
    }

    if (!email.trim() || !password.trim()) {
      setFormError('Please enter both your email and password.');
      emailInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    // =========================================================================
    // LOCAL MODE FALLBACK (When Supabase keys are absent in .env.local)
    // =========================================================================
    if (!isSupabaseConfigured || !supabase) {
      const localUserId = 'local_' + email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      setActiveStoreUser(localUserId);
      persistenceManager.setActiveUserId(localUserId);
      const store = await persistenceManager.loadUserStore(localUserId);
      saveStoreData(store, localUserId);

      setIsSubmitting(false);
      setSubmitSuccess(true);
      const next = getNextStep(store);
      const targetUrl = next === 'goal' ? '/onboarding' : next === 'calibrate' ? '/calibrate' : '/home';
      window.location.href = targetUrl;
      return;
    }

    // =========================================================================
    // SUPABASE AUTHENTICATION (When Supabase is configured)
    // =========================================================================
    try {
      if (isSignUp) {
        // Sign Up Flow
        const origin = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin) : '';
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=/home`,
          },
        });

        if (error) {
          setFormError(mapSupabaseError(error));
          emailInputRef.current?.focus();
          setIsSubmitting(false);
          return;
        }

        // When email confirmation is required, Supabase returns a user but session is null
        if (data?.user && !data?.session) {
          setIsSubmitting(false);
          setResetSent(false);
          setFormError(null);
          setConfirmationSent(email.trim());
          return;
        }

        let store = getStoreData();
        if (data?.user) {
          const user = data.user;
          const userId = user.id;
          setActiveStoreUser(userId);
          persistenceManager.setActiveUserId(userId);

          // Parallelize store loading and non-blocking profile upsert
          const [loadedStore] = await Promise.all([
            persistenceManager.loadUserStore(userId),
            (async () => {
              try {
                await supabase.from('profiles').upsert({
                  id: user.id,
                  email: user.email,
                  updated_at: new Date().toISOString(),
                });
              } catch (profileErr) {
                console.warn('Profile upsert warning (non-blocking):', profileErr);
              }
              return null;
            })(),
          ]);

          if (loadedStore) store = loadedStore;
          saveStoreData(store, userId);
        }

        const next = getNextStep(store);
        const targetUrl = next === 'goal' ? '/onboarding' : next === 'calibrate' ? '/calibrate' : '/home';

        setSubmitSuccess(true);
        window.location.href = targetUrl;
      } else {
        // Sign In Flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setFormError(mapSupabaseError(error));
          emailInputRef.current?.focus();
          setIsSubmitting(false);
          return;
        }

        let store = getStoreData();
        if (data?.user) {
          const user = data.user;
          const userId = user.id;
          setActiveStoreUser(userId);
          persistenceManager.setActiveUserId(userId);

          // Parallelize store loading and non-blocking profile upsert
          const [loadedStore] = await Promise.all([
            persistenceManager.loadUserStore(userId),
            (async () => {
              try {
                await supabase.from('profiles').upsert({
                  id: user.id,
                  email: user.email,
                  updated_at: new Date().toISOString(),
                });
              } catch (profileErr) {
                console.warn('Profile upsert warning (non-blocking):', profileErr);
              }
              return null;
            })(),
          ]);

          if (loadedStore) store = loadedStore;
          saveStoreData(store, userId);
        }

        const next = getNextStep(store);
        const targetUrl = next === 'goal' ? '/onboarding' : next === 'calibrate' ? '/calibrate' : '/home';

        setSubmitSuccess(true);
        window.location.href = targetUrl;
      }
    } catch (err: any) {
      setFormError(mapSupabaseError(err));
      emailInputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto bg-[#141826]/95 border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50 backdrop-blur-md relative z-10 select-none">
      <div className="space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-1">
            <Compass className="w-5 h-5 text-indigo-400" aria-hidden="true" />
          </div>
          <h1 className="font-orbitron font-bold text-xl sm:text-2xl tracking-wordmark text-white leading-none block">
            XPEDITION
          </h1>
          <span className="font-sans font-medium text-xs text-slate-400 block">
            {isSignUp ? 'Begin your intelligent learning adventure' : 'Sign in to continue your journey'}
          </span>
        </div>

        {/* Configuration Error Banner */}
        {!urlValidation.isValid && urlValidation.message && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-center space-y-1" role="alert">
            <span className="font-mono text-[10px] tracking-wider uppercase text-red-400 block font-bold">
              Configuration Notice
            </span>
            <span className="font-sans text-xs text-red-300 block leading-tight">
              {urlValidation.message}
            </span>
          </div>
        )}

        {/* Existing Session Prompt (Intentional Navigation / Switch Account) */}
        {existingSession && (
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl space-y-3" role="region" aria-label="Active session">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] tracking-wider uppercase text-indigo-400 font-bold">
                Active Session Detected
              </span>
              <span className="font-sans text-xs text-slate-300 font-semibold truncate max-w-[190px]">
                {existingSession.email}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  window.location.href = existingSession.targetUrl;
                }}
                className="flex-1 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-sans text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleSignOutExisting}
                className="flex-1 h-9 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] active:bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white font-sans text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <span>Switch Account</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Form Content */}
        <div
          className={`space-y-5 transition-opacity duration-150 ease-in-out ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Welcome Heading */}
          <div className="text-center">
            <h2 className="font-sans font-bold text-lg sm:text-xl text-[#F8FAFC]">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="font-sans text-xs text-slate-400 mt-1">
              {isSignUp
                ? 'Your progress and Skill Passport will stay with this account.'
                : 'Pick up exactly where you left off.'}
            </p>
          </div>

          {/* Form or Confirmation Notice */}
          {confirmationSent ? (
            <div className="p-5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-center space-y-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 mx-auto">
                <Mail className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="font-sans font-bold text-base text-white">Check your inbox</h3>
              <p className="font-sans text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                We sent a confirmation link to <span className="font-semibold text-white">{confirmationSent}</span>. Click the link in that email to activate your account.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmationSent(null);
                    toggleAuthMode(false);
                  }}
                  className="w-full h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center"
                >
                  Return to Log in
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Form Error Alert */}
              {formError && (
                <div
                  id="auth-error-alert"
                  role="alert"
                  className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-sans text-red-300 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{formError}</span>
                </div>
              )}

            {/* Reset Email Sent Confirmation */}
            {resetSent && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-sans text-emerald-300 text-center">
                Password reset instructions have been sent to your email.
              </div>
            )}

            {/* Field 1: EMAIL */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="email" className="block font-sans font-semibold text-xs text-slate-300 tracking-wide">
                Email
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" aria-hidden="true" />
                <input
                  id="email"
                  ref={emailInputRef}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-describedby={formError ? 'auth-error-alert' : undefined}
                  className="w-full h-[50px] pl-10 pr-3.5 rounded-xl bg-[#0F121C] border border-white/[0.1] text-[15px] font-sans text-[#F8FAFC] placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all"
                  placeholder="learner@example.com"
                />
              </div>
            </div>

            {/* Field 2: PASSWORD */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block font-sans font-semibold text-xs text-slate-300 tracking-wide">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="font-sans text-xs text-indigo-400 hover:text-indigo-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-describedby={formError ? 'auth-error-alert' : undefined}
                  className="w-full h-[50px] pl-10 pr-11 rounded-xl bg-[#0F121C] border border-white/[0.1] text-[15px] font-sans text-[#F8FAFC] placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all"
                  placeholder={isSignUp ? 'Choose a secure password' : 'Enter your password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !email.trim() || !password.trim() || !urlValidation.isValid}
              className="w-full h-[52px] rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-sans font-semibold text-[15px] sm:text-base flex items-center justify-center transition-all duration-200 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141826] motion-reduce:transform-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2 font-mono text-xs">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </span>
              ) : (
                <span>{isSignUp ? 'Create account' : 'Log in'}</span>
              )}
            </button>

            {submitSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-sans text-center rounded-xl mt-2">
                ✓ Success. Redirecting to your expedition...
              </div>
            )}
          </form>
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative px-3 bg-[#141826] font-sans text-xs text-slate-500 uppercase tracking-wider">
              or
            </div>
          </div>

          {/* Google Sign-In Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || !urlValidation.isValid}
              className="w-full h-[48px] rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.03] border border-white/[0.1] hover:border-white/[0.2] text-slate-200 hover:text-white font-sans font-medium text-[14px] flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141826] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <span className="inline-flex items-center gap-2 font-mono text-xs">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </span>
              ) : (
                <div className="flex items-center justify-center gap-2.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
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
                  <span>Continue with Google</span>
                </div>
              )}
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="text-center pt-2 font-sans text-xs text-slate-400">
            {!isSignUp ? (
              <span>
                New to XPedition?{' '}
                <button
                  type="button"
                  onClick={() => toggleAuthMode(true)}
                  className="text-indigo-400 hover:text-indigo-300 hover:underline font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded cursor-pointer ml-0.5"
                >
                  Create an account
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => toggleAuthMode(false)}
                  className="text-indigo-400 hover:text-indigo-300 hover:underline font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded cursor-pointer ml-0.5"
                >
                  Log in
                </button>
              </span>
            )}
          </div>

          {/* Terms & Privacy Footer */}
          <div className="text-center pt-3 border-t border-white/[0.06] font-sans text-[11px] text-slate-500 flex items-center justify-center gap-3">
            <Link href="/privacy" className="text-slate-500 hover:text-slate-400 hover:underline transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="text-slate-500 hover:text-slate-400 hover:underline transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/trust" className="text-slate-500 hover:text-slate-400 hover:underline transition-colors">
              Trust Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
