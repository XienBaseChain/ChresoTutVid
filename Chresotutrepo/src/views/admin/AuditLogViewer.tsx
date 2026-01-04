/**
 * AuditLogViewer Component
 * 
 * Admin view for viewing audit logs. Refactored to use useAuditLogs hook
 * for separation of concerns - UI logic only, business logic in hook.
 */

import React from 'react';
import { useAuditLogs } from '../../features/audit';
import { Button, LoadingSpinner } from '../../components/ui';
import { Download, AlertCircle, ClipboardList } from 'lucide-react';

export function AuditLogViewer() {
    const { logs, isLoading, error, exportToCSV } = useAuditLogs();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Security Audit Trail</h3>
                    <p className="text-sm text-slate-500">Immutable records of system activity.</p>
                </div>
                <Button variant="secondary" onClick={exportToCSV} leftIcon={<Download size={16} />}>
                    Export Logs
                </Button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span className="font-medium">{error.message}</span>
                </div>
            )}

            {/* Logs Table */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner size="md" message="Loading audit logs..." />
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="max-h-[600px] overflow-y-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Timestamp
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Action
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        User ID
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Details
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded bg-slate-100 text-[9px] font-black text-slate-600 uppercase">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-black text-slate-900 uppercase">
                                            {log.user_id?.slice(0, 8) || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500 font-medium max-w-md truncate">
                                            {log.details}
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                            <ClipboardList size={48} className="mx-auto mb-4 opacity-50" />
                                            <p className="font-medium">No audit logs found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AuditLogViewer;
