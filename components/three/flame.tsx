"use client";

/* This file is a three.js scene node: the shader material's uniforms are
   imperative per-frame state driven from R3F's useFrame loop (outside
   React's render). react-hooks/immutability cannot model that pattern. */
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { FLAME_FRAGMENT, FLAME_VERTEX } from "./shaders";
import { getFlameProfile } from "./isotype";

type FlameAssets = {
  geometry: THREE.BufferGeometry;
  centerTex: THREE.DataTexture;
  baseY: number;
  height: number;
};

let assetsCache: FlameAssets | null = null;

/** Builds the flame lathe from the isotype's real silhouette profile,
 *  plus the 1D center-line texture (the logo's left notch included). */
function buildFlameAssets(): FlameAssets {
  const profile = getFlameProfile();
  const { rows, center, halfWidth, height } = profile;

  const points: THREE.Vector2[] = [];
  for (let i = 0; i < rows; i++) {
    const v = i / (rows - 1);
    const radius = i === 0 || i === rows - 1 ? 0.004 : Math.max(halfWidth[i], 0.006);
    points.push(new THREE.Vector2(radius, -height / 2 + v * height));
  }
  const geometry = new THREE.LatheGeometry(points, 44);

  const data = new Uint8Array(rows);
  for (let i = 0; i < rows; i++) {
    data[i] = Math.round(THREE.MathUtils.clamp((center[i] + 1) / 2, 0, 1) * 255);
  }
  const centerTex = new THREE.DataTexture(data, 1, rows, THREE.RedFormat);
  centerTex.minFilter = THREE.LinearFilter;
  centerTex.magFilter = THREE.LinearFilter;
  centerTex.needsUpdate = true;

  return { geometry, centerTex, baseY: -height / 2, height };
}

function getFlameAssets() {
  if (!assetsCache) assetsCache = buildFlameAssets();
  return assetsCache;
}

/**
 * The Brasa flame — one mesh, one draw call. The caller drives it through
 * two refs: `heatRef` (0 rest → 1 hover → ~1.7 click spike) and
 * optionally `revealRef` (ignition fade-in). Time advances internally at a
 * rate that scales with heat, so a hotter flame also moves faster.
 */
export function FlameMesh({
  heatRef,
  revealRef,
  initialReveal = 0,
  seed = 11,
  animate = true,
  onPointerMove,
  onPointerLeave,
  onClick,
}: {
  heatRef: { current: number };
  revealRef?: { current: number };
  initialReveal?: number;
  seed?: number;
  animate?: boolean;
  onPointerMove?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerLeave?: () => void;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
}) {
  const assets = useMemo(() => getFlameAssets(), []);
  // A pleasant frozen state for the reduced-motion static render.
  const timeRef = useRef(animate ? 0 : 2.8);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FLAME_VERTEX,
        fragmentShader: FLAME_FRAGMENT,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          // useFrame syncs uTime from timeRef from the first frame on
          // (demand mode still runs it once, before pixels land).
          uTime: { value: 0 },
          uHeat: { value: 0 },
          uReveal: { value: initialReveal },
          uSeed: { value: seed * 0.37 },
          uBaseY: { value: assets.baseY },
          uHeight: { value: assets.height },
          uCenter: { value: assets.centerTex },
        },
      }),
    [assets, initialReveal, seed]
  );

  useEffect(
    () => () => {
      material.dispose();
    },
    [material]
  );

  useFrame((_, delta) => {
    const heat = heatRef.current;
    if (animate) {
      timeRef.current += Math.min(delta, 0.05) * (0.55 + heat * 0.75);
    }
    material.uniforms.uTime.value = timeRef.current;
    material.uniforms.uHeat.value = heat;
    material.uniforms.uReveal.value = revealRef ? revealRef.current : 1;
  });

  return (
    <mesh
      geometry={assets.geometry}
      material={material}
      renderOrder={1}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    />
  );
}
