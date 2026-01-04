/**
 * Users API Layer
 * 
 * This module provides typed API functions for user CRUD operations.
 * All Supabase calls are centralized here to decouple components from the database.
 */

import { supabase, logAction } from '../../../lib/supabase';
import { downloadAsCSV } from '../../../lib/csvExport';
import type { User } from '../../../types';

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
    data: T | null;
    error: Error | null;
}

export interface UsersListResponse {
    users: User[];
    error: Error | null;
}

// ============================================
// User API Functions
// ============================================

/**
 * Fetch all users (STAFF and STUDENT only) ordered by creation date
 */
export async function fetchUsers(): Promise<UsersListResponse> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('role', ['STAFF', 'STUDENT'])
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching users:', error);
        return { users: [], error: new Error(error.message) };
    }

    return { users: (data as User[]) ?? [], error: null };
}

/**
 * Delete a user by ID
 */
export async function deleteUser(
    userId: string,
    idNumber: string
): Promise<ApiResponse<void>> {
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

    if (error) {
        console.error('Error deleting user:', error);
        return { data: null, error: new Error(error.message) };
    }

    await logAction('DELETE_USER_ID', `Removed ID: ${idNumber}`);
    return { data: undefined, error: null };
}

/**
 * Export users to CSV format
 */
export function exportUsersToCSV(users: User[]): void {
    downloadAsCSV(users, {
        headers: ['id_number', 'name', 'role', 'email', 'is_active'],
        filename: 'university_ids',
    });
}
