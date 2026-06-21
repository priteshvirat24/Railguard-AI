/* ─── RailGuard AI — Realistic Station World ─── */

"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulationStore } from "@/stores/simulationStore";
import { PlatformMesh } from "./PlatformMesh";
import { TrainMesh } from "./TrainMesh";
import { TrackMesh } from "./TrackMesh";
import { CrowdParticles } from "./CrowdParticles";
import { HeatmapField } from "./HeatmapField";

export function StationWorld() {
  const platforms = useSimulationStore((s) => s.platforms);
  const trains = useSimulationStore((s) => s.trains);
  const tracks = useSimulationStore((s) => s.tracks);
  const forecastMode = useSimulationStore((s) => s.forecastMode);
  const forecasts = useSimulationStore((s) => s.forecasts);

  return (
    <group>
      {/* Realistic Ground Plane (Asphalt/Concrete base) */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.05, 0]} 
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <SafeTextureMaterial 
          prefix="asphalt"
          fallbackColor="#3E4042" 
          roughness={0.9} 
          metalness={0.1} 
        />
      </mesh>

      {/* Decorative concrete pavement areas around tracks */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.03, 0]} 
        receiveShadow
      >
        <planeGeometry args={[40, 40]} />
        <SafeTextureMaterial 
          prefix="concrete"
          fallbackColor="#5C5E60" 
          roughness={0.95} 
          metalness={0.05} 
        />
      </mesh>

      {/* Station concourse (Realistic brick/glass building) */}
      <StationConcourse />

      {/* Tracks */}
      {tracks.length > 0 ? (
        tracks.map((track) => (
          <TrackMesh key={track.id} track={track} />
        ))
      ) : (
        <DefaultTracks />
      )}

      {/* Platforms */}
      {platforms.length > 0 ? (
        platforms.map((platform) => (
          <PlatformMesh key={platform.id} platform={platform} />
        ))
      ) : (
        <DefaultPlatforms />
      )}

      {/* Trains */}
      {trains.map((train) => (
        <TrainMesh key={train.id} train={train} />
      ))}

      {/* Crowd particles (realistic colors) */}
      <CrowdParticles />

      {/* Heatmap overlay (Subtle AR visualization on ground) */}
      <HeatmapField />

      {/* Forecast ghost overlay */}
      {forecastMode && forecasts.length > 0 && (
        <ForecastGhost forecasts={forecasts} />
      )}
    </group>
  );
}

/* ─── GLTF Safe Loader Component ─── */
import { useState, useEffect } from "react";
import { useGLTF } from "@react-three/drei";

function SafeGLTF({ url, fallback, ...props }: { url: string, fallback: React.ReactNode, [key: string]: any }) {
  const [exists, setExists] = useState<boolean | null>(null);
  
  useEffect(() => {
    fetch(url, { method: "HEAD" })
      .then((res) => setExists(res.ok))
      .catch(() => setExists(false));
  }, [url]);

  if (exists === null) return null; // loading state
  if (!exists) return <>{fallback}</>;

  return <LoadedGLTF url={url} {...props} />;
}

function LoadedGLTF({ url, ...props }: { url: string, [key: string]: any }) {
  const { scene } = useGLTF(url);
  // Clone to allow multiple instances if needed, and ensure it can be mutated
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  return <primitive object={clonedScene} {...props} />;
}

/* ─── Realistic Station Concourse ─── */
import { SafeTextureMaterial } from "./SafeTextureMaterial";

