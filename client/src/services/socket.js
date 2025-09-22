import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3000";
let socket;

export const initSocket = (userType, id) => {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ["websocket"] });
    socket.on("connect", () => {
      console.log("✅ Connected:", socket.id);
      if (userType === "user") socket.emit("registerUser", id);
      else if (userType === "captain") socket.emit("registerCaptain", id);
    });
  }
  return socket;
};

export const getSocket = () => socket;
