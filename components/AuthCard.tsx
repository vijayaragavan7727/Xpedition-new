'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getStoreData, saveStoreData, setActiveStoreUser, clearStoreData } from '@/lib/store';
import { persistenceManager } from '@/lib/persistence';
import { getNextStep } from '@/lib/onboarding';
import { Eye, EyeOff, Mail, AlertCircle, ArrowRight, LogOut, CheckCircle2 } from 'lucide-react';

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
  const [isAppleLoading, setIsAppleLoading] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [resetSent, setResetSent] = useState<boolean>(false);
  const [confirmationSent, setConfirmationSent] = useState<string | null>(null);
  const [existingSession, setExistingSession] = useState<{ email: string; targetUrl: string } | null>(null);

  // Render Apple button ONLY if actually configured in environment
  const isAppleConfigured = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_APPLE_AUTH === 'true';

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

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

  // Switch between Sign In and Create Account
  const toggleAuthMode = (mode: boolean) => {
    if (mode === isSignUp && !confirmationSent) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setIsSignUp(mode);
      setFormError(null);
      setResetSent(false);
      setConfirmationSent(null);
      setIsTransitioning(false);
    }, 120);
  };

  // Map raw Supabase auth error codes to concise, human readable messages
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

    if (code === 'invalid_credentials' || msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
      return 'Invalid email or password.';
    }
    if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
      return 'Please check your inbox to confirm your email before signing in.';
    }
    if (code === 'user_already_exists' || msg.includes('user already registered') || msg.includes('already registered')) {
      return 'An account with this email already exists. Please sign in.';
    }
    if (code === 'user_not_found' || msg.includes('user not found')) {
      return 'No account with that email. Please sign up below.';
    }
    if (code === 'anonymous_provider_disabled' || msg.includes('anonymous sign-ins are disabled')) {
      return 'Anonymous sign-in is disabled.';
    }
    if (code === 'over_email_send_rate_limit' || msg.includes('rate limit exceeded')) {
      return 'Too many attempts. Please try again shortly.';
    }
    if (msg.includes('provider is not enabled') || msg.includes('unsupported provider')) {
      return 'This sign-in provider is not yet configured on this deployment. Please use email.';
    }
    if (
      msg.includes('failed to fetch') ||
      msg.includes('networkerror') ||
      msg.includes('network error') ||
      error.status === 0
    ) {
      return 'Unable to connect to the authentication service. Please check your connection.';
    }

    return error.message || 'Authentication failed. Please try again.';
  };

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured || !supabase || !urlValidation.isValid) {
      setFormError(urlValidation.message || 'Local mode active. Enter email and password to continue.');
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

  const handleAppleSignIn = async () => {
    if (!isSupabaseConfigured || !supabase || !urlValidation.isValid) {
      setFormError('Apple Sign In requires cloud deployment credentials. Please sign in with email.');
      return;
    }

    try {
      setIsAppleLoading(true);
      setFormError(null);
      const origin = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin) : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${origin}/auth/callback?next=/home`,
        },
      });

      if (error) {
        setFormError(mapSupabaseError(error));
      }
    } catch (err: any) {
      setFormError(mapSupabaseError(err));
    } finally {
      setIsAppleLoading(false);
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

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // 1. Empty field checks
    if (!trimmedEmail) {
      setFormError('Please enter your email or username.');
      emailInputRef.current?.focus();
      return;
    }
    if (!trimmedPassword) {
      setFormError('Please enter your password.');
      passwordInputRef.current?.focus();
      return;
    }

    // 2. Email format validation (when entering email format)
    if (trimmedEmail.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setFormError('Please enter a valid email address.');
        emailInputRef.current?.focus();
        return;
      }
    }

    // 3. Password length validation
    if (trimmedPassword.length < 6) {
      setFormError('Password must be at least 6 characters.');
      passwordInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    // =========================================================================
    // LOCAL MODE FALLBACK (When Supabase keys are absent in .env.local)
    // =========================================================================
    if (!isSupabaseConfigured || !supabase) {
      const localUserId = 'local_' + trimmedEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
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
    // SUPABASE AUTHENTICATION
    // =========================================================================
    try {
      if (isSignUp) {
        const origin = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin) : '';
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
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

        if (data?.user && !data?.session) {
          setIsSubmitting(false);
          setResetSent(false);
          setFormError(null);
          setConfirmationSent(trimmedEmail);
          return;
        }

        let store = getStoreData();
        if (data?.user) {
          const user = data.user;
          const userId = user.id;
          setActiveStoreUser(userId);
          persistenceManager.setActiveUserId(userId);

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
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
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
    <div className="w-full max-w-[390px] sm:max-w-[420px] bg-white rounded-[20px] sm:rounded-[22px] p-4 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200/80 transition-all select-none relative z-20 box-border">
      {/* Title & Subtitle */}
      <div className="mb-2.5 sm:mb-6 text-left">
        <h2 className="text-[20px] sm:text-[26px] font-bold text-slate-900 tracking-tight leading-tight">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-[11px] sm:text-[13px] text-slate-500 mt-0.5 sm:mt-1 leading-normal font-normal">
          {isSignUp ? 'Sign up to begin your learning journey' : 'Sign in to continue your journey'}
        </p>
      </div>

      {/* Configuration Error Banner */}
      {!urlValidation.isValid && urlValidation.message && (
        <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-amber-50 border border-amber-200 rounded-xl text-left" role="alert">
          <span className="font-sans text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
            Configuration Notice
          </span>
          <span className="font-sans text-[11px] sm:text-xs text-amber-700 block mt-0.5 leading-tight">
            {urlValidation.message}
          </span>
        </div>
      )}

      {/* Existing Session Prompt (Returning Authenticated User) */}
      {existingSession && (
        <div className="mb-3 sm:mb-5 p-3 sm:p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2 sm:space-y-3" role="region" aria-label="Active session">
          <div className="flex items-center justify-between gap-2">
            <span className="font-sans text-[10px] sm:text-[11px] uppercase tracking-wider text-emerald-800 font-bold">
              Active Session
            </span>
            <span className="font-sans text-[11px] sm:text-xs text-emerald-900 font-semibold truncate max-w-[160px] sm:max-w-[180px]">
              {existingSession.email}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                window.location.href = existingSession.targetUrl;
              }}
              className="flex-1 h-9 rounded-lg bg-[#184E38] hover:bg-[#133E2D] active:bg-[#0E2E21] text-white font-sans text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleSignOutExisting}
              className="flex-1 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-sans text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span>Switch Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Form Content */}
      <div className={`transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        {confirmationSent ? (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 my-2">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-[#184E38] mx-auto">
              <Mail className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="font-sans font-bold text-base text-slate-900">Check your inbox</h3>
            <p className="font-sans text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
              We sent a confirmation link to <span className="font-semibold text-slate-900">{confirmationSent}</span>. Click the link in that email to activate your account.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmationSent(null);
                  toggleAuthMode(false);
                }}
                className="w-full h-11 rounded-xl bg-[#184E38] hover:bg-[#133E2D] text-white font-sans text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center"
              >
                Return to Sign In
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-2.5 sm:space-y-4">
            {/* Form Error Alert */}
            {formError && (
              <div
                id="auth-error-alert"
                role="alert"
                className="p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-sans text-red-700 flex items-start gap-2 text-left"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="leading-tight">{formError}</span>
              </div>
            )}

            {/* Reset Email Sent Confirmation */}
            {resetSent && (
              <div className="p-2.5 sm:p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-sans text-emerald-800 text-center flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>Password reset instructions have been sent to your email.</span>
              </div>
            )}

            {/* Field 1: Email or username */}
            <div className="space-y-1 sm:space-y-1.5 text-left">
              <label htmlFor="auth-email" className="block font-sans font-semibold text-[12px] sm:text-[13px] text-slate-700">
                Email or username
              </label>
              <input
                id="auth-email"
                ref={emailInputRef}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                disabled={isSubmitting}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formError) setFormError(null);
                }}
                aria-describedby={formError ? 'auth-error-alert' : undefined}
                className="w-full h-10 sm:h-12 px-3 sm:px-3.5 rounded-[10px] bg-white border border-slate-200 text-[13px] sm:text-[14px] font-sans text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#184E38] focus:ring-1 focus:ring-[#184E38] disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                placeholder="you@domain.com"
              />
            </div>

            {/* Field 2: Password */}
            <div className="space-y-1 sm:space-y-1.5 text-left">
              <label htmlFor="auth-password" className="block font-sans font-semibold text-[12px] sm:text-[13px] text-slate-700">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="auth-password"
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  aria-describedby={formError ? 'auth-error-alert' : undefined}
                  className="w-full h-10 sm:h-12 pl-3 sm:pl-3.5 pr-10 rounded-[10px] bg-white border border-slate-200 text-[13px] sm:text-[14px] font-sans text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#184E38] focus:ring-1 focus:ring-[#184E38] disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#184E38] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Submit CTA: Sign In */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 sm:h-12 mt-1 sm:mt-2 rounded-[10px] bg-[#184E38] hover:bg-[#133E2D] active:bg-[#0E2E21] text-white font-sans font-semibold text-[14px] sm:text-[15px] flex items-center justify-center transition-all duration-150 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#184E38] focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2 font-mono text-xs text-white">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isSignUp ? 'Creating account...' : 'Signing in...'}</span>
                </span>
              ) : (
                <span>{isSignUp ? 'Sign Up' : 'Sign In'}</span>
              )}
            </button>

            {submitSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-sans text-center rounded-xl">
                ✓ Success. Loading your expedition...
              </div>
            )}
          </form>
        )}

        {/* Divider: "or" */}
        <div className="relative flex items-center justify-center my-2.5 sm:my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100" />
          </div>
          <div className="relative px-3 bg-white font-sans text-xs text-slate-400 font-normal">
            or
          </div>
        </div>

        {/* Social Buttons Stack: Google & Apple */}
        <div className="space-y-2 sm:space-y-2.5">
          {/* Google OAuth Button */}
          <button
            id="google-signin-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full h-11 sm:h-12 rounded-[10px] bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200/90 text-slate-700 font-sans font-medium text-[13px] sm:text-[14px] flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#184E38] focus-visible:ring-offset-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            {isGoogleLoading ? (
              <span className="inline-flex items-center gap-2 font-mono text-xs text-slate-600">
                <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                <span>Connecting with Google...</span>
              </span>
            ) : (
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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

          {/* Apple OAuth Button (rendered ONLY if configured) */}
          {isAppleConfigured && (
            <button
              id="apple-signin-btn"
              type="button"
              onClick={handleAppleSignIn}
              disabled={isAppleLoading || isSubmitting}
              className="w-full h-11 sm:h-12 rounded-[10px] bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200/90 text-slate-900 font-sans font-medium text-[13px] sm:text-[14px] flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#184E38] focus-visible:ring-offset-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              {isAppleLoading ? (
                <span className="inline-flex items-center gap-2 font-mono text-xs text-slate-600">
                  <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                  <span>Connecting with Apple...</span>
                </span>
              ) : (
                <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                  <svg className="w-4 h-4 shrink-0 fill-current text-slate-900" viewBox="0 0 170 170" aria-hidden="true">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.85-11.96-14.42-5.77-8.91-10.33-19.16-13.68-30.75-3.35-11.59-5.03-22.75-5.03-33.48 0-14.65 3.59-26.68 10.77-36.08 7.18-9.4 16.32-14.24 27.42-14.52 4.47 0 9.53 1.25 15.18 3.75 5.66 2.5 9.4 3.81 11.23 3.93 1.63 0 5.6-1.37 11.91-4.11 6.31-2.75 11.75-3.95 16.33-3.6 12.33.68 22.08 5.48 29.24 14.42-10.77 6.53-16.03 15.65-15.78 27.37.25 9.17 3.75 16.92 10.5 23.25 6.75 6.33 14.75 10.02 24 11.08-2.12 6.42-4.53 12.75-7.23 18.99zM119.22 31.02c0-7.39 2.66-14.18 7.98-20.36 5.32-6.18 11.83-9.97 19.53-11.37.22 1.3.33 2.5.33 3.6 0 7.28-2.77 14.28-8.31 21-5.54 6.72-12.28 10.54-20.21 11.45-.44-1.41-.66-2.85-.66-4.32z" />
                  </svg>
                  <span>Continue with Apple</span>
                </div>
              )}
            </button>
          )}
        </div>

        {/* Bottom Mode Switcher */}
        <div className="text-center pt-3 sm:pt-5 font-sans text-[12px] sm:text-[13px] text-slate-600">
          {!isSignUp ? (
            <span>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => toggleAuthMode(true)}
                className="text-[#184E38] font-semibold underline underline-offset-2 hover:text-[#133E2D] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#184E38] rounded cursor-pointer ml-0.5"
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => toggleAuthMode(false)}
                className="text-[#184E38] font-semibold underline underline-offset-2 hover:text-[#133E2D] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#184E38] rounded cursor-pointer ml-0.5"
              >
                Sign in
              </button>
            </span>
          )}
        </div>

        {/* Unobtrusive Trust, Terms, & Privacy Links (Visible on desktop; mobile has page footer) */}
        <div className="hidden lg:flex text-center pt-4 mt-3 border-t border-slate-100 font-sans text-[11px] text-slate-400 items-center justify-center gap-3">
          <Link href="/privacy" className="hover:text-slate-600 transition-colors">
            Privacy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-slate-600 transition-colors">
            Terms
          </Link>
          <span>•</span>
          <Link href="/trust" className="hover:text-slate-600 transition-colors">
            Trust Center
          </Link>
        </div>
      </div>
    </div>
  );
};
