import { io } from "socket.io-client";

const SOCKET_URL = "https://food-delivery-app-backend-2ifj.onrender.com";

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: true,
});
