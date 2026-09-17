'use client';

/**
 * 3D Human Heart Anatomy Explorer Scene
 *
 * Procedural 3D anatomical heart visualization built with Three.js.
 * Displays chambers, valves, and major vessels with educational clarity,
 * interactive raycasting selection, gentle systolic pulsation, and animated blood flow particles.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { HEART_STRUCTURES } from '@/lib/experience/catalog/heartAnatomyConfig';
import { HeartStructureDefinition, CANONICAL_BLOOD_FLOW_PATH } from '@/lib/experience/domain/heartAnatomyRules';
import { Eye, RotateCcw, ZoomIn, ZoomOut, Activity } from 'lucide-react';
import { disposeThreeScene } from '@/lib/experience/scene/threeDisposal';

interface HeartAnatomyScene3DProps {
  selectedStructureId?: string;
  onSelectStructure: (structure: HeartStructureDefinition) => void;
  isFlowModeActive?: boolean;
  currentFlowStepIndex?: number;
  onRotate?: (eulerDeg: [number, number, number]) => void;
}

export const HeartAnatomyScene3D: React.FC<HeartAnatomyScene3DProps> = ({
  selectedStructureId,
  onSelectStructure,
  isFlowModeActive = false,
  currentFlowStepIndex = 0,
  onRotate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const heartGroupRef = useRef<THREE.Group | null>(null);
  const flowParticlesRef = useRef<THREE.Points | null>(null);
  const structureMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const highlightRingRef = useRef<THREE.Mesh | null>(null);

  // Interaction tracking
  const isDraggingRef = useRef(false);
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const animationFrameIdRef = useRef<number | null>(null);
  const pulseClockRef = useRef(0);
  const [hoveredStructure, setHoveredStructure] = useState<HeartStructureDefinition | null>(null);

  // Initialize Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 450;

    // 1. Scene & Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b0d17');
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 8.5);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight('#2d3748', 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('#ffffff', 1.6);
    keyLight.position.set(5, 8, 7);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight('#38bdf8', 0.8);
    fillLight.position.set(-6, -2, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight('#f43f5e', 0.6);
    rimLight.position.set(0, -6, -5);
    scene.add(rimLight);

    // 5. Heart Container Group
    const heartGroup = new THREE.Group();
    scene.add(heartGroup);
    heartGroupRef.current = heartGroup;

    // Build procedural stylized anatomical components
    buildProceduralHeart(heartGroup, structureMeshesRef.current);

    // Build highlight selection indicator
    const ringGeo = new THREE.TorusGeometry(0.7, 0.05, 16, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.visible = false;
    heartGroup.add(ringMesh);
    highlightRingRef.current = ringMesh;

    // Build Blood Flow Particles
    const flowPoints = buildFlowParticles();
    heartGroup.add(flowPoints);
    flowParticlesRef.current = flowPoints;

    // 6. Animation Loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      pulseClockRef.current += 0.035;

      // Gentle realistic systolic pulsation (sinusoidal subtle scale)
      if (heartGroupRef.current) {
        const pulse = 1.0 + Math.sin(pulseClockRef.current) * 0.015;
        heartGroupRef.current.scale.set(pulse, pulse, pulse);
      }

      // Animate blood flow particles along pathway
      if (flowParticlesRef.current && flowParticlesRef.current.visible) {
        const positions = flowParticlesRef.current.geometry.attributes.position.array as Float32Array;
        const count = positions.length / 3;
        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          // Slowly advance along flow path
          positions[idx + 1] += (Math.sin(pulseClockRef.current + i) * 0.005);
        }
        flowParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      disposeThreeScene(sceneRef.current, rendererRef.current);
    };
  }, []);

  // Update selection ring position when selectedStructureId changes
  useEffect(() => {
    if (!highlightRingRef.current) return;

    if (selectedStructureId) {
      const struct = HEART_STRUCTURES.find((s) => s.id === selectedStructureId);
      if (struct) {
        highlightRingRef.current.position.set(...struct.position3D);
        highlightRingRef.current.lookAt(0, 0, 8.5);
        highlightRingRef.current.visible = true;
        return;
      }
    }

    highlightRingRef.current.visible = false;
  }, [selectedStructureId]);

  // Update flow mode visibility
  useEffect(() => {
    if (flowParticlesRef.current) {
      flowParticlesRef.current.visible = isFlowModeActive;
    }
  }, [isFlowModeActive]);

  // ---------------------------------------------------------------------------
  // Pointer & Drag Interaction Handlers
  // ---------------------------------------------------------------------------

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    pointerPosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !heartGroupRef.current) {
      // Raycast hover check when not dragging
      performRaycast(e.clientX, e.clientY, false);
      return;
    }

    const deltaX = e.clientX - pointerPosRef.current.x;
    const deltaY = e.clientY - pointerPosRef.current.y;
    pointerPosRef.current = { x: e.clientX, y: e.clientY };

    heartGroupRef.current.rotation.y += deltaX * 0.008;
    heartGroupRef.current.rotation.x += deltaY * 0.008;

    if (onRotate) {
      const degX = Math.round((heartGroupRef.current.rotation.x * 180) / Math.PI);
      const degY = Math.round((heartGroupRef.current.rotation.y * 180) / Math.PI);
      const degZ = Math.round((heartGroupRef.current.rotation.z * 180) / Math.PI);
      onRotate([degX, degY, degZ]);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    performRaycast(e.clientX, e.clientY, true);
  };

  const performRaycast = (clientX: number, clientY: number, select: boolean) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const meshes = Array.from(structureMeshesRef.current.values());
    const intersects = raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      const structId = hitMesh.userData.structureId;
      const matched = HEART_STRUCTURES.find((s) => s.id === structId);

      if (matched) {
        if (select) {
          onSelectStructure(matched);
        } else {
          setHoveredStructure(matched);
        }
        return;
      }
    }

    if (!select) {
      setHoveredStructure(null);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!cameraRef.current) return;
    const delta = e.deltaY * 0.005;
    cameraRef.current.position.z = Math.max(4.5, Math.min(13.0, cameraRef.current.position.z + delta));
  };

  const handleResetCamera = () => {
    if (heartGroupRef.current) {
      heartGroupRef.current.rotation.set(0, 0, 0);
    }
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0.5, 8.5);
    }
    if (onRotate) onRotate([0, 0, 0]);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current) return;
    const delta = direction === 'in' ? -1.2 : 1.2;
    cameraRef.current.position.z = Math.max(4.5, Math.min(13.0, cameraRef.current.position.z + delta));
  };

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] rounded-2xl bg-gradient-to-b from-[#0e1222] via-[#090b14] to-[#06080d] border border-line/60 overflow-hidden select-none">
      {/* 3D WebGL Canvas Mount */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        aria-label="3D Human Heart Anatomy Interactive Explorer Canvas"
      />

      {/* Floating Hover Card */}
      {hoveredStructure && (
        <div className="absolute top-4 left-4 pointer-events-none bg-ink/90 backdrop-blur-md border border-line/70 px-3 py-2 rounded-xl text-left shadow-lg max-w-[240px]">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: hoveredStructure.colorHex }}
            />
            <span className="font-sans font-bold text-xs text-text">{hoveredStructure.name}</span>
          </div>
          <p className="font-mono text-[10px] text-muted uppercase mt-0.5">
            {hoveredStructure.category} • {hoveredStructure.bloodType} blood
          </p>
        </div>
      )}

      {/* Flow Mode Status Pill */}
      {isFlowModeActive && (
        <div className="absolute top-4 right-4 bg-cyan-950/80 backdrop-blur-md border border-cyan-500/40 px-3 py-1.5 rounded-full flex items-center gap-2 text-cyan-300 font-mono text-xs shadow-lg">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Blood Flow: Step {currentFlowStepIndex + 1}/12</span>
        </div>
      )}

      {/* Canvas View Controls Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-ink/80 backdrop-blur-xl border border-line/60 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-2xl">
        <button
          type="button"
          onClick={() => handleZoom('in')}
          aria-label="Zoom In"
          className="p-2 rounded-full hover:bg-white/10 text-muted hover:text-text transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom('out')}
          aria-label="Zoom Out"
          className="p-2 rounded-full hover:bg-white/10 text-muted hover:text-text transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-line" />
        <button
          type="button"
          onClick={handleResetCamera}
          aria-label="Reset View"
          className="p-2 rounded-full hover:bg-white/10 text-muted hover:text-text transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Procedural Stylized Educational Heart Model Builder
// ---------------------------------------------------------------------------

function buildProceduralHeart(group: THREE.Group, meshMap: Map<string, THREE.Mesh>) {
  // Common material factory with medical aesthetic (subsurface sheen, emissive hint)
  const createMaterial = (colorHex: string, roughness = 0.35, metalness = 0.1) => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness,
      metalness,
      flatShading: false,
    });
  };

  // 1. Right Atrium (smooth rounded spheroid chamber)
  const raGeo = new THREE.SphereGeometry(1.0, 32, 24);
  raGeo.scale(1.1, 1.2, 0.9);
  const raMat = createMaterial('#3b82f6');
  const raMesh = new THREE.Mesh(raGeo, raMat);
  raMesh.position.set(-1.4, 0.8, 0.5);
  raMesh.userData.structureId = 'right_atrium';
  group.add(raMesh);
  meshMap.set('right_atrium', raMesh);

  // 2. Right Ventricle (anterior lower chamber, slightly conical)
  const rvGeo = new THREE.SphereGeometry(1.2, 32, 24);
  rvGeo.scale(1.0, 1.3, 1.0);
  const rvMat = createMaterial('#2563eb');
  const rvMesh = new THREE.Mesh(rvGeo, rvMat);
  rvMesh.position.set(-0.8, -1.2, 0.8);
  rvMesh.rotation.z = 0.15;
  rvMesh.userData.structureId = 'right_ventricle';
  group.add(rvMesh);
  meshMap.set('right_ventricle', rvMesh);

  // 3. Left Atrium (posterior upper chamber)
  const laGeo = new THREE.SphereGeometry(1.0, 32, 24);
  laGeo.scale(1.0, 1.1, 0.9);
  const laMat = createMaterial('#ef4444');
  const laMesh = new THREE.Mesh(laGeo, laMat);
  laMesh.position.set(1.3, 0.8, -0.2);
  laMesh.userData.structureId = 'left_atrium';
  group.add(laMesh);
  meshMap.set('left_atrium', laMesh);

  // 4. Left Ventricle (thick muscular apex chamber)
  const lvGeo = new THREE.SphereGeometry(1.35, 32, 24);
  lvGeo.scale(1.1, 1.5, 1.0);
  const lvMat = createMaterial('#dc2626');
  const lvMesh = new THREE.Mesh(lvGeo, lvMat);
  lvMesh.position.set(0.8, -1.3, 0.2);
  lvMesh.rotation.z = -0.25;
  lvMesh.userData.structureId = 'left_ventricle';
  group.add(lvMesh);
  meshMap.set('left_ventricle', lvMesh);

  // 5. Interventricular Septum (central dividing ridge)
  const septumGeo = new THREE.BoxGeometry(0.35, 2.5, 1.6);
  const septumMat = createMaterial('#7f1d1d', 0.5);
  const septumMesh = new THREE.Mesh(septumGeo, septumMat);
  septumMesh.position.set(0.0, -1.2, 0.5);
  septumMesh.rotation.y = 0.2;
  group.add(septumMesh);

  // 6. Tricuspid Valve (tri-flap annular disc)
  const triGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.1, 24);
  const triMat = createMaterial('#93c5fd', 0.2, 0.4);
  triMat.emissive = new THREE.Color('#38bdf8');
  triMat.emissiveIntensity = 0.3;
  const triMesh = new THREE.Mesh(triGeo, triMat);
  triMesh.position.set(-1.0, 0.0, 0.7);
  triMesh.rotation.x = Math.PI / 4;
  triMesh.userData.structureId = 'tricuspid_valve';
  group.add(triMesh);
  meshMap.set('tricuspid_valve', triMesh);

  // 7. Pulmonary Valve (semilunar disc at base of pulmonary artery)
  const pvGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 24);
  const pvMat = createMaterial('#38bdf8', 0.2, 0.4);
  pvMat.emissive = new THREE.Color('#0284c7');
  pvMat.emissiveIntensity = 0.4;
  const pvMesh = new THREE.Mesh(pvGeo, pvMat);
  pvMesh.position.set(-0.3, 0.5, 0.9);
  pvMesh.rotation.x = Math.PI / 6;
  pvMesh.userData.structureId = 'pulmonary_valve';
  group.add(pvMesh);
  meshMap.set('pulmonary_valve', pvMesh);

  // 8. Mitral Valve (bi-flap annular disc)
  const mvGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.1, 24);
  const mvMat = createMaterial('#fca5a5', 0.2, 0.4);
  mvMat.emissive = new THREE.Color('#f43f5e');
  mvMat.emissiveIntensity = 0.3;
  const mvMesh = new THREE.Mesh(mvGeo, mvMat);
  mvMesh.position.set(0.9, 0.0, 0.4);
  mvMesh.rotation.x = Math.PI / 4;
  mvMesh.userData.structureId = 'mitral_valve';
  group.add(mvMesh);
  meshMap.set('mitral_valve', mvMesh);

  // 9. Aortic Valve (semilunar disc at base of aorta)
  const avGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 24);
  const avMat = createMaterial('#fb7185', 0.2, 0.4);
  avMat.emissive = new THREE.Color('#e11d48');
  avMat.emissiveIntensity = 0.4;
  const avMesh = new THREE.Mesh(avGeo, avMat);
  avMesh.position.set(0.2, 0.4, 0.3);
  avMesh.rotation.x = -Math.PI / 8;
  avMesh.userData.structureId = 'aortic_valve';
  group.add(avMesh);
  meshMap.set('aortic_valve', avMesh);

  // 10. Superior & Inferior Vena Cava (vertical venous trunk)
  const vcCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.6, 2.5, -0.4),
    new THREE.Vector3(-1.5, 1.2, -0.1),
    new THREE.Vector3(-1.4, -0.5, -0.3),
  ]);
  const vcGeo = new THREE.TubeGeometry(vcCurve, 20, 0.38, 16, false);
  const vcMat = createMaterial('#1d4ed8');
  const vcMesh = new THREE.Mesh(vcGeo, vcMat);
  vcMesh.userData.structureId = 'vena_cava';
  group.add(vcMesh);
  meshMap.set('vena_cava', vcMesh);

  // 11. Pulmonary Artery Trunk (curving anteriorly over aorta)
  const paCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.3, 0.5, 0.9),
    new THREE.Vector3(-0.1, 1.3, 0.8),
    new THREE.Vector3(0.0, 2.0, 0.6),
  ]);
  const paGeo = new THREE.TubeGeometry(paCurve, 20, 0.35, 16, false);
  const paMat = createMaterial('#0284c7');
  const paMesh = new THREE.Mesh(paGeo, paMat);
  paMesh.userData.structureId = 'pulmonary_artery';
  group.add(paMesh);
  meshMap.set('pulmonary_artery', paMesh);

  // 12. Pulmonary Veins (dual tubes entering left atrium)
  const pvCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(2.2, 1.4, -0.8),
    new THREE.Vector3(1.8, 1.2, -0.6),
    new THREE.Vector3(1.4, 0.9, -0.3),
  ]);
  const pveinsGeo = new THREE.TubeGeometry(pvCurve, 16, 0.28, 14, false);
  const pveinsMat = createMaterial('#ef4444');
  const pveinsMesh = new THREE.Mesh(pveinsGeo, pveinsMat);
  pveinsMesh.userData.structureId = 'pulmonary_veins';
  group.add(pveinsMesh);
  meshMap.set('pulmonary_veins', pveinsMesh);

  // 13. Aortic Arch (curving systemic trunk)
  const aortaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.2, 0.4, 0.3),
    new THREE.Vector3(0.1, 1.5, 0.4),
    new THREE.Vector3(0.3, 2.4, 0.1),
    new THREE.Vector3(0.8, 2.7, -0.2),
    new THREE.Vector3(1.1, 1.8, -0.5),
  ]);
  const aortaGeo = new THREE.TubeGeometry(aortaCurve, 32, 0.42, 18, false);
  const aortaMat = createMaterial('#b91c1c');
  const aortaMesh = new THREE.Mesh(aortaGeo, aortaMat);
  aortaMesh.userData.structureId = 'aorta';
  group.add(aortaMesh);
  meshMap.set('aorta', aortaMesh);
}

// ---------------------------------------------------------------------------
// Animated Blood Flow Particle System
// ---------------------------------------------------------------------------

function buildFlowParticles(): THREE.Points {
  // Key control waypoint coordinates along canonical blood flow path
  const flowWaypoints: THREE.Vector3[] = [
    new THREE.Vector3(-1.6, 2.2, -0.4), // Vena Cava
    new THREE.Vector3(-1.4, 0.8, 0.5),  // Right Atrium
    new THREE.Vector3(-1.0, 0.0, 0.7),  // Tricuspid Valve
    new THREE.Vector3(-0.8, -1.2, 0.8), // Right Ventricle
    new THREE.Vector3(-0.3, 0.5, 0.9),  // Pulmonary Valve
    new THREE.Vector3(0.0, 1.8, 0.6),   // Pulmonary Artery
    new THREE.Vector3(1.8, 1.2, -0.6),  // Pulmonary Veins
    new THREE.Vector3(1.3, 0.8, -0.2),  // Left Atrium
    new THREE.Vector3(0.9, 0.0, 0.4),   // Mitral Valve
    new THREE.Vector3(0.8, -1.3, 0.2),  // Left Ventricle
    new THREE.Vector3(0.2, 0.4, 0.3),   // Aortic Valve
    new THREE.Vector3(0.8, 2.7, -0.2),  // Aorta
  ];

  const curve = new THREE.CatmullRomCurve3(flowWaypoints);
  const particleCount = 120;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const t = i / particleCount;
    const point = curve.getPoint(t);
    positions[i * 3] = point.x + (Math.random() - 0.5) * 0.15;
    positions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.15;
    positions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.15;

    // Blue for deoxygenated first half, Red for oxygenated second half
    if (t < 0.5) {
      colors[i * 3] = 0.2;     // R
      colors[i * 3 + 1] = 0.6; // G
      colors[i * 3 + 2] = 1.0; // B
    } else {
      colors[i * 3] = 1.0;     // R
      colors[i * 3 + 1] = 0.2; // G
      colors[i * 3 + 2] = 0.3; // B
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.14,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.visible = false;
  return points;
}
