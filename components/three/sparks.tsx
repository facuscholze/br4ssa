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

/**
 * Shared control channel between the scene and the spark system.
 * `heat` scales the ambient ember rate/lift (rest → hover → surge);
 * `burst` is a one-shot pool of extra sparks (the click "avivamiento").
 */
export type SparkControl = { heat: number; burst: number };

/**
 * Ember sparks rising off the flame's base — one draw call for the whole
 * pool (no textures, additive blend). Spawn rate and lift scale with heat;
 * a click pours a burst that arcs out and falls like real embers.
 */
export function SparkSystem({
  controlRef,
  base,
}: {
  controlRef: { current: SparkControl };
  base: { x: number; y: number; z: number };
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
  });

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  const spawn = (at: THREE.Vector3, burst: boolean) => {
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

    const heat = controlRef.current.heat;
    if (burst) {
      // The "avivamiento": a strong whoosh of embers, wide and high.
      s.velocity[ix] = (Math.random() - 0.5) * 1.1;
      s.velocity[ix + 1] = 0.9 + Math.random() * 0.9;
      s.velocity[ix + 2] = (Math.random() - 0.5) * 1.1;
      s.maxLife[i] = 0.7 + Math.random() * 0.7;
      size.array[i] = 0.034 + Math.random() * 0.05;
    } else {
      // Ambient embers: steady rise, livelier as the flame heats up.
      s.velocity[ix] = (Math.random() - 0.5) * (0.4 + heat * 0.3);
      s.velocity[ix + 1] = 0.35 + Math.random() * 0.55 + heat * 0.5;
      s.velocity[ix + 2] = (Math.random() - 0.5) * (0.4 + heat * 0.3);
      s.maxLife[i] = 0.55 + Math.random() * 0.6 + heat * 0.15;
      size.array[i] = 0.026 + Math.random() * 0.04 + heat * 0.012;
    }

    s.life[i] = 1;
    tint.array[i] = Math.random();
    size.needsUpdate = true;
    tint.needsUpdate = true;
  };

  useFrame((state, delta) => {
    const s = sim.current;
    const dt = Math.min(delta, 0.05);
    const control = controlRef.current;
    const heat = control.heat;
    const position = geometry.attributes.position as THREE.BufferAttribute;
    const life = geometry.attributes.aLife as THREE.BufferAttribute;

    // Ambient embers from the flame's base — rate scales with heat.
    const interval = 0.16 / (1 + heat * 2.4);
    s.ambientClock += dt;
    while (s.ambientClock >= interval) {
      s.ambientClock -= interval;
      s.tmp.set(
        base.x + (Math.random() - 0.5) * 1.0,
        base.y + (Math.random() - 0.5) * 0.3,
        base.z + (Math.random() - 0.5) * 1.0
      );
      spawn(s.tmp, false);
    }

    // Click burst, drained a few sparks per frame (a short whoosh).
    if (control.burst > 0) {
      const n = Math.min(6, Math.floor(control.burst));
      for (let i = 0; i < n; i++) {
        s.tmp.set(
          base.x + (Math.random() - 0.5) * 0.7,
          base.y + (Math.random() - 0.5) * 0.2,
          base.z + (Math.random() - 0.5) * 0.7
        );
        spawn(s.tmp, true);
      }
      control.burst -= n;
    }

    for (let i = 0; i < MAX_SPARKS; i++) {
      if (s.life[i] <= 0) continue;
      s.life[i] = Math.max(0, s.life[i] - dt / s.maxLife[i]);
      const ix = i * 3;
      s.velocity[ix + 1] -= 1.7 * dt; // embers arc and fall
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
