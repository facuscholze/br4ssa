"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { FlameMesh } from "./flame";
import { SparkSystem, type SparkControl } from "./sparks";

/**
 * The three interaction states are one scalar: `drive` = baseHeat (smoothed
 * 0↔1 by hover) + decaying click spike. The flame shader, the spark system,
 * the sway and the halo all read the same value, so rest/hover/surge feel
 * like degrees of the same fire, never different objects.
 *
 * Mouse: hover sets baseHeat target 1 (fast in, slow out).
 * Click/tap: spike ≈ 1.15, decaying over ~1.5s (exp), + a spark burst.
 * Touch: no persistent hover (pointerType check) — the tap is the spike.
 */
function Scene({
  reducedMotion,
  haloRef,
}: {
  reducedMotion: boolean;
  haloRef: { current: HTMLDivElement | null };
}) {
  const groupRef = useRef<THREE.Group>(null);
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
    1.05
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
    const drive = Math.min(baseHeat.current + spike.current * 1.15, 1.7);
    driveRef.current = drive;
    controlRef.current.heat = drive;

    // Subtle sway (a real flame doesn't spin) + cursor tilt.
    const t = state.clock.elapsedTime;
    const lerp = Math.min(delta * 3.2, 1);
    tilt.current.x += (state.pointer.x * 0.16 - tilt.current.x) * lerp;
    tilt.current.y += (state.pointer.y * -0.1 - tilt.current.y) * lerp;
    group.rotation.y =
      Math.sin(t * 0.4) * 0.15 * (1 + drive * 0.35) + tilt.current.x;
    group.rotation.z =
      Math.sin(t * 0.85 + 1.3) * 0.026 * (1 + drive * 0.9) + tilt.current.y;
    group.scale.setScalar(fit * (0.9 + 0.1 * Math.min(1, revealRef.current)));

    // The CSS halo breathes with the fire (opacity over the inner animated
    // .hero-halo, so the keyframe animation keeps running underneath).
    if (haloRef.current) {
      haloRef.current.style.opacity = String(
        Math.min(0.5 + drive * 0.42, 0.95)
      );
    }
  });

  const onMove = (event: ThreeEvent<PointerEvent>) => {
    // Mouse only: touch drags must not leave a persistent hover state.
    if (event.nativeEvent.pointerType === "mouse") hoverRef.current = true;
  };

  const onLeave = () => {
    hoverRef.current = false;
  };

  const onClick = () => {
    if (reducedMotion) return;
    spike.current = 1.15; // "leña por un instante"
    controlRef.current.burst = 28;
  };

  return (
    <group ref={groupRef} scale={fit}>
      <group position={[0, 0.12, 0]}>
        <FlameMesh
          heatRef={driveRef}
          revealRef={revealRef}
          initialReveal={reducedMotion ? 1 : 0}
          animate={!reducedMotion}
          seed={11}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          onClick={onClick}
        />
        {!reducedMotion && (
          <SparkSystem controlRef={controlRef} base={{ x: 0, y: -0.62, z: 0 }} />
        )}
      </group>
    </group>
  );
}

/**
 * The hero's 3D flame. Loaded via next/dynamic (ssr: false) so three.js
 * stays out of the initial bundle; mounted only while the hero is on screen.
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
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.12, 6.2], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={reducedMotion ? "demand" : "always"}
      className="!absolute !inset-0"
    >
      <Scene reducedMotion={reducedMotion} haloRef={haloRef} />
    </Canvas>
  );
}
