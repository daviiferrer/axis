import io from 'socket.io-client';
import { API_URL } from '../config/api';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect() {
        if (this.socket?.connected) return;

        this.socket = io(API_URL, {
            transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Infinity, // Keep trying forever
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            forceNew: false,
        });

        this.socket.on('connect', () => {
            console.log('[Socket] Connected to:', API_URL);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.log('[Socket] Connection Error:', error);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    on(event, callback) {
        if (!this.socket) this.connect();
        this.socket.on(event, callback);
    }

    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    emit(event, data) {
        if (!this.socket) this.connect();
        this.socket.emit(event, data);
    }
}

export const socketService = new SocketService();
export default socketService;
