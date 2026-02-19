"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { socket } from "@/services/socket";
import { Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";

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
    const { user } = useAuth();

    useEffect(() => {
        function onConnect() {
            console.log("[SocketContext] Connected");
            setIsConnected(true);
            // Join user-specific room for multi-tenant event routing
            if (user?.id) {
                socket.emit('join:user', user.id);
                console.log("[SocketContext] Joined user room:", user.id);
            }
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
        } else if (user?.id) {
            // Already connected, join room
            socket.emit('join:user', user.id);
        }

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.disconnect();
        };
    }, [user?.id]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
