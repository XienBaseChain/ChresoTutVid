/**
 * Audit API Layer
 * 
 * This module provides typed API functions for audit log operations.
 * All Supabase calls are centralized here to decouple components from the database.
 */

import { supabase } from '../../../lib/supabase';
import { downloadAsCSV } from '../../../lib/csvExport';
import type { AuditLog } from '../../../types';

// ============================================
// API Response Types
// ============================================

export interface AuditLogsListResponse {
    logs: AuditLog[];
    error: Error | null;
}

// ============================================
// Audit API Functions
// ============================================

/**
 * Fetch audit logs ordered by creation date (newest first)
 * Limited to 500 records for performance
 */
export async function fetchAuditLogs(): Promise<AuditLogsListResponse> {
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

    if (error) {
        console.error('Error fetching audit logs:', error);
        return { logs: [], error: new Error(error.message) };
    }

    return { logs: (data as AuditLog[]) ?? [], error: null };
}

/**
 * Export audit logs to CSV format
 */
export function exportAuditLogsToCSV(logs: AuditLog[]): void {
    const today = new Date().toISOString().split('T')[0];
    downloadAsCSV(logs, {
        headers: ['created_at', 'action', 'user_id', 'user_role', 'details'],
        filename: `audit_logs_${today}`,
    });
}
