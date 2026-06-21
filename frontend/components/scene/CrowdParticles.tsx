/* ─── RailGuard AI — Realistic Crowd Particles ─── */

"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulationStore } from "@/stores/simulationStore";
import { useGLTF } from "@react-three/drei";

// A predefined palette of realistic clothing colors (Jeans, shirts, jackets)
const CLOTHING_COLORS = [
  "#1A1A1A", // Black
  "#2C3E50", // Dark Blue
  "#8B4513", // Brown
  "#F5F5DC", // Beige
  "#7F8C8D", // Gray
  "#A93226", // Dark Red
  "#229954", // Green
  "#2980B9", // Blue
];

function SafeGLTFCrowd({ url, fallback, instanceCount, updateTransforms }: any) {
  const [exists, setExists] = useState<boolean | null>(null);
  
  useEffect(() => {
    fetch(url, { method: "HEAD" })
      .then((res) => setExists(res.ok))
      .catch(() => setExists(false));
  }, [url]);

  if (exists === null) return null;
  if (!exists) return fallback;

  return <LoadedGLTFCrowd url={url} instanceCount={instanceCount} updateTransforms={updateTransforms} />;
}

function LoadedGLTFCrowd({ url, instanceCount, updateTransforms }: any) {
  const { scene } = useGLTF(url as string) as any;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Find the first mesh in the GLTF to instance
  let targetGeometry: THREE.BufferGeometry | null = null;
  scene.traverse((child: THREE.Object3D) => {
    if ((child as THREE.Mesh).isMesh && !targetGeometry) {
      targetGeometry = (child as THREE.Mesh).geometry;
    }
  });

  useFrame(() => {
    if (meshRef.current) {
      updateTransforms(meshRef.current);
    }
  });

  if (!targetGeometry) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[targetGeometry, new THREE.MeshStandardMaterial({ color: "#888" }), instanceCount]}
      castShadow
      receiveShadow
    />
  );
}

const EMPTY_PARTICLES: any[] = [];

export function CrowdParticles() {
  const particles = useSimulationStore((s: any) => s.particles || EMPTY_PARTICLES);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Precompute random colors for each possible particle slot to persist clothing colors
  const colorArray = useMemo(() => {
    const array = new Float32Array(5000 * 3);
    const color = new THREE.Color();
    for (let i = 0; i < 5000; i++) {
      color.set(CLOTHING_COLORS[Math.floor(Math.random() * CLOTHING_COLORS.length)]);
      color.toArray(array, i * 3);
    }
    return array;
  }, []);

  const updateTransforms = (instancedMesh: THREE.InstancedMesh) => {
    particles.forEach((p: any, i: number) => {
      dummy.position.set(p.x, 0.4, p.z); // y=0.4 so they stand on the ground
      // Random subtle rotation so they don't all face the exact same way
      dummy.rotation.y = (p.id * 0.1) % (Math.PI * 2);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
      
      const r = colorArray[i * 3];
      const g = colorArray[i * 3 + 1];
      const b = colorArray[i * 3 + 2];
      instancedMesh.setColorAt(i, new THREE.Color(r, g, b));
    });
    instancedMesh.count = particles.length;
    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
  };

  const fallbackPrimitive = (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, 5000]}
      castShadow
      receiveShadow
    >
      {/* Simple primitive humanoid fallback (Cylinder) */}
      <cylinderGeometry args={[0.15, 0.15, 0.8, 8]} />
      <meshStandardMaterial roughness={0.8} metalness={0.1} />
    </instancedMesh>
  );

  // We only run useFrame manually for the fallback, SafeGLTFCrowd handles it internally for the loaded GLB
  useFrame(() => {
    if (meshRef.current) {
      updateTransforms(meshRef.current);
    }
  });

  if (particles.length === 0) return null;

  return (
    <group>
      <SafeGLTFCrowd 
        url="/models/character.glb" 
        fallback={fallbackPrimitive}
        instanceCount={5000}
        updateTransforms={updateTransforms}
      />
    </group>
  );
}
