"use client";

/* This file is a three.js scene node: the shader material's uniforms are
   imperative per-frame state driven from R3F's useFrame loop (outside
   React's render). react-hooks/immutability cannot model that pattern. */
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { COAL_FRAGMENT, COAL_VERTEX } from "./shaders";

/** Deterministic PRNG so the coal silhouette is stable between mounts. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Irregular low-poly coal chunk (~320 tris): displaced icosahedron,
 *  slightly squashed, no textures. */
function makeCoalGeometry(seed: number) {
  const geometry = new THREE.IcosahedronGeometry(1, 2);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const vertex = new THREE.Vector3();
  const rand = mulberry32(seed);
  const s1 = rand() * 40;
  const s2 = rand() * 40;
  const s3 = rand() * 40;

  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    const n =
      0.55 * Math.sin(vertex.x * 2.3 + s1) * Math.cos(vertex.y * 1.9 + s2) +
      0.3 * Math.sin(vertex.y * 3.1 + s3) * Math.cos(vertex.z * 2.7 + s1) +
      0.15 * Math.sin(vertex.z * 4.3 + s2);
    const radius = 1 + n * 0.3;
    vertex.multiplyScalar(radius);
    vertex.x *= 1.08;
    vertex.y *= 0.84;
    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  return geometry;
}

export type RevealRef = { current: number };

/** The incandescent coal. Shared by the loader (reveal 0→1) and the hero.
 *  `revealRef` is read every frame, so GSAP can tween `.current` directly. */
export function CoalMesh({
  seed = 7,
  revealRef,
  animate = true,
  timeOffset = 0,
  initialReveal = 0,
  onHover,
  onLeave,
}: {
  seed?: number;
  revealRef: RevealRef;
  animate?: boolean;
  timeOffset?: number;
  /** First-frame opacity (before useFrame syncs from revealRef). */
  initialReveal?: number;
  onHover?: (event: ThreeEvent<PointerEvent>) => void;
  onLeave?: () => void;
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: COAL_VERTEX,
        fragmentShader: COAL_FRAGMENT,
        transparent: true,
        uniforms: {
          uTime: { value: animate ? 0 : 2.4 },
          uReveal: { value: initialReveal },
          uSeed: { value: seed * 0.37 },
        },
      }),
    [seed, animate, initialReveal]
  );

  const geometries = useMemo(
    () => [makeCoalGeometry(seed), makeCoalGeometry(seed * 7 + 3)],
    [seed]
  );

  useEffect(
    () => () => {
      geometries.forEach((geometry) => geometry.dispose());
      material.dispose();
    },
    [geometries, material]
  );

  useFrame((state) => {
    if (animate) {
      material.uniforms.uTime.value = state.clock.elapsedTime + timeOffset;
    }
    material.uniforms.uReveal.value = revealRef.current;
  });

  return (
    <group>
      <mesh
        geometry={geometries[0]}
        material={material}
        onPointerMove={onHover}
        onPointerLeave={onLeave}
      />
      <mesh
        geometry={geometries[1]}
        material={material}
        position={[1.14, -0.52, 0.12]}
        rotation={[0.5, 0.9, 0.3]}
        scale={0.52}
      />
    </group>
  );
}
