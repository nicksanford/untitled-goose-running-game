import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import {
  connectToLobby,
  disconnectFromLobby,
  type LobbyPlayer,
} from "@/lib/socket";

const GOOSE_EMOJIS = ["🪿", "🦆", "🐥", "🥚", "🐣", "🦢"];

function pickEmoji(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return GOOSE_EMOJIS[Math.abs(hash) % GOOSE_EMOJIS.length];
}

export default function Lobby() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [myName, setMyName] = useState("");
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
    return () => disconnectFromLobby();
  }, []);

  const handleJoin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = name.trim();
      if (!trimmed || connecting) return;

      setConnecting(true);
      setError("");
      try {
        await connectToLobby(trimmed, setPlayers);
        setMyName(trimmed);
        setJoined(true);
      } catch (err) {
        setError("Could not connect to server. Is the goose server running?");
        console.error(err);
      } finally {
        setConnecting(false);
      }
    },
    [name, connecting],
  );

  const handleLeave = useCallback(() => {
    disconnectFromLobby();
    setJoined(false);
    setPlayers([]);
    setMyName("");
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          <span style={styles.gooseIcon}>🪿</span> Goose Lobby
        </h1>

        {!joined ? (
          <form onSubmit={handleJoin} style={styles.form}>
            <p style={styles.subtitle}>
              Enter your name to join the waddle.
            </p>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your goose name…"
              maxLength={24}
              style={styles.input}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!name.trim() || connecting}
              style={{
                ...styles.button,
                opacity: !name.trim() || connecting ? 0.5 : 1,
              }}
            >
              {connecting ? "Connecting…" : "Join Lobby"}
            </button>
            {error && <p style={styles.error}>{error}</p>}
          </form>
        ) : (
          <div style={styles.lobbyContent}>
            <div style={styles.welcomeBar}>
              <span>
                Playing as <strong>{myName}</strong>
              </span>
              <button onClick={handleLeave} style={styles.leaveButton}>
                Leave
              </button>
            </div>

            <div style={styles.playerListHeader}>
              <span style={styles.dot} />
              {players.length} goose{players.length !== 1 ? "s" : ""} in the
              pond
            </div>

            <ul style={styles.playerList}>
              {players
                .sort((a, b) => a.joinedAt - b.joinedAt)
                .map((p) => (
                  <li
                    key={p.id}
                    style={{
                      ...styles.playerItem,
                      ...(p.name === myName ? styles.playerItemMe : {}),
                    }}
                  >
                    <span style={styles.playerEmoji}>{pickEmoji(p.id)}</span>
                    <span style={styles.playerName}>{p.name}</span>
                    {p.name === myName && (
                      <span style={styles.youBadge}>you</span>
                    )}
                  </li>
                ))}
            </ul>

            <button
              onClick={() => router.push({ pathname: "/game", query: { name: myName } })}
              style={styles.startButton}
            >
              Start Race 🏁
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f1a0f 0%, #1a2e1a 50%, #0f1a0f 100%)",
    padding: 20,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
    color: "#e8f5e8",
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    textAlign: "center" as const,
    margin: 0,
    letterSpacing: "-0.02em",
  },
  gooseIcon: {
    fontSize: 32,
    marginRight: 8,
  },
  subtitle: {
    color: "rgba(232,245,232,0.6)",
    textAlign: "center" as const,
    margin: "8px 0 24px",
    fontSize: 15,
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  input: {
    padding: "14px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.08)",
    color: "#e8f5e8",
    fontSize: 16,
    outline: "none",
    transition: "border-color 0.2s",
  },
  button: {
    padding: "14px 20px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #4ade80, #22c55e)",
    color: "#052e16",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "transform 0.1s, opacity 0.2s",
  },
  error: {
    color: "#f87171",
    fontSize: 14,
    textAlign: "center" as const,
    margin: 0,
  },
  lobbyContent: {
    marginTop: 20,
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  welcomeBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 15,
    color: "rgba(232,245,232,0.8)",
  },
  leaveButton: {
    padding: "6px 14px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "rgba(232,245,232,0.6)",
    fontSize: 13,
    cursor: "pointer",
  },
  playerListHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    color: "rgba(232,245,232,0.5)",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#4ade80",
    boxShadow: "0 0 8px #4ade80",
    display: "inline-block",
  },
  playerList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  playerItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: 12,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    transition: "background 0.2s",
  },
  playerItemMe: {
    background: "rgba(74,222,128,0.1)",
    border: "1px solid rgba(74,222,128,0.2)",
  },
  playerEmoji: {
    fontSize: 22,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 600,
    flex: 1,
  },
  youBadge: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    color: "#4ade80",
    background: "rgba(74,222,128,0.15)",
    padding: "2px 8px",
    borderRadius: 6,
    letterSpacing: "0.05em",
  },
  startButton: {
    padding: "14px 20px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #facc15, #f59e0b)",
    color: "#451a03",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 4,
    transition: "transform 0.1s, opacity 0.2s",
  },
};
