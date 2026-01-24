import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Separate the URL origin if using a path like /api/v1 (though usually socket connects to root)
// Assuming backend socket is on root of API_URL
export const socket: Socket = io(API_URL, {
    autoConnect: false, // We connect manually in Context
    transports: ["websocket"],
    path: "/socket.io/", // Standard path, adjust if backend configured differently
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});
