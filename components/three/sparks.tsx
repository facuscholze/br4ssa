"use client";

/* This file is a three.js simulation: the particle pool lives in
   buffer attributes that are integrated every frame from R3F's useFrame
   loop (outside React's render). react-hooks/immutability cannot model
   that pattern. */
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { SPARK_FRAGMENT, SPARK_VERTEX } from "./shaders";

export const MAX_SPARKS = 260;

/** Raycast hit on the coal mesh, fed to the spark system each frame. */
export type SparkHit = {
  point: THREE.Vector3;
  normal: THREE.Vector3;
  speed: number;
  active: boolean;
};

/**
 * Ember spark system — the "estela de chispas". A fixed pool rendered as a
 * single THREE.Points draw call (no textures, additive blend). Two spawn
 * modes: sparks kicked off the coal surface while the pointer hovers it,
 * and slow ambient embers rising off the coal's crown.
 */
export function SparkSystem({
  hitRef,
  ambient,
  quality = 1,
}: {
  hitRef: { current: SparkHit };
  ambient: { x: number; y: number; z: number } | null;
  quality?: number;
}) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const position = new THREE.BufferAttribute(new Float32Array(MAX_SPARKS * 3), 3);
    position.setUsage(THREE.DynamicDrawUsage);
    const life = new THREE.BufferAttribute(new Float32Array(MAX_SPARKS), 1);
    life.setUsage(THREE.DynamicDrawUsage);
    const size = new THREE.BufferAttribute(new Float32Array(MAX_SPARKS), 1);
    const tint = new THREE.BufferAttribute(new Float32Array(MAX_SPARKS), 1);
    geo.setAttribute("position", position);
    geo.setAttribute("aLife", life);
    geo.setAttribute("aSize", size);
    geo.setAttribute("aTint", tint);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SPARK_VERTEX,
        fragmentShader: SPARK_FRAGMENT,
        uniforms: {
          uPointScale: { value: 900 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const sim = useRef({
    velocity: new Float32Array(MAX_SPARKS * 3),
    life: new Float32Array(MAX_SPARKS),
    maxLife: new Float32Array(MAX_SPARKS),
    cursor: 0,
    ambientClock: 0,
    tmp: new THREE.Vector3(),
    tangent: new THREE.Vector3(),
    up: new THREE.Vector3(0, 1, 0),
  });

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  const spawn = (
    at: THREE.Vector3,
    normal: THREE.Vector3 | null,
    boost: number
  ) => {
    const s = sim.current;
    const i = s.cursor;
    s.cursor = (s.cursor + 1) % MAX_SPARKS;
    const ix = i * 3;
    const position = geometry.attributes.position as THREE.BufferAttribute;
    const size = geometry.attributes.aSize as THREE.BufferAttribute;
    const tint = geometry.attributes.aTint as THREE.BufferAttribute;

    position.array[ix] = at.x + (Math.random() - 0.5) * 0.08;
    position.array[ix + 1] = at.y + (Math.random() - 0.5) * 0.08;
    position.array[ix + 2] = at.z + (Math.random() - 0.5) * 0.08;

    if (normal) {
      // Kick along the surface normal + random tangent + upward bias:
      // real sparks arc off the coal, they don't slide along a trail.
      s.tangent.crossVectors(normal, s.up);
      if (s.tangent.lengthSq() < 0.01) s.tangent.set(1, 0, 0);
      s.tangent.normalize();
      const kick = 0.22 + Math.random() * 0.5 + boost * 0.25;
      const sway = (Math.random() - 0.5) * (0.5 + boost * 0.6);
      const lift = 0.35 + Math.random() * 0.7 + boost * 0.2;
      s.velocity[ix] = normal.x * kick + s.tangent.x * sway;
      s.velocity[ix + 1] = normal.y * kick + lift;
      s.velocity[ix + 2] = normal.z * kick + s.tangent.z * sway;
    } else {
      s.velocity[ix] = (Math.random() - 0.5) * 0.3;
      s.velocity[ix + 1] = 0.3 + Math.random() * 0.5;
      s.velocity[ix + 2] = (Math.random() - 0.5) * 0.3;
    }

    s.life[i] = 1;
    s.maxLife[i] = 0.5 + Math.random() * 0.65;
    size.array[i] = 0.028 + Math.random() * 0.045;
    tint.array[i] = Math.random();
    size.needsUpdate = true;
    tint.needsUpdate = true;
  };

  useFrame((state, delta) => {
    const s = sim.current;
    const dt = Math.min(delta, 0.05);
    const position = geometry.attributes.position as THREE.BufferAttribute;
    const life = geometry.attributes.aLife as THREE.BufferAttribute;
    const hit = hitRef.current;

    if (hit.active) {
      let budget = (16 + hit.speed * 30) * quality * dt + Math.random() * 0.5;
      while (budget >= 1) {
        budget -= 1;
        spawn(hit.point, hit.normal, hit.speed);
      }
      if (Math.random() < budget) spawn(hit.point, hit.normal, hit.speed);
    }

    if (ambient) {
      s.ambientClock += dt;
      while (s.ambientClock >= 0.17) {
        s.ambientClock -= 0.17;
        s.tmp.set(
          ambient.x + (Math.random() - 0.5) * 0.9,
          ambient.y + (Math.random() - 0.5) * 0.3,
          ambient.z + (Math.random() - 0.5) * 0.9
        );
        spawn(s.tmp, null, 0);
      }
    }

    for (let i = 0; i < MAX_SPARKS; i++) {
      if (s.life[i] <= 0) continue;
      s.life[i] = Math.max(0, s.life[i] - dt / s.maxLife[i]);
      const ix = i * 3;
      s.velocity[ix + 1] -= 1.7 * dt; // sparks arc and fall
      const drag = Math.max(0, 1 - 1.5 * dt);
      s.velocity[ix] *= drag;
      s.velocity[ix + 1] *= drag;
      s.velocity[ix + 2] *= drag;
      position.array[ix] += s.velocity[ix] * dt;
      position.array[ix + 1] += s.velocity[ix + 1] * dt;
      position.array[ix + 2] += s.velocity[ix + 2] * dt;
      life.array[i] = s.life[i];
    }
    position.needsUpdate = true;
    life.needsUpdate = true;

    // Pixels per world unit at distance 1, for point sizing.
    const camera = state.camera as THREE.PerspectiveCamera;
    const fov = camera.fov ?? 42;
    material.uniforms.uPointScale.value =
      (state.size.height * state.gl.getPixelRatio()) /
      (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2));
  });

  return (
    <points
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={2}
    />
  );
}
