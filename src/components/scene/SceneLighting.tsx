import { Environment, Lightformer } from "@react-three/drei";

export const SceneLighting = () => {
  return (
    <>
      <ambientLight intensity={0.28} color="#7c8b99" />
      <directionalLight
        position={[4.5, 5.5, 6]}
        intensity={2.1}
        color="#eef7ff"
      />
      <directionalLight
        position={[-5, -1.5, 3.5]}
        intensity={1.1}
        color="#6f8fa8"
      />
      <directionalLight
        position={[0, -4, -5]}
        intensity={1.6}
        color="#31516b"
      />
      <Environment resolution={128} frames={1} background={false}>
        <color attach="background" args={["#05080c"]} />
        <Lightformer
          form="rect"
          intensity={4.5}
          color="#dcecff"
          position={[0, 4.5, 6]}
          scale={[12, 7, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#7898b3"
          position={[-6, 1, 2]}
          rotation-y={Math.PI / 2.2}
          scale={[8, 6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.8}
          color="#3c617c"
          position={[6, -1.5, -1]}
          rotation-y={-Math.PI / 2.2}
          scale={[7, 5, 1]}
        />
        <Lightformer
          form="circle"
          intensity={2.8}
          color="#8eb9d8"
          position={[0, -5, 1]}
          rotation-x={Math.PI / 2}
          scale={[5, 5, 1]}
        />
      </Environment>
    </>
  );
};
