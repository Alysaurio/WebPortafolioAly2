import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointLight,
} from "three";
import type { CubeController } from "../interaction/CubeController";

interface CoreLightProps {
  controller: CubeController;
}

export const CoreLight = ({ controller }: CoreLightProps) => {
  const light = useRef<PointLight>(null);
  const core = useRef<Mesh>(null);
  const glow = useRef<Mesh>(null);

  useFrame(() => {
    if (light.current) {
      light.current.intensity = controller.coreIntensity * 6.5;
    }
    if (core.current) {
      const material = core.current.material as MeshStandardMaterial;
      material.emissiveIntensity = 2.5 + controller.coreIntensity * 0.22;
    }
    if (glow.current) {
      const material = glow.current.material as MeshBasicMaterial;
      material.opacity = 0.035 + controller.coreIntensity * 0.0025;
      const scale = 1.8 + controller.coreIntensity * 0.012;
      glow.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      <pointLight
        ref={light}
        color="#b8dcff"
        intensity={12}
        distance={3.4}
        decay={2}
      />
      <mesh ref={core}>
        <icosahedronGeometry args={[0.052, 2]} />
        <meshStandardMaterial
          color="#05080b"
          emissive="#d7edff"
          emissiveIntensity={3}
          roughness={0.2}
          metalness={0}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={glow}>
        <sphereGeometry args={[0.15, 24, 24]} />
        <meshBasicMaterial
          color="#8bb8da"
          transparent
          opacity={0.05}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};
