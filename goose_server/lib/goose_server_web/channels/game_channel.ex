defmodule GooseServerWeb.GameChannel do
  use GooseServerWeb, :channel

  alias GooseServerWeb.Presence
  alias GooseServer.GameRegistry

  require Logger

  @impl true
  def join("game:" <> game_id, _params, socket) do
    if GameRegistry.game_exists?(game_id) do
      send(self(), :after_join)
      {:ok, assign(socket, :game_id, game_id)}
    else
      {:error, %{reason: "game not found"}}
    end
  end

  @impl true
  def handle_info(:after_join, socket) do
    {:ok, _} =
      Presence.track(socket, socket.assigns.player_id, %{
        player_name: socket.assigns.player_name,
        joined_at: System.system_time(:second)
      })

    push(socket, "presence_state", Presence.list(socket))
    {:noreply, socket}
  end

  @impl true
  def handle_in("position_update", %{"progress" => progress}, socket) do
    broadcast_from!(socket, "position_update", %{
      player_id: socket.assigns.player_id,
      progress: progress
    })

    {:noreply, socket}
  end

  @impl true
  def handle_in("start_game", _params, socket) do
    game = GameRegistry.get_game(socket.assigns.game_id)

    if game && game.creator_id == socket.assigns.player_id do
      broadcast!(socket, "game_started", %{})
      {:noreply, socket}
    else
      {:reply, {:error, %{reason: "only the creator can start the game"}}, socket}
    end
  end

  @impl true
  def handle_in("new_msg", %{"body" => body}, socket) do
    player_id = socket.assigns.player_id
    game_id = socket.assigns.game_id

    Logger.info("Game #{game_id} - #{player_id}: #{body}")

    broadcast!(socket, "new_msg", %{player_id: player_id, body: body})
    {:noreply, socket}
  end

  @impl true
  def terminate(_reason, socket) do
    game = GameRegistry.get_game(socket.assigns.game_id)

    if game && game.creator_id == socket.assigns.player_id do
      GooseServerWeb.Endpoint.broadcast!(
        "game:#{socket.assigns.game_id}",
        "game_ended",
        %{reason: "host_left"}
      )
    end

    :ok
  end
end
