import React, { useEffect, useRef, useState } from "react";
import { Client, Room } from "colyseus.js";
import "./Canvas.css";

interface Player {
  x: number;
  y: number;
  name: string;
}

interface State {
  players: { [id: string]: Player };
}

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [players, setPlayers] = useState<{ [id: string]: Player }>({});
  const playersRef = useRef<{ [id: string]: Player }>({});
  const mainPlayerIdRef = useRef<string | null>(null);
  const mainPlayerRef = useRef<Player | null>(null);
  const client = new Client("ws://localhost:2567");
  const roomRef = useRef<Room<State> | null>(null);
  let offscreenCanvas: HTMLCanvasElement;
  let offscreenContext: CanvasRenderingContext2D | null;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (canvas && context) {
      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };

      window.addEventListener("resize", resizeCanvas);
      resizeCanvas();

      // Create an off-screen canvas
      offscreenCanvas = document.createElement("canvas");
      offscreenCanvas.width = canvas.width;
      offscreenCanvas.height = canvas.height;
      offscreenContext = offscreenCanvas.getContext("2d");

      if (!offscreenContext) {
        console.error("Failed to get offscreen canvas context");
        return;
      }
      if (!roomRef.current) {
        client.joinOrCreate<State>("my_room").then((r) => {
          roomRef.current = r;

          roomRef.current.onMessage("mainPlayerId", (id: string) => {
            mainPlayerIdRef.current = id;
          });

          roomRef.current.onStateChange((state) => {
            //setPlayers( state.players);
            playersRef.current = state.players;
            drawPlayers(state.players);
          });

          roomRef.current.onMessage("state", (state: State) => {
            //setPlayers( state.players);
            playersRef.current = state.players;
            if (mainPlayerIdRef.current) {
              const mpI = Object.keys(state.players).findIndex(
                (id) => id === mainPlayerIdRef.current,
                0,
              );
              mainPlayerRef.current = Object.values(state.players)[mpI];
            }
            drawPlayers(playersRef.current);
          });
        });
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        const keyName = event.key;
        const move = { x: 0, y: 0 };

        if (keyName === "w") {
          move.y = -10;
        } else if (keyName === "a") {
          move.x = -10;
        } else if (keyName === "s") {
          move.y = 10;
        } else if (keyName === "d") {
          move.x = 10;
        }

        if (move.x !== 0 || move.y !== 0) {
          roomRef.current?.send("move", move);
        }
      };

      const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        roomRef.current?.send("disconnect", {});
        roomRef.current?.leave();
      };

      document.addEventListener("keydown", handleKeyDown);
      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("resize", resizeCanvas);
      };
    }
  }, []);

  const drawPlayers = (players: { [id: string]: Player }) => {
    if (!offscreenContext) return;

    // Clear the off-screen canvas
    offscreenContext.clearRect(
      0,
      0,
      offscreenCanvas.width,
      offscreenCanvas.height,
    );

    // Calculate the camera offset
    const cameraOffsetX = mainPlayerRef.current
      ? offscreenCanvas.width / 2 - mainPlayerRef.current.x
      : 0;
    const cameraOffsetY = mainPlayerRef.current
      ? offscreenCanvas.height / 2 - mainPlayerRef.current.y
      : 0;

    // Draw players on the off-screen canvas with camera offset);
    console.log(playersRef.current);
    Object.values(playersRef.current).forEach((player, id) => {

      console.log(player.x);
      offscreenContext!.fillRect(
        player.x + cameraOffsetX,
        player.y + cameraOffsetY,
        10,
        10,
      );
      offscreenContext!.fillText(
        player.name,
        player.x + cameraOffsetX,
        player.y + cameraOffsetY - 10,
      );
    });

    // Copy the off-screen canvas to the on-screen canvas
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(offscreenCanvas, 0, 0);
    }
  };

  return <canvas ref={canvasRef} className="Canvas" />;
};

export default Canvas;
