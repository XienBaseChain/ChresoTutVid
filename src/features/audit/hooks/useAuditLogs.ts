/**
 * useAuditLogs Hook
 * 
 * Custom hook for managing audit logs state and operations.
 * Encapsulates all data fetching and state management logic.
 */

import { useState, useEffect, useCallback } from 'react';
import type { AuditLog } from '../../../types';
import {
    fetchAuditLogs as apiFetchAuditLogs,
    exportAuditLogsToCSV as apiExportAuditLogsToCSV,
} from '../api/audit.api';

// ============================================
// Hook Return Type
// ============================================

export interface UseAuditLogsReturn {
    logs: AuditLog[];
    isLoading: boolean;
    error: Error | null;
    refreshLogs: () => Promise<void>;
    exportToCSV: () => void;
}

// ============================================
// useAuditLogs Hook
// ============================================

export function useAuditLogs(): UseAuditLogsReturn {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Fetch all audit logs
    const refreshLogs = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const { logs: data, error: fetchError } = await apiFetchAuditLogs();

        if (fetchError) {
            setError(fetchError);
        } else {
            setLogs(data);
        }

        setIsLoading(false);
    }, []);

    // Export logs to CSV
    const exportToCSV = useCallback(() => {
        apiExportAuditLogsToCSV(logs);
    }, [logs]);

    // Initial data fetch
    useEffect(() => {
        refreshLogs();
    }, [refreshLogs]);

    return {
        logs,
        isLoading,
        error,
        refreshLogs,
        exportToCSV,
    };
}

export default useAuditLogs;
