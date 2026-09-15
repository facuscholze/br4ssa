"use client";

/* This file is a three.js scene node: the shader materials' uniforms are
   imperative per-frame state driven from R3F's useFrame loop (outside
   React's render). react-hooks/immutability cannot model that pattern. */
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  FLAME_CORE_FRAGMENT,
  FLAME_CORE_VERTEX,
  FLAME_FRAGMENT,
  FLAME_VERTEX,
} from "./shaders";
import { getFlameProfile } from "./isotype";

type NaturalFlameAssets = {
  mainGeometry: THREE.BufferGeometry;
  coreGeometry: THREE.BufferGeometry;
  centerTex: THREE.DataTexture;
  baseY: number;
  height: number;
};

let assetsCache: NaturalFlameAssets | null = null;

/**
 * Builds the natural flame geometries:
 * 1. Main flame lathe from the isotype's silhouette profile.
 * 2. Soft inner core lathe.
 */
function buildNaturalAssets(): NaturalFlameAssets {
  const profile = getFlameProfile(64, 2.1);
  const { rows, center, halfWidth, height } = profile;

  // 1. Main Flame Lathe
  const mainPoints: THREE.Vector2[] = [];
  for (let i = 0; i < rows; i++) {
    const v = i / (rows - 1);
    const radius = i === 0 || i === rows - 1 ? 0.003 : Math.max(halfWidth[i], 0.005);
    mainPoints.push(new THREE.Vector2(radius, -height / 2 + v * height));
  }
  const mainGeometry = new THREE.LatheGeometry(mainPoints, 44);

  // 2. Soft Inner Core Lathe
  const corePoints: THREE.Vector2[] = [];
  for (let i = 0; i < rows; i++) {
    const v = i / (rows - 1);
    const radius = i === 0 || i === rows - 1 ? 0.002 : Math.max(halfWidth[i] * 0.58, 0.003);
    corePoints.push(new THREE.Vector2(radius, -height / 2 + v * (height * 0.82)));
  }
  const coreGeometry = new THREE.LatheGeometry(corePoints, 36);

  // 1D center-line texture
  const data = new Uint8Array(rows);
  for (let i = 0; i < rows; i++) {
    data[i] = Math.round(THREE.MathUtils.clamp((center[i] + 1) / 2, 0, 1) * 255);
  }
  const centerTex = new THREE.DataTexture(data, 1, rows, THREE.RedFormat);
  centerTex.minFilter = THREE.LinearFilter;
  centerTex.magFilter = THREE.LinearFilter;
  centerTex.needsUpdate = true;

  return {
    mainGeometry,
    coreGeometry,
    centerTex,
    baseY: -height / 2,
    height,
  };
}

function getAssets() {
  if (!assetsCache) assetsCache = buildNaturalAssets();
  return assetsCache;
}

/**
 * Natural Wood Flame System.
 *
 * Renders:
 * - Fluid volumetric flame with 3D curl noise and blackbody temperature gradient.
 * - Soft inner incandescent honey-gold core.
 * - Perfectly feathered alpha envelope (zero clipping or square box boundaries).
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
  showCharcoal?: boolean;
  onPointerMove?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerLeave?: () => void;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
}) {
  const assets = useMemo(() => getAssets(), []);
  const timeRef = useRef(animate ? 0 : 2.8);

  // 1. Main Volumetric Flame Material
  const mainMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FLAME_VERTEX,
        fragmentShader: FLAME_FRAGMENT,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
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

  // 2. Soft Inner Core Material
  const coreMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FLAME_CORE_VERTEX,
        fragmentShader: FLAME_CORE_FRAGMENT,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uHeat: { value: 0 },
          uReveal: { value: initialReveal },
          uSeed: { value: seed * 0.49 + 1.2 },
          uBaseY: { value: assets.baseY },
          uHeight: { value: assets.height },
          uCenter: { value: assets.centerTex },
        },
      }),
    [assets, initialReveal, seed]
  );

  useEffect(
    () => () => {
      mainMaterial.dispose();
      coreMaterial.dispose();
    },
    [mainMaterial, coreMaterial]
  );

  useFrame((_, delta) => {
    const heat = heatRef.current;
    if (animate) {
      timeRef.current += Math.min(delta, 0.05) * (0.55 + heat * 0.65);
    }
    const t = timeRef.current;
    const rev = revealRef ? revealRef.current : 1;

    mainMaterial.uniforms.uTime.value = t;
    mainMaterial.uniforms.uHeat.value = heat;
    mainMaterial.uniforms.uReveal.value = rev;

    coreMaterial.uniforms.uTime.value = t;
    coreMaterial.uniforms.uHeat.value = heat;
    coreMaterial.uniforms.uReveal.value = rev;
  });

  return (
    <group
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    >
      {/* Soft Inner Core */}
      <mesh
        geometry={assets.coreGeometry}
        material={coreMaterial}
        renderOrder={1}
      />

      {/* Main Natural Flame */}
      <mesh
        geometry={assets.mainGeometry}
        material={mainMaterial}
        renderOrder={2}
      />
    </group>
  );
}
