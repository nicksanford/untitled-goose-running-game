import { useFrame } from "@react-three/fiber";
import { useWorld } from "koota/react";
import { updateTime } from "@/core/systems/update-time";
import { advanceRace } from "@/core/systems/advance-race";
import { mapProgressToTrack } from "@/core/systems/map-progress-to-track";
import { syncPosition } from "@/core/systems/sync-position";

export function Frameloop() {
  const world = useWorld();

  useFrame(() => {
    updateTime(world);
    advanceRace(world);
    mapProgressToTrack(world);
    syncPosition(world);
  });

  return null;
}
