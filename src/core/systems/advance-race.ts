import type { World } from "koota";
import { Player, RaceProgress } from "../traits";
import { Time } from "../traits";

const BASE_SPEED = 0.04;

export function advanceRace(world: World) {
  const { delta } = world.get(Time)!;

  world
    .query(RaceProgress, Player)
    .updateEach(([progress, player]) => {
      const wobble = Math.sin(performance.now() * 0.003 + player.index * 1.7) * 0.02;
      progress.value = Math.min(progress.value + (BASE_SPEED + wobble) * delta, 1);
    });
}
