import { io } from "socket.io-client";

let socket;

export const connectSocket = () => {
  const token = localStorage.getItem("token");

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
    auth: {
      token,
    },
  });

  return socket;
};

export const getSocket = () => socket;
