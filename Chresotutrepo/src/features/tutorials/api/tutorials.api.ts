/**
 * Tutorials API Layer
 * 
 * This module provides typed API functions for tutorial CRUD operations.
 * All Supabase calls are centralized here to decouple components from the database.
 */

import { supabase, logAction } from '../../../lib/supabase';
import type { Tutorial, TutorialInsert } from '../../../types';

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
    data: T | null;
    error: Error | null;
}

export interface TutorialsListResponse {
    tutorials: Tutorial[];
    error: Error | null;
}

// ============================================
// Tutorial API Functions
// ============================================

/**
 * Fetch all tutorials ordered by creation date (newest first)
 */
export async function fetchTutorials(): Promise<TutorialsListResponse> {
    const { data, error } = await supabase
        .from('tutorials')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tutorials:', error);
        return { tutorials: [], error: new Error(error.message) };
    }

    return { tutorials: (data as Tutorial[]) ?? [], error: null };
}

/**
 * Create a new tutorial
 */
export async function createTutorial(
    tutorial: TutorialInsert,
    createdByUserId?: string
): Promise<ApiResponse<Tutorial>> {
    const insertData = {
        ...tutorial,
        created_by: createdByUserId ?? null,
    };

    const { data, error } = await supabase
        .from('tutorials')
        .insert(insertData as never)
        .select()
        .single();

    if (error) {
        console.error('Error creating tutorial:', error);
        return { data: null, error: new Error(error.message) };
    }

    await logAction('CREATE_TUTORIAL', `Added: ${tutorial.title}`);
    return { data: data as Tutorial, error: null };
}

/**
 * Update an existing tutorial
 */
export async function updateTutorial(
    id: string,
    updates: Partial<TutorialInsert>
): Promise<ApiResponse<Tutorial>> {
    const { data, error } = await supabase
        .from('tutorials')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating tutorial:', error);
        return { data: null, error: new Error(error.message) };
    }

    await logAction('UPDATE_TUTORIAL', `Updated: ${updates.title ?? id}`);
    return { data: data as Tutorial, error: null };
}

/**
 * Delete a tutorial by ID
 */
export async function deleteTutorial(
    id: string,
    title: string
): Promise<ApiResponse<void>> {
    const { error } = await supabase
        .from('tutorials')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting tutorial:', error);
        return { data: null, error: new Error(error.message) };
    }

    await logAction('DELETE_TUTORIAL', `Deleted: ${title}`);
    return { data: undefined, error: null };
}
