import * as THREE from "three";

const TRACK_POINTS = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(10, 0, 0),
  new THREE.Vector3(20, 0, 0),
  new THREE.Vector3(30, 0, 0),
];

export const trackCurve = new THREE.CatmullRomCurve3(TRACK_POINTS, false);

const LANE_OFFSET = 0.8;

/**
 * Get a world position on the track given a progress value (0..1) and a lane index.
 * Lane 0 is the innermost lane, lane 3 is the outermost.
 */
export function getTrackPosition(
  progress: number,
  laneIndex: number,
  out: THREE.Vector3 = new THREE.Vector3()
): THREE.Vector3 {
  const t = THREE.MathUtils.clamp(progress, 0, 1);
  trackCurve.getPointAt(t, out);

  const tangent = trackCurve.getTangentAt(t);
  const up = new THREE.Vector3(0, 1, 0);
  const normal = new THREE.Vector3().crossVectors(up, tangent).normalize();

  const laneCenterOffset = ((laneIndex - 1.5) * LANE_OFFSET);
  out.addScaledVector(normal, laneCenterOffset);

  return out;
}
