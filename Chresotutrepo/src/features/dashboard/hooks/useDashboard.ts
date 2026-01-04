/**
 * useDashboard Hook
 * 
 * Custom hook for managing dashboard state and tutorial fetching.
 * Encapsulates data fetching logic for the student/staff dashboard.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Tutorial } from '../../../types';

// ============================================
// Hook Return Type
// ============================================

export interface UseDashboardReturn {
    tutorials: Tutorial[];
    filteredTutorials: Tutorial[];
    isLoading: boolean;
    error: Error | null;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    refreshTutorials: () => Promise<void>;
}

// ============================================
// useDashboard Hook
// ============================================

export function useDashboard(): UseDashboardReturn {
    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch all tutorials
    const refreshTutorials = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
            .from('tutorials')
            .select('*')
            .order('created_at', { ascending: false });

        if (fetchError) {
            console.error('Error fetching tutorials:', fetchError);
            setError(new Error(fetchError.message));
        } else {
            setTutorials(data ?? []);
        }

        setIsLoading(false);
    }, []);

    // Filter tutorials based on search term
    const filteredTutorials = useMemo(() => {
        if (!searchTerm.trim()) return tutorials;

        const term = searchTerm.toLowerCase();
        return tutorials.filter(
            (t) =>
                t.title.toLowerCase().includes(term) ||
                (t.description?.toLowerCase() || '').includes(term)
        );
    }, [tutorials, searchTerm]);

    // Initial data fetch
    useEffect(() => {
        refreshTutorials();
    }, [refreshTutorials]);

    return {
        tutorials,
        filteredTutorials,
        isLoading,
        error,
        searchTerm,
        setSearchTerm,
        refreshTutorials,
    };
}

export default useDashboard;
