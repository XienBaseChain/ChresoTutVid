import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../useAuth';
import React from 'react';

// Mock the supabase module
vi.mock('../../lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: { session: null },
                error: null
            }),
            onAuthStateChange: vi.fn().mockImplementation((callback) => {
                // Return subscription object
                return {
                    data: {
                        subscription: {
                            unsubscribe: vi.fn()
                        }
                    }
                };
            }),
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        },
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
    },
    logAction: vi.fn(),
}));

// Test component that displays auth state
function TestAuthConsumer() {
    const { user, isLoading, isAuthenticated, role } = useAuth();

    return (
        <div>
            <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
            <div data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</div>
            <div data-testid="user">{user?.name ?? 'null'}</div>
            <div data-testid="role">{role ?? 'null'}</div>
        </div>
    );
}

describe('AuthProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render children', () => {
        render(
            <AuthProvider>
                <div data-testid="child">Child Component</div>
            </AuthProvider>
        );

        expect(screen.getByTestId('child')).toBeInTheDocument();
        expect(screen.getByTestId('child')).toHaveTextContent('Child Component');
    });

    it('should provide auth context with initial null state', async () => {
        render(
            <AuthProvider>
                <TestAuthConsumer />
            </AuthProvider>
        );

        // Wait for loading to complete
        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
        });

        // When no session, user should be null
        expect(screen.getByTestId('user')).toHaveTextContent('null');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
        expect(screen.getByTestId('role')).toHaveTextContent('null');
    });

    it('should throw error when useAuth is used outside AuthProvider', () => {
        // Suppress console.error for this test
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        expect(() => {
            render(<TestAuthConsumer />);
        }).toThrow('useAuth must be used within an AuthProvider');

        consoleSpy.mockRestore();
    });
});
