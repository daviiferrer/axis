// API Configuration
// For Android emulator: 10.0.2.2 maps to host machine's localhost
// For physical device: use your computer's local IP (e.g., 192.168.x.x)
import { Platform } from 'react-native';

const getApiUrl = () => {
    if (Platform.OS === 'android') {
        // Emulator: 10.0.2.2, Physical: Use your computer's LAN IP
        return 'http://192.168.0.100:8000';
    } else if (Platform.OS === 'ios') {
        // iOS simulator can use localhost
        return 'http://localhost:8000';
    }
    // Web/default
    return 'http://localhost:8000';
};

export const API_URL = getApiUrl();

export const SOCKET_URL = API_URL;

// Supabase Configuration
export const SUPABASE_URL = 'https://htxcqjjtcsirqdpajibr.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0eGNxamp0Y3NpcnFkcGFqaWJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1ODQ2MDksImV4cCI6MjA4MjE2MDYwOX0.j2snOYFWOz5zR5zUYiju32cHZrwCUm5Ib-1i_IZA8lk';

// App Settings
export const APP_NAME = 'ÁXIS';
export const APP_VERSION = '1.0.0';
