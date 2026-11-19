import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Mesh,
  ShaderMaterial,
} from "three";
import type { CubeController } from "../interaction/CubeController";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    float ends = smoothstep(0.0, 0.26, vUv.y) * smoothstep(1.0, 0.74, vUv.y);
    float pulse = 0.72 + 0.28 * sin(vUv.y * 18.0 + vUv.x * 6.2831);
    gl_FragColor = vec4(uColor, ends * pulse * uOpacity);
  }
`;

export const VolumetricBeams = ({
  controller,
}: {
  controller: CubeController;
}) => {
  const material = useMemo(() => {
    return new ShaderMaterial({
      uniforms: {
        uColor: { value: new Color("#8fb9d8") },
        uOpacity: { value: 0.12 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    });
  }, []);
  const beams = useRef<Array<Mesh | null>>([]);

  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  useFrame(() => {
    material.uniforms.uOpacity.value = controller.beamsOpacity;
    for (const beam of beams.current) {
      if (!beam) continue;
      beam.scale.setScalar(0.94 + controller.previewAmount * 0.08);
    }
  });

  return (
    <group>
      <mesh
        ref={(node) => {
          beams.current[0] = node;
        }}
      >
        <cylinderGeometry args={[0.012, 0.012, 1.28, 10, 1, true]} />
        <primitive object={material} attach="material" />
      </mesh>
      <mesh
        rotation={[0, 0, Math.PI / 2]}
        ref={(node) => {
          beams.current[1] = node;
        }}
      >
        <cylinderGeometry args={[0.01, 0.01, 1.28, 10, 1, true]} />
        <primitive object={material} attach="material" />
      </mesh>
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        ref={(node) => {
          beams.current[2] = node;
        }}
      >
        <cylinderGeometry args={[0.01, 0.01, 1.28, 10, 1, true]} />
        <primitive object={material} attach="material" />
      </mesh>
    </group>
  );
};
