import { useEffect } from "react";
import { useRouter } from "next/router";
import { useActions } from "koota/react";
import { actions } from "@/core/actions";

const PLAYER_COUNT = 4;

export function Startup() {
  const { spawnGoose, spawnGrassAlongTrack, spawnCamera } = useActions(actions);
  const router = useRouter();
  const playerName = (router.query.name as string) || "";

  useEffect(() => {
    if (!router.isReady) return;

    const geese = Array.from({ length: PLAYER_COUNT }, (_, i) =>
      spawnGoose({ index: i, ...(i === 0 ? { name: playerName || undefined, self: true } : {}) }),
    );
    const grass = spawnGrassAlongTrack();
    const selfGoose = geese[0];
    const camera = spawnCamera(selfGoose);

    return () => {
      camera.destroy();
      grass.forEach((g) => g.destroy());
      geese.forEach((g) => g.destroy());
    };
  }, [router.isReady, playerName, spawnGoose, spawnGrassAlongTrack, spawnCamera]);

  return null;
}
