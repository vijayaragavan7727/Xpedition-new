'use client';

/**
 * Universal 3D Scene Visualizer Component
 *
 * Declarative, high-performance Three.js renderer capable of displaying
 * any procedural UniversalSceneDefinition.
 *
 * Features:
 * - Geometric primitives (box, sphere, cylinder, capsule, arrow, orbit, particles)
 * - Orbit interaction (rotate, zoom, pan) with full touch support
 * - Object raycasting selection and hover highlights
 * - Real-time parameter updates without scene recreation
 * - Clean resource disposal (geometries, materials, render targets)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { UniversalSceneDefinition, SceneObjectDefinition } from '@/lib/experience/scene/sceneDefinition';
import { RotateCcw, ZoomIn, ZoomOut, Eye, Sparkles, Layers } from 'lucide-react';
import { disposeThreeScene } from '@/lib/experience/scene/threeDisposal';

interface UniversalSceneVisualizer3DProps {
  sceneDefinition: UniversalSceneDefinition;
  parameterValues: Record<string, any>;
  selectedObjectId?: string;
  onSelectObject: (object: SceneObjectDefinition) => void;
  className?: string;
}

export const UniversalSceneVisualizer3D: React.FC<UniversalSceneVisualizer3DProps> = ({
  sceneDefinition,
  parameterValues,
  selectedObjectId,
  onSelectObject,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshMapRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const animationFrameIdRef = useRef<number | null>(null);
  const clockRef = useRef(new THREE.Clock());

  // Interaction State
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const sphericalRef = useRef(new THREE.Spherical(8, Math.PI / 3, Math.PI / 4));
  const [hoveredObject, setHoveredObject] = useState<SceneObjectDefinition | null>(null);

  // 1. Initialize Scene & Three.js Context
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 450;

    // A. Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(sceneDefinition.backgroundColor || '#07090e');
    sceneRef.current = scene;

    // B. Create Camera
    const camCfg = sceneDefinition.camera;
    const camera = new THREE.PerspectiveCamera(camCfg.fov || 50, width / height, 0.1, 100);
    const initPos = camCfg.initialPosition || [0, 4, 8];
    const lookAt = camCfg.lookAt || [0, 0, 0];
    camera.position.set(initPos[0], initPos[1], initPos[2]);
    camera.lookAt(new THREE.Vector3(lookAt[0], lookAt[1], lookAt[2]));
    cameraTargetRef.current.set(lookAt[0], lookAt[1], lookAt[2]);
    cameraRef.current = camera;

    // Calculate initial spherical coordinates for orbit
    const offset = new THREE.Vector3().subVectors(camera.position, cameraTargetRef.current);
    sphericalRef.current.setFromVector3(offset);

    // C. Create Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // D. Lighting
    const lightCfg = sceneDefinition.lighting;
    const ambientLight = new THREE.AmbientLight(
      lightCfg.ambientColor || '#ffffff',
      lightCfg.ambientIntensity ?? 0.7
    );
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(
      lightCfg.directionalColor || '#00f5ff',
      lightCfg.directionalIntensity ?? 1.2
    );
    const dirPos = lightCfg.directionalPosition || [5, 10, 5];
    dirLight.position.set(dirPos[0], dirPos[1], dirPos[2]);
    scene.add(dirLight);

    // E. Ground Grid (if enabled)
    if (sceneDefinition.showGroundGrid !== false) {
      const gridSize = sceneDefinition.groundGridSize || 12;
      const gridHelper = new THREE.GridHelper(gridSize, gridSize, 0x00f5ff, 0x1f293d);
      gridHelper.position.y = -0.2;
      scene.add(gridHelper);
    }

    // F. Construct Meshes from SceneObjects
    const meshes = new Map<string, THREE.Object3D>();

    sceneDefinition.objects.forEach((objDef) => {
      const mesh = createMeshForObject(objDef);
      if (mesh) {
        mesh.name = objDef.id;
        scene.add(mesh);
        meshes.set(objDef.id, mesh);
      }
    });

    // G. Construct Relationship Lines / Connectors
    sceneDefinition.relationships.forEach((rel) => {
      const src = sceneDefinition.objects.find((o) => o.id === rel.sourceObjectId);
      const tgt = sceneDefinition.objects.find((o) => o.id === rel.targetObjectId);

      if (src && tgt) {
        const points = [
          new THREE.Vector3(...src.position),
          new THREE.Vector3(...tgt.position),
        ];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({
          color: rel.color ? new THREE.Color(rel.color) : 0x00f5ff,
          transparent: true,
          opacity: 0.6,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        scene.add(line);
      }
    });

    meshMapRef.current = meshes;

    // H. Animation Loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      const elapsed = clockRef.current.getElapsedTime();

      // Execute Declarative Animations
      sceneDefinition.animations.forEach((anim) => {
        const targetMesh = meshes.get(anim.targetObjectId);
        if (!targetMesh) return;

        if (anim.type === 'pulse') {
          const s = 1.0 + Math.sin(elapsed * anim.speed) * ((anim.maxScale ?? 1.1) - (anim.minScale ?? 0.9)) * 0.5;
          targetMesh.scale.set(s, s, s);
        } else if (anim.type === 'rotate') {
          targetMesh.rotation.y = elapsed * anim.speed;
        } else if (anim.type === 'orbit') {
          const r = anim.radius ?? 3;
          const speed = anim.speed;
          targetMesh.position.x = Math.cos(elapsed * speed) * r;
          targetMesh.position.z = Math.sin(elapsed * speed) * r;
        }
      });

      renderer.render(scene, camera);
    };

    clockRef.current.start();
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      disposeThreeScene(scene, renderer);
    };
  }, [sceneDefinition]);

  // 2. Dynamic Parameter Updates
  useEffect(() => {
    const meshes = meshMapRef.current;
    if (!meshes || meshes.size === 0) return;

    // Newton's Laws parameter binding
    if (sceneDefinition.topicId === 'newtons_laws') {
      const force = Number(parameterValues.appliedForce ?? 20);
      const mass = Number(parameterValues.cartMass ?? 5);
      const accel = force / mass;

      const forceArrow = meshes.get('force_arrow');
      if (forceArrow) {
        forceArrow.scale.x = Math.max(0.5, (force / 20) * 1.8);
      }
      const cart = meshes.get('cart_body');
      if (cart) {
        const massScale = 0.8 + (mass / 10) * 0.4;
        cart.scale.set(1.8 * massScale, 0.8 * massScale, 1.2 * massScale);
      }
    }

    // Photosynthesis parameter binding
    if (sceneDefinition.topicId === 'photosynthesis') {
      const light = Number(parameterValues.lightIntensity ?? 80);
      const sunlight = meshes.get('sunlight_rays');
      if (sunlight) {
        sunlight.scale.set(1, Math.max(0.2, light / 80), 1);
      }
    }

    // Electric circuits parameter binding
    if (sceneDefinition.topicId === 'electric_circuits') {
      const voltage = Number(parameterValues.voltage ?? 12);
      const resistance = Number(parameterValues.resistance ?? 10);
      const isClosed = parameterValues.isSwitchClosed !== false;
      const current = isClosed ? voltage / resistance : 0;

      const bulb = meshes.get('light_bulb');
      if (bulb && (bulb as THREE.Mesh).material) {
        const mat = (bulb as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = isClosed ? Math.min(2.0, (current / 1.2) * 0.9) : 0.05;
      }
    }
  }, [parameterValues, sceneDefinition.topicId]);

  // 3. Pointer & Touch Orbit Controls
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingRef.current && cameraRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      sphericalRef.current.theta -= dx * 0.008;
      sphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, sphericalRef.current.phi - dy * 0.008));

      const offset = new THREE.Vector3().setFromSpherical(sphericalRef.current);
      cameraRef.current.position.copy(cameraTargetRef.current).add(offset);
      cameraRef.current.lookAt(cameraTargetRef.current);
      return;
    }

    // Raycasting Hover
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const interactableMeshes: THREE.Object3D[] = [];
    meshMapRef.current.forEach((m) => interactableMeshes.push(m));

    const hits = raycaster.intersectObjects(interactableMeshes, true);
    if (hits.length > 0) {
      let topHit: THREE.Object3D | null = hits[0].object;
      while (topHit && !meshMapRef.current.has(topHit.name) && topHit.parent) {
        topHit = topHit.parent;
      }
      if (topHit && meshMapRef.current.has(topHit.name)) {
        const found = sceneDefinition.objects.find((o) => o.id === topHit?.name);
        setHoveredObject(found || null);
        return;
      }
    }
    setHoveredObject(null);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // Check for click selection
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const interactableMeshes: THREE.Object3D[] = [];
    meshMapRef.current.forEach((m) => interactableMeshes.push(m));

    const hits = raycaster.intersectObjects(interactableMeshes, true);
    if (hits.length > 0) {
      let topHit: THREE.Object3D | null = hits[0].object;
      while (topHit && !meshMapRef.current.has(topHit.name) && topHit.parent) {
        topHit = topHit.parent;
      }
      if (topHit) {
        const found = sceneDefinition.objects.find((o) => o.id === topHit?.name);
        if (found) {
          onSelectObject(found);
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!cameraRef.current) return;
    sphericalRef.current.radius = Math.max(3, Math.min(25, sphericalRef.current.radius + e.deltaY * 0.01));
    const offset = new THREE.Vector3().setFromSpherical(sphericalRef.current);
    cameraRef.current.position.copy(cameraTargetRef.current).add(offset);
    cameraRef.current.lookAt(cameraTargetRef.current);
  };

  const resetCamera = useCallback(() => {
    if (!cameraRef.current) return;
    sphericalRef.current.set(8, Math.PI / 3, Math.PI / 4);
    const offset = new THREE.Vector3().setFromSpherical(sphericalRef.current);
    cameraRef.current.position.copy(cameraTargetRef.current).add(offset);
    cameraRef.current.lookAt(cameraTargetRef.current);
  }, []);

  const zoomIn = useCallback(() => {
    if (!cameraRef.current) return;
    sphericalRef.current.radius = Math.max(3, sphericalRef.current.radius - 1.5);
    const offset = new THREE.Vector3().setFromSpherical(sphericalRef.current);
    cameraRef.current.position.copy(cameraTargetRef.current).add(offset);
    cameraRef.current.lookAt(cameraTargetRef.current);
  }, []);

  const zoomOut = useCallback(() => {
    if (!cameraRef.current) return;
    sphericalRef.current.radius = Math.min(25, sphericalRef.current.radius + 1.5);
    const offset = new THREE.Vector3().setFromSpherical(sphericalRef.current);
    cameraRef.current.position.copy(cameraTargetRef.current).add(offset);
    cameraRef.current.lookAt(cameraTargetRef.current);
  }, []);

  return (
    <div className={`relative w-full h-[420px] md:h-[500px] rounded-2xl overflow-hidden border border-cyan-500/20 bg-[#07090e] shadow-2xl select-none ${className}`}>
      {/* Three.js Canvas Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Floating 3D Controls Strip */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 bg-slate-950/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-lg">
        <button
          onClick={zoomIn}
          title="Zoom In"
          className="p-2 text-slate-300 hover:text-cyan-400 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={zoomOut}
          title="Zoom Out"
          className="p-2 text-slate-300 hover:text-cyan-400 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetCamera}
          title="Reset Camera View"
          className="p-2 text-slate-300 hover:text-cyan-400 hover:bg-white/5 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Scene Title & Mode Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-cyan-400 font-mono text-xs font-medium">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>3D SCENE: {sceneDefinition.title}</span>
        </div>
      </div>

      {/* Hover / Selected Object Tooltip */}
      {(hoveredObject || selectedObjectId) && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-md z-10 p-3 rounded-xl bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 shadow-xl pointer-events-none transition-all">
          {(() => {
            const active = hoveredObject || sceneDefinition.objects.find((o) => o.id === selectedObjectId);
            if (!active) return null;
            return (
              <div>
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>{active.educationalLabel || active.name}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {active.educationalDescription || active.semanticMeaning}
                </p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

// Helper: Procedural Geometric Primitive Mesh Builder
function createMeshForObject(def: SceneObjectDefinition): THREE.Object3D {
  let geo: THREE.BufferGeometry;
  const s = def.scale || [1, 1, 1];

  switch (def.visualType) {
    case 'sphere':
      geo = new THREE.SphereGeometry(s[0] / 2, 32, 32);
      break;
    case 'cylinder':
      geo = new THREE.CylinderGeometry(s[0] / 2, s[2] / 2, s[1], 32);
      break;
    case 'capsule':
      geo = new THREE.CapsuleGeometry(s[0] / 2, s[1], 16, 32);
      break;
    case 'plane':
      geo = new THREE.PlaneGeometry(s[0], s[2]);
      break;
    case 'arrow': {
      const group = new THREE.Group();
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, s[0] * 0.7, 16),
        new THREE.MeshStandardMaterial({ color: def.color, metalness: 0.5 })
      );
      shaft.rotation.z = -Math.PI / 2;
      shaft.position.x = (s[0] * 0.7) / 2;

      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, s[0] * 0.3, 16),
        new THREE.MeshStandardMaterial({
          color: def.color,
          emissive: def.emissive || def.color,
          emissiveIntensity: def.emissiveIntensity ?? 0.6,
        })
      );
      tip.rotation.z = -Math.PI / 2;
      tip.position.x = s[0] * 0.85;

      group.add(shaft);
      group.add(tip);
      group.position.set(...def.position);
      if (def.rotation) group.rotation.set(...def.rotation);
      return group;
    }
    case 'box':
    default:
      geo = new THREE.BoxGeometry(s[0], s[1], s[2]);
      break;
  }

  const mat = new THREE.MeshStandardMaterial({
    color: def.color,
    emissive: def.emissive || 0x000000,
    emissiveIntensity: def.emissiveIntensity ?? 0,
    metalness: def.metalness ?? 0.3,
    roughness: def.roughness ?? 0.4,
    transparent: def.transparent ?? false,
    opacity: def.opacity ?? 1.0,
    wireframe: def.wireframe ?? false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...def.position);
  if (def.rotation) mesh.rotation.set(...def.rotation);
  return mesh;
}
