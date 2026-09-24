'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ClassroomOrientationState {
  isMobile: boolean;
  isPortrait: boolean;
  isLockActive: boolean;
  lockFailed: boolean;
  shouldShowPrompt: boolean;
  dismissPrompt: () => void;
  retryLock: () => Promise<void>;
}

/**
 * useClassroomOrientation
 *
 * Scoped specifically to the Class experience.
 * - Detects mobile touch devices in portrait orientation
 * - Attempts to lock orientation to landscape via Screen Orientation API
 * - Gracefully handles failures (e.g., iOS Safari) by providing `shouldShowPrompt`
 * - Automatically dismisses prompt when device is turned sideways
 * - Restores previous orientation state upon unmounting/leaving Class
 */
export function useClassroomOrientation(): ClassroomOrientationState {
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isLockActive, setIsLockActive] = useState(false);
  const [lockFailed, setLockFailed] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);

  // Check if device is a mobile touch device
  const checkIsMobile = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isNarrowViewport = Math.min(window.innerWidth, window.innerHeight) <= 600;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // Desktop browsers (even with resized windows) have fine pointer and no touch
    return (hasCoarsePointer || hasTouch || isMobileUA) && isNarrowViewport;
  }, []);

  // Check if device is currently in portrait orientation
  const checkIsPortrait = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    if (typeof screen !== 'undefined' && screen.orientation && screen.orientation.type) {
      return screen.orientation.type.startsWith('portrait');
    }
    if (window.matchMedia) {
      return window.matchMedia('(orientation: portrait)').matches;
    }
    return window.innerHeight > window.innerWidth;
  }, []);

  // Attempt to lock screen orientation to landscape
  const requestLandscape = useCallback(async () => {
    if (typeof screen === 'undefined' || !('orientation' in screen)) {
      setLockFailed(true);
      return;
    }

    const orientationObj = screen.orientation as any;
    if (typeof orientationObj?.lock === 'function') {
      try {
        await orientationObj.lock('landscape');
        setIsLockActive(true);
        setLockFailed(false);
      } catch (err) {
        // Expected on iOS Safari or when browser policy requires fullscreen
        setLockFailed(true);
        setIsLockActive(false);
      }
    } else {
      setLockFailed(true);
    }
  }, []);

  // Initial detection and orientation request
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mobile = checkIsMobile();
    const portrait = checkIsPortrait();

    setIsMobile(mobile);
    setIsPortrait(portrait);

    if (mobile && portrait) {
      requestLandscape();
    }

    // Orientation change listener
    const handleOrientationChange = () => {
      const currentPortrait = checkIsPortrait();
      setIsPortrait(currentPortrait);

      // If user physically rotated to landscape, lock is no longer needed
      if (!currentPortrait) {
        setLockFailed(false);
      }
    };

    if (typeof screen !== 'undefined' && screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    }
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    // Restore orientation when student leaves Class
    return () => {
      if (typeof screen !== 'undefined' && screen.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationChange);
      }
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);

      if (typeof screen !== 'undefined' && 'orientation' in screen) {
        const orientationObj = screen.orientation as any;
        try {
          if (typeof orientationObj?.unlock === 'function') {
            orientationObj.unlock();
          } else if (typeof orientationObj?.lock === 'function') {
            orientationObj.lock('portrait').catch(() => {});
          }
        } catch {
          // Ignore unlock errors during cleanup
        }
      }
    };
  }, [checkIsMobile, checkIsPortrait, requestLandscape]);

  const dismissPrompt = useCallback(() => {
    setPromptDismissed(true);
  }, []);

  // Prompt should ONLY show if it's a mobile device in portrait where locking couldn't be enforced automatically
  const shouldShowPrompt = isMobile && isPortrait && lockFailed && !promptDismissed;

  return {
    isMobile,
    isPortrait,
    isLockActive,
    lockFailed,
    shouldShowPrompt,
    dismissPrompt,
    retryLock: requestLandscape,
  };
}
