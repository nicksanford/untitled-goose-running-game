import { createActions } from "koota";
import { IsGoose, Player, Position, RaceProgress } from "../traits";

export const actions = createActions((world) => ({
  spawnGoose: (index: number) => {
    return world.spawn(
      Position,
      IsGoose,
      RaceProgress({ value: 0 }),
      Player({ index }),
    );
  },
}));