function StationConcourse() {
  const fallbackPrimitive = (
    <group position={[0, 0, 0]}>
      {/* Main Building Base (Concrete/Brick) */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[30, 3, 6]} />
        <SafeTextureMaterial prefix="brick" fallbackColor="#8B5A2B" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Large Glass Windows Front */}
      <mesh position={[0, 1.5, 3.05]} castShadow>
        <boxGeometry args={[20, 2.5, 0.1]} />
        <meshPhysicalMaterial
          color="#87CEEB"
          metalness={0.9}
          roughness={0.1}
          transmission={0.8}
          thickness={0.5}
        />
      </mesh>

      {/* Large Glass Windows Back */}
      <mesh position={[0, 1.5, -3.05]} castShadow>
        <boxGeometry args={[20, 2.5, 0.1]} />
        <meshPhysicalMaterial
          color="#87CEEB"
          metalness={0.9}
          roughness={0.1}
          transmission={0.8}
          thickness={0.5}
        />
      </mesh>

      {/* Window Frames / Mullions */}
      {[-9, -4.5, 0, 4.5, 9].map((x, i) => (
        <group key={`mullion-${i}`}>
          <mesh position={[x, 1.5, 3.1]} castShadow>
            <boxGeometry args={[0.2, 2.5, 0.1]} />
            <SafeTextureMaterial prefix="metal" fallbackColor="#2C3539" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[x, 1.5, -3.1]} castShadow>
            <boxGeometry args={[0.2, 2.5, 0.1]} />
            <SafeTextureMaterial prefix="metal" fallbackColor="#2C3539" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Main Roof (Corrugated Metal/Concrete) */}
      <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[32, 0.4, 8]} />
        <SafeTextureMaterial prefix="concrete" fallbackColor="#D3D3D3" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Roof Skylight */}
      <mesh position={[0, 3.45, 0]}>
        <boxGeometry args={[20, 0.1, 3]} />
        <meshPhysicalMaterial
          color="#E0FFFF"
          metalness={0.8}
          roughness={0.1}
          transmission={0.9}
          thickness={0.2}
        />
      </mesh>

      {/* Main Station Entrance Awning */}
      <mesh position={[0, 2, 4]} castShadow>
        <boxGeometry args={[10, 0.2, 2]} />
        <SafeTextureMaterial prefix="metal" fallbackColor="#2C3539" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Entrance Pillars */}
      {[-4.8, 4.8].map((x, i) => (
        <mesh key={`awning-pillar-${i}`} position={[x, 1, 4.8]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 2, 8]} />
          <SafeTextureMaterial prefix="metal" fallbackColor="#A9A9A9" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {/* "RAILGUARD AI" Station Sign (Realistic) */}
      <mesh position={[0, 3.6, 4.05]}>
        <boxGeometry args={[6, 1, 0.2]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.6, 4.16]}>
        <planeGeometry args={[5, 0.6]} />
        <meshStandardMaterial color="#fff" emissive="#FFD700" emissiveIntensity={2} />
      </mesh>
    </group>
  );

  return (
    <SafeGLTF 
      url="/models/station.glb" 
      fallback={fallbackPrimitive} 
      position={[0, 0, 0]} 
      scale={1} // The user might need to adjust this scale depending on their model
    />
  );
}

/* ─── Default platforms when no data yet ─── */
function DefaultPlatforms() {
  const defaultPositions = [
    { id: 1, x: -12, z: -8 },
    { id: 2, x: -4, z: -8 },
    { id: 3, x: 4, z: -8 },
    { id: 4, x: 12, z: -8 },
    { id: 5, x: -8, z: 8 },
    { id: 6, x: 8, z: 8 },
  ];

  return (
    <>
      {defaultPositions.map((p) => (
        <PlatformMesh
          key={p.id}
          platform={{
            id: p.id,
            name: `Platform ${p.id}`,
            capacity: 400,
            x: p.x,
            z: p.z,
            currentDensity: 0.2,
            passengerCount: 80,
            state: "NORMAL",
            inflowRate: 5,
            outflowRate: 3,
            isClosed: false,
          }}
        />
      ))}
    </>
  );
}

/* ─── Default tracks ─── */
function DefaultTracks() {
  const defaultTracks = [
    { id: 1, platformIds: [1, 2], z: -12, hasSignalFailure: false },
    { id: 2, platformIds: [2, 3], z: -4, hasSignalFailure: false },
    { id: 3, platformIds: [3, 4], z: 4, hasSignalFailure: false },
    { id: 4, platformIds: [5, 6], z: 12, hasSignalFailure: false },
  ];

  return (
    <>
      {defaultTracks.map((t) => (
        <TrackMesh key={t.id} track={t} />
      ))}
    </>
  );
}

/* ─── Forecast Ghost Overlay (Kept simple as AR visualization) ─── */
function ForecastGhost({ forecasts }: { forecasts: any[] }) {
  const forecast15 = forecasts.filter((f: any) => f.minutesAhead === 15);

  return (
    <group>
      {forecast15.map((f: any) => {
        const platform = useSimulationStore.getState().platforms.find(
          (p) => p.id === f.platformId
        );
        if (!platform) return null;

        const color =
          f.predictedState === "CRITICAL"
            ? "#FF4D4D"
            : f.predictedState === "WARNING"
              ? "#F97316"
              : f.predictedState === "CONGESTING"
                ? "#F59E0B"
                : "#00C8FF";

        return (
          <mesh
            key={`ghost-${f.platformId}`}
            position={[platform.x, 0.15, platform.z]}
          >
            <boxGeometry args={[6, 0.1, 3]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.15 + f.predictedDensity * 0.25}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
