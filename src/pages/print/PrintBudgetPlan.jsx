import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
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

    useEffect(() => { loadData(); }, [id]);

    const loadData = async () => {
        try {
            const budgetData = await dentalService.getBudget(id);
            setBudget(budgetData);
            if (budgetData.expand?.patient) {
                setPatient(budgetData.expand.patient);
            }
        } catch (error) {
            console.error('Error loading budget:', error);
            toast.error('Error al cargar presupuesto');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        // Small timeout to ensure styles and images are fully ready
        setTimeout(() => window.print(), 100);
    };

    if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

    const activeDoctor = getActiveDoctor();
    const activeClinic = getActiveClinic();
    const isAccepted = budget?.status === 'accepted' || budget?.status === 'paid' || budget?.status === 'partial';
    const validityDays = budget?.plan?.validity || 15;
    const expirationDate = new Date(budget?.created);
    expirationDate.setDate(expirationDate.getDate() + validityDays);

    return (
        <div className="min-h-screen bg-slate-100 print:bg-white text-black">
            {/* Controls - No Print */}
            <div className="no-print bg-white border-b border-slate-200 p-3 sticky top-0 z-50 shadow-sm">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                    </Button>
                    <div className="flex gap-3 items-center">
                        {isAccepted ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1" /> ACEPTADO
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" /> PENDIENTE / COTIZACIÓN
                            </span>
                        )}
                        <Button onClick={handlePrint} size="sm" className="bg-slate-800 hover:bg-slate-900 text-white">
                            <Printer className="w-4 h-4 mr-1" /> Imprimir
                        </Button>
                    </div>
                </div>
            </div>

            {/* Document Layout */}
            <div className="flex justify-center p-8 print:p-0">
                <div className="bg-white shadow-lg print:shadow-none w-[21.59cm] min-h-[27.94cm] p-[1.5cm] text-sm relative box-border">

                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
                        <div className="flex items-center gap-4">
                            {activeClinic?.logo ? (
                                <img src={activeClinic.logo} alt="Logo" className="w-20 h-20 object-contain" />
                            ) : (
                                <div className="w-20 h-20 bg-slate-100 rounded flex items-center justify-center text-slate-400 font-bold text-2xl">
                                    LOGO
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{activeClinic?.name || 'Consultorio Dental'}</h1>
                                <div className="text-slate-600 text-xs space-y-0.5 mt-1">
                                    <p>{activeClinic?.address}</p>
                                    <p>Tel: {activeClinic?.phone}</p>
                                    <p>{activeClinic?.email}</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="inline-block border-2 border-slate-800 px-4 py-2 rounded mb-2">
                                <h2 className="font-bold uppercase tracking-widest text-xs text-slate-600">
                                    {isAccepted ? 'PRESUPUESTO ACEPTADO' : 'COTIZACIÓN'}
                                </h2>
                                <p className="text-red-600 font-black text-xl">#{id?.slice(-6).toUpperCase()}</p>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                <p>Fecha de Emisión: {new Date(budget?.created).toLocaleDateString()}</p>
                                {!isAccepted && (
                                    <p className="text-orange-600 font-medium">Válido hasta: {expirationDate.toLocaleDateString()}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Doctor & Patient Row */}
                    <div className="flex justify-between gap-8 mb-8">
                        <div className="flex-1">
                            <h3 className="text-xs font-bold uppercase text-slate-400 mb-1 border-b pb-1">Paciente</h3>
                            <p className="font-bold text-lg text-slate-800">{patient?.firstName} {patient?.lastName}</p>
                            <p className="text-xs text-slate-500">Expediente: {patient?.id?.slice(0, 8)}</p>
                        </div>
                        <div className="flex-1 text-right">
                            <h3 className="text-xs font-bold uppercase text-slate-400 mb-1 border-b pb-1">Odontólogo Tratante</h3>
                            <p className="font-bold text-slate-800">{activeDoctor?.name}</p>
                            <p className="text-xs text-slate-500">{activeDoctor?.specialty}</p>
                            {activeDoctor?.cedula && <p className="text-xs text-slate-500">Céd. Prof: {activeDoctor.cedula}</p>}
                        </div>
                    </div>

                    {/* Treatments Table */}
                    <div className="mb-8">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-100 text-slate-700 uppercase text-xs">
                                    <th className="p-3 text-left font-bold border-y border-slate-200">Tratamiento</th>
                                    <th className="p-3 text-center font-bold border-y border-slate-200 w-24">Diente</th>
                                    {/* <th className="p-3 text-center font-bold border-y border-slate-200 w-24">Código</th> */}
                                    <th className="p-3 text-right font-bold border-y border-slate-200 w-32">Precio</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-700">
                                {budget?.items?.map((item, idx) => (
                                    <tr key={idx} className="border-b border-slate-100 last:border-0">
                                        <td className="p-3 font-medium">{item.name}</td>
                                        <td className="p-3 text-center text-slate-500">{item.tooth || '-'}</td>
                                        {/* <td className="p-3 text-center text-slate-400 text-xs">{item.code || '-'}</td> */}
                                        <td className="p-3 text-right font-semibold text-slate-900">${item.price?.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-50">
                                    <td colSpan={2} className="p-3 text-right font-bold text-slate-600 uppercase text-xs">Subtotal</td>
                                    <td className="p-3 text-right font-bold text-slate-800">
                                        ${budget?.items?.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Payment Plan Info */}
                    <div className="mb-10 p-6 bg-slate-50 rounded-xl border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-wider border-b border-slate-200 pb-2">Plan de Financiamiento</h3>

                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <span className="block text-xs text-slate-500 uppercase font-bold">Tipo de Plan</span>
                                <span className="text-lg font-bold text-blue-800">
                                    {budget?.plan?.type || 'Contado'}
                                    {(budget?.plan?.type || 'Contado') !== 'Contado' &&
                                        ` (${budget?.plan?.duration} ${budget?.plan?.type === 'Mensual' ? 'Meses' : budget?.plan?.type === 'Semanal' ? 'Semanas' : 'Quincenas'})`
                                    }
                                </span>
                            </div>
                            {(budget?.plan?.interest > 0) && (
                                <div className="text-center">
                                    <span className="block text-xs text-slate-500 uppercase font-bold">Interés / Comisión</span>
                                    <span className="text-lg font-bold text-orange-600">{budget?.plan?.interest}%</span>
                                </div>
                            )}
                            <div className="text-right">
                                <span className="block text-xs text-slate-500 uppercase font-bold">Total Final a Pagar</span>
                                <span className="text-2xl font-black text-green-700">${budget?.total?.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Breakdown if not Contado */}
                        {(budget?.plan?.type || 'Contado') !== 'Contado' && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <div className="flex gap-4 text-xs text-slate-600">
                                    <div className="flex-1 bg-white p-3 rounded border text-center">
                                        <div className="font-bold text-slate-400 uppercase mb-1">Pagos</div>
                                        <div className="font-bold text-lg text-slate-800">{Math.ceil(budget?.plan?.breakdown?.count || 0)}</div>
                                    </div>
                                    <div className="flex-1 bg-white p-3 rounded border text-center">
                                        <div className="font-bold text-slate-400 uppercase mb-1">Monto por Pago</div>
                                        <div className="font-bold text-lg text-slate-800">${budget?.plan?.breakdown?.perPayment?.toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Signatures */}
                    <div className="mt-20 print-footer" style={{ pageBreakInside: 'avoid' }}>
                        <div className="flex justify-between gap-16">
                            <div className="flex-1 text-center">
                                <div className="border-t border-slate-800 pt-2 mb-1"></div>
                                <p className="font-bold text-slate-800 text-sm">{activeDoctor?.name}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Firma del Odontólogo</p>
                            </div>
                            <div className="flex-1 text-center">
                                <div className="border-t border-slate-800 pt-2 mb-1"></div>
                                <p className="font-bold text-slate-800 text-sm">{patient?.firstName} {patient?.lastName}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                                    {isAccepted ? 'Firma de Conformidad' : 'Firma de Aceptación'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 text-center text-[10px] text-slate-400">
                            {!isAccepted && (
                                <p className="block font-bold text-orange-600 mb-1">
                                    IMPORTANTE: Este presupuesto es una propuesta válida por {validityDays} días a partir de su emisión.
                                </p>
                            )}
                            <p>El plan de tratamiento puede sufrir modificaciones clínicas durante su ejecución. Los precios están sujetos a cambios si el tratamiento es interrumpido.</p>
                            <p className="mt-2 text-slate-300 font-mono">Generado por ZenMedix Dental Software</p>
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: letter; margin: 0; }
                    body { background: white; margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                    .print:shadow-none { box-shadow: none !important; }
                    .print-footer { page-break-inside: avoid; }
                    /* Force background colors */
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
        </div>
    );
}
