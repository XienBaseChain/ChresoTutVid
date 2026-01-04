import '@testing-library/jest-dom';

// Mock Supabase client for testing
vi.mock('../lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
            onAuthStateChange: vi.fn().mockReturnValue({
                data: { subscription: { unsubscribe: vi.fn() } }
            }),
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        },
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    logAction: vi.fn().mockResolvedValue(undefined),
}));

// Extend expect with jest-dom matchers
declare global {
    namespace Vi {
        interface JestAssertion<T = unknown> {
            toBeInTheDocument(): void;
            toHaveTextContent(text: string): void;
        }
    }
}
