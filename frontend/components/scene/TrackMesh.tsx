/* ─── RailGuard AI — Realistic Track Mesh ─── */

"use client";

import * as THREE from "three";
import { Track } from "@/lib/types";

import { SafeTextureMaterial } from "./SafeTextureMaterial";

export function TrackMesh({ track }: { track: Track }) {
  // Generate sleepers (wooden ties)
  const sleepers = [];
  for (let x = -20; x <= 20; x += 0.8) {
    sleepers.push(
      <mesh key={`sleeper-${x}`} position={[x, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 0.1, 2.6]} />
        <SafeTextureMaterial prefix="wood" fallbackColor="#3E2723" roughness={0.9} />
      </mesh>
    );
  }

  return (
    <group position={[0, 0, track.z]}>
      {/* Track Bed (Gravel / Ballast) */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[50, 0.04, 3.2]} />
        <SafeTextureMaterial prefix="gravel" fallbackColor="#4A4A4A" roughness={1} metalness={0} />
      </mesh>

      {/* Sleepers */}
      {sleepers}

      {/* Steel Rail 1 */}
      <mesh position={[0, 0.15, 0.8]} castShadow>
        <boxGeometry args={[50, 0.15, 0.1]} />
        <SafeTextureMaterial prefix="metal" fallbackColor="#B0BEC5" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Steel Rail 2 */}
      <mesh position={[0, 0.15, -0.8]} castShadow>
        <boxGeometry args={[50, 0.15, 0.1]} />
        <SafeTextureMaterial prefix="metal" fallbackColor="#B0BEC5" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Signal Light / Block Indicator */}
      <group position={[18, 0, -2]}>
        <mesh position={[0, 1, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 2]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0, 1.8, 0]}>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0, 1.8, 0.11]}>
          <circleGeometry args={[0.08, 16]} />
          <meshStandardMaterial
            color={track.hasSignalFailure ? "#ff0000" : "#00ff00"}
            emissive={track.hasSignalFailure ? "#ff0000" : "#00ff00"}
            emissiveIntensity={2}
          />
        </mesh>
      </group>
    </group>
  );
}
