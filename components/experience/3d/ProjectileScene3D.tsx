'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SimulationResult, TrajectoryPoint } from '@/lib/experience/simulation/projectilePhysics';
import { disposeThreeScene } from '@/lib/experience/scene/threeDisposal';

interface ProjectileScene3DProps {
  launchAngleDeg: number;
  velocity: number;
  targetDistance: number;
  targetTolerance?: number;
  simResult: SimulationResult;
  isLaunching: boolean;
  onLaunchComplete?: () => void;
}

export const ProjectileScene3D: React.FC<ProjectileScene3DProps> = ({
  launchAngleDeg,
  velocity,
  targetDistance,
  targetTolerance = 1.5,
  simResult,
  isLaunching,
  onLaunchComplete,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // References to dynamic Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cannonBarrelRef = useRef<THREE.Mesh | null>(null);
  const projectileBallRef = useRef<THREE.Mesh | null>(null);
  const trajectoryLineRef = useRef<THREE.Line | null>(null);
  const targetMeshRef = useRef<THREE.Group | null>(null);
  const landingMarkerRef = useRef<THREE.Mesh | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Flight animation state
  const flightProgressRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);

  // ---------------------------------------------------------------------------
  // 1. Scene Initialization
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 360;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0d14);
    scene.fog = new THREE.FogExp2(0x0b0d14, 0.015);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 100);
    camera.position.set(13, 10, 26);
    camera.lookAt(14, 2, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x2a3350, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x818cf8, 1.8);
    dirLight.position.set(15, 25, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 1.5, 30);
    pointLight.position.set(0, 5, 5);
    scene.add(pointLight);

    // Ground Grid
    const gridHelper = new THREE.GridHelper(60, 60, 0x312e81, 0x1e2238);
    gridHelper.position.set(15, 0, 0);
    scene.add(gridHelper);

    // Ground Axis Line (Range track)
    const axisMat = new THREE.LineBasicMaterial({ color: 0x6366f1, linewidth: 2 });
    const axisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.05, 0),
      new THREE.Vector3(40, 0.05, 0),
    ]);
    const axisLine = new THREE.Line(axisGeo, axisMat);
    scene.add(axisLine);

    // Distance tick markers (5m, 10m, 15m, 20m, 25m, 30m, 35m)
    for (let x = 5; x <= 35; x += 5) {
      const tickGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0.05, -1),
        new THREE.Vector3(x, 0.05, 1),
      ]);
      const tickMat = new THREE.LineBasicMaterial({ color: x === 25 ? 0x10b981 : 0x4f46e5 });
      const tick = new THREE.Line(tickGeo, tickMat);
      scene.add(tick);
    }

    // -------------------------------------------------------------------------
    // Cannon Base & Barrel
    // -------------------------------------------------------------------------
    const cannonGroup = new THREE.Group();
    cannonGroup.position.set(0, 0, 0);

    // Mount stand
    const standGeo = new THREE.CylinderGeometry(0.8, 1.2, 1.0, 16);
    const standMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.y = 0.5;
    cannonGroup.add(stand);

    // Barrel pivot
    const pivot = new THREE.Group();
    pivot.position.set(0, 1.0, 0);

    const barrelGeo = new THREE.CylinderGeometry(0.3, 0.4, 2.2, 16);
    // Orient cylinder horizontally along X-axis
    barrelGeo.rotateZ(-Math.PI / 2);
    barrelGeo.translate(1.1, 0, 0);

    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      metalness: 0.7,
      roughness: 0.3,
    });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    pivot.add(barrel);
    cannonGroup.add(pivot);

    cannonBarrelRef.current = pivot as any;
    scene.add(cannonGroup);

    // -------------------------------------------------------------------------
    // Target Landing Pad (Concentric rings)
    // -------------------------------------------------------------------------
    const targetGroup = new THREE.Group();
    targetGroup.position.set(targetDistance, 0.02, 0);

    // Outer ring
    const outerGeo = new THREE.RingGeometry(targetTolerance - 0.4, targetTolerance, 32);
    outerGeo.rotateX(-Math.PI / 2);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const outerRing = new THREE.Mesh(outerGeo, outerMat);
    targetGroup.add(outerRing);

    // Bullseye disk
    const centerGeo = new THREE.CircleGeometry(0.5, 32);
    centerGeo.rotateX(-Math.PI / 2);
    const centerMat = new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide });
    const centerDisk = new THREE.Mesh(centerGeo, centerMat);
    targetGroup.add(centerDisk);

    // Target vertical light beacon
    const beaconGeo = new THREE.CylinderGeometry(0.05, 0.05, 3.5, 8);
    beaconGeo.translate(0, 1.75, 0);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.5,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    targetGroup.add(beacon);

    scene.add(targetGroup);
    targetMeshRef.current = targetGroup;

    // -------------------------------------------------------------------------
    // Projectile Ball
    // -------------------------------------------------------------------------
    const ballGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.set(0, -10, 0); // Hide initially
    scene.add(ball);
    projectileBallRef.current = ball;

    // -------------------------------------------------------------------------
    // Landing Marker
    // -------------------------------------------------------------------------
    const markerGeo = new THREE.RingGeometry(0.2, 0.6, 16);
    markerGeo.rotateX(-Math.PI / 2);
    const markerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.set(0, -10, 0);
    scene.add(marker);
    landingMarkerRef.current = marker;

    // -------------------------------------------------------------------------
    // Render Loop
    // -------------------------------------------------------------------------
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 360;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      disposeThreeScene(scene, renderer);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // 2. Cannon Barrel Tilt Animation when Launch Angle Changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (cannonBarrelRef.current) {
      const angleRad = (launchAngleDeg * Math.PI) / 180;
      cannonBarrelRef.current.rotation.z = angleRad;
    }
  }, [launchAngleDeg]);

  // ---------------------------------------------------------------------------
  // 3. Update Trajectory Arc on Parameter Changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!sceneRef.current || !simResult || simResult.points.length === 0) return;

    // Remove old trajectory line if exists
    if (trajectoryLineRef.current) {
      sceneRef.current.remove(trajectoryLineRef.current);
      trajectoryLineRef.current.geometry.dispose();
      if (Array.isArray(trajectoryLineRef.current.material)) {
        trajectoryLineRef.current.material.forEach((m) => m.dispose());
      } else {
        trajectoryLineRef.current.material.dispose();
      }
      trajectoryLineRef.current = null;
    }

    const vectors = simResult.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    const lineGeo = new THREE.BufferGeometry().setFromPoints(vectors);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x818cf8,
      dashSize: 0.6,
      gapSize: 0.3,
      transparent: true,
      opacity: 0.6,
    });

    const line = new THREE.Line(lineGeo, lineMat);
    line.computeLineDistances();
    sceneRef.current.add(line);
    trajectoryLineRef.current = line;
  }, [simResult]);

  // ---------------------------------------------------------------------------
  // 4. Fire Launch Animation
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isLaunching || !simResult || simResult.points.length === 0) return;

    isAnimatingRef.current = true;
    flightProgressRef.current = 0;

    const points = simResult.points;
    const totalPoints = points.length;
    const animationDurationMs = Math.min(2200, Math.max(900, simResult.flightTime * 650));
    const startTime = performance.now();

    const stepAnimation = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / animationDurationMs);

      const pointIndex = Math.min(totalPoints - 1, Math.floor(progress * (totalPoints - 1)));
      const pt = points[pointIndex];

      if (projectileBallRef.current && pt) {
        projectileBallRef.current.position.set(pt.x, pt.y, pt.z);
      }

      if (progress < 1.0 && isAnimatingRef.current) {
        requestAnimationFrame(stepAnimation);
      } else {
        // Landed!
        isAnimatingRef.current = false;
        if (landingMarkerRef.current) {
          landingMarkerRef.current.position.set(simResult.landingDistance, 0.05, 0);
        }
        if (onLaunchComplete) {
          onLaunchComplete();
        }
      }
    };

    requestAnimationFrame(stepAnimation);

    return () => {
      isAnimatingRef.current = false;
    };
  }, [isLaunching, simResult, onLaunchComplete]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[280px] sm:h-[360px] md:h-[400px] rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0B0D14] shadow-2xl"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Trajectory Visual Overlay Indicators */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
        <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/[0.1] font-mono text-[11px] text-slate-300">
          Target: <strong className="text-emerald-400">{targetDistance}m</strong>
        </span>
        <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/[0.1] font-mono text-[11px] text-slate-300">
          Angle: <strong className="text-indigo-300">{launchAngleDeg}°</strong>
        </span>
        <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/[0.1] font-mono text-[11px] text-slate-300">
          Speed: <strong className="text-cyan-300">{velocity} m/s</strong>
        </span>
      </div>

      {/* Target Marker Pill */}
      <div className="absolute top-3 right-3 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-semibold tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>BULLSEYE ZONE (±{targetTolerance}m)</span>
        </div>
      </div>
    </div>
  );
};
