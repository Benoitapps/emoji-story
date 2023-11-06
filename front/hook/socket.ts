import { E } from "@/interface";
import { useRef } from "react";
import { Manager, Socket } from "socket.io-client";

const manager = new Manager(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  {
    reconnection: true,
    autoConnect: false,
  }
);

export function useSocket(namespace: string = "") {
  const socket: Socket<E.ServerToClientEvents, E.ClientToServerEvents> =
    manager.socket(`/${namespace}`);

  const socketRef = useRef(socket);

  return socketRef;
}
