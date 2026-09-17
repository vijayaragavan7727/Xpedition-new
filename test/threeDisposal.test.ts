import assert from 'assert';
import * as THREE from 'three';
import { disposeMaterial, disposeObject3D, disposeThreeScene } from '../lib/experience/scene/threeDisposal';

export async function runThreeDisposalTests(): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;

  function it(name: string, fn: () => void | Promise<void>) {
    try {
      const res = fn();
      if (res && typeof (res as any).then === 'function') {
        return (res as any)
          .then(() => {
            passed++;
            console.log(`  ✓ ${name}`);
          })
          .catch((err: any) => {
            failed++;
            console.error(`  ✗ ${name}:`, err.message || err);
          });
      } else {
        passed++;
        console.log(`  ✓ ${name}`);
      }
    } catch (err: any) {
      failed++;
      console.error(`  ✗ ${name}:`, err.message || err);
    }
  }

  console.log('\n--- Three.js WebGL Resource Disposal Tests ---');

  it('safely disposes individual and array materials with textures', () => {
    let textureDisposed = false;
    let matDisposed = false;

    const texture = new THREE.Texture();
    texture.dispose = () => {
      textureDisposed = true;
    };

    const material = new THREE.MeshBasicMaterial({ map: texture });
    material.dispose = () => {
      matDisposed = true;
    };

    disposeMaterial(material);

    assert.strictEqual(textureDisposed, true, 'Texture must be disposed');
    assert.strictEqual(matDisposed, true, 'Material must be disposed');
  });

  it('safely disposes scene hierarchy and geometries', () => {
    const scene = new THREE.Scene();
    const geom = new THREE.BoxGeometry();
    let geomDisposed = false;
    geom.dispose = () => {
      geomDisposed = true;
    };

    const mat = new THREE.MeshStandardMaterial();
    let matDisposed = false;
    mat.dispose = () => {
      matDisposed = true;
    };

    const mesh = new THREE.Mesh(geom, mat);
    scene.add(mesh);

    assert.strictEqual(scene.children.length, 1);
    disposeThreeScene(scene, null);

    assert.strictEqual(geomDisposed, true, 'Geometry must be disposed');
    assert.strictEqual(matDisposed, true, 'Material must be disposed');
    assert.strictEqual(scene.children.length, 0, 'Scene children must be cleared');
  });

  it('safely handles null or undefined scenes and renderers without throwing', () => {
    assert.doesNotThrow(() => disposeThreeScene(null, null));
    assert.doesNotThrow(() => disposeThreeScene(undefined, undefined));
  });

  it('handles renderer context loss and DOM detachment safely', () => {
    let contextLost = false;
    let rendererDisposed = false;

    const mockRenderer: any = {
      forceContextLoss: () => {
        contextLost = true;
      },
      dispose: () => {
        rendererDisposed = true;
      },
      domElement: {
        parentNode: null,
      },
    };

    assert.doesNotThrow(() => disposeThreeScene(null, mockRenderer));
    assert.strictEqual(contextLost, true);
    assert.strictEqual(rendererDisposed, true);
  });

  return { passed, failed };
}
