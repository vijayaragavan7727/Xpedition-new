'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { BuddyState, BUDDY_STATE_CONFIG } from './BuddyState';
import { BuddyAnimationController, BuddyMeshNodes } from './BuddyAnimationController';
import { createBuddyMeshNodes } from './BuddyModel';
import { disposeThreeScene } from '../../lib/experience/scene/threeDisposal';
import Image from 'next/image';

export interface BuddySceneProps {
  state?: BuddyState;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

const SIZE_MAP = {
  sm: { width: 72, height: 72 },
  md: { width: 128, height: 128 },
  lg: { width: 192, height: 192 },
};

/**
 * Checks whether WebGL is supported by the current browser environment.
 */
function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export const BuddyScene: React.FC<BuddySceneProps> = ({
  state = 'IDLE',
  size = 'md',
  className = '',
  onClick,
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<BuddyState>(state);
  stateRef.current = state;

  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  const animationController = useMemo(() => new BuddyAnimationController(), []);
  const dimensions = SIZE_MAP[size];

  // 1. Detect Reduced Motion Preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 2. Initialize Three.js Scene and Renderer
  useEffect(() => {
    if (!isWebGLAvailable()) {
      setHasWebGL(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let scene: THREE.Scene | null = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      dimensions.width / dimensions.height,
      0.1,
      100
    );
    camera.position.set(0, 0, 3.2);

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
      renderer.setSize(dimensions.width, dimensions.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(renderer.domElement);
    } catch (err) {
      console.warn('[BuddyScene] WebGL initialization failed, falling back to 2D representation:', err);
      setHasWebGL(false);
      return;
    }

    // A. Lighting
    const ambientLight = new THREE.AmbientLight('#818CF8', 0.85);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight('#FFFFFF', 1.8);
    directionalLight.position.set(2, 3, 3);
    scene.add(directionalLight);

    const rimLight = new THREE.DirectionalLight('#38BDF8', 2.0);
    rimLight.position.set(-2, -1, -2);
    scene.add(rimLight);

    // B. Procedural Model
    const nodes: BuddyMeshNodes = createBuddyMeshNodes();
    scene.add(nodes.group);

    // C. Animation Frame Loop & Visibility Management
    const clock = new THREE.Clock();
    let animationFrameId: number | null = null;
    let isVisible = true;

    // Pause rendering when off-screen to conserve mobile GPU / battery
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible || !renderer || !scene) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      animationController.update(
        nodes,
        stateRef.current,
        delta,
        elapsed,
        prefersReducedMotion
      );

      renderer.render(scene, camera);
    };

    animate();

    // D. Clean Resource Disposal on Unmount
    return () => {
      observer.disconnect();
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      if (scene || renderer) {
        disposeThreeScene(scene, renderer);
        scene = null;
        renderer = null;
      }
    };
  }, [dimensions.width, dimensions.height, animationController, prefersReducedMotion]);

  // =========================================================================
  // FALLBACK 2D RENDERING (If WebGL fails or is unsupported)
  // =========================================================================
  if (!hasWebGL) {
    const config = BUDDY_STATE_CONFIG[state] || BUDDY_STATE_CONFIG.IDLE;
    return (
      <div
        role="img"
        aria-label={`Buddy companion in ${config.label} state`}
        onClick={onClick}
        className={`relative flex items-center justify-center rounded-2xl overflow-hidden cursor-pointer transition-transform hover:scale-105 select-none ${className}`}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, rgba(6,11,24,0.4) 70%)',
          boxShadow: `0 0 16px ${config.glowColor}`,
          border: `1px solid ${config.visorColor}40`,
        }}
      >
        <Image
          src="/robot.png"
          alt="Buddy Companion"
          width={dimensions.width - 12}
          height={dimensions.height - 12}
          className="object-contain filter drop-shadow-[0_4px_12px_rgba(56,189,248,0.4)]"
          priority
        />
        {/* State Badge Indicator */}
        <span
          className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-slate-900"
          style={{ backgroundColor: config.visorColor }}
          title={config.label}
        />
      </div>
    );
  }

  // =========================================================================
  // 3D CANVAS RENDERING
  // =========================================================================
  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`Interactive 3D Buddy companion: ${BUDDY_STATE_CONFIG[state]?.label || 'Active'}`}
      onClick={onClick}
      style={{ width: dimensions.width, height: dimensions.height }}
      className={`relative inline-flex items-center justify-center select-none ${
        interactive ? 'cursor-pointer' : ''
      } ${className}`}
    />
  );
};

export default BuddyScene;
