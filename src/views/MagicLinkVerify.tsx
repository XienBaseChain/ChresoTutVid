import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase, logAction } from '../lib/supabase';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { Role, User, UserInsert } from '../types';

/**
 * Magic Link Verification Page
 * 
 * This page handles the callback when a user clicks on a magic link.
 * Supabase automatically processes the URL token, this page:
 * 1. Verifies the session was created
 * 2. Creates/updates the user profile if needed
 * 3. Redirects to the appropriate dashboard
 */
export function MagicLinkVerify() {
    const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'creating-profile'>('verifying');
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, isAuthenticated, role } = useAuth();

    const intendedRole = searchParams.get('role') as 'STAFF' | 'STUDENT' | null;

    useEffect(() => {
        const handleVerification = async () => {
            try {
                // Give Supabase a moment to process the token from URL
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Check if we have a session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    setError(sessionError.message);
                    setStatus('error');
                    return;
                }

                if (!session) {
                    setError('No active session. The magic link may have expired.');
                    setStatus('error');
                    return;
                }

                // Check if user profile exists
                const { data: userData, error: fetchError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                // Cast to User type for proper TypeScript support
                const existingUser = userData as User | null;

                if (fetchError && fetchError.code !== 'PGRST116') {
                    // PGRST116 = no rows returned (new user)
                    console.error('Error fetching user:', fetchError);
                }

                if (!existingUser) {
                    // New user - create profile
                    setStatus('creating-profile');

                    const roleToAssign: Role = intendedRole || 'STUDENT';

                    const { error: insertError } = await supabase
                        .from('users')
                        .insert({
                            id: session.user.id,
                            id_number: `ML-${Date.now()}`, // Auto-generated for magic link users
                            role: roleToAssign,
                            name: session.user.email?.split('@')[0] || 'User',
                            email: session.user.email,
                            is_active: true,
                            email_verified: true,
                            auth_provider: 'magic_link',
                        } as never); // Type cast: DB has these columns, regenerate Supabase types

                    if (insertError) {
                        console.error('Error creating profile:', insertError);
                        setError('Failed to create user profile. Please contact support.');
                        setStatus('error');
                        return;
                    }

                    await logAction('MAGIC_LINK_SIGNUP', `New ${roleToAssign} via magic link: ${session.user.email}`);
                } else {
                    // Existing user - update email verification status if needed
                    if (!existingUser.email_verified) {
                        await supabase
                            .from('users')
                            .update({
                                email_verified: true,
                                auth_provider: 'magic_link',
                            } as never)
                            .eq('id', session.user.id);
                    }

                    await logAction('MAGIC_LINK_LOGIN', `${existingUser.role} logged in via magic link: ${session.user.email}`);
                }

                setStatus('success');

                // Redirect after brief success message
                setTimeout(() => {
                    const targetRole = existingUser?.role || intendedRole || 'STUDENT';
                    if (targetRole === 'ADMIN' || targetRole === 'SUDO') {
                        navigate('/admin', { replace: true });
                    } else {
                        navigate('/dashboard', { replace: true });
                    }
                }, 1500);

            } catch (err) {
                console.error('Verification error:', err);
                setError('An unexpected error occurred during verification.');
                setStatus('error');
            }
        };

        handleVerification();
    }, [navigate, intendedRole]);

    // Already authenticated - redirect
    useEffect(() => {
        if (isAuthenticated && role && status === 'verifying') {
            if (role === 'ADMIN' || role === 'SUDO') {
                navigate('/admin', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [isAuthenticated, role, navigate, status]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
                {status === 'verifying' && (
                    <>
                        <div className="mb-6 inline-flex p-4 rounded-full bg-blue-100 text-blue-600">
                            <Loader2 size={48} className="animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifying Your Login</h1>
                        <p className="text-slate-500">Please wait while we verify your magic link...</p>
                    </>
                )}

                {status === 'creating-profile' && (
                    <>
                        <div className="mb-6 inline-flex p-4 rounded-full bg-blue-100 text-blue-600">
                            <Loader2 size={48} className="animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Setting Up Your Account</h1>
                        <p className="text-slate-500">Creating your profile...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="mb-6 inline-flex p-4 rounded-full bg-emerald-100 text-emerald-600">
                            <CheckCircle2 size={48} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Login Successful!</h1>
                        <p className="text-slate-500">Redirecting you to your dashboard...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="mb-6 inline-flex p-4 rounded-full bg-red-100 text-red-600">
                            <AlertCircle size={48} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h1>
                        <p className="text-red-600 mb-6">{error}</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/auth/v2/login')}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="text-sm text-slate-400 hover:text-slate-600"
                            >
                                Use legacy login
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default MagicLinkVerify;
