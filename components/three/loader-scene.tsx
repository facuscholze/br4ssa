"use client";

/* This file is a three.js scene node: shader uniforms are imperative
   per-frame state driven from R3F's useFrame loop (outside React's
   render). react-hooks/immutability cannot model that pattern. */
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { FlameMesh } from "./flame";
import { getBrasaTargets, targetsToWorld } from "./isotype";
import { LOADER_FRAGMENT, LOADER_VERTEX } from "./shaders";

const COUNT = 380;

export type LoaderState = {
  assemble: number;
  disperse: number;
  fade: number;
  flameReveal: number;
};

/** Builds the lightweight particle buffer for smooth convergence */
function buildParticlesGeometry(count: number) {
  const targets = getBrasaTargets(count);
  const world = new Float32Array(count * 3);
  targetsToWorld(targets, world, 1.9);

  const start = new Float32Array(count * 3);
  const scatter = new Float32Array(count * 3);
  const delay = new Float32Array(count);
  const size = new Float32Array(count);
  const tint = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.6 + Math.random() * 2.0;
    start[i3] = Math.cos(angle) * radius;
    start[i3 + 1] = (Math.random() - 0.5) * 2.2;
    start[i3 + 2] = -0.4 + Math.random() * 1.0;

    const sx = Math.random() - 0.5;
    const sy = 0.2 + Math.random() * 1.2;
    const sz = Math.random() - 0.5;
    const length = Math.hypot(sx, sy, sz) || 1;
    const distance = 1.2 + Math.random() * 2.0;
    scatter[i3] = (sx / length) * distance;
    scatter[i3 + 1] = (sy / length) * distance;
    scatter[i3 + 2] = (sz / length) * distance * 0.5;

    delay[i] = Math.random() * 0.8;
    size[i] = 0.016 + Math.random() * 0.024;
    tint[i] = Math.random();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute("aStart", new THREE.BufferAttribute(start, 3));
  geo.setAttribute("aTarget", new THREE.BufferAttribute(world, 3));
  geo.setAttribute("aScatter", new THREE.BufferAttribute(scatter, 3));
  geo.setAttribute("aDelay", new THREE.BufferAttribute(delay, 1));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geo.setAttribute("aTint", new THREE.BufferAttribute(tint, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50);
  return geo;
}

function Particles({ stateRef }: { stateRef: { current: LoaderState } }) {
  const geometry = useMemo(() => buildParticlesGeometry(COUNT), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: LOADER_VERTEX,
        fragmentShader: LOADER_FRAGMENT,
        uniforms: {
          uAssemble: { value: 0 },
          uDisperse: { value: 0 },
          uFade: { value: 1 },
          uTime: { value: 0 },
          uPointScale: { value: 800 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  useFrame((state) => {
    material.uniforms.uAssemble.value = stateRef.current.assemble;
    material.uniforms.uDisperse.value = stateRef.current.disperse;
    material.uniforms.uFade.value = stateRef.current.fade;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    const camera = state.camera as THREE.PerspectiveCamera;
    const fov = camera.fov ?? 42;
    material.uniforms.uPointScale.value =
      (state.size.height * state.gl.getPixelRatio()) /
      (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2));
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

function Contents({ stateRef }: { stateRef: { current: LoaderState } }) {
  const flameGroup = useRef<THREE.Group>(null);
  const flameReveal = useRef(0);
  const baseHeat = useRef(0.2);

  useFrame(() => {
    const s = stateRef.current;
    flameReveal.current = s.flameReveal;
    const group = flameGroup.current;
    if (group) {
      const eased = 1 - (1 - s.flameReveal) * (1 - s.flameReveal);
      group.scale.setScalar(0.55 + 0.45 * eased);
    }
  });

  return (
    <>
      <Particles stateRef={stateRef} />
      <group ref={flameGroup} scale={0.55}>
        <FlameMesh
          heatRef={baseHeat}
          revealRef={flameReveal}
          initialReveal={0}
          animate
          seed={23}
        />
      </group>
    </>
  );
}

export default function LoaderScene({
  stateRef,
  onCreated,
}: {
  stateRef: { current: LoaderState };
  onCreated: () => void;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5.8], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      frameloop="always"
      onCreated={onCreated}
      className="!absolute !inset-0"
    >
      <Contents stateRef={stateRef} />
    </Canvas>
  );
}
