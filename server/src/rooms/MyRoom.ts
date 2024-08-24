import { Room, Client } from "@colyseus/core";
import { MyRoomState } from "./schema/MyRoomState";
import Player from "./schema/Player";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 4;

  onCreate(options: any) {
    this.setState(new MyRoomState());

    this.setSimulationInterval(() => this.onTick(), 600);

    this.onMessage("move", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.x += message.x;
        player.y += message.y;
      }
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    const player = new Player("Player " + client.sessionId);
    client.send("mainPlayerId", client.sessionId);
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    this.state.players.delete(client.sessionId);
    console.log(client.sessionId, "left!");
  }

  onTick() {
    this.state.players.forEach((player, sessionId) => {});

    this.broadcast("state", this.state);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
