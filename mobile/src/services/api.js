/**
 * API Service - Thin Client
 * All business logic resides on the backend.
 * This service only handles HTTP requests and token management.
 */
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';

// Create axios instance
const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token storage keys
const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'user_data';

/**
 * Token Management
 */
export const TokenService = {
    async getToken() {
        try {
            return await SecureStore.getItemAsync(TOKEN_KEY);
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    },

    async setToken(token) {
        try {
            await SecureStore.setItemAsync(TOKEN_KEY, token);
        } catch (error) {
            console.error('Error setting token:', error);
        }
    },

    async removeToken() {
        try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
        } catch (error) {
            console.error('Error removing token:', error);
        }
    },

    async getUser() {
        try {
            const userData = await SecureStore.getItemAsync(USER_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },

    async setUser(user) {
        try {
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
        } catch (error) {
            console.error('Error setting user:', error);
        }
    },

    async removeUser() {
        try {
            await SecureStore.deleteItemAsync(USER_KEY);
        } catch (error) {
            console.error('Error removing user:', error);
        }
    },

    async clearAll() {
        await this.removeToken();
        await this.removeUser();
    },
};

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
    async (config) => {
        const token = await TokenService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired - will be handled by auth context
            console.log('Unauthorized - token may be expired');
        }
        return Promise.reject(error);
    }
);

/**
 * Auth API - No business logic, just API calls
 */
export const AuthAPI = {
    async signup(email, password) {
        const response = await api.post('/auth/signup', { email, password });
        return response.data;
    },

    async login(email, password) {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    async getMe() {
        const response = await api.get('/auth/me');
        return response.data;
    },
};

/**
 * Video API - No business logic, just API calls
 */
export const VideoAPI = {
    async getDashboard() {
        const response = await api.get('/dashboard');
        return response.data;
    },

    async getStreamUrl(videoId, playbackToken) {
        const response = await api.get(`/video/${videoId}/stream`, {
            params: { token: playbackToken },
        });
        return response.data;
    },

    // Build embed URL for WebView (direct backend route)
    buildEmbedUrl(videoId, playbackToken, userId) {
        return `${API_CONFIG.BASE_URL}/video/${videoId}/embed?token=${encodeURIComponent(playbackToken)}&user_id=${userId}`;
    },
};

export default api;
