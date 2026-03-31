import { useRouter } from "next/router";
import { Scene } from "../components/Scene";

export default function Game() {
  const router = useRouter();

  if (!router.isReady) return null;

  const name = (router.query.name as string) || "Goose";
  const gameId = (router.query.gameId as string) || "";

  return <Scene playerName={name} gameId={gameId} />;
}
