import { Loader2 } from 'lucide-react';

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    loading = false,
    disabled,
    type = 'button',
    onClick,
    ...props
}) => {
    const baseStyles = `
        inline-flex items-center justify-center gap-2 font-semibold tracking-[0.01em]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        focus-visible:ring-offset-transparent disabled:opacity-55 disabled:cursor-not-allowed
        transition-all duration-200 select-none
    `;

    const sizes = {
        sm: 'min-h-10 px-3.5 text-sm rounded-2xl',
        md: 'min-h-11 px-4.5 text-sm rounded-[1.15rem]',
        lg: 'min-h-12 px-6 text-base rounded-[1.25rem]',
    };

    const variants = {
        primary: `
            border border-transparent text-white
            bg-[linear-gradient(135deg,var(--primary-700),var(--primary-500))]
            shadow-[0_24px_44px_-26px_rgba(15,124,120,0.7)]
            hover:-translate-y-0.5 hover:shadow-[0_28px_56px_-28px_rgba(15,124,120,0.8)]
            active:translate-y-0
        `,
        secondary: `
            border text-[color:var(--text-primary)]
            border-[color:var(--border-default)]
            bg-white/70 dark:bg-white/[0.04]
            hover:bg-white/90 dark:hover:bg-white/[0.07]
            hover:border-[color:var(--border-strong)]
            backdrop-blur-xl
        `,
        danger: `
            border border-transparent text-white
            bg-[linear-gradient(135deg,#cc5e4b,#e4816f)]
            shadow-[0_24px_44px_-26px_rgba(204,94,75,0.6)]
            hover:-translate-y-0.5 hover:shadow-[0_28px_56px_-28px_rgba(204,94,75,0.7)]
        `,
        ghost: `
            border border-transparent bg-transparent
            text-[color:var(--text-secondary)]
            hover:bg-black/[0.03] dark:hover:bg-white/[0.06]
            hover:text-[color:var(--text-primary)]
        `,
    };

    return (
        <button
            type={type}
            className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
            disabled={disabled || loading}
            onClick={onClick}
            {...props}
        >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
};
