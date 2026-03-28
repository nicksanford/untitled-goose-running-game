import { useCallback } from "react";
import { useQuery } from "koota/react";
import type { Entity } from "koota";
import type { Mesh } from "three";
import { IsGoose, Player, Ref } from "@/core/traits";

const GOOSE_COLORS = ["#ff6b35", "#ffd23f", "#06d6a0", "#118ab2"];

function GooseView({ entity }: { entity: Entity }) {
  const playerIndex = entity.get(Player)?.index ?? 0;

  const handleInit = useCallback(
    (mesh: Mesh | null) => {
      if (!mesh || !entity.isAlive()) return;
      entity.add(Ref(mesh));
      return () => entity.remove(Ref);
    },
    [entity],
  );

  return (
    <mesh ref={handleInit} castShadow>
      <capsuleGeometry args={[0.25, 0.5, 4, 8]} />
      <meshStandardMaterial color={GOOSE_COLORS[playerIndex % GOOSE_COLORS.length]} />
    </mesh>
  );
}

export function GooseRenderer() {
  const geese = useQuery(IsGoose);
  return (
    <>
      {geese.map((entity) => (
        <GooseView key={entity.id()} entity={entity} />
      ))}
    </>
  );
}
