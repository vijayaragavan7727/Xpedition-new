import * as THREE from 'three';

/**
 * Safely disposes a Three.js material and any associated textures.
 */
export function disposeMaterial(material: THREE.Material | THREE.Material[] | null | undefined): void {
  if (!material) return;

  if (Array.isArray(material)) {
    material.forEach((mat) => disposeMaterial(mat));
    return;
  }

  // Dispose known textures on the material
  const matAny = material as any;
  const textureKeys = [
    'map',
    'alphaMap',
    'aoMap',
    'bumpMap',
    'displacementMap',
    'emissiveMap',
    'envMap',
    'lightMap',
    'metalnessMap',
    'normalMap',
    'roughnessMap',
  ];

  for (const key of textureKeys) {
    if (matAny[key] && typeof matAny[key].dispose === 'function') {
      try {
        matAny[key].dispose();
      } catch {
        // Safe fallback
      }
    }
  }

  try {
    material.dispose();
  } catch {
    // Safe fallback
  }
}

/**
 * Recursively disposes all geometries and materials attached to an Object3D / Scene.
 */
export function disposeObject3D(object: THREE.Object3D | null | undefined): void {
  if (!object) return;

  object.traverse((child: any) => {
    if (child.geometry && typeof child.geometry.dispose === 'function') {
      try {
        child.geometry.dispose();
      } catch {
        // Safe fallback
      }
    }

    if (child.material) {
      disposeMaterial(child.material);
    }
  });
}

/**
 * Comprehensive Three.js Scene and WebGLRenderer cleanup.
 * Disposes the entire scene graph, clears children, releases WebGL context,
 * and safely detaches the canvas element from the DOM.
 */
export function disposeThreeScene(
  scene: THREE.Scene | null | undefined,
  renderer: THREE.WebGLRenderer | null | undefined
): void {
  if (scene) {
    disposeObject3D(scene);
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }
  }

  if (renderer) {
    try {
      if (typeof renderer.forceContextLoss === 'function') {
        renderer.forceContextLoss();
      }
    } catch {
      // Safe fallback
    }

    try {
      if (typeof renderer.dispose === 'function') {
        renderer.dispose();
      }
    } catch {
      // Safe fallback
    }

    try {
      const dom = renderer.domElement;
      if (dom && dom.parentNode) {
        dom.parentNode.removeChild(dom);
      }
    } catch {
      // Safe fallback
    }
  }
}
