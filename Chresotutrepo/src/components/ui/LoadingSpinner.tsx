import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    message?: string;
    className?: string;
}

const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4',
};

export function LoadingSpinner({
    size = 'md',
    message = 'Loading...',
    className = ''
}: LoadingSpinnerProps) {
    return (
        <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
            <div
                className={`${sizeClasses[size]} border-slate-200 border-t-blue-600 rounded-full animate-spin`}
            />
            {message && (
                <p className="text-slate-500 font-medium text-sm">{message}</p>
            )}
        </div>
    );
}

// Full page loading spinner for Suspense boundaries
export function PageLoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <LoadingSpinner size="lg" message="Loading page..." />
        </div>
    );
}

export default LoadingSpinner;
