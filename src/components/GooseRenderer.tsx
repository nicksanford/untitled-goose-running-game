import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useTraitEffect } from "koota/react";
import type { Entity } from "koota";
import { Color, Group, Mesh, MeshStandardMaterial } from "three";
import { SkeletonUtils } from "three/examples/jsm/Addons.js";
import { Billboard, Text, useGLTF, useAnimations } from "@react-three/drei";
import { IsGoose, Player, PlayerInput, RaceProgress, Ref } from "@/core/traits";

const GOOSE_MODEL_PATH = "/assets/models/goose.glb";
const GOOSE_FONT_URL = "/assets/fonts/LilitaOne-Regular.ttf";
const SPEED_THRESHOLD = 0.005;
const MIN_PLAYBACK_RATE = 0.4;
const MAX_PLAYBACK_RATE = 2.0;
const MAX_INPUT_SPEED = 0.15;

function GooseView({ entity, name, color }: { entity: Entity; name: string; color: string }) {
  const { scene, animations } = useGLTF(GOOSE_MODEL_PATH);
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  useEffect(() => {
    clone.traverse((child) => {
      if (child instanceof Mesh && child.material instanceof MeshStandardMaterial && child.material.name === "Shoe_Accent") {
        child.material = child.material.clone();
        child.material.color = new Color(color);
      }
    });
  }, [clone, color]);
  const groupRef = useRef<Group>(null);
  const { actions } = useAnimations(animations, groupRef);
  const wasRunningRef = useRef(false);

  const handleInit = useCallback(
    (group: Group | null) => {
      if (!group || !entity.isAlive()) return;
      entity.add(Ref(group));
      return () => entity.remove(Ref);
    },
    [entity],
  );

  const timeOffset = useMemo(() => {
    const id = entity.id();
    const hash = Math.sin(id * 9301 + 49297) * 49267;
    return (hash - Math.floor(hash)) * 2;
  }, [entity]);

  useEffect(() => {
    if (entity.has(PlayerInput)) return;
    const run = actions["GooseRun"];
    if (!run) return;
    run.reset().fadeIn(0.2).play();
    run.time = timeOffset;
    return () => {
      run.fadeOut(0.2);
    };
  }, [actions, timeOffset, entity]);

  useTraitEffect(entity, PlayerInput, (input) => {
    if (!input) return;
    const progress = entity.get(RaceProgress);
    const run = actions["GooseRun"];
    const idle = actions["GooseIdle"];
    const isRunning = input.speed > SPEED_THRESHOLD;

    if (isRunning && !wasRunningRef.current && progress && progress.value < 1) {
      idle?.fadeOut(0.15);
      run?.reset().fadeIn(0.15).play();
      wasRunningRef.current = true;
    } else if (!isRunning && wasRunningRef.current) {
      run?.fadeOut(0.15);
      idle?.reset().fadeIn(0.15).play();
      wasRunningRef.current = false;
    } else if (!isRunning && !wasRunningRef.current && !idle?.isRunning) {
      idle?.reset().fadeIn(0.2).play();
      // eslint-disable-next-line react-hooks/immutability
      if (idle) idle.time = timeOffset;
    }

    if (run && isRunning) {
      const t = Math.min(input.speed / MAX_INPUT_SPEED, 1);
      // eslint-disable-next-line react-hooks/immutability
      run.timeScale =
        MIN_PLAYBACK_RATE + t * (MAX_PLAYBACK_RATE - MIN_PLAYBACK_RATE);
    }
  });

  useTraitEffect(entity, RaceProgress, (progress) => {
    if (progress && progress.value >= 1) {
      actions["GooseRun"]?.fadeOut(0.3);
      const idle = actions["GooseIdle"];
      if (!idle) return;
      idle.reset().fadeIn(0.2).play();
      // eslint-disable-next-line react-hooks/immutability
      idle.time = timeOffset;
    }
  });

  return (
    <group
      ref={(node) => {
        (groupRef as React.MutableRefObject<Group | null>).current = node;
        handleInit(node);
      }}
    >
      <primitive object={clone} rotation={[0, Math.PI / 2, 0]} castShadow />
      <Billboard position={[0, 2.2, 0]} follow>
        <Text
          font={GOOSE_FONT_URL}
          fontSize={0.35}
          color="#fffbe6"
          outlineWidth={0.05}
          outlineColor="#4a3520"
          anchorX="center"
          anchorY="bottom"
        >
          {name}
        </Text>
      </Billboard>
    </group>
  );
}

useGLTF.preload(GOOSE_MODEL_PATH);

export function GooseRenderer() {
  const geese = useQuery(IsGoose, Player);
  return (
    <>
      {geese.map((entity) => (
        <GooseView
          key={entity.id()}
          entity={entity}
          name={entity.get(Player)?.name ?? "Goose"}
          color={entity.get(Player)?.color ?? "#ffffff"}
        />
      ))}
    </>
  );
}
