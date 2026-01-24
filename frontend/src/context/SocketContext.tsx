"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { socket } from "@/services/socket";
import { Socket } from "socket.io-client";

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        function onConnect() {
            console.log("[SocketContext] Connected");
            setIsConnected(true);
        }

        function onDisconnect() {
            console.log("[SocketContext] Disconnected");
            setIsConnected(false);
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        // Debug
        socket.on("connect_error", (err) => console.error("[SocketContext] Connection Error:", err));

        // Connect
        if (!socket.connected) {
            socket.connect();
        }

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
