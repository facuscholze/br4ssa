"use client";

/* This file is a three.js scene node: the shader materials' uniforms are
   imperative per-frame state driven from R3F's useFrame loop (outside
   React's render). react-hooks/immutability cannot model that pattern. */
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  CHARCOAL_BED_FRAGMENT,
  CHARCOAL_BED_VERTEX,
  FLAME_BLUE_BASE_FRAGMENT,
  FLAME_BLUE_BASE_VERTEX,
  FLAME_CORE_FRAGMENT,
  FLAME_CORE_VERTEX,
  FLAME_FRAGMENT,
  FLAME_OUTER_FRAGMENT,
  FLAME_OUTER_VERTEX,
  FLAME_VERTEX,
} from "./shaders";
import { getFlameProfile } from "./isotype";

type HyperrealisticFlameAssets = {
  mainGeometry: THREE.BufferGeometry;
  coreGeometry: THREE.BufferGeometry;
  outerGeometry: THREE.BufferGeometry;
  blueBaseGeometry: THREE.BufferGeometry;
  charcoalGeometry: THREE.BufferGeometry;
  centerTex: THREE.DataTexture;
  baseY: number;
  height: number;
};

let assetsCache: HyperrealisticFlameAssets | null = null;

/**
 * Builds the 4K multi-shell geometries:
 * 1. Main flame lathe (silky 80x56 profile)
 * 2. Inner white-hot plasma core lathe
 * 3. Outer licking tendril whisps lathe
 * 4. Chemiluminescent blue root ring
 * 5. 3D Quebracho wood charcoal ember bed
 */
function buildHyperrealisticAssets(): HyperrealisticFlameAssets {
  const profile = getFlameProfile(80, 2.3);
  const { rows, center, halfWidth, height } = profile;

  // 1. Main Flame Lathe
  const mainPoints: THREE.Vector2[] = [];
  for (let i = 0; i < rows; i++) {
    const v = i / (rows - 1);
    const radius = i === 0 || i === rows - 1 ? 0.003 : Math.max(halfWidth[i], 0.005);
    mainPoints.push(new THREE.Vector2(radius, -height / 2 + v * height));
  }
  const mainGeometry = new THREE.LatheGeometry(mainPoints, 56);

  // 2. Inner Plasma Core Lathe (Concentrated core)
  const corePoints: THREE.Vector2[] = [];
  for (let i = 0; i < rows; i++) {
    const v = i / (rows - 1);
    const radius = i === 0 || i === rows - 1 ? 0.002 : Math.max(halfWidth[i] * 0.62, 0.003);
    corePoints.push(new THREE.Vector2(radius, -height / 2 + v * (height * 0.88)));
  }
  const coreGeometry = new THREE.LatheGeometry(corePoints, 44);

  // 3. Outer Whisps & Licking Tendril Lathe
  const outerPoints: THREE.Vector2[] = [];
  for (let i = 0; i < rows; i++) {
    const v = i / (rows - 1);
    const radius = i === 0 || i === rows - 1 ? 0.004 : Math.max(halfWidth[i] * 1.14, 0.007);
    outerPoints.push(new THREE.Vector2(radius, -height / 2 + v * (height * 1.12)));
  }
  const outerGeometry = new THREE.LatheGeometry(outerPoints, 48);

  // 4. Blue Combustion Radical Foot
  const blueRows = Math.floor(rows * 0.32);
  const bluePoints: THREE.Vector2[] = [];
  for (let i = 0; i < blueRows; i++) {
    const v = i / (rows - 1);
    const radius = Math.max(halfWidth[i] * 1.05, 0.005);
    bluePoints.push(new THREE.Vector2(radius, -height / 2 + v * height));
  }
  const blueBaseGeometry = new THREE.LatheGeometry(bluePoints, 44);

  // 5. 3D Charcoal Ember Bed (Quebracho Coals)
  const charcoalRadius = 0.82;
  const charcoalHeight = 0.18;
  const charcoalGeometry = new THREE.CylinderGeometry(
    charcoalRadius * 0.95,
    charcoalRadius * 1.15,
    charcoalHeight,
    36,
    6
  );
  const cPos = charcoalGeometry.attributes.position;
  for (let i = 0; i < cPos.count; i++) {
    const x = cPos.getX(i);
    const y = cPos.getY(i);
    const z = cPos.getZ(i);
    const angle = Math.atan2(z, x);
    const r = Math.hypot(x, z);
    const noise =
      Math.sin(angle * 8) * 0.045 +
      Math.cos(angle * 14) * 0.025 +
      Math.sin(y * 24) * 0.02;
    cPos.setXYZ(
      i,
      x + (x / (r || 1)) * noise,
      y + Math.sin(x * 10 + z * 10) * 0.02 - 0.02,
      z + (z / (r || 1)) * noise
    );
  }
  charcoalGeometry.computeVertexNormals();

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
    outerGeometry,
    blueBaseGeometry,
    charcoalGeometry,
    centerTex,
    baseY: -height / 2,
    height,
  };
}

