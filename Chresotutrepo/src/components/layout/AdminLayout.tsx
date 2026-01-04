import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Video, Users, ClipboardList, LogOut } from 'lucide-react';

export function AdminLayout() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const navItems = [
        { to: '/admin/tutorials', icon: Video, label: 'Tutorials' },
        { to: '/admin/users', icon: Users, label: 'User IDs' },
        { to: '/admin/logs', icon: ClipboardList, label: 'Audit Logs' },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed inset-y-0 z-50">
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-1.5 rounded-lg">
                            <span className="text-slate-900 text-xs font-black">CHRESO</span>
                        </div>
                        <span className="text-white font-bold tracking-tight">Admin CMS</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`
                            }
                        >
                            <Icon size={20} />
                            <span className="font-bold text-sm">{label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 mt-auto border-t border-slate-800">
                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-black text-xs uppercase">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-white text-xs font-black truncate">{user?.name || 'Admin'}</p>
                            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black opacity-60">
                                System Admin
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all text-xs font-black uppercase tracking-widest"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Panel */}
            <main className="flex-1 pl-64 animate-fadeIn">
                {/* Header */}
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
                    <div>
                        {/* Title will be provided by child routes */}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-500">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Real-time Monitoring Active
                        </div>
                    </div>
                </header>

                {/* Content - rendered from child routes */}
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default AdminLayout;
