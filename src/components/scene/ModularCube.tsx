import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Group,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { PROJECTS } from "../../data/projects";
import { FACES } from "../../data/faces";
import { useAnimatedTextures } from "../../hooks/useAnimatedTexture";
import type { CubeController } from "../interaction/CubeController";
import {
  BEVEL_RADIUS,
  BODY_SIZE,
  FRAME_DISTANCE,
  FRAME_SIZE,
  GLASS_DISTANCE,
  MODULES,
  createPanelGeometry,
  getFaceQuaternion,
  moduleFaceKeys,
} from "../../utils/geometry";

interface ModularCubeProps {
  controller: CubeController;
}

const faceToProject = new Map(
  PROJECTS.map((project, index) => [project.face, index]),
);

const normalForFace = (face: keyof typeof FACES) =>
  new Vector3(...FACES[face].normal);

export const ModularCube = ({ controller }: ModularCubeProps) => {
  const handles = useAnimatedTextures(PROJECTS);
  const root = useRef<Group>(null);
  const moduleRefs = useRef<Array<Group | null>>([]);

  const bodyGeometry = useMemo(
    () =>
      new RoundedBoxGeometry(
        BODY_SIZE,
        BODY_SIZE,
        BODY_SIZE,
        3,
        BEVEL_RADIUS,
      ),
    [],
  );
  const frameGeometry = useMemo(
    () =>
      new RoundedBoxGeometry(FRAME_SIZE, FRAME_SIZE, 0.012, 2, 0.004),
    [],
  );
  const glassGeometry = useMemo(
    () => new PlaneGeometry(0.998, 0.998),
    [],
  );
  const ledGeometry = useMemo(() => new SphereGeometry(0.009, 10, 10), []);

  const panels = useMemo(
    () =>
      MODULES.map((module) =>
        moduleFaceKeys(module.signs).map((face) => ({
          face,
          geometry: createPanelGeometry(face, module),
          quaternion: getFaceQuaternion(face),
          normal: normalForFace(face),
        })),
      ),
    [],
  );

  const bodyMaterial = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: "#0b1117",
        metalness: 0.52,
        roughness: 0.3,
        clearcoat: 0.7,
        clearcoatRoughness: 0.22,
        envMapIntensity: 0.9,
      }),
    [],
  );
  const frameMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#1b2530",
        metalness: 0.9,
        roughness: 0.24,
        envMapIntensity: 1.5,
      }),
    [],
  );
  const glassMaterial = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: "#c8dbe6",
        metalness: 0.02,
        roughness: 0.06,
        ior: 1.46,
        thickness: 0.08,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        transparent: true,
        opacity: 0.13,
        depthWrite: false,
        side: 2,
        envMapIntensity: 1.8,
      }),
    [],
  );
  const imageMaterials = useMemo(
    () =>
      PROJECTS.map(
        () =>
          new MeshBasicMaterial({
            color: "#161d24",
            toneMapped: true,
            side: 0,
          }),
      ),
    [handles],
  );
  const ledMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#c7e7ff",
        toneMapped: false,
        transparent: true,
        opacity: 0.9,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      bodyGeometry.dispose();
      frameGeometry.dispose();
      glassGeometry.dispose();
      ledGeometry.dispose();
      for (const modulePanels of panels) {
        for (const panel of modulePanels) panel.geometry.dispose();
      }
      bodyMaterial.dispose();
      frameMaterial.dispose();
      glassMaterial.dispose();
      imageMaterials.forEach((material) => material.dispose());
      ledMaterial.dispose();
    };
  }, [
    bodyGeometry,
    frameGeometry,
    glassGeometry,
    ledGeometry,
    panels,
    bodyMaterial,
    frameMaterial,
    glassMaterial,
    imageMaterials,
    ledMaterial,
  ]);

  useFrame(() => {
    for (let index = 0; index < imageMaterials.length; index += 1) {
      const texture = handles[index]?.texture;
      const material = imageMaterials[index];
      if (texture && material.map !== texture) {
        material.map = texture;
        material.color.set("#ffffff");
        material.needsUpdate = true;
      }
    }

    if (!root.current) return;
    root.current.quaternion.copy(controller.quaternion);
    root.current.position.copy(controller.objectPosition);
    root.current.scale.setScalar(controller.objectScale);

    const time = controller.time;
    const offset = controller.moduleOffset;
    const tilt = controller.moduleTilt;
    const preview = controller.previewAmount;

    for (let index = 0; index < MODULES.length; index += 1) {
      const group = moduleRefs.current[index];
      if (!group) continue;
      const module = MODULES[index];
      const sway = Math.sin(time * 0.5 + module.phase) * 0.0045 * tilt;
      group.position.set(
        module.base[0] + module.direction[0] * (offset + sway),
        module.base[1] + module.direction[1] * (offset + sway),
        module.base[2] + module.direction[2] * (offset + sway),
      );
      group.rotation.set(
        Math.sin(time * 0.42 + module.phase) * 0.018 * tilt +
          Math.sin(module.phase) * 0.008 * tilt,
        Math.cos(time * 0.37 + module.phase * 1.3) * 0.014 * tilt,
        Math.sin(time * 0.31 + module.phase * 0.7) * 0.012 * tilt +
          Math.sin(module.phase * 1.7) * preview * 0.03,
      );
    }
  });

  return (
    <group ref={root}>
      {MODULES.map((module, index) => (
        <group
          key={module.key}
          ref={(node) => {
            moduleRefs.current[index] = node;
          }}
        >
          <mesh geometry={bodyGeometry} material={bodyMaterial} />
          {panels[index].map((panel) => {
            const projectIndex = faceToProject.get(panel.face) ?? 0;
            const framePosition = panel.normal
              .clone()
              .multiplyScalar(FRAME_DISTANCE);
            const glassPosition = panel.normal
              .clone()
              .multiplyScalar(GLASS_DISTANCE);
            return (
              <group key={`${module.key}-${panel.face}`}>
                <mesh
                  geometry={frameGeometry}
                  material={frameMaterial}
                  position={framePosition}
                  quaternion={panel.quaternion}
                />
                <mesh
                  geometry={panel.geometry}
                  material={imageMaterials[projectIndex]}
                />
                <mesh
                  geometry={glassGeometry}
                  material={glassMaterial}
                  position={glassPosition}
                  quaternion={panel.quaternion}
                />
              </group>
            );
          })}
          <mesh
            geometry={ledGeometry}
            material={ledMaterial}
            position={[
              module.signs[0] * 0.462,
              module.signs[1] * 0.462,
              module.signs[2] * 0.462,
            ]}
          />
        </group>
      ))}
    </group>
  );
};
