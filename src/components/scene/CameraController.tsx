import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "three";

export const CameraController = () => {
  const { camera, size } = useThree();

  useEffect(() => {
    const perspective = camera as PerspectiveCamera;
    const narrow = size.width < 720;
    perspective.fov = narrow ? 44 : 38;
    const distance = narrow
      ? size.height > size.width
        ? 9.3
        : 6.8
      : 5.9;
    perspective.position.set(0, 0.04, distance);
    perspective.lookAt(0, 0, 0);
    perspective.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return null;
};
