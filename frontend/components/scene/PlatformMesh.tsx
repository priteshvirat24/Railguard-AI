/* ─── RailGuard AI — Realistic Platform Mesh ─── */

"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Platform } from "@/lib/types";
import { Html } from "@react-three/drei";

import { SafeTextureMaterial } from "./SafeTextureMaterial";

export function PlatformMesh({ platform }: { platform: Platform }) {
  const meshRef = useRef<THREE.Group>(null);
  const displayMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Use LED colors for the display board
  const stateColors = useMemo(() => {
    return {
      NORMAL: new THREE.Color("#00C8FF"),
      CONGESTING: new THREE.Color("#F59E0B"),
      WARNING: new THREE.Color("#F97316"),
      CRITICAL: new THREE.Color("#FF4D4D"),
      MITIGATING: new THREE.Color("#A855F7"),
      RECOVERING: new THREE.Color("#10B981"),
      CLOSED: new THREE.Color("#374151"),
    } as Record<string, THREE.Color>;
  }, []);

  useFrame(() => {
    if (displayMaterialRef.current) {
      // Smoothly lerp the LED sign color based on state
      displayMaterialRef.current.emissive.lerp(
        stateColors[platform.state],
        0.05
      );
    }
  });

  return (
    <group ref={meshRef} position={[platform.x, 0, platform.z]}>
      {/* Main Concrete Platform Slab */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 0.5, 3]} />
        <SafeTextureMaterial prefix="concrete" fallbackColor="#9CA3AF" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Yellow tactile paving edge (track side) */}
      <mesh position={[0, 0.505, 1.4]} receiveShadow>
        <planeGeometry args={[6, 0.2]} />
        <meshStandardMaterial color="#EAB308" roughness={1} />
      </mesh>
      
      <mesh position={[0, 0.505, -1.4]} receiveShadow>
        <planeGeometry args={[6, 0.2]} />
        <meshStandardMaterial color="#EAB308" roughness={1} />
      </mesh>

      {/* Platform Pillars */}
      {[-2, 0, 2].map((x, i) => (
        <mesh key={`pillar-${i}`} position={[x, 1.25, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 2, 8]} />
          <SafeTextureMaterial prefix="metal" fallbackColor="#6B7280" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {/* Realistic Platform Canopy */}
      <mesh position={[0, 2.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.4, 0.1, 3.4]} />
        <SafeTextureMaterial prefix="metal" fallbackColor="#D1D5DB" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Digital Info Display Boards */}
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[1.5, 0.3, 0.1]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 2.1, 0.06]}>
        <planeGeometry args={[1.4, 0.2]} />
        <meshStandardMaterial 
          ref={displayMaterialRef}
          color="#000" 
          emissive={stateColors[platform.state]}
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Simple Benches */}
      {[-1, 1].map((x, i) => (
        <group key={`bench-${i}`} position={[x, 0.65, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.6, 0.1, 0.3]} />
            <SafeTextureMaterial prefix="wood" fallbackColor="#8B4513" roughness={0.8} />
          </mesh>
          <mesh position={[-0.2, -0.1, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.2]} />
            <SafeTextureMaterial prefix="metal" fallbackColor="#444" metalness={0.8} />
          </mesh>
          <mesh position={[0.2, -0.1, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.2]} />
            <SafeTextureMaterial prefix="metal" fallbackColor="#444" metalness={0.8} />
          </mesh>
        </group>
      ))}

      <Html position={[0, 3, 0]} center zIndexRange={[100, 0]} distanceFactor={20}>
        <div className="bg-black/80 text-white px-2 py-1 rounded text-xs font-mono pointer-events-none border border-white/20 shadow-lg">
          {platform.name}
        </div>
      </Html>
    </group>
  );
}
