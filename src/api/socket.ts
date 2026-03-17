import { io } from "socket.io-client";

const SOCKET_URL = "https://haldia-cloud-kitchen-backend-production.onrender.com";

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: true,
});
