// ============================================
// CHRESO UNIVERSITY - TYPE DEFINITIONS
// ============================================

// Role enum matching database constraints
// SUDO added as additive extension for super-admin capabilities
export type Role = 'STAFF' | 'STUDENT' | 'ADMIN' | 'SUDO';

// Auth provider type for tracking login method
// legacy = existing password auth, magic_link = OTP-based, password = new credential-based
export type AuthProvider = 'legacy' | 'magic_link' | 'password';

// User profile from database
export interface User {
    id: string;
    id_number: string;
    role: Role;
    name: string;
    email: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // New additive fields (nullable for backward compatibility)
    email_verified?: boolean | null;
    auth_provider?: AuthProvider | null;
}

// Tutorial record from database
export interface Tutorial {
    id: string;
    title: string;
    description: string | null;
    video_url: string;
    portal_link: string | null;
    elearning_link: string | null;
    target_role: 'STAFF' | 'STUDENT';
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

// Audit log record from database
export interface AuditLog {
    id: string;
    user_id: string | null;
    user_role: string;
    action: string;
    details: string | null;
    created_at: string;
}

// Form data for creating a new tutorial
export interface TutorialFormData {
    title: string;
    description: string;
    video_url: string;
    portal_link: string;
    elearning_link: string;
    target_role: 'STAFF' | 'STUDENT';
}

// Insert type for tutorials (what we send to Supabase)
export interface TutorialInsert {
    title: string;
    description?: string | null;
    video_url: string;
    portal_link?: string | null;
    elearning_link?: string | null;
    target_role: 'STAFF' | 'STUDENT';
    created_by?: string | null;
}

// Form data for creating a new user
export interface UserFormData {
    id_number: string;
    role: 'STAFF' | 'STUDENT';
    name: string;
    email?: string;
}

// Insert type for users (what we send to Supabase)
export interface UserInsert {
    id: string;
    id_number: string;
    role: Role;
    name: string;
    email?: string | null;
    is_active: boolean;
}

// Auth context state
export interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

// ============================================
// SUPABASE DATABASE TYPES
// ============================================

export type Database = {
    public: {
        Tables: {
            users: {
                Row: User;
                Insert: UserInsert;
                Update: Partial<Omit<User, 'id' | 'created_at'>>;
                Relationships: [];
            };
            tutorials: {
                Row: Tutorial;
                Insert: TutorialInsert;
                Update: Partial<Omit<Tutorial, 'id' | 'created_at'>>;
                Relationships: [
                    {
                        foreignKeyName: 'tutorials_created_by_fkey';
                        columns: ['created_by'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    }
                ];
            };
            audit_logs: {
                Row: AuditLog;
                Insert: Omit<AuditLog, 'id' | 'created_at'>;
                Update: never;
                Relationships: [
                    {
                        foreignKeyName: 'audit_logs_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    }
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            get_my_role: {
                Args: Record<string, never>;
                Returns: string | null;
            };
            get_my_profile: {
                Args: Record<string, never>;
                Returns: User | null;
            };
            log_action: {
                Args: {
                    p_action: string;
                    p_details: string | null;
                };
                Returns: string;
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

// Helper type for Supabase table operations
export type Tables<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Update'];


