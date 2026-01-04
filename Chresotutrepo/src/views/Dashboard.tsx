/**
 * Dashboard Component
 * 
 * Main dashboard for students and staff. Refactored to use useDashboard hook
 * for separation of concerns - UI logic only, data fetching in hook.
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDashboard } from '../features/dashboard';
import { useAuth } from '../hooks/useAuth';
import { Modal } from '../components/ui';
import { LogOut, Play, ExternalLink, Globe, BookOpen, Search, User, AlertCircle } from 'lucide-react';

export function Dashboard() {
    const { user, role, signOut } = useAuth();
    const { filteredTutorials, isLoading, searchTerm, setSearchTerm } = useDashboard();
    const navigate = useNavigate();
    const location = useLocation();

    // Local UI state
    const [activeVideo, setActiveVideo] = useState<string | null>(null);

    // Check for access denied message
    const accessDenied = (location.state as { accessDenied?: boolean })?.accessDenied;

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    // Static theme classes to avoid Tailwind purge issues
    const isStaff = role === 'STAFF';
    const themeClasses = {
        banner: isStaff
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 shadow-blue-100'
            : 'bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-emerald-100',
        iconBg: isStaff ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600',
        iconBgHover: isStaff
            ? 'group-hover:bg-blue-600 group-hover:text-white'
            : 'group-hover:bg-emerald-600 group-hover:text-white',
        userIcon: isStaff ? 'text-blue-600' : 'text-emerald-600',
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Navbar */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-900 p-1.5 rounded-lg shadow-sm">
                            <span className="text-white text-xs font-black">CHRESO</span>
                        </div>
                        <h1 className="text-lg font-bold text-slate-800 hidden md:block">
                            {isStaff ? 'Staff' : 'Student'} Repository
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                            <User size={16} className={themeClasses.userIcon} />
                            <span className="text-sm font-bold text-slate-700">{user?.name}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
                {/* Access Denied Alert */}
                {accessDenied && (
                    <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3">
                        <AlertCircle size={20} />
                        <p className="font-medium">
                            You don't have permission to access that area. Contact an administrator if you need access.
                        </p>
                    </div>
                )}

                {/* Banner */}
                <div
                    className={`mb-10 ${themeClasses.banner} rounded-3xl p-8 text-white shadow-xl relative overflow-hidden`}
                >
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-2">
                            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
                        </h2>
                        <p className="text-white/80 max-w-xl">
                            Access all your {role?.toLowerCase()} portal and e-learning resources in one place. Secure
                            role-based access to University systems.
                        </p>
                    </div>
                    <div className="absolute right-[-10%] bottom-[-50%] opacity-10 rotate-12">
                        <Globe size={400} />
                    </div>
                </div>

                {/* Action Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <a
                        href={isStaff ? 'https://staff.chresouniversity.edu.zm' : 'https://student.chresouniversity.edu.zm'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${themeClasses.iconBg} ${themeClasses.iconBgHover} transition-all`}>
                                <Globe size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{isStaff ? 'Staff' : 'Student'} Portal</h3>
                                <p className="text-xs text-slate-500">Access your core university records</p>
                            </div>
                        </div>
                        <ExternalLink size={20} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </a>

                    <a
                        href="https://elearning.chresouniversity.edu.zm"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${themeClasses.iconBg} ${themeClasses.iconBgHover} transition-all`}>
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{isStaff ? 'Staff' : 'Student'} E-Learning</h3>
                                <p className="text-xs text-slate-500">Access course materials and assignments</p>
                            </div>
                        </div>
                        <ExternalLink size={20} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </a>
                </div>

                {/* Search and Content */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <h3 className="text-xl font-bold text-slate-800">Tutorial Repository</h3>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search tutorials..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border-2 border-slate-100 focus:border-slate-900 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Tutorial Grid */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredTutorials.length > 0 ? (
                            filteredTutorials.map((tutorial) => (
                                <div
                                    key={tutorial.id}
                                    className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all flex flex-col group"
                                >
                                    <div
                                        className="aspect-video bg-slate-900 relative flex items-center justify-center cursor-pointer overflow-hidden"
                                        onClick={() => setActiveVideo(tutorial.video_url)}
                                    >
                                        <img
                                            src={`https://picsum.photos/seed/${tutorial.id}/400/225`}
                                            alt=""
                                            className="absolute inset-0 w-full h-full object-cover opacity-60"
                                        />
                                        <div className="relative z-10 w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Play className="text-white fill-white ml-1" size={24} />
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <h4 className="font-bold text-slate-800 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                                            {tutorial.title}
                                        </h4>
                                        <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                                            {tutorial.description}
                                        </p>
                                        <div className="flex gap-2">
                                            <a
                                                href={tutorial.portal_link || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 text-center py-2 px-3 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                            >
                                                Portal Link
                                            </a>
                                            <a
                                                href={tutorial.elearning_link || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 text-center py-2 px-3 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                            >
                                                E-Learning
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center">
                                <div className="inline-flex p-6 rounded-full bg-slate-100 text-slate-400 mb-4">
                                    <Search size={48} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">No tutorials found</h3>
                                <p className="text-slate-500">Try adjusting your search or check back later.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Video Modal */}
            <Modal
                isOpen={!!activeVideo}
                onClose={() => setActiveVideo(null)}
                size="xl"
                showCloseButton={true}
                title="Tutorial Video"
            >
                <div className="bg-black aspect-video rounded-xl overflow-hidden">
                    {activeVideo && (
                        <video src={activeVideo} controls autoPlay className="w-full h-full" />
                    )}
                </div>
            </Modal>

            <footer className="py-8 border-t border-slate-200 bg-white mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm font-medium">
                    <p>Authenticated: {user?.name} ({user?.id_number})</p>
                    <p className="mt-1">Logged actions are auditable. System security protocols active.</p>
                </div>
            </footer>
        </div>
    );
}

export default Dashboard;
