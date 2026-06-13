import { Center, Grid, OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

function GeneratedModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

export function ModelViewer({ url }: { url: string }) {
  return (
    <div className="h-full min-h-72 w-full bg-canvas">
      <Canvas camera={{ position: [4, 3, 6], fov: 42 }} dpr={[1, 2]}>
        <color attach="background" args={["#070713"]} />
        <Suspense fallback={null}>
          <Stage environment={null} intensity={0.75} adjustCamera>
            <GeneratedModel url={url} />
          </Stage>
        </Suspense>
        <Grid
          position={[0, -1.01, 0]}
          args={[12, 12]}
          cellColor="#24245c"
          sectionColor="#4f46e5"
          fadeDistance={18}
          infiniteGrid
        />
        <OrbitControls makeDefault minDistance={1.5} maxDistance={16} />
      </Canvas>
    </div>
  );
}
