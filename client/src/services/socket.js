import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3000"; // Gateway server

let socket;

export const connectSocket = (userType, id) => {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ["websocket"] });
  }

  socket.on("connect", () => {
    console.log("✅ Connected to WebSocket:", socket.id);

    if (userType === "user") {
      socket.emit("registerUser", id);
    } else if (userType === "captain") {
      socket.emit("registerCaptain", id);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected from WebSocket");
  });

  return socket;
};

export const getSocket = () => socket;
