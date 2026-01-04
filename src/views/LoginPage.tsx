import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, AlertCircle, GraduationCap, Briefcase, ShieldAlert } from 'lucide-react';
import type { Role } from '../types';

type LoginMode = 'selection' | 'staff' | 'student' | 'admin';

export function LoginPage() {
    const [mode, setMode] = useState<LoginMode>('selection');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loginAttempted, setLoginAttempted] = useState(false);
    const loginTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { signIn, isAuthenticated, role, isLoading: authLoading, session } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Get redirect destination from state or default to dashboard
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

    // Watch for authentication changes after login attempt
    // Redirect based on user role once auth state is confirmed
    useEffect(() => {
        if (loginAttempted && isAuthenticated && role) {
            // Clear timeout since login succeeded
            if (loginTimeoutRef.current) {
                clearTimeout(loginTimeoutRef.current);
                loginTimeoutRef.current = null;
            }
            setIsLoading(false);
            // Redirect admin users to admin panel, others to their original destination
            if (role === 'ADMIN') {
                navigate('/admin', { replace: true });
            } else {
                navigate(from, { replace: true });
            }
        }
    }, [loginAttempted, isAuthenticated, role, navigate, from]);

    // Handle the case where Supabase auth succeeds but user profile not found
    // This happens when user exists in Auth but not in the users table
    useEffect(() => {
        if (loginAttempted && !authLoading && session && !isAuthenticated) {
            // Auth succeeded (we have session) but profile not found (isAuthenticated is false)
            // This means the user doesn't exist in our users table
            if (loginTimeoutRef.current) {
                clearTimeout(loginTimeoutRef.current);
                loginTimeoutRef.current = null;
            }
            setError('Account not found. Your authentication succeeded but your user profile is not set up. Please contact an administrator.');
            setIsLoading(false);
            setLoginAttempted(false);
        }
    }, [loginAttempted, authLoading, session, isAuthenticated]);

    // If already authenticated, redirect immediately
    useEffect(() => {
        if (isAuthenticated && role) {
            if (role === 'ADMIN') {
                navigate('/admin', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [isAuthenticated, role, navigate]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (loginTimeoutRef.current) {
                clearTimeout(loginTimeoutRef.current);
            }
        };
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const { error: authError } = await signIn(email, password);

        if (authError) {
            setError(authError.message || 'Login failed. Please check your credentials.');
            setIsLoading(false);
            return;
        }

        // Mark that login was attempted - the useEffect will handle redirect
        // once the auth state updates with user role information
        setLoginAttempted(true);

        // Set a timeout to prevent infinite loading (10 seconds)
        // Must use a function that doesn't close over isLoading
        loginTimeoutRef.current = setTimeout(() => {
            setError('Login is taking too long. Your account may not be properly configured. Please contact an administrator.');
            setIsLoading(false);
            setLoginAttempted(false);
        }, 10000);
    };

    const getRoleFromMode = (): Role | null => {
        if (mode === 'staff') return 'STAFF';
        if (mode === 'student') return 'STUDENT';
        if (mode === 'admin') return 'ADMIN';
        return null;
    };

    const themeColor = mode === 'staff' ? 'blue' : mode === 'student' ? 'emerald' : 'slate';

    // Selection screen
    if (mode === 'selection') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                <div className="mb-12 text-center animate-fadeIn">
                    <div className="flex justify-center mb-4">
                        <div className="bg-blue-900 p-4 rounded-2xl shadow-xl">
                            <span className="text-white text-3xl font-black tracking-tighter">CHRESO</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">University Tutorial Repository</h1>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                        Select your role below to access the secure repository of portal and e-learning guides.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4 animate-fadeIn">
                    <button
                        onClick={() => setMode('staff')}
                        className="group relative overflow-hidden bg-white p-8 rounded-2xl border-2 border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all duration-300 text-left"
                    >
                        <div className="mb-6 inline-flex p-4 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Briefcase size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-slate-800">Staff Portal</h2>
                        <p className="text-slate-500 mb-4 leading-relaxed">
                            Access tutorials for grading, e-learning management, and portal resources.
                        </p>
                        <span className="inline-flex items-center text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">
                            Staff Login →
                        </span>
                    </button>

                    <button
                        onClick={() => setMode('student')}
                        className="group relative overflow-hidden bg-white p-8 rounded-2xl border-2 border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all duration-300 text-left"
                    >
                        <div className="mb-6 inline-flex p-4 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <GraduationCap size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-slate-800">Student Portal</h2>
                        <p className="text-slate-500 mb-4 leading-relaxed">
                            Find tutorials for module access, online exams, and student support services.
                        </p>
                        <span className="inline-flex items-center text-emerald-600 font-semibold group-hover:translate-x-1 transition-transform">
                            Student Login →
                        </span>
                    </button>
                </div>

                <footer className="mt-16 text-center text-slate-400 text-sm animate-fadeIn">
                    <p>© {new Date().getFullYear()} Chreso University. All rights reserved.</p>
                    <button
                        onClick={() => setMode('admin')}
                        className="mt-4 inline-flex items-center gap-1.5 hover:text-slate-600 transition-colors opacity-30 hover:opacity-100 font-bold"
                    >
                        <Lock size={12} />
                        Admin Access
                    </button>
                </footer>
            </div>
        );
    }

    // Login form screen
    const roleConfig = {
        staff: { title: 'Staff Login', icon: Briefcase, color: 'blue' },
        student: { title: 'Student Login', icon: GraduationCap, color: 'emerald' },
        admin: { title: 'Admin Login', icon: ShieldAlert, color: 'slate' },
    };

    const config = roleConfig[mode];
    const Icon = config.icon;

    return (
        <div className={`min-h-screen flex items-center justify-center p-6 ${mode === 'admin' ? 'bg-slate-950' : 'bg-gradient-to-br from-slate-50 to-slate-100'
            }`}>
            <div className={`w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-slideUp ${mode === 'admin' ? 'shadow-[0_20px_50px_rgba(0,0,0,0.3)]' : ''
                }`}>
                {mode === 'admin' && (
                    <div className="bg-slate-50 p-10 text-center border-b border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                        <div className="inline-flex p-4 rounded-2xl bg-slate-900 text-white mb-4 shadow-xl shadow-slate-200">
                            <ShieldAlert size={32} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wider">Restricted Access</h1>
                        <p className="text-slate-500 text-sm font-semibold tracking-tight">University Administrative Registry</p>
                    </div>
                )}

                <div className="p-8">
                    <button
                        onClick={() => { setMode('selection'); setError(''); setEmail(''); setPassword(''); }}
                        className="text-sm text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-1 font-bold"
                    >
                        ← Back to Selection
                    </button>

                    {mode !== 'admin' && (
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`p-3 rounded-lg ${mode === 'staff' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                                }`}>
                                <Icon />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{config.title}</h2>
                                <p className="text-xs text-slate-500">Authenticated via University SSO</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                                    <Mail size={20} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your.email@chresouniversity.edu.zm"
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all outline-none font-medium ${error
                                        ? 'border-red-200 focus:border-red-500 bg-red-50/30'
                                        : 'border-slate-100 focus:border-slate-900 focus:bg-white'
                                        }`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all outline-none font-medium ${error
                                        ? 'border-red-200 focus:border-red-500 bg-red-50/30'
                                        : 'border-slate-100 focus:border-slate-900 focus:bg-white'
                                        }`}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
                                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                <p className="font-semibold">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-4 rounded-xl text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                                } ${mode === 'staff'
                                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                                    : mode === 'student'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                                        : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
                                }`}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Lock size={18} />
                                    Login Securely
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {mode === 'admin' && (
                    <div className="bg-slate-50 px-10 py-5 border-t border-slate-100">
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2 text-slate-400 text-[9px] uppercase font-black tracking-widest">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Secure Audit Logging Active
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LoginPage;
