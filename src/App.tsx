import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { PageLoadingSpinner } from './components/ui';
import LoginPage from './views/LoginPage';
import Dashboard from './views/Dashboard';

// Lazy-loaded admin components for code splitting
// These will be loaded on-demand when admin routes are accessed
const TutorialManager = lazy(() => import('./views/admin/TutorialManager'));
const UserManager = lazy(() => import('./views/admin/UserManager'));
const AuditLogViewer = lazy(() => import('./views/admin/AuditLogViewer'));

// Lazy-loaded V2 auth components (dormant until feature flags enabled)
const LoginPageV2 = lazy(() => import('./views/LoginPageV2'));
const MagicLinkVerify = lazy(() => import('./views/MagicLinkVerify'));

// Landing page that redirects authenticated users
function LandingRedirect() {
    return <Navigate to="/login" replace />;
}

// 404 Not Found page
function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <h1 className="text-6xl font-black text-slate-200 mb-4">404</h1>
                <p className="text-xl font-bold text-slate-800 mb-2">Page Not Found</p>
                <p className="text-slate-500 mb-6">The page you're looking for doesn't exist.</p>
                <a
                    href="/"
                    className="inline-flex px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                    Go Home
                </a>
            </div>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes - EXISTING UNCHANGED */}
                    <Route path="/" element={<LandingRedirect />} />
                    <Route path="/login" element={<LoginPage />} />

                    {/* Auth v2 Routes - NEW (feature flagged via components) */}
                    <Route path="/auth/v2/login" element={
                        <Suspense fallback={<PageLoadingSpinner />}>
                            <LoginPageV2 />
                        </Suspense>
                    } />
                    <Route path="/auth/v2/verify" element={
                        <Suspense fallback={<PageLoadingSpinner />}>
                            <MagicLinkVerify />
                        </Suspense>
                    } />

                    {/* Protected: Any authenticated user - EXISTING UNCHANGED */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                    </Route>

                    {/* Protected: Admin/SUDO only - UPDATED to include SUDO */}
                    <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUDO']} />}>
                        <Route path="/admin" element={
                            <Suspense fallback={<PageLoadingSpinner />}>
                                <AdminLayout />
                            </Suspense>
                        }>
                            <Route index element={<Navigate to="tutorials" replace />} />
                            <Route path="tutorials" element={
                                <Suspense fallback={<PageLoadingSpinner />}>
                                    <TutorialManager />
                                </Suspense>
                            } />
                            <Route path="users" element={
                                <Suspense fallback={<PageLoadingSpinner />}>
                                    <UserManager />
                                </Suspense>
                            } />
                            <Route path="logs" element={
                                <Suspense fallback={<PageLoadingSpinner />}>
                                    <AuditLogViewer />
                                </Suspense>
                            } />
                        </Route>
                    </Route>

                    {/* 404 Catch-all */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;

