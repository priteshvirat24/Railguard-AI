/* ─── RailGuard AI — Train Entity Mesh ─── */

"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Train } from "@/lib/types";
import { useSimulationStore } from "@/stores/simulationStore";
import { useGLTF } from "@react-three/drei";

function SafeGLTF({ url, fallback, ...props }: { url: string, fallback: React.ReactNode, [key: string]: any }) {
  const [exists, setExists] = useState<boolean | null>(null);
  
  useEffect(() => {
    fetch(url, { method: "HEAD" })
      .then((res) => setExists(res.ok))
      .catch(() => setExists(false));
  }, [url]);

  if (exists === null) return null;
  if (!exists) return <>{fallback}</>;

  return <LoadedGLTF url={url} {...props} />;
}

function LoadedGLTF({ url, ...props }: { url: string, [key: string]: any }) {
  const { scene } = useGLTF(url);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  return <primitive object={clonedScene} {...props} />;
}

export function TrainMesh({ train }: { train: Train }) {
  const groupRef = useRef<THREE.Group>(null);
  
  const tracks = useSimulationStore((s) => s.tracks);
  const track = tracks.find((t) => t.id === train.trackId);
  const trackZ = track ? track.z : 0;

  // Convert position to world X
  const worldX = (train.position / 100) * 40 - 20;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.x += (worldX - groupRef.current.position.x) * 0.08;
      groupRef.current.position.z = trackZ;
    }
  });

  const fallbackPrimitive = (
    <group>
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 1.2, 1.5]} />
        <meshStandardMaterial color="#E5E7EB" metalness={0.8} roughness={0.3} />
      </mesh>
      {[-1, 0, 1].map((x, i) => (
        <group key={`win-${i}`}>
          <mesh position={[x, 1.4, 0.76]}>
            <boxGeometry args={[0.6, 0.4, 0.05]} />
            <meshStandardMaterial color="#111" roughness={0.1} metalness={0.9} />
          </mesh>
          <mesh position={[x, 1.4, -0.76]}>
            <boxGeometry args={[0.6, 0.4, 0.05]} />
            <meshStandardMaterial color="#111" roughness={0.1} metalness={0.9} />
          </mesh>
        </group>
      ))}
      {[-1.5, 1.5].map((x, i) => (
        <group key={`wheel-${i}`}>
          <mesh position={[x, 0.4, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
            <meshStandardMaterial color="#333" roughness={0.8} metalness={0.5} />
          </mesh>
          <mesh position={[x, 0.4, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
            <meshStandardMaterial color="#333" roughness={0.8} metalness={0.5} />
          </mesh>
        </group>
      ))}
      <mesh position={[-2.2, 1.2, 0]} castShadow>
        <boxGeometry args={[0.4, 1.2, 1.5]} />
        <meshStandardMaterial color="#E5E7EB" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-2.41, 1.4, 0]}>
        <boxGeometry args={[0.05, 0.6, 1.3]} />
        <meshStandardMaterial color="#111" roughness={0.1} metalness={0.9} />
      </mesh>
    </group>
  );

  if (train.status === "SCHEDULED" && train.position === 0) return null;

  return (
    <group ref={groupRef} position={[worldX, 0, trackZ]}>
      <SafeGLTF 
        url="/models/train.glb" 
        fallback={fallbackPrimitive}
      />
    </group>
  );
}
