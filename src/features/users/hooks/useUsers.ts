/**
 * useUsers Hook
 * 
 * Custom hook for managing users state and operations.
 * Encapsulates all data fetching and state management logic.
 */

import { useState, useEffect, useCallback } from 'react';
import type { User } from '../../../types';
import {
    fetchUsers as apiFetchUsers,
    deleteUser as apiDeleteUser,
    exportUsersToCSV as apiExportUsersToCSV,
} from '../api/users.api';

// ============================================
// Hook Return Type
// ============================================

export interface UseUsersReturn {
    users: User[];
    staffUsers: User[];
    studentUsers: User[];
    isLoading: boolean;
    error: Error | null;
    deleteUser: (user: User) => Promise<boolean>;
    refreshUsers: () => Promise<void>;
    exportToCSV: () => void;
}

// ============================================
// useUsers Hook
// ============================================

export function useUsers(): UseUsersReturn {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Derived state
    const staffUsers = users.filter((u) => u.role === 'STAFF');
    const studentUsers = users.filter((u) => u.role === 'STUDENT');

    // Fetch all users
    const refreshUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const { users: data, error: fetchError } = await apiFetchUsers();

        if (fetchError) {
            setError(fetchError);
        } else {
            setUsers(data);
        }

        setIsLoading(false);
    }, []);

    // Delete a user
    const deleteUser = useCallback(async (user: User): Promise<boolean> => {
        const { error: deleteError } = await apiDeleteUser(user.id, user.id_number);

        if (deleteError) {
            setError(deleteError);
            return false;
        }

        // Refresh the list after successful deletion
        await refreshUsers();
        return true;
    }, [refreshUsers]);

    // Export users to CSV
    const exportToCSV = useCallback(() => {
        apiExportUsersToCSV(users);
    }, [users]);

    // Initial data fetch
    useEffect(() => {
        refreshUsers();
    }, [refreshUsers]);

    return {
        users,
        staffUsers,
        studentUsers,
        isLoading,
        error,
        deleteUser,
        refreshUsers,
        exportToCSV,
    };
}

export default useUsers;
