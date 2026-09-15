"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { FlameMesh } from "./flame";
import { SparkSystem, type SparkControl } from "./sparks";

function Scene({
  reducedMotion,
  haloRef,
}: {
  reducedMotion: boolean;
  haloRef: { current: HTMLDivElement | null };
}) {
  const groupRef = useRef<THREE.Group>(null);
  const coreLightRef = useRef<THREE.PointLight>(null);

  const baseHeat = useRef(0);
  const spike = useRef(0);
  const driveRef = useRef(0);
  const revealRef = useRef(reducedMotion ? 1 : 0);
  const hoverRef = useRef(false);
  const controlRef = useRef<SparkControl>({ heat: 0, burst: 0 });
  const tilt = useRef({ x: 0, y: 0 });
  const { size } = useThree();

  // Scale fits comfortably inside viewport with generous margin
  const fit = THREE.MathUtils.clamp(
    Math.min(size.width / 750, size.height / 600),
    0.58,
    0.95
  );

  useEffect(() => {
    if (reducedMotion) return;
    let cancelled = false;
    import("gsap").then(({ default: gsap }) => {
      if (cancelled) return;
      gsap.to(revealRef, {
        current: 1,
        duration: 0.8,
        delay: 0.05,
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

    // Heat response
    const target = hoverRef.current ? 1 : 0;
    const rate = target > baseHeat.current ? 5.0 : 2.0;
    baseHeat.current += (target - baseHeat.current) * (1 - Math.exp(-dt * rate));
    spike.current *= Math.exp(-dt * 2.0);
    const drive = Math.min(baseHeat.current + spike.current * 1.1, 1.6);
    driveRef.current = drive;
    controlRef.current.heat = drive;

    // Smooth aerodynamic sway
    const t = state.clock.elapsedTime;
    const lerp = Math.min(delta * 3.0, 1);
    tilt.current.x += (state.pointer.x * 0.12 - tilt.current.x) * lerp;
    tilt.current.y += (state.pointer.y * -0.08 - tilt.current.y) * lerp;

    group.rotation.y =
      Math.sin(t * 0.4) * 0.10 * (1 + drive * 0.3) + tilt.current.x;
    group.rotation.z =
      Math.sin(t * 0.8 + 1.2) * 0.02 * (1 + drive * 0.6) + tilt.current.y;
    group.scale.setScalar(fit * (0.94 + 0.06 * Math.min(1, revealRef.current)));

    // Subtle warm light pulse
    if (coreLightRef.current) {
      const flicker = Math.sin(t * 8.0) * 0.1;
      coreLightRef.current.intensity = (1.4 + flicker + drive * 0.8);
    }

    if (haloRef.current) {
      haloRef.current.style.opacity = String(
        Math.min(0.45 + drive * 0.35, 0.85)
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
    spike.current = 1.0;
    controlRef.current.burst = 18;
  };

  return (
    <group ref={groupRef} scale={fit}>
      <pointLight
        ref={coreLightRef}
        position={[0, 0.1, 0.5]}
        color="#ffa834"
        distance={7}
        decay={2}
      />

      <group position={[0, 0.05, 0]}>
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
          <SparkSystem controlRef={controlRef} base={{ x: 0, y: -0.55, z: 0 }} />
        )}
      </group>
    </group>
  );
}

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
      camera={{ position: [0, 0.08, 6.0], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={reducedMotion ? "demand" : "always"}
      className="!absolute !inset-0"
    >
      <Scene reducedMotion={reducedMotion} haloRef={haloRef} />
    </Canvas>
  );
}
