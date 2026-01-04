import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export function Input({
    label,
    error,
    helperText,
    id,
    className = '',
    ...props
}: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"
                >
                    {label}
                </label>
            )}
            <input
                id={inputId}
                aria-invalid={!!error}
                aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
                className={`
          w-full px-4 py-3 bg-slate-50 border rounded-xl 
          outline-none transition-all font-bold text-sm
          ${error
                        ? 'border-red-300 focus:border-red-500 bg-red-50/30'
                        : 'border-slate-200 focus:border-slate-900 focus:bg-white'
                    }
          ${className}
        `.trim()}
                {...props}
            />
            {error && (
                <p id={errorId} className="text-red-500 text-xs mt-1 font-medium">
                    {error}
                </p>
            )}
            {helperText && !error && (
                <p id={helperId} className="text-slate-400 text-xs mt-1">
                    {helperText}
                </p>
            )}
        </div>
    );
}
