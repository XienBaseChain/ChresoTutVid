import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { sendStudentMagicLink, sendStaffMagicLink, getStaffDomain } from '../features/auth';
import {
    Mail,
    Lock,
    AlertCircle,
    GraduationCap,
    Briefcase,
    ShieldAlert,
    Sparkles,
    ArrowLeft,
    CheckCircle2
} from 'lucide-react';
import type { Role } from '../types';

type LoginMode = 'selection' | 'staff' | 'student' | 'admin';
type AuthMethod = 'magic-link' | 'password';

/**
 * LoginPage v2 - Role-based auth with magic link support
 * 
 * Features:
 * - Student: Magic link (passwordless) flow
 * - Staff: Magic link with domain validation (@chresouniversity.edu.zm)
 * - Admin: Traditional email/password authentication
 * 
 * Falls back to legacy /login if magic link feature is disabled.
 */
export function LoginPageV2() {
    const [mode, setMode] = useState<LoginMode>('selection');
    const [authMethod, setAuthMethod] = useState<AuthMethod>('magic-link');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [magicLinkSent, setMagicLinkSent] = useState(false);

    const { signIn, isAuthenticated, role } = useAuth();
    const { magicLinkEnabled } = useFeatureFlags();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && role) {
            if (role === 'ADMIN' || role === 'SUDO') {
                navigate('/admin', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [isAuthenticated, role, navigate]);

    // Redirect to legacy login if magic link not enabled
    useEffect(() => {
        if (!magicLinkEnabled && mode !== 'admin') {
            // For admin, always use password auth
            // For others, redirect to legacy if magic link disabled
        }
    }, [magicLinkEnabled, mode]);

    const handleMagicLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = mode === 'student'
                ? await sendStudentMagicLink(email)
                : await sendStaffMagicLink(email);

            if (result.error) {
                setError(result.error);
            } else {
                setMagicLinkSent(true);
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const { error: authError } = await signIn(email, password);

        if (authError) {
            setError(authError.message || 'Login failed. Please check your credentials.');
            setIsLoading(false);
            return;
        }

        // Auth hook will handle redirect via useEffect
        setIsLoading(false);
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setError('');
        setMagicLinkSent(false);
    };

    // Magic link sent confirmation screen
    if (magicLinkSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center animate-fadeIn">
                    <div className="mb-6 inline-flex p-4 rounded-full bg-emerald-100 text-emerald-600">
                        <CheckCircle2 size={48} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email!</h1>
                    <p className="text-slate-500 mb-6">
                        We've sent a magic login link to<br />
                        <span className="font-semibold text-slate-700">{email}</span>
                    </p>
                    <div className="bg-slate-50 rounded-xl p-4 mb-6 text-sm text-slate-600">
                        <p>Click the link in your email to sign in securely. The link expires in 1 hour.</p>
                    </div>
                    <div className="space-y-3">
                        <button
                            onClick={() => { resetForm(); setMagicLinkSent(false); }}
                            className="w-full py-3 text-slate-600 hover:text-slate-800 font-medium flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={18} />
                            Use a different email
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm text-slate-400 hover:text-slate-600"
                        >
                            Back to legacy login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Role selection screen
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
                        Select your role below to access the secure repository.
                    </p>
                    {magicLinkEnabled && (
                        <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                            <Sparkles size={14} />
                            Passwordless login available
                        </div>
                    )}
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
                            {magicLinkEnabled ? 'Login with Magic Link →' : 'Staff Login →'}
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
                            {magicLinkEnabled ? 'Login with Magic Link →' : 'Student Login →'}
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

    // Login form for Staff/Student (Magic Link) or Admin (Password)
    const isStudent = mode === 'student';
    const isStaff = mode === 'staff';
    const isAdmin = mode === 'admin';
    const useMagicLink = magicLinkEnabled && !isAdmin;

    const config = {
        staff: { title: 'Staff Login', icon: Briefcase, color: 'blue' },
        student: { title: 'Student Login', icon: GraduationCap, color: 'emerald' },
        admin: { title: 'Admin Login', icon: ShieldAlert, color: 'slate' },
    };

    const currentConfig = config[mode];
    const Icon = currentConfig.icon;

    return (
        <div className={`min-h-screen flex items-center justify-center p-6 ${isAdmin ? 'bg-slate-950' : 'bg-gradient-to-br from-slate-50 to-slate-100'
            }`}>
            <div className={`w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-slideUp ${isAdmin ? 'shadow-[0_20px_50px_rgba(0,0,0,0.3)]' : ''
                }`}>
                {isAdmin && (
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
                        onClick={() => { setMode('selection'); resetForm(); }}
                        className="text-sm text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-1 font-bold"
                    >
                        <ArrowLeft size={16} />
                        Back to Selection
                    </button>

                    {!isAdmin && (
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`p-3 rounded-lg ${isStaff ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                                }`}>
                                <Icon />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{currentConfig.title}</h2>
                                <p className="text-xs text-slate-500">
                                    {useMagicLink ? 'Passwordless magic link' : 'Secure password authentication'}
                                </p>
                            </div>
                        </div>
                    )}

                    {useMagicLink && isStaff && (
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                            Staff must use their <strong>{getStaffDomain()}</strong> email
                        </div>
                    )}

                    <form onSubmit={useMagicLink ? handleMagicLinkSubmit : handlePasswordSubmit} className="space-y-4">
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
                                    placeholder={isStaff ? `your.name${getStaffDomain()}` : 'your.email@example.com'}
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all outline-none font-medium ${error
                                            ? 'border-red-200 focus:border-red-500 bg-red-50/30'
                                            : 'border-slate-100 focus:border-slate-900 focus:bg-white'
                                        }`}
                                />
                            </div>
                        </div>

                        {!useMagicLink && (
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
                        )}

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
                                } ${isStaff
                                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                                    : isStudent
                                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                                        : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
                                }`}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : useMagicLink ? (
                                <>
                                    <Sparkles size={18} />
                                    Send Magic Link
                                </>
                            ) : (
                                <>
                                    <Lock size={18} />
                                    Login Securely
                                </>
                            )}
                        </button>
                    </form>

                    {!isAdmin && !magicLinkEnabled && (
                        <p className="mt-4 text-center text-xs text-slate-400">
                            Looking for passwordless login?{' '}
                            <button
                                onClick={() => navigate('/login')}
                                className="text-slate-600 hover:underline"
                            >
                                Use legacy login
                            </button>
                        </p>
                    )}
                </div>

                {isAdmin && (
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

export default LoginPageV2;
