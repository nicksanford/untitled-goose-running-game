import { useEffect } from "react";
import { useActions } from "koota/react";
import { actions } from "@/core/actions";

const PLAYER_COUNT = 4;

export function Startup() {
  const { spawnGoose } = useActions(actions);

  useEffect(() => {
    const geese = Array.from({ length: PLAYER_COUNT }, (_, i) => spawnGoose(i));
    return () => geese.forEach((g) => g.destroy());
  }, [spawnGoose]);

  return null;
}
