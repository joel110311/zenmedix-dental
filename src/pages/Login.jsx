import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, ShieldCheck, Sparkles, Stethoscope, Waves } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

function ToothSeal() {
    return (
        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-[0_28px_60px_-32px_rgba(16,37,35,0.38)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.05]">
            <svg className="h-12 w-12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M50 8C35 8 25 15 20 25C15 35 15 50 18 65C21 80 28 92 32 92C36 92 40 82 44 75C47 70 50 68 50 68C50 68 53 70 56 75C60 82 64 92 68 92C72 92 79 80 82 65C85 50 85 35 80 25C75 15 65 8 50 8Z"
                    stroke="url(#toothGradLoginPremium)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M55 30C65 35 68 50 60 60C52 70 40 65 38 55C36 45 45 40 52 45C58 50 55 58 50 58"
                    stroke="url(#toothGradLoginPremium)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <defs>
                    <linearGradient id="toothGradLoginPremium" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0f7c78" />
                        <stop offset="55%" stopColor="#39b2a5" />
                        <stop offset="100%" stopColor="#caa879" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}

export default function Login() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        setLoading(true);
        const success = await login(data.username, data.password);
        if (success) {
            navigate('/');
        }
        setLoading(false);
    };

    return (
        <div className="relative min-h-screen overflow-hidden px-4 py-6 md:px-6 md:py-8">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[-8rem] top-[-7rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(15,124,120,0.22),transparent_70%)] blur-3xl" />
                <div className="absolute right-[-10rem] top-[10%] h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(183,138,87,0.16),transparent_72%)] blur-3xl" />
                <div className="absolute bottom-[-10rem] left-[28%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(15,124,120,0.14),transparent_74%)] blur-3xl" />
            </div>

            <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1380px] items-stretch gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <section className="glass flex min-h-[26rem] flex-col justify-between rounded-[2.5rem] border border-white/60 p-6 shadow-[0_36px_80px_-40px_rgba(16,37,35,0.38)] dark:border-white/10 md:p-8 lg:p-10">
                    <div>
                        <div className="flex items-center gap-4">
                            <ToothSeal />
                            <div>
                                <p className="section-kicker">Private Practice OS</p>
                                <h1 className="mt-4 font-display text-5xl leading-none text-[color:var(--text-primary)] md:text-6xl">
                                    ZenMedix
                                </h1>
                                <p className="mt-3 max-w-xl text-base leading-7 text-[color:var(--text-secondary)] md:text-lg">
                                    Una experiencia operativa de alta gama para recepcion, agenda, expediente dental y crecimiento de la clinica.
                                </p>
                            </div>
                        </div>

                        <div className="mt-12 grid gap-4 md:grid-cols-3">
                            <div className="rounded-[1.7rem] border border-white/60 bg-white/58 p-5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
                                <Stethoscope className="h-5 w-5 text-primary" />
                                <h2 className="mt-4 text-lg font-semibold text-[color:var(--text-primary)]">Clinical luxury</h2>
                                <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                                    Expediente y consulta con una interfaz sobria, moderna y lista para crecer.
                                </p>
                            </div>
                            <div className="rounded-[1.7rem] border border-white/60 bg-white/58 p-5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
                                <CalendarDays className="h-5 w-5 text-primary" />
                                <h2 className="mt-4 text-lg font-semibold text-[color:var(--text-primary)]">Agenda visible</h2>
                                <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                                    Citas, recepcion y tiempos con una composicion clara para vender confianza.
                                </p>
                            </div>
                            <div className="rounded-[1.7rem] border border-white/60 bg-white/58 p-5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                <h2 className="mt-4 text-lg font-semibold text-[color:var(--text-primary)]">Marca premium</h2>
                                <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                                    Un producto con presencia comercial, preparado para presentarse y venderse mejor.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-[color:var(--text-muted)]">
                        <span className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/60 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                            <Sparkles className="h-4 w-4 text-[color:var(--accent-400)]" />
                            Dental growth platform
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/60 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                            <Waves className="h-4 w-4 text-primary" />
                            Calm premium interface
                        </span>
                    </div>
                </section>

                <section className="glass flex items-center rounded-[2.5rem] border border-white/60 p-4 shadow-[0_36px_80px_-40px_rgba(16,37,35,0.38)] dark:border-white/10 md:p-6 lg:p-8">
                    <div className="mx-auto w-full max-w-md">
                        <div className="rounded-[2rem] border border-white/60 bg-white/68 p-6 shadow-[0_24px_56px_-34px_rgba(16,37,35,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] md:p-8">
                            <p className="section-kicker">Secure access</p>
                            <h2 className="mt-5 text-3xl font-semibold text-[color:var(--text-primary)]">
                                Ingresa a tu estudio
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-[color:var(--text-muted)]">
                                Accede al centro operativo de tu clinica con una experiencia mas limpia, moderna y confiable.
                            </p>

                            <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
                                <Input
                                    label="Usuario"
                                    placeholder="doctor@zenmedix"
                                    {...register('username', { required: 'El usuario es requerido' })}
                                    error={errors.username}
                                />

                                <Input
                                    label="Contrasena"
                                    type="password"
                                    placeholder="Tu acceso seguro"
                                    {...register('password', { required: 'La contrasena es requerida' })}
                                    error={errors.password}
                                />

                                <Button type="submit" className="w-full justify-between" loading={loading} size="lg">
                                    <span>Iniciar sesion</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </form>

                            <div className="mt-8 rounded-[1.4rem] border border-black/5 bg-white/72 px-4 py-3 text-sm text-[color:var(--text-muted)] dark:border-white/10 dark:bg-white/[0.04]">
                                <p className="font-semibold text-[color:var(--text-primary)]">ZenMedix Dental</p>
                                <p className="mt-1">Plataforma premium para expediente, agenda y operacion de clinicas dentales.</p>
                            </div>
                        </div>

                        <p className="mt-5 text-center text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                            Version 2026 · Crafted for premium care
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
