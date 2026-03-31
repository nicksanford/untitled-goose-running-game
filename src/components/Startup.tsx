import { useEffect } from "react";
import { useRouter } from "next/router";
import { useActions, useWorld } from "koota/react";
import type { Entity } from "koota";
import { actions, GOOSE_NAMES } from "@/core/actions";
import { RaceProgress } from "@/core/traits";
import {
  joinGame,
  getGamePlayers,
  isInGame,
  updateGameCallbacks,
  leaveGame,
  type GamePlayer,
} from "@/lib/game-socket";
import { disconnectSocket } from "@/lib/socket";

const TOTAL_GEESE = 4;

function randomGooseName(): string {
  return GOOSE_NAMES[Math.floor(Math.random() * GOOSE_NAMES.length)];
}

export function Startup({ playerName, gameId }: { playerName: string; gameId: string }) {
  const { spawnGoose, spawnGrassAlongTrack, spawnCamera } = useActions(actions);
  const world = useWorld();
  const router = useRouter();

  useEffect(() => {
    let selfEntity: Entity;
    let remoteEntities = new Map<string, Entity>();
    let aiEntities: Entity[] = [];
    let grass: Entity[];
    let camera: Entity;
    let destroyed = false;

    const handlePositionUpdate = (playerId: string, progress: number) => {
      const entity = remoteEntities.get(playerId);
      if (entity?.isAlive()) {
        entity.set(RaceProgress, { value: progress });
      }
    };

    function spawnEntities(remotePlayers: GamePlayer[]) {
      // Sort all human players alphabetically by name for deterministic index assignment
      // This ensures every client assigns the same color/lane to the same player
      const allPlayers = [
        { id: "__self__", name: playerName },
        ...remotePlayers,
      ].sort((a, b) => a.name.localeCompare(b.name));

      let nextIndex = 0;
      for (const p of allPlayers) {
        if (nextIndex >= TOTAL_GEESE) break;
        if (p.id === "__self__") {
          selfEntity = spawnGoose({ index: nextIndex, name: playerName, self: true });
        } else {
          const entity = spawnGoose({ index: nextIndex, name: p.name, remote: true });
          remoteEntities.set(p.id, entity);
        }
        nextIndex++;
      }

      // Fill remaining with AI
      while (nextIndex < TOTAL_GEESE) {
        const aiName = randomGooseName() + " (AI)";
        aiEntities.push(spawnGoose({ index: nextIndex, name: aiName }));
        nextIndex++;
      }

      grass = spawnGrassAlongTrack();
      camera = spawnCamera(selfEntity!);
    }

    const handleGameEnded = () => {
      router.push("/lobby");
    };

    async function init() {
      if (!gameId) {
        // Single player mode - no server connection
        spawnEntities([]);
        return;
      }

      if (isInGame()) {
        // Already joined from lobby - reuse existing channel
        const players = getGamePlayers();
        const remotePlayers = players.filter((p) => p.name !== playerName);
        spawnEntities(remotePlayers);
        updateGameCallbacks({
          onPositionUpdate: handlePositionUpdate,
          onPlayersChanged: () => {},
          onGameStarted: () => {},
          onGameEnded: handleGameEnded,
        });
      } else {
        // Direct navigation - need to connect
        const { players } = await joinGame(gameId, playerName, {
          onPlayersChanged: () => {},
          onPositionUpdate: handlePositionUpdate,
          onGameStarted: () => {},
          onGameEnded: handleGameEnded,
        });
        if (destroyed) return;
        const remotePlayers = players.filter((p) => p.name !== playerName);
        spawnEntities(remotePlayers);
      }
    }

    init();

    return () => {
      destroyed = true;
      camera?.destroy();
      grass?.forEach((g) => g.destroy());
      selfEntity?.destroy();
      remoteEntities.forEach((e) => e.destroy());
      aiEntities.forEach((e) => e.destroy());
      leaveGame();
      disconnectSocket();
    };
  }, [playerName, gameId, spawnGoose, spawnGrassAlongTrack, spawnCamera, world]);

  return null;
}
