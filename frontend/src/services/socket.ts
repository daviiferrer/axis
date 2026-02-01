import { io, Socket } from "socket.io-client";

const apiEnvUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
// Extract origin (e.g., http://localhost:8000 from http://localhost:8000/api/v1)
const SOCKET_URL = new URL(apiEnvUrl).origin;

// Separate the URL origin if using a path like /api/v1 (though usually socket connects to root)
// Assuming backend socket is on root of API_URL
export const socket: Socket = io(SOCKET_URL, {
    autoConnect: false, // We connect manually in Context
    // transports: ["websocket"], // Allow polling fallback
    path: "/socket.io/", // Standard path, adjust if backend configured differently
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});
