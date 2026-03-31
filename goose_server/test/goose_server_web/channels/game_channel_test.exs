defmodule GooseServerWeb.GameChannelTest do
  use GooseServerWeb.ChannelCase

  alias GooseServerWeb.UserSocket
  alias GooseServer.GameRegistry

  setup do
    game = GameRegistry.create_game("creator", "Test Race")
    {:ok, socket} = connect(UserSocket, %{"player_id" => "player1"})
    {:ok, game: game, socket: socket}
  end

  describe "join" do
    test "player can join an existing game", %{socket: socket, game: game} do
      {:ok, _reply, _socket} = subscribe_and_join(socket, "game:#{game.id}", %{})
      assert_push "presence_state", %{}
    end

    test "player cannot join a non-existent game", %{socket: socket} do
      assert {:error, %{reason: "game not found"}} =
               subscribe_and_join(socket, "game:nonexistent", %{})
    end

    test "player appears in game presence after joining", %{socket: socket, game: game} do
      {:ok, _reply, _socket} = subscribe_and_join(socket, "game:#{game.id}", %{})
      assert_push "presence_state", presence
      assert Map.has_key?(presence, "player1")
    end

    test "presence diff is broadcast when player joins game", %{socket: socket, game: game} do
      {:ok, _reply, _socket} = subscribe_and_join(socket, "game:#{game.id}", %{})
      assert_broadcast "presence_diff", %{joins: %{"player1" => _}}
    end

    test "presence includes player_name metadata", %{game: game} do
      {:ok, socket} =
        connect(UserSocket, %{"player_id" => "alice1", "player_name" => "Alice"})

      {:ok, _reply, _socket} = subscribe_and_join(socket, "game:#{game.id}", %{})
      assert_push "presence_state", presence

      assert %{"alice1" => %{metas: [meta | _]}} = presence
      assert meta.player_name == "Alice"
    end
  end

  describe "new_msg" do
    test "message is broadcast to the game", %{socket: socket, game: game} do
      {:ok, _reply, socket} = subscribe_and_join(socket, "game:#{game.id}", %{})

      push(socket, "new_msg", %{"body" => "honk!"})
      assert_broadcast "new_msg", %{player_id: "player1", body: "honk!"}
    end

    test "message includes correct player_id", %{socket: socket, game: game} do
      {:ok, _reply, socket} = subscribe_and_join(socket, "game:#{game.id}", %{})

      push(socket, "new_msg", %{"body" => "hello geese"})
      assert_broadcast "new_msg", payload
      assert payload.player_id == "player1"
      assert payload.body == "hello geese"
    end
  end

  describe "position_update" do
    test "broadcasts progress to other players", %{game: game} do
      {:ok, socket1} = connect(UserSocket, %{"player_id" => "alice"})
      {:ok, _reply, socket1} = subscribe_and_join(socket1, "game:#{game.id}", %{})

      push(socket1, "position_update", %{"progress" => 0.5})
      assert_broadcast "position_update", %{player_id: "alice", progress: 0.5}
    end

    test "includes correct player_id in broadcast", %{game: game} do
      {:ok, socket1} = connect(UserSocket, %{"player_id" => "bob"})
      {:ok, _reply, socket1} = subscribe_and_join(socket1, "game:#{game.id}", %{})

      push(socket1, "position_update", %{"progress" => 0.75})
      assert_broadcast "position_update", payload
      assert payload.player_id == "bob"
      assert payload.progress == 0.75
    end

    test "handles zero progress", %{socket: socket, game: game} do
      {:ok, _reply, socket} = subscribe_and_join(socket, "game:#{game.id}", %{})

      push(socket, "position_update", %{"progress" => 0.0})
      assert_broadcast "position_update", %{progress: progress}
      assert progress == 0.0
    end

    test "handles full progress", %{socket: socket, game: game} do
      {:ok, _reply, socket} = subscribe_and_join(socket, "game:#{game.id}", %{})

      push(socket, "position_update", %{"progress" => 1.0})
      assert_broadcast "position_update", %{progress: 1.0}
    end
  end

  describe "start_game" do
    test "creator can start the game", %{game: game} do
      {:ok, socket} = connect(UserSocket, %{"player_id" => "creator"})
      {:ok, _reply, socket} = subscribe_and_join(socket, "game:#{game.id}", %{})

      push(socket, "start_game", %{})
      assert_broadcast "game_started", %{}
    end

    test "non-creator cannot start the game", %{socket: socket, game: game} do
      {:ok, _reply, socket} = subscribe_and_join(socket, "game:#{game.id}", %{})

      ref = push(socket, "start_game", %{})
      assert_reply ref, :error, %{reason: "only the creator can start the game"}
    end

    test "game_started broadcast reaches all players in game", %{game: game} do
      {:ok, creator_socket} = connect(UserSocket, %{"player_id" => "creator"})
      {:ok, _reply, creator_socket} = subscribe_and_join(creator_socket, "game:#{game.id}", %{})

      {:ok, player_socket} = connect(UserSocket, %{"player_id" => "player2"})
      {:ok, _reply, _player_socket} = subscribe_and_join(player_socket, "game:#{game.id}", %{})

      push(creator_socket, "start_game", %{})
      assert_broadcast "game_started", %{}
    end
  end

  describe "terminate (host leaves)" do
    test "game_ended is broadcast when creator leaves", %{game: game} do
      {:ok, creator_socket} = connect(UserSocket, %{"player_id" => "creator"})
      {:ok, _reply, creator_socket} = subscribe_and_join(creator_socket, "game:#{game.id}", %{})

      # Another player is in the game to receive the broadcast
      {:ok, player_socket} = connect(UserSocket, %{"player_id" => "player2"})
      {:ok, _reply, _player_socket} = subscribe_and_join(player_socket, "game:#{game.id}", %{})

      # Creator leaves the channel
      Process.unlink(creator_socket.channel_pid)
      close(creator_socket)

      assert_broadcast "game_ended", %{reason: "host_left"}
    end

    test "game_ended is NOT broadcast when non-creator leaves", %{game: game} do
      {:ok, creator_socket} = connect(UserSocket, %{"player_id" => "creator"})
      {:ok, _reply, _creator_socket} = subscribe_and_join(creator_socket, "game:#{game.id}", %{})

      {:ok, player_socket} = connect(UserSocket, %{"player_id" => "player2"})
      {:ok, _reply, player_socket} = subscribe_and_join(player_socket, "game:#{game.id}", %{})

      # Non-creator leaves
      Process.unlink(player_socket.channel_pid)
      close(player_socket)

      refute_broadcast "game_ended", _
    end
  end
end
