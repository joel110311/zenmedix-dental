export const Card = ({ children, className = '', title, action }) => {
    return (
        <section
            className={`
                card-premium overflow-hidden border
                border-white/60 dark:border-white/10
                ${className}
            `}
        >
            {(title || action) && (
                <div className="flex items-center justify-between gap-4 border-b border-black/5 px-6 py-5 dark:border-white/10">
                    {title ? (
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                                Workspace
                            </p>
                            <h3 className="mt-1 text-xl font-semibold text-[color:var(--text-primary)]">{title}</h3>
                        </div>
                    ) : <div />}
                    {action && <div className="shrink-0">{action}</div>}
                </div>
            )}
            <div className="p-6 md:p-7">{children}</div>
        </section>
    );
};
