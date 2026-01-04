/**
 * useTutorials Hook
 * 
 * Custom hook for managing tutorials state and operations.
 * Encapsulates all data fetching and state management logic.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Tutorial, TutorialFormData } from '../../../types';
import {
    fetchTutorials as apiFetchTutorials,
    createTutorial as apiCreateTutorial,
    deleteTutorial as apiDeleteTutorial,
} from '../api/tutorials.api';

// ============================================
// Hook Return Type
// ============================================

export interface UseTutorialsReturn {
    tutorials: Tutorial[];
    isLoading: boolean;
    error: Error | null;
    createTutorial: (formData: TutorialFormData, userId?: string) => Promise<boolean>;
    deleteTutorial: (id: string, title: string) => Promise<boolean>;
    refreshTutorials: () => Promise<void>;
}

// ============================================
// useTutorials Hook
// ============================================

export function useTutorials(): UseTutorialsReturn {
    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Fetch all tutorials
    const refreshTutorials = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const { tutorials: data, error: fetchError } = await apiFetchTutorials();

        if (fetchError) {
            setError(fetchError);
        } else {
            setTutorials(data);
        }

        setIsLoading(false);
    }, []);

    // Create a new tutorial
    const createTutorial = useCallback(async (
        formData: TutorialFormData,
        userId?: string
    ): Promise<boolean> => {
        const tutorialInsert = {
            title: formData.title,
            description: formData.description || null,
            video_url: formData.video_url,
            portal_link: formData.portal_link || null,
            elearning_link: formData.elearning_link || null,
            target_role: formData.target_role,
        };

        const { error: createError } = await apiCreateTutorial(tutorialInsert, userId);

        if (createError) {
            setError(createError);
            return false;
        }

        // Refresh the list after successful creation
        await refreshTutorials();
        return true;
    }, [refreshTutorials]);

    // Delete a tutorial
    const deleteTutorial = useCallback(async (
        id: string,
        title: string
    ): Promise<boolean> => {
        const { error: deleteError } = await apiDeleteTutorial(id, title);

        if (deleteError) {
            setError(deleteError);
            return false;
        }

        // Refresh the list after successful deletion
        await refreshTutorials();
        return true;
    }, [refreshTutorials]);

    // Initial data fetch
    useEffect(() => {
        refreshTutorials();
    }, [refreshTutorials]);

    return {
        tutorials,
        isLoading,
        error,
        createTutorial,
        deleteTutorial,
        refreshTutorials,
    };
}

export default useTutorials;
