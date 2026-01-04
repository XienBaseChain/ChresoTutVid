/**
 * UserManager Component
 * 
 * Admin view for managing users. Refactored to use useUsers hook
 * for separation of concerns - UI logic only, business logic in hook.
 */

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useUsers } from '../../features/users';
import { logAction } from '../../lib/supabase';
import { Button, Input } from '../../components/ui';
import { Trash2, CheckCircle2, Download, AlertCircle, Users } from 'lucide-react';
import type { User } from '../../types';

export function UserManager() {
    const { user: currentUser } = useAuth();
    const { users, isLoading, error, deleteUser, refreshUsers, exportToCSV } = useUsers();

    // Local UI state
    const [newUserRole, setNewUserRole] = useState<'STAFF' | 'STUDENT'>('STAFF');
    const [newUserId, setNewUserId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle add user (note: full implementation would create Supabase Auth user)
    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Note: In production, this would create a Supabase Auth user first
        // For now, we're just logging the action for ID management
        await logAction('ADD_USER_ID', `Added ${newUserRole}: ${newUserId}`);
        setNewUserId('');
        await refreshUsers();
        setIsSubmitting(false);
    };

    // Handle delete with confirmation
    const handleDeleteUser = async (user: User) => {
        if (!confirm(`Remove ID ${user.id_number} from the system?`)) return;
        await deleteUser(user);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User Registry Table */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800">ID Registry</h3>
                    <Button variant="secondary" onClick={exportToCSV} leftIcon={<Download size={14} />}>
                        Export CSV
                    </Button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                        <AlertCircle size={18} />
                        <span className="font-medium">{error.message}</span>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        ID Number
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Role
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">{u.id_number}</td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === 'STAFF'
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'bg-emerald-50 text-emerald-600'
                                                    }`}
                                            >
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold uppercase tracking-wider">
                                                <CheckCircle2 size={14} />
                                                {u.is_active ? 'Active' : 'Inactive'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDeleteUser(u)}
                                                className="p-2 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                            <Users size={48} className="mx-auto mb-4 opacity-50" />
                                            <p className="font-medium">No users found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add User Form */}
            <div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-28">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Authorize Access</h3>
                    <form onSubmit={handleAddUser} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                                Role Type
                            </label>
                            <select
                                value={newUserRole}
                                onChange={(e) => setNewUserRole(e.target.value as 'STAFF' | 'STUDENT')}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-900 transition-all font-bold text-sm"
                            >
                                <option value="STAFF">University Staff</option>
                                <option value="STUDENT">University Student</option>
                            </select>
                        </div>
                        <Input
                            label="ID Number"
                            required
                            value={newUserId}
                            onChange={(e) => setNewUserId(e.target.value)}
                            placeholder="STF000 / STD000"
                        />
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full shadow-xl shadow-slate-200"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Syncing...' : 'Sync Registry'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default UserManager;
