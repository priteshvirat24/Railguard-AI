/* ─── RailGuard AI — Realistic Main 3D Station Scene ─── */

"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { EffectComposer, Bloom, DepthOfField } from "@react-three/postprocessing";
import { Sky, Environment } from "@react-three/drei";
import { StationWorld } from "./StationWorld";
import { CameraController } from "./CameraController";

export function StationScene() {
  return (
    <div className="absolute inset-0" id="station-scene">
      <Canvas
        shadows
        camera={{ position: [0, 25, 40], fov: 45 }}
        gl={{ antialias: true, alpha: false, toneMappingExposure: 1.2 }}
        dpr={[1, 2]}
        style={{ background: "#87CEEB" }}
      >
        <Suspense fallback={null}>
          <CameraController />
          
          {/* Realistic Sky and Environment lighting */}
          <Sky 
            distance={450000} 
            sunPosition={[100, 20, 100]} 
            inclination={0} 
            azimuth={0.25} 
            rayleigh={2}
            mieCoefficient={0.005}
            mieDirectionalG={0.8}
          />
          <Environment preset="city" />

          {/* Main Directional Sun Light for Shadows */}
          <directionalLight
            castShadow
            position={[50, 80, 50]}
            intensity={2}
            color="#FFF4E5"
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-40}
            shadow-camera-right={40}
            shadow-camera-top={40}
            shadow-camera-bottom={-40}
            shadow-camera-near={0.1}
            shadow-camera-far={200}
            shadow-bias={-0.0001}
          />

          {/* Ambient Fill Light */}
          <ambientLight intensity={0.6} color="#B0C4DE" />

          <StationWorld />
          <PostFX />
        </Suspense>
      </Canvas>
    </div>
  );
}

function PostFX() {
  return (
    <EffectComposer>
      {/* Subtle bloom for sun glare and metallic highlights */}
      <Bloom
        luminanceThreshold={1.5}
        luminanceSmoothing={0.9}
        intensity={0.5}
        mipmapBlur
      />
      {/* Cinematic depth of field to make it feel like a miniature realistic set */}
      <DepthOfField 
        focusDistance={0.05} 
        focalLength={0.05} 
        bokehScale={2} 
        height={480} 
      />
    </EffectComposer>
  );
}
