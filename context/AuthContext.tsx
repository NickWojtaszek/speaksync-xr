import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/auth';
import type { User, UserRole } from '../types';

interface AuthContextType {
    currentUser: User | null;
    users: User[];
    login: (username: string, role: UserRole) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load initial auth state on mount
    useEffect(() => {
        const loadAuthState = async () => {
            try {
                const [user, userList] = await Promise.all([
                    authService.getCurrentUser(),
                    authService.getUsers(),
                ]);
                setCurrentUser(user);
                setUsers(userList);
            } catch (error) {
                console.error('Failed to load auth state:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAuthState();
    }, []);

    const login = useCallback(async (username: string, role: UserRole) => {
        try {
            const user = await authService.login(username, undefined, role);
            setCurrentUser(user);

            // Refresh users list
            const userList = await authService.getUsers();
            setUsers(userList);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await authService.logout();
            setCurrentUser(null);
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
    }, []);

    const value = {
        currentUser,
        users,
        login,
        logout,
        isLoading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
