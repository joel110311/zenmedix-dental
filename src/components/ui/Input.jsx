import { forwardRef } from 'react';

export const Input = forwardRef(({ label, error, className = '', type = 'text', ...props }, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="mb-2 block text-sm font-semibold tracking-[0.01em] text-[color:var(--text-secondary)]">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                type={type}
                className={`
                    w-full rounded-[1.15rem] px-4 py-3 text-sm
                    ${error ? 'border-[color:var(--danger)] focus:border-[color:var(--danger)] focus:ring-[color:var(--danger)]/20' : ''}
                    ${className}
                `}
                {...props}
            />
            {error && <p className="mt-2 text-sm font-medium text-[color:var(--danger)]">{error.message}</p>}
        </div>
    );
});

Input.displayName = 'Input';
