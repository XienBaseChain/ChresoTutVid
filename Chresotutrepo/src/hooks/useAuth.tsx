import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { Session, AuthError } from '@supabase/supabase-js';
import { supabase, logAction } from '../lib/supabase';
import type { User, Role } from '../types';

// ============================================
// AUTH CONTEXT & PROVIDER
// ============================================

interface AuthContextValue {
    session: Session | null;
    user: User | null;
    role: Role | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    // Legacy auth methods (unchanged)
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string, userData: { name: string; id_number: string; role: Role }) => Promise<{ error: AuthError | Error | null }>;
    signOut: () => Promise<void>;
    // New v2 auth methods (additive - feature flagged)
    signInWithMagicLink?: (email: string, role: 'STAFF' | 'STUDENT') => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user profile from our users table
    const fetchUserProfile = useCallback(async (userId: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
        return data as User;
    }, []);

    // Initialize auth state
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                const profile = await fetchUserProfile(session.user.id);
                setUser(profile);
            }
            setIsLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session);

            if (session?.user) {
                const profile = await fetchUserProfile(session.user.id);
                setUser(profile);
            } else {
                setUser(null);
            }

            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [fetchUserProfile]);

    // Sign in with email and password
    const signIn = useCallback(async (email: string, password: string) => {
        setIsLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (!error) {
            await logAction('LOGIN', `User logged in: ${email}`);
        }

        setIsLoading(false);
        return { error };
    }, []);

    // Sign up with email, password, and user data
    const signUp = useCallback(async (
        email: string,
        password: string,
        userData: { name: string; id_number: string; role: Role }
    ) => {
        setIsLoading(true);

        // First, create the auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            setIsLoading(false);
            return { error: authError };
        }

        if (!authData.user) {
            setIsLoading(false);
            return { error: new Error('Failed to create user account') };
        }

        // Then create the user profile
        const userInsert = {
            id: authData.user.id,
            id_number: userData.id_number,
            role: userData.role,
            name: userData.name,
            email: email,
            is_active: true,
        };

        const { error: profileError } = await supabase
            .from('users')
            .insert(userInsert as never);

        if (profileError) {
            console.error('Error creating user profile:', profileError);
            setIsLoading(false);
            return { error: profileError };
        }

        await logAction('SIGNUP', `New user registered: ${email}`);

        setIsLoading(false);
        return { error: null };
    }, []);

    // Sign out
    const signOut = useCallback(async () => {
        if (user) {
            await logAction('LOGOUT', `User logged out: ${user.email}`);
        }

        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
    }, [user]);

    const value: AuthContextValue = {
        session,
        user,
        role: user?.role ?? null,
        isLoading,
        isAuthenticated: !!session && !!user,
        signIn,
        signUp,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// ============================================
// AUTH HOOK
// ============================================

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}

// ============================================
// ROLE CHECK HOOK
// ============================================

export function useRequireRole(allowedRoles: Role[]): {
    isAllowed: boolean;
    isLoading: boolean;
    role: Role | null;
} {
    const { role, isLoading } = useAuth();

    const isAllowed = role !== null && allowedRoles.includes(role);

    return { isAllowed, isLoading, role };
}
