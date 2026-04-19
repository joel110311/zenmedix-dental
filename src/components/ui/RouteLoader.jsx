import { Loader2 } from 'lucide-react';

const shimmerLines = ['w-28', 'w-44', 'w-36'];

function LoaderPanel({ title, message }) {
    return (
        <div
            className="glass w-full rounded-[2rem] border border-white/60 p-5 shadow-[0_28px_60px_-36px_rgba(16,37,35,0.32)] dark:border-white/10 md:p-6"
            role="status"
            aria-live="polite"
        >
            <p className="section-kicker">Performance mode</p>

            <div className="mt-4 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(135deg,var(--primary-700),var(--primary-500))] text-white shadow-[0_24px_50px_-28px_rgba(15,124,120,0.75)]">
                    <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-[color:var(--text-primary)] md:text-xl">
                        {title}
                    </h2>
                    <p className="mt-1 text-sm text-[color:var(--text-muted)]">
                        {message}
                    </p>
                </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
                {shimmerLines.map((width) => (
                    <div
                        key={width}
                        className="rounded-[1.4rem] border border-white/50 bg-white/45 p-4 dark:border-white/10 dark:bg-white/[0.04]"
                    >
                        <div className="h-2.5 w-16 rounded-full bg-black/5 dark:bg-white/10" />
                        <div className={`mt-4 h-4 animate-pulse rounded-full bg-black/10 dark:bg-white/10 ${width}`} />
                        <div className="mt-3 h-3.5 w-full animate-pulse rounded-full bg-black/[0.06] dark:bg-white/[0.08]" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export const PageLoader = ({
    title = 'Cargando modulo',
    message = 'Preparando datos, vistas y componentes para una experiencia fluida.',
}) => {
    return <LoaderPanel title={title} message={message} />;
};

export const FullScreenLoader = ({
    title = 'Preparando ZenMedix',
    message = 'Ajustando el entorno clinico para que cargue rapido y con buena presencia.',
}) => {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute left-[-6rem] top-[-5rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(15,124,120,0.2),transparent_72%)] blur-3xl" />
                <div className="absolute bottom-[-8rem] right-[-5rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(183,138,87,0.16),transparent_72%)] blur-3xl" />
            </div>
            <div className="w-full max-w-3xl">
                <LoaderPanel title={title} message={message} />
            </div>
        </div>
    );
};
