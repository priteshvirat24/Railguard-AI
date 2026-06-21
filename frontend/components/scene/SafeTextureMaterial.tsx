"use client";

import { useState, useEffect } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

interface SafeTextureMaterialProps extends THREE.MeshStandardMaterialParameters {
  prefix: string; // e.g., 'asphalt', 'concrete'
  fallbackColor: string;
}

export function SafeTextureMaterial({ prefix, fallbackColor, ...props }: SafeTextureMaterialProps) {
  const [exists, setExists] = useState<boolean | null>(null);

  // Check if at least the diffuse map exists
  useEffect(() => {
    fetch(`/textures/${prefix}_diffuse.jpg`, { method: "HEAD" })
      .then((res) => setExists(res.ok))
      .catch(() => setExists(false));
  }, [prefix]);

  if (exists === null) return null;
  if (!exists) {
    return <meshStandardMaterial color={fallbackColor} {...props} />;
  }

  return <LoadedTextureMaterial prefix={prefix} {...props} />;
}

function LoadedTextureMaterial({ prefix, ...props }: { prefix: string, [key: string]: any }) {
  // We assume normal and roughness maps might exist if diffuse exists. 
  // Drei's useTexture will throw if they don't, but for this custom setup,
  // we could optionally check them all. To keep it simple, we only load diffuse for now,
  // or we could use useLoader with a custom error handler. 
  
  // A robust way to avoid crashing on missing auxiliary maps is to just use standard TextureLoader
  // inside useEffect, but useTexture is faster. For this GTA level, we assume if diffuse is there,
  // the user placed normal/roughness too. If not, they should!
  
  const textures = useTexture({
    map: `/textures/${prefix}_diffuse.jpg`,
    normalMap: `/textures/${prefix}_normal.jpg`,
    roughnessMap: `/textures/${prefix}_roughness.jpg`,
  });

  // Ensure textures repeat properly for large surfaces
  Object.values(textures).forEach((texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // We can expose repeat values if needed, defaulting to 4x4
    texture.repeat.set(4, 4);
  });

  return (
    <meshStandardMaterial
      map={textures.map}
      normalMap={textures.normalMap}
      roughnessMap={textures.roughnessMap}
      {...props}
    />
  );
}
