import * as THREE from "three";
import type { World } from "koota";
import { Player, Position, RaceProgress } from "../traits";
import { getTrackPosition } from "../track";

const _pos = new THREE.Vector3();

export function mapProgressToTrack(world: World) {
  world
    .query(RaceProgress, Player, Position)
    .updateEach(([progress, player, pos]) => {
      getTrackPosition(progress.value, player.index, _pos);
      pos.x = _pos.x;
      pos.y = _pos.y;
      pos.z = _pos.z;
    });
}
