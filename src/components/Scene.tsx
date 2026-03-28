import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { GooseRenderer } from "./GooseRenderer";
import { TrackRenderer } from "./TrackRenderer";
import { Frameloop } from "./Frameloop";
import { Startup } from "./Startup";

const Scene = () => {
  return (
    <Canvas
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh" }}
    >
      <group rotation={[0, Math.PI / 2, 0]}>
        <TrackRenderer />
        <GooseRenderer />
      </group>
      <Frameloop />
      <Startup />
      <OrbitControls />
      {/* <PerspectiveCamera makeDefault position={[15, 20, 20]} /> */}
      <OrthographicCamera
        makeDefault
        position={[1, 1, 1]}
        near={-100}
        far={100}
        zoom={100}
      />
      <directionalLight position={[-5, 10, 5]} intensity={1.5} />
      <ambientLight intensity={0.4} />
    </Canvas>
  );
};

export { Scene };
