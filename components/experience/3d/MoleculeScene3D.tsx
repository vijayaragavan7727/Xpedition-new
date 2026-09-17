'use client';

/**
 * 3D Molecule Scene
 * Built with Three.js for interactive molecular construction and chemical bonding.
 *
 * Features:
 * - 3D spheres for atoms with CPK color palette (Red for Oxygen, Slate-white for Hydrogen)
 * - 3D cylinders representing covalent bonds between atoms with energetic emissive glow
 * - Interactive atom selection, drag repositioning, and bonding affordance
 * - Camera orbit rotation and wheel zoom
 * - Accessible control bar for mobile/touch/keyboard interactions
 * - Full WebGL memory disposal on unmount
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MoleculeAtomDefinition, MoleculeBond } from '@/lib/experience/types';
import { calculateBondCylinder } from '@/lib/experience/domain/moleculeRules';
import { disposeThreeScene } from '@/lib/experience/scene/threeDisposal';

interface MoleculeScene3DProps {
  atoms: MoleculeAtomDefinition[];
  bonds: MoleculeBond[];
  selectedAtomId: string | null;
  onSelectAtom: (atomId: string) => void;
  onAttemptBond: (atomAId: string, atomBId: string) => void;
  disabled?: boolean;
}

export const MoleculeScene3D: React.FC<MoleculeScene3DProps> = ({
  atoms,
  bonds,
  selectedAtomId,
  onSelectAtom,
  onAttemptBond,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const atomsGroupRef = useRef<THREE.Group | null>(null);
  const bondsGroupRef = useRef<THREE.Group | null>(null);
  const selectionRingsRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const atomMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const selectedAtomIdRef = useRef<string | null>(selectedAtomId);

  useEffect(() => {
    selectedAtomIdRef.current = selectedAtomId;
  }, [selectedAtomId]);

  // Atom positions state
  const [atomPositions, setAtomPositions] = useState<Map<string, [number, number, number]>>(() => {
    const map = new Map<string, [number, number, number]>();
    atoms.forEach((a) => map.set(a.id, [a.initialPosition[0], a.initialPosition[1], a.initialPosition[2]]));
    return map;
  });

  // Interaction tracking refs
  const isDraggingSceneRef = useRef(false);
  const draggedAtomIdRef = useRef<string | null>(null);
  const previousPointerPosRef = useRef({ x: 0, y: 0 });
  const animationFrameIdRef = useRef<number | null>(null);

  // Helper to create atom label sprite texture
  const createTextSprite = (text: string): THREE.Sprite => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.beginPath();
      ctx.arc(64, 64, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.font = 'bold 50px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, 64, 64);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.9, 0.9, 1);
    return sprite;
  };

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
    camera.position.set(0, 0, 7.5);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0c16, 1.0);
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting - Nocturne Science Lab
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    fillLight.position.set(-6, -4, 4);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xa855f7, 1.5, 12);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // Groups
    const atomsGroup = new THREE.Group();
    const bondsGroup = new THREE.Group();
    scene.add(atomsGroup);
    scene.add(bondsGroup);
    atomsGroupRef.current = atomsGroup;
    bondsGroupRef.current = bondsGroup;

    // Build Atoms
    selectionRingsRef.current.clear();
    atomMeshesRef.current.clear();

    atoms.forEach((atom) => {
      const atomGroup = new THREE.Group();
      atomGroup.name = `atomGroup_${atom.id}`;
      const pos = atomPositions.get(atom.id) || atom.initialPosition;
      atomGroup.position.set(pos[0], pos[1], pos[2]);

      // Atom sphere
      const sphereGeo = new THREE.SphereGeometry(atom.radius, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: atom.colorHex,
        roughness: 0.25,
        metalness: 0.1,
        emissive: atom.colorHex,
        emissiveIntensity: 0.15,
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.userData = { atomId: atom.id };
      atomGroup.add(sphereMesh);
      atomMeshesRef.current.set(atom.id, sphereMesh);

      // Symbol sprite
      const label = createTextSprite(atom.elementSymbol);
      label.position.set(0, 0, atom.radius + 0.15);
      atomGroup.add(label);

      // Selection indicator ring
      const ringGeo = new THREE.RingGeometry(atom.radius + 0.15, atom.radius + 0.28, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      atomGroup.add(ringMesh);
      selectionRingsRef.current.set(atom.id, ringMesh);

      atomsGroup.add(atomGroup);
    });

    // Subtle space grid/reticle
    const gridHelper = new THREE.GridHelper(10, 10, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -2.5;
    scene.add(gridHelper);

    // Animation Loop
    let frame = 0;
    const animate = () => {
      frame++;
      animationFrameIdRef.current = requestAnimationFrame(animate);

      // Pulse selection ring if active
      selectionRingsRef.current.forEach((ring, id) => {
        if (id === selectedAtomIdRef.current) {
          const pulse = 0.6 + Math.sin(frame * 0.1) * 0.35;
          (ring.material as THREE.MeshBasicMaterial).opacity = pulse;
          ring.rotation.z += 0.02;
        } else {
          (ring.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const selRings = selectionRingsRef.current;
    const meshes = atomMeshesRef.current;

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      disposeThreeScene(scene, renderer);
      selRings.clear();
      meshes.clear();
    };
  }, []); // Run once on mount

  // Update Atom Positions in scene when state changes
  useEffect(() => {
    if (!atomsGroupRef.current) return;
    atoms.forEach((atom) => {
      const atomGroup = atomsGroupRef.current?.getObjectByName(`atomGroup_${atom.id}`);
      const pos = atomPositions.get(atom.id);
      if (atomGroup && pos) {
        atomGroup.position.set(pos[0], pos[1], pos[2]);
      }
    });
  }, [atomPositions, atoms]);

  // Update 3D Covalent Bonds Cylinders whenever bonds change
  useEffect(() => {
    const bondsGroup = bondsGroupRef.current;
    if (!bondsGroup) return;

    // Clear previous bonds
    while (bondsGroup.children.length > 0) {
      const child = bondsGroup.children[0];
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
      bondsGroup.remove(child);
    }

    // Build cylinders for active bonds
    bonds.forEach((bond) => {
      const posA = atomPositions.get(bond.fromAtomId);
      const posB = atomPositions.get(bond.toAtomId);
      if (!posA || !posB) return;

      const { midpoint, length, direction } = calculateBondCylinder(posA, posB);

      const cylinderGeo = new THREE.CylinderGeometry(0.12, 0.12, length, 16);
      const cylinderMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.9,
        roughness: 0.2,
        metalness: 0.3,
      });

      const cylinderMesh = new THREE.Mesh(cylinderGeo, cylinderMat);
      cylinderMesh.position.set(midpoint[0], midpoint[1], midpoint[2]);

      // Orient cylinder towards direction vector (default cylinder is aligned with Y-axis)
      const defaultY = new THREE.Vector3(0, 1, 0);
      const targetDir = new THREE.Vector3(direction[0], direction[1], direction[2]);
      cylinderMesh.quaternion.setFromUnitVectors(defaultY, targetDir);

      bondsGroup.add(cylinderMesh);
    });
  }, [bonds, atomPositions]);

  // Pointer Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || !containerRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const meshes = Array.from(atomMeshesRef.current.values());
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const clickedAtomId = intersects[0].object.userData.atomId;
      if (clickedAtomId) {
        if (!selectedAtomId) {
          onSelectAtom(clickedAtomId);
        } else if (selectedAtomId === clickedAtomId) {
          // Deselect if clicking the same atom
          onSelectAtom('');
        } else {
          // Attempt bond between selectedAtomId and clickedAtomId
          onAttemptBond(selectedAtomId, clickedAtomId);
        }
        draggedAtomIdRef.current = clickedAtomId;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
    }

    // Otherwise dragging scene background
    isDraggingSceneRef.current = true;
    previousPointerPosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (disabled) return;

    // 1. Dragging individual atom in XY plane
    if (draggedAtomIdRef.current && containerRef.current && cameraRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Project onto Z=0 plane at camera distance
      const vec = new THREE.Vector3(x, y, 0.5);
      vec.unproject(cameraRef.current);
      vec.sub(cameraRef.current.position).normalize();
      const distance = -cameraRef.current.position.z / vec.z;
      const targetPos = cameraRef.current.position.clone().add(vec.multiplyScalar(distance));

      // Clamp target within workspace
      const clampedX = Math.max(-3.5, Math.min(3.5, targetPos.x));
      const clampedY = Math.max(-2.5, Math.min(2.5, targetPos.y));

      setAtomPositions((prev) => {
        const next = new Map(prev);
        next.set(draggedAtomIdRef.current!, [clampedX, clampedY, 0]);
        return next;
      });
      return;
    }

    // 2. Rotating entire scene
    if (isDraggingSceneRef.current && sceneRef.current) {
      const deltaX = e.clientX - previousPointerPosRef.current.x;
      const deltaY = e.clientY - previousPointerPosRef.current.y;
      previousPointerPosRef.current = { x: e.clientX, y: e.clientY };

      sceneRef.current.rotation.y += deltaX * 0.006;
      sceneRef.current.rotation.x += deltaY * 0.006;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingSceneRef.current = false;
    draggedAtomIdRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!cameraRef.current || disabled) return;
    const zoomDelta = e.deltaY * 0.005;
    cameraRef.current.position.z = Math.min(Math.max(cameraRef.current.position.z + zoomDelta, 4.0), 11.0);
  };

  const resetCamera = () => {
    if (sceneRef.current) {
      sceneRef.current.rotation.set(0, 0, 0);
    }
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 7.5);
    }
    const map = new Map<string, [number, number, number]>();
    atoms.forEach((a) => map.set(a.id, [a.initialPosition[0], a.initialPosition[1], a.initialPosition[2]]));
    setAtomPositions(map);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center select-none overflow-hidden rounded-2xl bg-slate-950/90 border border-slate-800 shadow-2xl">
      {/* 3D Canvas */}
      <div
        ref={containerRef}
        className="w-full h-[450px] cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        aria-label="3D Molecular Bonding Workspace. Click an atom to select, click a partner to form a bond."
      />

      {/* Real-time HUD Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-lg font-mono text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-200">
            {selectedAtomId
              ? `Selected: ${atoms.find((a) => a.id === selectedAtomId)?.elementName}`
              : 'Click atom to start bonding'}
          </span>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-lg font-mono text-xs">
          <span className="text-slate-400 mr-2">BONDS:</span>
          <span className="font-bold text-cyan-300">
            {bonds.length} / {atoms.length - 1} target
          </span>
        </div>
      </div>

      {/* Accessible Atom Selector & Quick Bond Controls */}
      <div className="w-full p-4 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider mr-1">
            Atoms:
          </span>
          {atoms.map((atom) => {
            const isSelected = selectedAtomId === atom.id;
            const currentBonds = bonds.filter(
              (b) => b.fromAtomId === atom.id || b.toAtomId === atom.id
            ).length;

            return (
              <button
                key={atom.id}
                onClick={() => {
                  if (!selectedAtomId) {
                    onSelectAtom(atom.id);
                  } else if (selectedAtomId === atom.id) {
                    onSelectAtom('');
                  } else {
                    onAttemptBond(selectedAtomId, atom.id);
                  }
                }}
                disabled={disabled}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-medium border transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_#38bdf8]'
                    : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
                }`}
                title={`Select ${atom.elementName}`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: atom.elementSymbol === 'O' ? '#ef4444' : '#e2e8f0',
                  }}
                />
                <span>{atom.elementName}</span>
                <span className="text-[10px] text-slate-400">
                  ({currentBonds}/{atom.maxBonds})
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={resetCamera}
          disabled={disabled}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset View
        </button>
      </div>
    </div>
  );
};
