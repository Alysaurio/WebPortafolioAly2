import { useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ACESFilmicToneMapping } from "three";
import type { CubeController } from "../interaction/CubeController";
import { CameraController } from "./CameraController";
import { CoreLight } from "./CoreLight";
import { ModularCube } from "./ModularCube";
import { SceneEffects } from "./SceneEffects";
import { SceneLighting } from "./SceneLighting";
import { VolumetricBeams } from "./VolumetricBeams";

interface SceneProps {
  controller: CubeController;
  reducedMotion: boolean;
}

const SceneBridge = ({
  controller,
  reducedMotion,
}: {
  controller: CubeController;
  reducedMotion: boolean;
}) => {
  const { gl } = useThree();

  useEffect(() => {
    controller.attach(gl.domElement);
    return () => controller.detach();
  }, [controller, gl]);

  useFrame((state, delta) => {
    controller.update(
      delta,
      state.camera.position,
      state.size.width,
      reducedMotion,
    );
  });

  return null;
};

export const ArchiveScene = ({ controller, reducedMotion }: SceneProps) => {
  const [visible, setVisible] = useState(
    () => document.visibilityState === "visible",
  );

  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return (
    <Canvas
      className="scene-canvas"
      dpr={[1, 1.5]}
      frameloop={visible ? "always" : "never"}
      camera={{ position: [0, 0.04, 5.9], fov: 38, near: 0.1, far: 40 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.06;
        gl.setClearColor("#080a0d", 1);
      }}
    >
      <color attach="background" args={["#080a0d"]} />
      <SceneBridge controller={controller} reducedMotion={reducedMotion} />
      <CameraController />
      <SceneLighting />
      <ModularCube controller={controller} />
      <CoreLight controller={controller} />
      <VolumetricBeams controller={controller} />
      {reducedMotion ? null : <SceneEffects lowPower={false} />}
    </Canvas>
  );
};
