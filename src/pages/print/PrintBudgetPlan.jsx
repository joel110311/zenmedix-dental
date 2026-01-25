import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { dentalService } from '../../services/dentalService';
import { useSettings } from '../../context/SettingsContext';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { toast } from 'sonner';

export default function PrintBudgetPlan() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getActiveDoctor, getActiveClinic } = useSettings();
    const [loading, setLoading] = useState(true);
    const [budget, setBudget] = useState(null);
    const [patient, setPatient] = useState(null);
    const [viewMode, setViewMode] = useState('loading'); // 'proposal' | 'accepted'

    useEffect(() => { loadData(); }, [id]);

    const loadData = async () => {
        try {
            const budgetData = await dentalService.getBudget(id);
            setBudget(budgetData);
            if (budgetData.expand?.patient) {
                setPatient(budgetData.expand.patient);
            }

            // Determine initial view mode
            if (budgetData.status === 'accepted') {
                setViewMode('accepted');
            } else {
                setViewMode('proposal');
            }
        } catch (error) {
            console.error('Error loading budget:', error);
            toast.error('Error al cargar presupuesto');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        try {
            await dentalService.updateBudget(id, { status: 'accepted' });
            setBudget({ ...budget, status: 'accepted' });
            setViewMode('accepted');
            toast.success('Presupuesto aceptado');
        } catch (error) {
            toast.error('Error al aceptar presupuesto');
        }
    };

    const handleReject = async () => {
        if (confirm('¿Estás seguro de rechazar este presupuesto?')) {
            try {
                await dentalService.updateBudget(id, { status: 'rejected' });
                navigate(-1); // Go back
            } catch (error) {
                toast.error('Error al rechazar presupuesto');
            }
        }
    };

    const handlePrint = () => window.print();

    if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

    const activeDoctor = getActiveDoctor();
    const activeClinic = getActiveClinic();

    // PROPOSAL VIEW (Reduced)
    if (viewMode === 'proposal') {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden">
                    <div className="bg-blue-600 p-6 text-white text-center">
                        <h1 className="text-2xl font-bold mb-2">Propuesta de Presupuesto</h1>
                        <p className="opacity-90">Revise y confirme el plan de pagos seleccionado.</p>
                    </div>

                    <div className="p-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-slate-50 p-4 rounded-lg border text-center">
                                <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Paciente</span>
                                <span className="font-semibold text-slate-800">{patient?.firstName} {patient?.lastName}</span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg border text-center">
                                <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Plan</span>
                                <span className="font-semibold text-blue-600">{budget?.plan?.type} ({budget?.plan?.duration})</span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg border text-center">
                                <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Total Final</span>
                                <span className="font-exame-bold text-xl text-green-600">${budget?.total?.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Payment Breakdown Preview */}
                        <div className="mb-8">
                            <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase">Resumen de Pagos</h3>
                            {(budget?.plan?.type || 'Contado') === 'Contado' ? (
                                <div className="p-4 bg-green-50 border border-green-100 rounded text-center text-green-800 font-medium">
                                    Pago Único de ${budget.total?.toFixed(2)}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded border">
                                        <span className="text-slate-600">No. de Pagos</span>
                                        <span className="font-bold">{Math.ceil(budget?.plan?.breakdown?.count || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded border">
                                        <span className="text-slate-600">Monto por Pago</span>
                                        <span className="font-bold">${budget?.plan?.breakdown?.perPayment?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded border">
                                        <span className="text-slate-600">Interés Aplicado ({budget?.plan?.interest}%)</span>
                                        <span className="font-bold text-orange-600">+${budget?.plan?.breakdown?.interest?.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <button
                                onClick={handleReject}
                                className="flex-1 py-3 px-4 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <XCircle className="w-5 h-5" /> Rechazar / Cancelar
                            </button>
                            <button
                                onClick={handleAccept}
                                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
                            >
                                <CheckCircle className="w-5 h-5" /> Aceptar y Generar Documento
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ACCEPTED / PRINT VIEW (Full Table)
    return (
        <div className="min-h-screen bg-slate-100 print:bg-white text-black">
            {/* Controls */}
            <div className="no-print bg-white border-b border-slate-200 p-3 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                    </Button>
                    <div className="flex gap-3">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" /> ACEPTADO
                        </span>
                        <Button onClick={handlePrint} size="sm">
                            <Printer className="w-4 h-4 mr-1" /> Imprimir
                        </Button>
                    </div>
                </div>
                {/* Auto-print hint */}
                <div className="text-center text-xs text-slate-400 mt-1">
                    Nota: Los márgenes se ajustan automáticamente al tamaño carta.
                </div>
            </div>

            {/* Document */}
            <div className="flex justify-center p-8 print:p-0">
                <div className="bg-white shadow-lg print:shadow-none w-[21.59cm] min-h-[27.94cm] p-[1.5cm] text-sm relative">

                    {/* Header */}
                    <div className="flex justify-between items-start border-b-4 border-blue-500 pb-4 mb-6">
                        <div className="flex items-center gap-3">
                            {activeClinic?.logo ? (
                                <img src={activeClinic.logo} alt="Logo" className="w-16 h-16 object-contain" />
                            ) : (
                                <div className="p-2 bg-blue-50 rounded">
                                    <span className="text-2xl font-bold text-blue-600">Z</span>
                                </div>
                            )}
                            <div>
                                <h1 className="text-xl font-bold text-slate-800">{activeClinic?.name || 'Clínica Dental'}</h1>
                                <p className="text-xs text-slate-500">{activeClinic?.address}</p>
                                <p className="text-xs text-slate-500">Tel: {activeClinic?.phone}</p>
                            </div>
                        </div>
                        <div className="text-center w-1/3 pt-2">
                            <div className="border border-slate-800 px-4 py-2 rounded">
                                <h2 className="font-bold uppercase tracking-widest text-sm">Presupuesto</h2>
                                <p className="text-red-600 font-bold text-lg">#{id?.slice(-6).toUpperCase()}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-lg font-bold text-slate-800">{activeDoctor?.name}</h2>
                            <p className="text-xs text-slate-600">{activeDoctor?.specialty}</p>
                            <p className="text-[10px] text-slate-500">Céd. Prof: {activeDoctor?.cedula}</p>
                        </div>
                    </div>

                    {/* Patient Info */}
                    <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-slate-500 text-xs uppercase font-bold">Paciente</span>
                                <p className="font-semibold text-lg">{patient?.firstName} {patient?.lastName}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-slate-500 text-xs uppercase font-bold">Fecha de Emisión</span>
                                <p className="font-mono text-slate-700">{new Date(budget?.created).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Treatments Table */}
                    <div className="mb-8">
                        <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs border-b pb-1">Tratamientos a Realizar</h3>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100 text-slate-600">
                                <tr>
                                    <th className="p-2 text-left">Tratamiento</th>
                                    <th className="p-2 text-center">Diente</th>
                                    <th className="p-2 text-right">Costo Unitario</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {budget?.items?.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="p-2 font-medium">{item.name}</td>
                                        <td className="p-2 text-center text-slate-500">{item.tooth || 'Gral'}</td>
                                        <td className="p-2 text-right font-bold">${item.price?.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t-2 border-slate-200">
                                <tr>
                                    <td colSpan={2} className="p-2 text-right font-bold uppercase text-xs text-slate-500">Subtotal Tratamientos</td>
                                    <td className="p-2 text-right font-bold">
                                        ${budget?.items?.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Payment Plan & Breakdown */}
                    <div className="mb-8">
                        <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs border-b pb-1">Plan de Financiamiento</h3>

                        <div className="flex gap-6 mb-4">
                            <div className="flex-1 bg-blue-50 p-3 rounded border border-blue-100">
                                <span className="block text-xs text-blue-600 uppercase font-bold mb-1">Plan Elegido</span>
                                <span className="text-lg font-bold text-blue-900">
                                    {budget?.plan?.type || 'Contado'}
                                    {(budget?.plan?.type || 'Contado') !== 'Contado' && ` (${budget?.plan?.duration} ${budget?.plan?.type === 'Mensual' ? 'Meses' : budget?.plan?.type === 'Semanal' ? 'Semanas' : 'Quincenas'})`}
                                </span>
                            </div>
                            <div className="flex-1 bg-white p-3 rounded border border-slate-200">
                                <span className="block text-xs text-slate-500 uppercase font-bold mb-1">Interés/Comisión</span>
                                <span className="text-lg font-bold text-slate-700">{budget?.plan?.interest || 0}%</span>
                            </div>
                            <div className="flex-1 bg-green-50 p-3 rounded border border-green-100 text-right">
                                <span className="block text-xs text-green-600 uppercase font-bold mb-1">Total Final</span>
                                <span className="text-xl font-bold text-green-700">${budget?.total?.toFixed(2)}</span>
                            </div>
                        </div>


                        {budget?.plan?.type !== 'Contado' ? (
                            <table className="w-full text-sm border border-slate-200 rounded overflow-hidden">
                                <thead className="bg-slate-800 text-white">
                                    <tr>
                                        <th className="p-2 text-left">No.</th>
                                        <th className="p-2 text-left">Fecha Programada (Sugerida)</th>
                                        <th className="p-2 text-right">Monto</th>
                                        <th className="p-2 text-center">Estatus</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {Array.from({ length: Math.ceil(budget?.plan?.breakdown?.count || 0) }).map((_, i) => {
                                        const date = new Date(budget.created);
                                        // Simple date projection based on plan type
                                        if (budget.plan.type === 'Mensual') date.setMonth(date.getMonth() + i);
                                        else if (budget.plan.type === 'Semanal') date.setDate(date.getDate() + (i * 7));
                                        else if (budget.plan.type === 'Quincenal') date.setDate(date.getDate() + (i * 15));

                                        return (
                                            <tr key={i} className="even:bg-slate-50">
                                                <td className="p-2 font-medium">{i + 1}</td>
                                                <td className="p-2 text-slate-600">{date.toLocaleDateString()}</td>
                                                <td className="p-2 text-right font-bold">${budget?.plan?.breakdown?.perPayment?.toFixed(2)}</td>
                                                <td className="p-2 text-center text-xs text-slate-400 border-l">Pendiente</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-slate-100 font-bold border-t">
                                    <tr>
                                        <td colSpan={2} className="p-2 text-right">Total Final a Pagar:</td>
                                        <td className="p-2 text-right text-green-700">${budget?.total?.toFixed(2)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        ) : (
                            <div className="p-4 bg-green-50 border border-green-100 rounded flex justify-between items-center text-green-800">
                                <span className="font-bold">Total a Pagar (Contado):</span>
                                <span className="text-xl font-bold">${budget?.total?.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    {/* Signature */}
                    <div className="absolute bottom-[2cm] left-[1.5cm] right-[1.5cm]">
                        <div className="flex justify-between gap-12">
                            <div className="flex-1 text-center border-t border-slate-400 pt-2">
                                <p className="font-bold text-slate-800 text-sm">{activeDoctor?.name}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Médico Tratante</p>
                            </div>
                            <div className="flex-1 text-center border-t border-slate-400 pt-2">
                                <p className="font-bold text-slate-800 text-sm">{patient?.firstName} {patient?.lastName}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Acepto Presupuesto y Plan de Pagos</p>
                            </div>
                        </div>
                        <div className="mt-8 text-center text-[9px] text-slate-400">
                            <p>Este documento es un comprobante del plan de tratamiento aceptado. Los precios pueden variar si el plan es interrumpido o modificado.</p>
                            <p className="mt-1 font-bold">ZenMedix Dental Software</p>
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: letter; margin: 0; }
                    body { margin: 0; padding: 0; background: white; }
                    .no-print { display: none !important; }
                }
            `}</style>
        </div >
    );
}
