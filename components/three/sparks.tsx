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

export const MAX_SPARKS = 420;

export type SparkControl = { heat: number; burst: number };

/** Fast analytical curl noise approximation for CPU particle turbulence */
function curlDrift(x: number, y: number, z: number, t: number, out: THREE.Vector3) {
  const s = 1.3;
  const cx = Math.sin(y * s + t * 1.4) * Math.cos(z * s * 0.8);
  const cy = Math.cos(x * s + t * 1.8) * Math.sin(z * s);
  const cz = Math.sin(x * s * 0.9 + t * 1.2) * Math.cos(y * s * 1.1);
  out.set(cx, cy * 0.5 + 0.5, cz);
}

/**
 * Hyperrealistic 4K Combustion Spark & Ember Particle Simulation.
 *
 * Implements:
 * - Fluid thermal updraft & curl turbulence fields.
 * - Blackbody radiative cooling.
 * - Heavy glowing cinders + micro-incandescent spark flakes.
 * - Click "avivamiento" explosive vortex bursts.
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
    const velocity = new THREE.BufferAttribute(new Float32Array(MAX_SPARKS * 3), 3);
    velocity.setUsage(THREE.DynamicDrawUsage);
    const life = new THREE.BufferAttribute(new Float32Array(MAX_SPARKS), 1);
    life.setUsage(THREE.DynamicDrawUsage);
    const size = new THREE.BufferAttribute(new Float32Array(MAX_SPARKS), 1);
    const tint = new THREE.BufferAttribute(new Float32Array(MAX_SPARKS), 1);

    geo.setAttribute("position", position);
    geo.setAttribute("aVelocity", velocity);
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
    weights: new Float32Array(MAX_SPARKS), // Particle mass / drag factor
    cursor: 0,
    ambientClock: 0,
    time: 0,
    tmp: new THREE.Vector3(),
    curlTmp: new THREE.Vector3(),
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
    const velAttr = geometry.attributes.aVelocity as THREE.BufferAttribute;
    const sizeAttr = geometry.attributes.aSize as THREE.BufferAttribute;
    const tintAttr = geometry.attributes.aTint as THREE.BufferAttribute;

    posAttr.array[ix] = at.x + (Math.random() - 0.5) * 0.12;
    posAttr.array[ix + 1] = at.y + (Math.random() - 0.5) * 0.08;
    posAttr.array[ix + 2] = at.z + (Math.random() - 0.5) * 0.12;

    const heat = controlRef.current.heat;
    const isHeavyEmber = Math.random() < 0.28;

    if (burst) {
      // Explosive "avivamiento" burst: radial eruption with high buoyant lift
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.6 + Math.random() * 1.4;
      s.velocity[ix] = Math.cos(angle) * speed;
      s.velocity[ix + 1] = 1.2 + Math.random() * 1.5;
      s.velocity[ix + 2] = Math.sin(angle) * speed * 0.7;
      s.maxLife[i] = 0.8 + Math.random() * 0.9;
      s.weights[i] = isHeavyEmber ? 1.6 : 0.8;
      sizeAttr.array[i] = isHeavyEmber ? 0.045 + Math.random() * 0.04 : 0.024 + Math.random() * 0.025;
    } else {
      // Ambient buoyant embers swirling in the thermal draft
      const angle = Math.random() * Math.PI * 2;
      const rSpeed = (0.15 + Math.random() * 0.35) * (1 + heat * 0.4);
      s.velocity[ix] = Math.cos(angle) * rSpeed;
      s.velocity[ix + 1] = 0.45 + Math.random() * 0.65 + heat * 0.65;
      s.velocity[ix + 2] = Math.sin(angle) * rSpeed * 0.7;
      s.maxLife[i] = 0.6 + Math.random() * 0.8 + heat * 0.25;
      s.weights[i] = isHeavyEmber ? 1.4 : 0.9;
      sizeAttr.array[i] = isHeavyEmber ? 0.038 + Math.random() * 0.035 : 0.018 + Math.random() * 0.025 + heat * 0.01;
    }

    velAttr.array[ix] = s.velocity[ix];
    velAttr.array[ix + 1] = s.velocity[ix + 1];
    velAttr.array[ix + 2] = s.velocity[ix + 2];

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
    const velAttr = geometry.attributes.aVelocity as THREE.BufferAttribute;
    const lifeAttr = geometry.attributes.aLife as THREE.BufferAttribute;

    // Convective ember generation rate scales with heat
    const interval = 0.08 / (1 + heat * 2.8);
    s.ambientClock += dt;
    while (s.ambientClock >= interval) {
      s.ambientClock -= interval;
      s.tmp.set(
        base.x + (Math.random() - 0.5) * 0.95,
        base.y + (Math.random() - 0.5) * 0.25,
        base.z + (Math.random() - 0.5) * 0.95
      );
      spawn(s.tmp, false);
    }

    // Process click burst
    if (control.burst > 0) {
      const n = Math.min(8, Math.floor(control.burst));
      for (let i = 0; i < n; i++) {
        s.tmp.set(
          base.x + (Math.random() - 0.5) * 0.75,
          base.y + (Math.random() - 0.5) * 0.2,
          base.z + (Math.random() - 0.5) * 0.75
        );
        spawn(s.tmp, true);
      }
      control.burst -= n;
    }

    // Physical integration loop
    for (let i = 0; i < MAX_SPARKS; i++) {
      if (s.life[i] <= 0) continue;
      s.life[i] = Math.max(0, s.life[i] - dt / s.maxLife[i]);
      const ix = i * 3;

      const px = posAttr.array[ix];
      const py = posAttr.array[ix + 1];
      const pz = posAttr.array[ix + 2];

      // Curl noise turbulence draft
      curlDrift(px, py, pz, s.time, s.curlTmp);
      const turbulence = (0.7 + heat * 0.6) * dt;
      s.velocity[ix] += s.curlTmp.x * turbulence;
      s.velocity[ix + 1] += s.curlTmp.y * turbulence * 0.6;
      s.velocity[ix + 2] += s.curlTmp.z * turbulence;

      // Gravity and drag
      const mass = s.weights[i];
      s.velocity[ix + 1] -= (1.3 * mass) * dt; // Gravity pulls dying embers down
      const drag = Math.max(0, 1 - (1.1 + 0.3 * mass) * dt);
      s.velocity[ix] *= drag;
      s.velocity[ix + 1] *= drag;
      s.velocity[ix + 2] *= drag;

      posAttr.array[ix] += s.velocity[ix] * dt;
      posAttr.array[ix + 1] += s.velocity[ix + 1] * dt;
      posAttr.array[ix + 2] += s.velocity[ix + 2] * dt;

      velAttr.array[ix] = s.velocity[ix];
      velAttr.array[ix + 1] = s.velocity[ix + 1];
      velAttr.array[ix + 2] = s.velocity[ix + 2];

      lifeAttr.array[i] = s.life[i];
    }

    posAttr.needsUpdate = true;
    velAttr.needsUpdate = true;
    lifeAttr.needsUpdate = true;

    // Sizing scaled by camera distance
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
      renderOrder={5}
    />
  );
}
