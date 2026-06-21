/* ─── RailGuard AI — Camera Controller ─── */

"use client";

import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { useSimulationStore } from "@/stores/simulationStore";

export function CameraController() {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const introComplete = useRef(false);
  const introProgress = useRef(0);
  const mouseX = useRef(0);
  const mouseY = useRef(0);

  const cinematicMode = useSimulationStore((s) => s.cinematicMode);
  const setCinematicMode = useSimulationStore((s) => s.setCinematicMode);

  // Animation states
  const cinematicProgress = useRef(0);
  const savedPos = useRef(new THREE.Vector3());
  const savedLook = useRef(new THREE.Vector3());

  // Starting camera position (high up, far away)
  const startPos = useRef(new THREE.Vector3(40, 50, 40));
  // Target camera position
  const endPos = useRef(new THREE.Vector3(0, 22, 28));
  // Target look-at
  const lookAt = useRef(new THREE.Vector3(0, 0, -2));

  useEffect(() => {
    camera.position.copy(startPos.current);
    camera.lookAt(lookAt.current);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.current = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY.current = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [camera]);

  // When cinematic mode starts, save current camera state
  useEffect(() => {
    if (cinematicMode) {
      cinematicProgress.current = 0;
      savedPos.current.copy(camera.position);
      if (controlsRef.current) {
        savedLook.current.copy(controlsRef.current.target);
        controlsRef.current.enabled = false;
      }
    }
  }, [cinematicMode, camera]);

  useFrame((state, delta) => {
    if (cinematicMode) {
      // Cinematic Flyby Sequence (approx 5 seconds long)
      cinematicProgress.current += delta;
      const t = cinematicProgress.current;

      if (t < 2.0) {
        // Phase 1: Swoop down to ground level fast
        const alpha = easeInOutCubic(Math.min(1, t / 2.0));
        const trackLevelPos = new THREE.Vector3(25, 1.5, 4); // Down on the tracks
        const trackLookAt = new THREE.Vector3(-20, 1.5, 4);  // Looking down the track

        camera.position.lerpVectors(savedPos.current, trackLevelPos, alpha);
        
        // Custom lookAt interpolation
        const currentLook = new THREE.Vector3().lerpVectors(savedLook.current, trackLookAt, alpha);
        camera.lookAt(currentLook);

      } else if (t < 4.0) {
        // Phase 2: High speed train tracking (Smooth)
        // Move camera alongside an imaginary train
        const progress = (t - 2.0) / 2.0;
        camera.position.x = 25 - (progress * 50); // Move from x=25 to x=-25
        
        camera.position.y = 1.5;
        camera.position.z = 4;
        
        camera.lookAt(new THREE.Vector3(camera.position.x - 10, 1.5, 4));

      } else if (t < 6.0) {
        // Phase 3: Smooth boom up to original overview
        const alpha = easeInOutCubic(Math.min(1, (t - 4.0) / 2.0));
        const endOfTrackPos = new THREE.Vector3(-25, 1.5, 4);
        
        camera.position.lerpVectors(endOfTrackPos, endPos.current, alpha);
        
        const currentLook = new THREE.Vector3().lerpVectors(new THREE.Vector3(-35, 1.5, 4), lookAt.current, alpha);
        camera.lookAt(currentLook);

      } else {
        // End cinematic mode
        setCinematicMode(false);
        if (controlsRef.current) {
          controlsRef.current.target.copy(lookAt.current);
          controlsRef.current.enabled = true;
        }
      }
      return;
    }

    if (!introComplete.current) {
      introProgress.current = Math.min(1, introProgress.current + delta * 0.2);
      const t = easeInOutCubic(introProgress.current);

      camera.position.lerpVectors(startPos.current, endPos.current, t);
      camera.lookAt(lookAt.current);

      if (introProgress.current >= 1) {
        introComplete.current = true;
        if (controlsRef.current) {
          controlsRef.current.target.copy(lookAt.current);
          controlsRef.current.enabled = true;
        }
      }
    } else {
      const parallaxX = mouseX.current * 0.3;
      const parallaxY = mouseY.current * 0.15;

      if (controlsRef.current) {
        controlsRef.current.target.x +=
          (parallaxX - controlsRef.current.target.x) * 0.02;
        controlsRef.current.target.y +=
          (parallaxY + lookAt.current.y - controlsRef.current.target.y) * 0.02;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={false}
      enableDamping
      dampingFactor={0.05}
      minDistance={10}
      maxDistance={60}
      maxPolarAngle={Math.PI / 2.2}
      minPolarAngle={0.2}
    />
  );
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
