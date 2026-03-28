import { useMemo } from "react";
import { trackCurve } from "@/core/track";

export function TrackRenderer() {
  const points = useMemo(() => trackCurve.getPoints(100), []);

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            args={[new Float32Array(points.flatMap((p) => [p.x, p.y, p.z])), 3]}
            attach="attributes-position"
            count={points.length}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#888" linewidth={2} />
      </line>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01}>
        <planeGeometry args={[100, 50]} />
        <meshStandardMaterial color="#2d5a27" />
      </mesh>
    </group>
  );
}
