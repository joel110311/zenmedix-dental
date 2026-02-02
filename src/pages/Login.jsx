import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

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
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex flex-col items-center gap-3">
                    {/* Stylized Tooth Icon - matching uploaded design */}
                    <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Main Tooth Outline */}
                        <path
                            d="M50 8C35 8 25 15 20 25C15 35 15 50 18 65C21 80 28 92 32 92C36 92 40 82 44 75C47 70 50 68 50 68C50 68 53 70 56 75C60 82 64 92 68 92C72 92 79 80 82 65C85 50 85 35 80 25C75 15 65 8 50 8Z"
                            stroke="url(#toothGradLogin)"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                        />
                        {/* Inner Swirl Detail */}
                        <path
                            d="M55 30C65 35 68 50 60 60C52 70 40 65 38 55C36 45 45 40 52 45C58 50 55 58 50 58"
                            stroke="url(#toothGradLogin)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                        />
                        <defs>
                            <linearGradient id="toothGradLogin" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#1C64F2" />
                                <stop offset="100%" stopColor="#00C2FF" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <span className="text-[#1C64F2]">Zen</span>
                        <span className="text-slate-800">Medix</span>
                    </h1>
                </div>
                <p className="mt-3 text-center text-sm text-slate-600">
                    Sistema de Historia Clínica
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <Input
                            label="Usuario"
                            {...register('username', { required: 'El usuario es requerido' })}
                            error={errors.username}
                        />

                        <Input
                            label="Contraseña"
                            type="password"
                            {...register('password', { required: 'La contraseña es requerida' })}
                            error={errors.password}
                        />

                        <Button type="submit" className="w-full" loading={loading}>
                            Iniciar Sesión
                        </Button>
                    </form>
                </div>

                {/* Copyright Footer */}
                <p className="mt-6 text-center text-xs text-slate-400">
                    v1.0 &middot; © 2026 ZenMedix Medical Software
                </p>
            </div>
        </div>
    );
}
