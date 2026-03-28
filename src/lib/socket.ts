import { Socket, Presence, Channel } from "phoenix";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "ws://localhost:4000/socket";

let socket: Socket | null = null;
let lobbyChannel: Channel | null = null;
let lobbyPresence: Presence | null = null;

export type LobbyPlayer = {
  id: string;
  name: string;
  joinedAt: number;
};

export function connectToLobby(
  playerName: string,
  onPlayersChanged: (players: LobbyPlayer[]) => void,
) {
  const playerId = `${playerName}-${Date.now().toString(36)}`;

  socket = new Socket(SOCKET_URL, {
    params: { player_id: playerId, player_name: playerName },
  });
  socket.connect();

  lobbyChannel = socket.channel("lobby", {});
  lobbyPresence = new Presence(lobbyChannel);

  lobbyPresence.onSync(() => {
    const players: LobbyPlayer[] = [];
    lobbyPresence!.list((id: string, presence: { metas: Array<{ player_name?: string; joined_at?: number }> }) => {
      const meta = presence.metas[0];
      players.push({
        id,
        name: meta?.player_name ?? id,
        joinedAt: meta?.joined_at ?? 0,
      });
    });
    onPlayersChanged(players);
  });

  return new Promise<void>((resolve, reject) => {
    lobbyChannel!
      .join()
      .receive("ok", () => resolve())
      .receive("error", (resp) => reject(new Error(JSON.stringify(resp))));
  });
}

export function disconnectFromLobby() {
  lobbyChannel?.leave();
  socket?.disconnect();
  lobbyChannel = null;
  lobbyPresence = null;
  socket = null;
}
