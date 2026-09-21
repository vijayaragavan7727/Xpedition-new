/**
 * Buddy Animation Controller
 * Procedural Three.js animation controller for Buddy companion.
 *
 * Implements:
 * - Breathing and levitation dynamics
 * - Visor color interpolation matching emotional states
 * - State-specific reactive gestures (greeting, nodding, thinking tilt, celebration spin)
 * - Strict prefers-reduced-motion safety: halts continuous motion, maintains static expressive poses.
 */

import * as THREE from 'three';
import { BuddyState, BUDDY_STATE_CONFIG } from './BuddyState';

export interface BuddyMeshNodes {
  group: THREE.Group;
  chassis: THREE.Mesh;
  visor: THREE.Mesh;
  eyesGroup: THREE.Group;
  eyeLeft: THREE.Mesh;
  eyeRight: THREE.Mesh;
  leftFin: THREE.Mesh;
  rightFin: THREE.Mesh;
  energyHalo: THREE.Mesh;
  thrustGlow: THREE.PointLight;
}

export class BuddyAnimationController {
  private currentVisorColor: THREE.Color = new THREE.Color('#38BDF8');
  private targetVisorColor: THREE.Color = new THREE.Color('#38BDF8');
  private celebrationSpin: number = 0;
  private nodOffset: number = 0;
  private tiltOffset: number = 0;

  /**
   * Updates mesh nodes based on elapsed time, delta, and active Buddy state.
   */
  public update(
    nodes: BuddyMeshNodes,
    state: BuddyState,
    deltaTime: number,
    elapsedTime: number,
    reducedMotion: boolean = false
  ): void {
    const config = BUDDY_STATE_CONFIG[state] || BUDDY_STATE_CONFIG.IDLE;
    this.targetVisorColor.set(config.visorColor);

    // 1. Smooth Visor Color Transition
    this.currentVisorColor.lerp(this.targetVisorColor, Math.min(1.0, deltaTime * 5));
    if (nodes.visor.material instanceof THREE.MeshStandardMaterial) {
      nodes.visor.material.emissive.copy(this.currentVisorColor);
      nodes.visor.material.emissiveIntensity = 0.8 + Math.sin(elapsedTime * config.pulseRate * 3) * 0.2;
    }
    if (nodes.thrustGlow) {
      nodes.thrustGlow.color.copy(this.currentVisorColor);
      nodes.thrustGlow.intensity = reducedMotion ? 1.5 : 1.5 + Math.sin(elapsedTime * 4) * 0.4;
    }

    // 2. Reduced Motion Fallback: Steady expressive posture, zero continuous loops
    if (reducedMotion) {
      nodes.group.position.y = 0;
      nodes.group.rotation.set(0, 0, 0);
      nodes.chassis.rotation.set(0, 0, 0);
      nodes.leftFin.rotation.z = -0.3;
      nodes.rightFin.rotation.z = 0.3;
      nodes.energyHalo.rotation.z = 0;

      // Apply subtle static tilt based on state
      if (state === 'THINKING') {
        nodes.chassis.rotation.z = 0.12;
      } else if (state === 'INTRODUCING') {
        nodes.leftFin.rotation.z = -0.6;
      }
      return;
    }

    // 3. Levitation Breathing Bob
    const bob = Math.sin(elapsedTime * config.pulseRate * 2.5) * config.bobAmplitude;
    nodes.group.position.y = THREE.MathUtils.lerp(nodes.group.position.y, bob, deltaTime * 8);

    // 4. Energy Halo Rotation
    if (nodes.energyHalo) {
      nodes.energyHalo.rotation.z += deltaTime * (state === 'CELEBRATING' ? 4.0 : 1.2);
    }

    // 5. Articulated Fins Dynamics
    const finSway = Math.sin(elapsedTime * 3) * 0.15;
    nodes.leftFin.rotation.z = -0.3 + finSway;
    nodes.rightFin.rotation.z = 0.3 - finSway;

    // 6. State-Specific Expressive Gestures
    switch (state) {
      case 'INTRODUCING':
        // Friendly wave posture
        nodes.leftFin.rotation.z = -0.8 + Math.sin(elapsedTime * 8) * 0.3;
        nodes.chassis.rotation.y = Math.sin(elapsedTime * 2) * 0.1;
        nodes.chassis.rotation.z = Math.sin(elapsedTime * 3) * 0.05;
        break;

      case 'EXPLAINING':
        // Gentle rhythmic nodding
        this.nodOffset = Math.sin(elapsedTime * 3) * 0.08;
        nodes.chassis.rotation.x = 0.05 + this.nodOffset;
        nodes.chassis.rotation.z = 0;
        break;

      case 'THINKING':
        // Inquisitive head tilt
        this.tiltOffset = THREE.MathUtils.lerp(this.tiltOffset, 0.18, deltaTime * 4);
        nodes.chassis.rotation.z = this.tiltOffset;
        nodes.chassis.rotation.y = Math.sin(elapsedTime * 1.5) * 0.1;
        break;

      case 'CORRECT':
        // Happy vertical jump bounce
        nodes.group.position.y += Math.abs(Math.sin(elapsedTime * 6)) * 0.15;
        nodes.leftFin.rotation.z = -0.5 + Math.sin(elapsedTime * 10) * 0.2;
        nodes.rightFin.rotation.z = 0.5 - Math.sin(elapsedTime * 10) * 0.2;
        break;

      case 'INCORRECT':
        // Gentle sympathetic lean (never harsh or shameful)
        nodes.chassis.rotation.z = -0.1 + Math.sin(elapsedTime * 2) * 0.03;
        nodes.chassis.rotation.x = 0.05;
        break;

      case 'CELEBRATING':
        // Joyful spin and celebratory rotation
        this.celebrationSpin += deltaTime * 5;
        nodes.chassis.rotation.y = this.celebrationSpin;
        nodes.group.position.y += Math.sin(elapsedTime * 8) * 0.15;
        nodes.leftFin.rotation.z = -0.7 + Math.sin(elapsedTime * 12) * 0.2;
        nodes.rightFin.rotation.z = 0.7 - Math.sin(elapsedTime * 12) * 0.2;
        break;

      case 'WAITING':
      case 'IDLE':
      default:
        // Calm natural rest
        nodes.chassis.rotation.x = THREE.MathUtils.lerp(nodes.chassis.rotation.x, 0, deltaTime * 5);
        nodes.chassis.rotation.y = THREE.MathUtils.lerp(nodes.chassis.rotation.y, 0, deltaTime * 5);
        nodes.chassis.rotation.z = THREE.MathUtils.lerp(nodes.chassis.rotation.z, 0, deltaTime * 5);
        this.celebrationSpin = 0;
        this.tiltOffset = 0;
        break;
    }
  }
}