function getAssets() {
  if (!assetsCache) assetsCache = buildHyperrealisticAssets();
  return assetsCache;
}

/**
 * Hyperrealistic 4K Volumetric Flame & Embers System.
 *
 * Renders:
 * - 3D Incandescent charcoal ember bed at the base.
 * - Chemiluminescent oxygen-blue combustion root.
 * - Multi-layered fluid volumetric flame with 3D divergence-free curl noise.
 * - Inner white-hot plasma core.
 * - Outer dancing flame tendrils & whisps.
 */
export function FlameMesh({
  heatRef,
  revealRef,
  initialReveal = 0,
  seed = 11,
  animate = true,
  showCharcoal = true,
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

  // 1. Main Flame Material
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

  // 2. Inner White-Hot Plasma Core Material
  const coreMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FLAME_CORE_VERTEX,
        fragmentShader: FLAME_CORE_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
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

  // 3. Outer Whisps & Licking Tendrils Material
  const outerMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FLAME_OUTER_VERTEX,
        fragmentShader: FLAME_OUTER_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uHeat: { value: 0 },
          uReveal: { value: initialReveal },
          uSeed: { value: seed * 0.83 + 3.4 },
          uBaseY: { value: assets.baseY },
          uHeight: { value: assets.height },
          uCenter: { value: assets.centerTex },
        },
      }),
    [assets, initialReveal, seed]
  );

  // 4. Chemiluminescent Blue Root Material
  const blueBaseMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FLAME_BLUE_BASE_VERTEX,
        fragmentShader: FLAME_BLUE_BASE_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uHeat: { value: 0 },
          uReveal: { value: initialReveal },
          uSeed: { value: seed * 0.25 },
          uBaseY: { value: assets.baseY },
          uHeight: { value: assets.height },
          uCenter: { value: assets.centerTex },
        },
      }),
    [assets, initialReveal, seed]
  );

  // 5. Incandescent Charcoal Ember Bed Material
  const charcoalMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: CHARCOAL_BED_VERTEX,
        fragmentShader: CHARCOAL_BED_FRAGMENT,
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uHeat: { value: 0 },
          uReveal: { value: initialReveal },
        },
      }),
    [initialReveal]
  );

  // Clean up materials on unmount
  useEffect(
    () => () => {
      mainMaterial.dispose();
      coreMaterial.dispose();
      outerMaterial.dispose();
      blueBaseMaterial.dispose();
      charcoalMaterial.dispose();
    },
    [mainMaterial, coreMaterial, outerMaterial, blueBaseMaterial, charcoalMaterial]
  );

  useFrame((_, delta) => {
    const heat = heatRef.current;
    if (animate) {
      timeRef.current += Math.min(delta, 0.05) * (0.65 + heat * 0.85);
    }
    const t = timeRef.current;
    const rev = revealRef ? revealRef.current : 1;

    mainMaterial.uniforms.uTime.value = t;
    mainMaterial.uniforms.uHeat.value = heat;
    mainMaterial.uniforms.uReveal.value = rev;

    coreMaterial.uniforms.uTime.value = t;
    coreMaterial.uniforms.uHeat.value = heat;
    coreMaterial.uniforms.uReveal.value = rev;

    outerMaterial.uniforms.uTime.value = t;
    outerMaterial.uniforms.uHeat.value = heat;
    outerMaterial.uniforms.uReveal.value = rev;

    blueBaseMaterial.uniforms.uTime.value = t;
    blueBaseMaterial.uniforms.uHeat.value = heat;
    blueBaseMaterial.uniforms.uReveal.value = rev;

    charcoalMaterial.uniforms.uTime.value = t;
    charcoalMaterial.uniforms.uHeat.value = heat;
    charcoalMaterial.uniforms.uReveal.value = rev;
  });

  return (
    <group
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    >
      {/* 3D Incandescent Charcoal Bed / Quebracho Coals */}
      {showCharcoal && (
        <mesh
          geometry={assets.charcoalGeometry}
          material={charcoalMaterial}
          position={[0, assets.baseY - 0.04, 0]}
          renderOrder={0}
        />
      )}

      {/* Chemiluminescent Blue Root */}
      <mesh
        geometry={assets.blueBaseGeometry}
        material={blueBaseMaterial}
        renderOrder={1}
      />

      {/* Main Volumetric Flame Shell */}
      <mesh
        geometry={assets.mainGeometry}
        material={mainMaterial}
        renderOrder={2}
      />

      {/* Inner White-Hot Plasma Core */}
      <mesh
        geometry={assets.coreGeometry}
        material={coreMaterial}
        renderOrder={3}
      />

      {/* Outer Licking Whisps & Tendrils */}
      <mesh
        geometry={assets.outerGeometry}
        material={outerMaterial}
        renderOrder={4}
      />
    </group>
  );
}
