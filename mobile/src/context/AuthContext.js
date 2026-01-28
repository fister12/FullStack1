/**
 * Auth Context - Manages authentication state
 * No business logic - just state management and API calls
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthAPI, TokenService } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check for existing token on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = await TokenService.getToken();
            if (token) {
                // Verify token with backend
                const userData = await AuthAPI.getMe();
                setUser(userData);
                setIsAuthenticated(true);
            }
        } catch (error) {
            // Token invalid or expired
            await TokenService.clearAll();
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (email, password) => {
        // No validation here - backend handles all validation
        const result = await AuthAPI.signup(email, password);
        return result;
    };

    const login = async (email, password) => {
        // No validation here - backend handles all validation
        const result = await AuthAPI.login(email, password);

        // Store token and user data
        await TokenService.setToken(result.access_token);
        await TokenService.setUser(result.user);

        setUser(result.user);
        setIsAuthenticated(true);

        return result;
    };

    const logout = async () => {
        await TokenService.clearAll();
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        user,
        isLoading,
        isAuthenticated,
        signup,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
