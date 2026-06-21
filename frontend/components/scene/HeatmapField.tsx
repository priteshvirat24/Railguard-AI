/* ─── RailGuard AI — Heatmap Field ─── */

"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulationStore } from "@/stores/simulationStore";

export function HeatmapField() {
  const platforms = useSimulationStore((s) => s.platforms);
  const groupRef = useRef<THREE.Group>(null);

  // Create heatmap circles for each platform
  return (
    <group ref={groupRef}>
      {platforms.map((platform) => (
        <HeatmapCircle
          key={platform.id}
          x={platform.x}
          z={platform.z}
          density={platform.currentDensity}
          state={platform.state}
        />
      ))}
    </group>
  );
}

function HeatmapCircle({
  x,
  z,
  density,
  state,
}: {
  x: number;
  z: number;
  density: number;
  state: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const color = useMemo(() => {
    if (state === "CRITICAL") return new THREE.Color("#FF4D4D");
    if (state === "WARNING") return new THREE.Color("#F97316");
    if (state === "CONGESTING") return new THREE.Color("#F59E0B");
    if (state === "MITIGATING") return new THREE.Color("#A855F7");
    if (state === "RECOVERING") return new THREE.Color("#10B981");
    return new THREE.Color("#00C8FF");
  }, [state]);

  const targetRadius = useMemo(() => {
    return 2 + density * 5; // Radius grows with density
  }, [density]);

  const currentRadius = useRef(targetRadius);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    // Smooth radius transition
    currentRadius.current += (targetRadius - currentRadius.current) * 0.03;

    const scale = currentRadius.current;
    meshRef.current.scale.set(scale, scale, 1);

    // Pulse opacity
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    const baseOpacity = Math.min(0.25, density * 0.3);
    mat.opacity = baseOpacity + Math.sin(clock.elapsedTime * 1.5) * 0.03;
  });

  // Only show heatmap if there's notable density
  if (density < 0.1) return null;

  return (
    <mesh
      ref={meshRef}
      position={[x, 0.05, z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <circleGeometry args={[1, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.15}
        toneMapped={false}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
