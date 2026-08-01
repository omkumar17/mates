import { io } from "socket.io-client";

let socket = null;

export const connectSocket = () => {
  if (socket) return socket; // Already created

  const token = localStorage.getItem("token");

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
    auth: { token },
    autoConnect: true,
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};