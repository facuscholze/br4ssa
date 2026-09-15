"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { FlameMesh } from "./flame";
import { SparkSystem, type SparkControl } from "./sparks";

/**
 * Dynamic 3D Scene for the Hero section.
 *
 * Drives:
 * - Fluid thermodynamic state machine: baseHeat (rest <-> hover) + click surges ("avivamiento").
 * - Multi-source dynamic combustion lighting (core point light + ember bed point light).
 * - Aerodynamic cursor tilt & convective flame drag.
 * - Dynamic halo synchronization.
 */
function Scene({
  reducedMotion,
  haloRef,
}: {
  reducedMotion: boolean;
  haloRef: { current: HTMLDivElement | null };
}) {
  const groupRef = useRef<THREE.Group>(null);
  const coreLightRef = useRef<THREE.PointLight>(null);
  const bedLightRef = useRef<THREE.PointLight>(null);

  const baseHeat = useRef(0);
  const spike = useRef(0);
  const driveRef = useRef(0);
  const revealRef = useRef(reducedMotion ? 1 : 0);
  const hoverRef = useRef(false);
  const controlRef = useRef<SparkControl>({ heat: 0, burst: 0 });
  const tilt = useRef({ x: 0, y: 0 });
  const { size } = useThree();
  const fit = THREE.MathUtils.clamp(
    Math.min(size.width / 700, size.height / 560),
    0.62,
    1.08
  );

  // Intro: the flame ignites right after the loader hands off.
  useEffect(() => {
    if (reducedMotion) return;
    let cancelled = false;
    import("gsap").then(({ default: gsap }) => {
      if (cancelled) return;
      gsap.to(revealRef, {
        current: 1,
        duration: 1.0,
        delay: 0.1,
        ease: "power2.out",
      });
    });
    return () => {
      cancelled = true;
    };
  }, [reducedMotion]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group || reducedMotion) return;
    const dt = Math.min(delta, 0.05);

    // Heat state machine: fast attack on hover-in, gentle release on out.
    const target = hoverRef.current ? 1 : 0;
    const rate = target > baseHeat.current ? 6.5 : 2.0;
    baseHeat.current += (target - baseHeat.current) * (1 - Math.exp(-dt * rate));
    spike.current *= Math.exp(-dt * 1.9); // ~1.5s to settle after a click
    const drive = Math.min(baseHeat.current + spike.current * 1.25, 2.0);
    driveRef.current = drive;
    controlRef.current.heat = drive;

    // Subtle sway + cursor aerodynamic tilt
    const t = state.clock.elapsedTime;
    const lerp = Math.min(delta * 3.4, 1);
    tilt.current.x += (state.pointer.x * 0.18 - tilt.current.x) * lerp;
    tilt.current.y += (state.pointer.y * -0.12 - tilt.current.y) * lerp;

    group.rotation.y =
      Math.sin(t * 0.45) * 0.14 * (1 + drive * 0.35) + tilt.current.x;
    group.rotation.z =
      Math.sin(t * 0.9 + 1.3) * 0.028 * (1 + drive * 0.85) + tilt.current.y;
    group.scale.setScalar(fit * (0.92 + 0.08 * Math.min(1, revealRef.current)));

    // Dynamic combustion lighting flicker
    if (coreLightRef.current) {
      const flicker1 = Math.sin(t * 14.0) * 0.2 + Math.cos(t * 23.0) * 0.15;
      coreLightRef.current.intensity = (2.6 + flicker1 + drive * 2.2);
    }
    if (bedLightRef.current) {
      const flicker2 = Math.cos(t * 11.0) * 0.18;
      bedLightRef.current.intensity = (1.8 + flicker2 + drive * 1.6);
    }

    // Synchronize CSS halo with combustion drive
    if (haloRef.current) {
      haloRef.current.style.opacity = String(
        Math.min(0.52 + drive * 0.44, 0.98)
      );
    }
  });

  const onMove = (event: ThreeEvent<PointerEvent>) => {
    if (event.nativeEvent.pointerType === "mouse") hoverRef.current = true;
  };

  const onLeave = () => {
    hoverRef.current = false;
  };

  const onClick = () => {
    if (reducedMotion) return;
    spike.current = 1.25; // "avivamiento"
    controlRef.current.burst = 36;
  };

  return (
    <group ref={groupRef} scale={fit}>
      {/* Dynamic volumetric fire lights */}
      <pointLight
        ref={coreLightRef}
        position={[0, 0.25, 0.6]}
        color="#ffe2a0"
        distance={9}
        decay={2}
      />
      <pointLight
        ref={bedLightRef}
        position={[0, -0.65, 0.4]}
        color="#ff5511"
        distance={6}
        decay={2}
      />

      <group position={[0, 0.12, 0]}>
        <FlameMesh
          heatRef={driveRef}
          revealRef={revealRef}
          initialReveal={reducedMotion ? 1 : 0}
          animate={!reducedMotion}
          showCharcoal={true}
          seed={11}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          onClick={onClick}
        />
        {!reducedMotion && (
          <SparkSystem controlRef={controlRef} base={{ x: 0, y: -0.68, z: 0 }} />
        )}
      </group>
    </group>
  );
}

/**
 * The hero's 3D flame scene. Loaded via next/dynamic (ssr: false).
 */
export default function HeroFlameScene({
  reducedMotion,
  haloRef,
}: {
  reducedMotion: boolean;
  haloRef: { current: HTMLDivElement | null };
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.12, 6.2], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={reducedMotion ? "demand" : "always"}
      className="!absolute !inset-0"
    >
      <Scene reducedMotion={reducedMotion} haloRef={haloRef} />
    </Canvas>
  );
}
