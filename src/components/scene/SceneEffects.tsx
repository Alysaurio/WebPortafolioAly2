import { useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, SMAA } from "@react-three/postprocessing";

export const SceneEffects = ({ lowPower }: { lowPower: boolean }) => {
  const { size } = useThree();
  const mobile = size.width < 760;
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        intensity={mobile ? 0.22 : lowPower ? 0.28 : 0.42}
        luminanceThreshold={0.72}
        luminanceSmoothing={0.24}
        radius={0.65}
      />
      <SMAA />
    </EffectComposer>
  );
};
