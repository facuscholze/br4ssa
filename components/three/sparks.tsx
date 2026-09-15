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

export const MAX_SPARKS = 70;

export type SparkControl = { heat: number; burst: number };

/**
 * Natural Ember Sparks Simulation.
 *
 * Lightweight, gentle sparks floating naturally above the flame.
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
    time: 0,
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

    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const sizeAttr = geometry.attributes.aSize as THREE.BufferAttribute;
    const tintAttr = geometry.attributes.aTint as THREE.BufferAttribute;

    posAttr.array[ix] = at.x + (Math.random() - 0.5) * 0.12;
    posAttr.array[ix + 1] = at.y + (Math.random() - 0.5) * 0.08;
    posAttr.array[ix + 2] = at.z + (Math.random() - 0.5) * 0.12;

    const heat = controlRef.current.heat;

    if (burst) {
      // Gentle burst on click
      s.velocity[ix] = (Math.random() - 0.5) * 0.6;
      s.velocity[ix + 1] = 0.8 + Math.random() * 0.7;
      s.velocity[ix + 2] = (Math.random() - 0.5) * 0.5;
      s.maxLife[i] = 0.8 + Math.random() * 0.6;
      sizeAttr.array[i] = 0.024 + Math.random() * 0.02;
    } else {
      // Natural ambient embers
      s.velocity[ix] = (Math.random() - 0.5) * (0.15 + heat * 0.15);
      s.velocity[ix + 1] = 0.35 + Math.random() * 0.35 + heat * 0.3;
      s.velocity[ix + 2] = (Math.random() - 0.5) * (0.15 + heat * 0.15);
      s.maxLife[i] = 0.6 + Math.random() * 0.6 + heat * 0.2;
      sizeAttr.array[i] = 0.016 + Math.random() * 0.018;
    }

    s.life[i] = 1;
    tintAttr.array[i] = Math.random();
    sizeAttr.needsUpdate = true;
    tintAttr.needsUpdate = true;
  };

  useFrame((state, delta) => {
    const s = sim.current;
    const dt = Math.min(delta, 0.05);
    s.time += dt;
    const control = controlRef.current;
    const heat = control.heat;

    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const lifeAttr = geometry.attributes.aLife as THREE.BufferAttribute;

    // Gentle ambient spawn rate
    const interval = 0.22 / (1 + heat * 1.5);
    s.ambientClock += dt;
    while (s.ambientClock >= interval) {
      s.ambientClock -= interval;
      s.tmp.set(
        base.x + (Math.random() - 0.5) * 0.5,
        base.y + (Math.random() - 0.5) * 0.15,
        base.z + (Math.random() - 0.5) * 0.5
      );
      spawn(s.tmp, false);
    }

    // Process click burst
    if (control.burst > 0) {
      const n = Math.min(4, Math.floor(control.burst));
      for (let i = 0; i < n; i++) {
        s.tmp.set(
          base.x + (Math.random() - 0.5) * 0.4,
          base.y + (Math.random() - 0.5) * 0.1,
          base.z + (Math.random() - 0.5) * 0.4
        );
        spawn(s.tmp, true);
      }
      control.burst -= n;
    }

    // Physical integration
    for (let i = 0; i < MAX_SPARKS; i++) {
      if (s.life[i] <= 0) continue;
      s.life[i] = Math.max(0, s.life[i] - dt / s.maxLife[i]);
      const ix = i * 3;

      // Gentle upward thermal draft & drag
      s.velocity[ix + 1] -= 0.6 * dt;
      const drag = Math.max(0, 1 - 0.8 * dt);
      s.velocity[ix] *= drag;
      s.velocity[ix + 1] *= drag;
      s.velocity[ix + 2] *= drag;

      // Soft natural drift
      s.velocity[ix] += Math.sin(s.time * 2.0 + i) * 0.15 * dt;

      posAttr.array[ix] += s.velocity[ix] * dt;
      posAttr.array[ix + 1] += s.velocity[ix + 1] * dt;
      posAttr.array[ix + 2] += s.velocity[ix + 2] * dt;

      lifeAttr.array[i] = s.life[i];
    }

    posAttr.needsUpdate = true;
    lifeAttr.needsUpdate = true;

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
      renderOrder={3}
    />
  );
}
