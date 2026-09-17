'use client';

/**
 * 3D Object Manipulation Scene
 * Built with Three.js for interactive spatial orientation and spatial reasoning.
 *
 * Features:
 * - Multifaceted 3D Scholar's Prism geometry with distinct faces and glowing emerald resonant focal face.
 * - Interactive pointer drag rotation (orbit/trackball feel) + mouse wheel zoom.
 * - Reticle target alignment indicator with dynamic resonance aura:
 *     - Cyan: Coarse scanning (> 30° error)
 *     - Amber/Gold: Proximity cone (15° - 30° error)
 *     - Emerald/Green: Resonant lock (< 15° error)
 * - Accessible micro-adjustment buttons (Pitch, Yaw, Roll, Zoom, Reset).
 * - Full memory/GPU disposal on unmount.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { calculateAngularDistance } from '@/lib/experience/simulation/spatialMath';
import { disposeThreeScene } from '@/lib/experience/scene/threeDisposal';

interface ObjectManipulationScene3DProps {
  initialEulerDeg?: [number, number, number];
  targetEulerDeg?: [number, number, number];
  toleranceDeg?: number;
  onRotationChange?: (eulerDeg: [number, number, number], angularDistanceDeg: number) => void;
  onAlignSuccess?: (eulerDeg: [number, number, number], angularDistanceDeg: number) => void;
  disabled?: boolean;
}

export const ObjectManipulationScene3D: React.FC<ObjectManipulationScene3DProps> = ({
  initialEulerDeg = [65, -110, 25],
  targetEulerDeg = [0, 0, 0],
  toleranceDeg = 15.0,
  onRotationChange,
  onAlignSuccess,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const artifactGroupRef = useRef<THREE.Group | null>(null);
  const reticleRingRef = useRef<THREE.Mesh | null>(null);

  // Interaction tracking refs
  const isDraggingRef = useRef(false);
  const previousPointerPositionRef = useRef({ x: 0, y: 0 });
  const currentEulerRef = useRef<[number, number, number]>([...initialEulerDeg]);
  const animationFrameIdRef = useRef<number | null>(null);

  // State for UI readouts
  const [currentError, setCurrentError] = useState<number>(() =>
    calculateAngularDistance(initialEulerDeg, targetEulerDeg)
  );
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(6.0);

  // Notify parent of changes
  const updateRotationState = useCallback(
    (newEuler: [number, number, number]) => {
      currentEulerRef.current = newEuler;
      const error = calculateAngularDistance(newEuler, targetEulerDeg);
      setCurrentError(error);

      const aligned = error <= toleranceDeg;
      setIsLocked(aligned);

      if (onRotationChange) {
        onRotationChange(newEuler, error);
      }
      if (aligned && onAlignSuccess) {
        onAlignSuccess(newEuler, error);
      }
    },
    [targetEulerDeg, toleranceDeg, onRotationChange, onAlignSuccess]
  );

  // Setup Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 6.0);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0c16, 1.0);
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting - Nocturne Scholar palette
    const ambientLight = new THREE.AmbientLight(0x232d4b, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x93c5fd, 1.8);
    keyLight.position.set(5, 7, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 1.2);
    rimLight.position.set(-5, -3, -4);
    scene.add(rimLight);

    const resonantLight = new THREE.PointLight(0x10b981, 2.0, 10);
    resonantLight.position.set(0, 0, 2);
    scene.add(resonantLight);

    // 5. Build Multifaceted Scholar's Prism
    const artifactGroup = new THREE.Group();
    artifactGroupRef.current = artifactGroup;

    // Outer crystalline body (octahedron/faceted geometry)
    const baseGeo = new THREE.OctahedronGeometry(1.6, 1);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.2,
      roughness: 0.15,
      transmission: 0.7,
      thickness: 0.8,
      transparent: true,
      opacity: 0.85,
      wireframe: false,
    });
    const bodyMesh = new THREE.Mesh(baseGeo, bodyMat);
    artifactGroup.add(bodyMesh);

    // Wireframe glowing cage around the prism
    const wireGeo = new THREE.OctahedronGeometry(1.62, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    artifactGroup.add(wireMesh);

    // Core Emerald Resonant Glyph Face (pointing toward +Z in local coords)
    const glyphGeo = new THREE.CircleGeometry(0.55, 6);
    const glyphMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 1.2,
      roughness: 0.2,
      side: THREE.DoubleSide,
    });
    const glyphMesh = new THREE.Mesh(glyphGeo, glyphMat);
    glyphMesh.position.set(0, 0, 1.55);
    artifactGroup.add(glyphMesh);

    // Inner glowing core
    const coreGeo = new THREE.IcosahedronGeometry(0.5, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 1.5,
      wireframe: true,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    artifactGroup.add(coreMesh);

    // Apply initial Euler rotation
    artifactGroup.rotation.x = THREE.MathUtils.degToRad(initialEulerDeg[0]);
    artifactGroup.rotation.y = THREE.MathUtils.degToRad(initialEulerDeg[1]);
    artifactGroup.rotation.z = THREE.MathUtils.degToRad(initialEulerDeg[2]);
    scene.add(artifactGroup);

    // 6. Observation Reticle in HUD space (fixed in front of camera)
    const reticleRingGeo = new THREE.RingGeometry(1.9, 1.95, 64);
    const reticleRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const reticleRing = new THREE.Mesh(reticleRingGeo, reticleRingMat);
    reticleRing.position.set(0, 0, 0);
    scene.add(reticleRing);
    reticleRingRef.current = reticleRing;

    // Crosshairs
    const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25 });
    const crosshairGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-2.2, 0, 0),
      new THREE.Vector3(2.2, 0, 0),
      new THREE.Vector3(0, -2.2, 0),
      new THREE.Vector3(0, 2.2, 0),
    ]);
    const crosshairs = new THREE.LineSegments(crosshairGeo, lineMat);
    scene.add(crosshairs);

    // 7. Animation loop
    let frame = 0;
    const animate = () => {
      frame++;
      animationFrameIdRef.current = requestAnimationFrame(animate);

      // Subtle reticle breathing pulse
      if (reticleRingRef.current) {
        const pulse = 1.0 + Math.sin(frame * 0.05) * 0.02;
        reticleRingRef.current.scale.set(pulse, pulse, 1);
      }

      // Subtle core spin inside the prism
      coreMesh.rotation.y += 0.01;
      coreMesh.rotation.x += 0.005;

      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      disposeThreeScene(scene, renderer);
    };
  }, []); // Run once on mount

  // Update reticle color dynamically based on current alignment error
  useEffect(() => {
    if (!reticleRingRef.current) return;
    const mat = reticleRingRef.current.material as THREE.MeshBasicMaterial;
    if (currentError <= toleranceDeg) {
      // Emerald lock
      mat.color.setHex(0x10b981);
      mat.opacity = 0.9;
    } else if (currentError <= 30.0) {
      // Amber proximity
      mat.color.setHex(0xf59e0b);
      mat.opacity = 0.65;
    } else {
      // Cyan search
      mat.color.setHex(0x38bdf8);
      mat.opacity = 0.35;
    }
  }, [currentError, toleranceDeg]);

  // Pointer Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    isDraggingRef.current = true;
    previousPointerPositionRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !artifactGroupRef.current || disabled) return;

    const deltaX = e.clientX - previousPointerPositionRef.current.x;
    const deltaY = e.clientY - previousPointerPositionRef.current.y;
    previousPointerPositionRef.current = { x: e.clientX, y: e.clientY };

    // Rotation sensitivity: 0.5 deg per pixel
    const sensitivity = 0.5;
    const deltaYaw = deltaX * sensitivity;
    const deltaPitch = deltaY * sensitivity;

    // Update group rotation
    const group = artifactGroupRef.current;
    group.rotation.y += THREE.MathUtils.degToRad(deltaYaw);
    group.rotation.x += THREE.MathUtils.degToRad(deltaPitch);

    // Convert back to degrees
    const curX = THREE.MathUtils.radToDeg(group.rotation.x);
    const curY = THREE.MathUtils.radToDeg(group.rotation.y);
    const curZ = THREE.MathUtils.radToDeg(group.rotation.z);

    updateRotationState([curX, curY, curZ]);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture was already lost
    }
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!cameraRef.current || disabled) return;
    const zoomDelta = e.deltaY * 0.005;
    const newZ = Math.min(Math.max(cameraRef.current.position.z + zoomDelta, 3.5), 9.0);
    cameraRef.current.position.z = newZ;
    setZoomLevel(newZ);
  };

  // Micro-adjustment buttons for precise control / accessibility
  const adjustAxis = (axis: 'pitch' | 'yaw' | 'roll', degrees: number) => {
    if (!artifactGroupRef.current || disabled) return;
    const group = artifactGroupRef.current;
    const rad = THREE.MathUtils.degToRad(degrees);

    if (axis === 'pitch') group.rotation.x += rad;
    if (axis === 'yaw') group.rotation.y += rad;
    if (axis === 'roll') group.rotation.z += rad;

    const curX = THREE.MathUtils.radToDeg(group.rotation.x);
    const curY = THREE.MathUtils.radToDeg(group.rotation.y);
    const curZ = THREE.MathUtils.radToDeg(group.rotation.z);

    updateRotationState([curX, curY, curZ]);
  };

  const resetOrientation = () => {
    if (!artifactGroupRef.current) return;
    const group = artifactGroupRef.current;
    group.rotation.x = THREE.MathUtils.degToRad(initialEulerDeg[0]);
    group.rotation.y = THREE.MathUtils.degToRad(initialEulerDeg[1]);
    group.rotation.z = THREE.MathUtils.degToRad(initialEulerDeg[2]);

    if (cameraRef.current) {
      cameraRef.current.position.z = 6.0;
      setZoomLevel(6.0);
    }

    updateRotationState([...initialEulerDeg]);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center select-none overflow-hidden rounded-2xl bg-slate-950/90 border border-slate-800 shadow-2xl">
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-[450px] cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        aria-label="3D Scholar's Prism Chamber. Click and drag to rotate artifact."
      />

      {/* Real-time HUD Alignment Header Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-lg">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isLocked
                ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]'
                : currentError <= 30
                ? 'bg-amber-400'
                : 'bg-cyan-400'
            }`}
          />
          <span className="text-xs font-mono font-medium text-slate-200">
            {isLocked
              ? 'RESONANCE LOCKED'
              : currentError <= 30
              ? 'APPROACHING TARGET'
              : 'SEARCHING ORIENTATION'}
          </span>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-lg font-mono text-xs">
          <span className="text-slate-400 mr-2">ANGULAR DIVERGENCE:</span>
          <span
            className={`font-bold ${
              isLocked ? 'text-emerald-400' : currentError <= 30 ? 'text-amber-400' : 'text-cyan-400'
            }`}
          >
            {currentError.toFixed(1)}°
          </span>
          <span className="text-slate-500 ml-1">/ &lt;{toleranceDeg}°</span>
        </div>
      </div>

      {/* Bottom Control Bar & Micro-Adjustment Pad */}
      <div className="w-full p-4 bg-slate-900/90 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Spatial Axis Precision Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider mr-1">
            Precision Nudge:
          </span>

          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-mono px-1">PITCH</span>
            <button
              onClick={() => adjustAxis('pitch', -5)}
              disabled={disabled}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50 transition"
              title="Pitch Down -5°"
            >
              -5°
            </button>
            <button
              onClick={() => adjustAxis('pitch', 5)}
              disabled={disabled}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50 transition"
              title="Pitch Up +5°"
            >
              +5°
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-mono px-1">YAW</span>
            <button
              onClick={() => adjustAxis('yaw', -5)}
              disabled={disabled}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50 transition"
              title="Yaw Left -5°"
            >
              -5°
            </button>
            <button
              onClick={() => adjustAxis('yaw', 5)}
              disabled={disabled}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50 transition"
              title="Yaw Right +5°"
            >
              +5°
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-mono px-1">ROLL</span>
            <button
              onClick={() => adjustAxis('roll', -5)}
              disabled={disabled}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50 transition"
              title="Roll Counterclockwise -5°"
            >
              -5°
            </button>
            <button
              onClick={() => adjustAxis('roll', 5)}
              disabled={disabled}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50 transition"
              title="Roll Clockwise +5°"
            >
              +5°
            </button>
          </div>
        </div>

        {/* Global Reset & Orientation readout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>[X:{currentEulerRef.current[0].toFixed(0)}°</span>
            <span>Y:{currentEulerRef.current[1].toFixed(0)}°</span>
            <span>Z:{currentEulerRef.current[2].toFixed(0)}°]</span>
          </div>

          <button
            onClick={resetOrientation}
            disabled={disabled}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700/70 transition flex items-center gap-1.5"
          >
            <svg
              className="w-3.5 h-3.5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
