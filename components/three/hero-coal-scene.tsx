"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { CoalMesh } from "./coal";
import { SparkSystem, type SparkHit } from "./sparks";

function Scene({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const spin = useRef(0);
  const tilt = useRef({ x: 0, y: 0 });
  const revealRef = useRef(reducedMotion ? 1 : 0);
  const hitRef = useRef<SparkHit>({
    point: new THREE.Vector3(),
    normal: new THREE.Vector3(0, 1, 0),
    speed: 0,
    active: false,
  });
  const { size } = useThree();
  const fit = THREE.MathUtils.clamp(
    Math.min(size.width / 760, size.height / 620),
    0.5,
    1.05
  );

  // Intro: the coal wakes up after the loader hands off.
  useEffect(() => {
    if (reducedMotion) return;
    let cancelled = false;
    import("gsap").then(({ default: gsap }) => {
      if (cancelled) return;
      gsap.to(revealRef, {
        current: 1,
        duration: 0.9,
        delay: 0.12,
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
    spin.current += delta * 0.16;
    const lerp = Math.min(delta * 3.2, 1);
    tilt.current.x += (state.pointer.x * 0.32 - tilt.current.x) * lerp;
    tilt.current.y += (state.pointer.y * -0.2 - tilt.current.y) * lerp;
    group.rotation.y = spin.current + tilt.current.x;
    group.rotation.x =
      tilt.current.y + Math.sin(state.clock.elapsedTime * 0.5) * 0.04;
  });

  const onHover = (event: ThreeEvent<PointerEvent>) => {
    if (reducedMotion || !event.face) return;
    const hit = hitRef.current;
    hit.point.copy(event.point);
    hit.normal.copy(event.face.normal).transformDirection(event.object.matrixWorld);
    hit.speed = Math.min(Math.max(event.delta, 0) / 60, 3);
    hit.active = true;
  };

  const onLeave = () => {
    hitRef.current.active = false;
  };

  return (
    <group ref={groupRef}>
      <group scale={fit}>
        <group position={[0, 0.05, 0]}>
          <CoalMesh
            seed={11}
            revealRef={revealRef}
            animate={!reducedMotion}
            initialReveal={reducedMotion ? 1 : 0}
            onHover={onHover}
            onLeave={onLeave}
          />
        </group>
        {!reducedMotion && (
          <SparkSystem
            hitRef={hitRef}
            ambient={{ x: 0, y: 0.95, z: 0 }}
          />
        )}
      </group>
    </group>
  );
}

/**
 * The hero's 3D coal. Loaded via next/dynamic (ssr: false) so three.js stays
 * out of the initial bundle; mounted only while the hero is on screen.
 */
export default function HeroCoalScene({
  reducedMotion,
}: {
  reducedMotion: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.12, 6.2], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={reducedMotion ? "demand" : "always"}
      className="!absolute !inset-0"
    >
      <Scene reducedMotion={reducedMotion} />
    </Canvas>
  );
}
