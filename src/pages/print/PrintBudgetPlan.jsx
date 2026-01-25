import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api'; // Ensure this path is correct
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
            // Need to implement getOne for budgets or filter
            const budgetsList = await api.dentalService.getBudgets(null); // This usually filters by patient, we might need a direct get
            // Since our api wrapper might not have getOne for budgets exposed directly in the snippets I saw, 
            // I'll try to use the generic collection method if available or filter.
            // Actually, PB collection('presupuestos').getOne(id) is standard.
            // Let's assume api.dentalService doesn't expose it and use the pb instance directly if possible, 
            // OR reuse getBudgets if it allowed filtering by ID.
            // Looking at dentalService.js, getBudgets filters by patientId. 
            // I'll try to fetch all or use a direct call. 
            // Since I can't easily change dentalService right now without reading it again (I did read it, it has getBudgets(patientId)).
            // I will assume I can import 'pb' from services/pocketbase to get one.
            // Wait, I shouldn't bypass service layer if possible. 
            // But for now, let's use a trick or assume I updated dentalService. 
            // Actually, I'll update dentalService to add 'getBudget(id)' in the next step.
            // For now I'll mock the fetch or rely on a new method I'll add.

            // Let's use direct PB import for now to be safe and fast
            // import pb from '../../services/pocketbase'; // I need to verify path

            // I'll stick to a placeholder and fix service in next step.
            setLoading(false);
        } catch (error) {
            console.error('Error loading budget:', error);
            // toast.error('Error al cargar presupuesto');
        }
    };

    const handlePrint = () => window.print();

    // Mock data until service is ready
    if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

    // Use active doctor/clinic
    const activeDoctor = getActiveDoctor();
    const activeClinic = getActiveClinic();

    return (
        <div className="min-h-screen bg-slate-100 print:bg-white text-black">
            {/* Controls */}
            <div className="no-print bg-white border-b border-slate-200 p-3 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                    </Button>
                    <Button onClick={handlePrint} size="sm">
                        <Printer className="w-4 h-4 mr-1" /> Imprimir
                    </Button>
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
                        <div className="text-right">
                            <h2 className="text-lg font-bold text-slate-800">{activeDoctor?.name}</h2>
                            <p className="text-xs text-slate-600">{activeDoctor?.specialty}</p>
                            <p className="text-[10px] text-slate-500">Céd. Prof: {activeDoctor?.cedula}</p>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold uppercase tracking-widest text-slate-800">Presupuesto y Plan de Pagos</h1>
                        <p className="text-slate-500 text-xs">Fecha: {new Date().toLocaleDateString()}</p>
                    </div>

                    {/* Patient Info */}
                    <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-slate-500 text-xs uppercase font-bold">Paciente</span>
                                <p className="font-semibold text-lg">{patient?.firstName} {patient?.lastName || 'Juan Pérez (Demo)'}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-slate-500 text-xs uppercase font-bold">Folio</span>
                                <p className="font-mono text-slate-700">#{id?.slice(-6) || '000000'}</p>
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
                                    <th className="p-2 text-right">Costo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {/* MOCK DATA or budget.items */}
                                {budget?.items?.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="p-2 font-medium">{item.name}</td>
                                        <td className="p-2 text-center text-slate-500">{item.code || '-'}</td>
                                        <td className="p-2 text-right font-bold">${item.price}</td>
                                    </tr>
                                )) || (
                                        <>
                                            <tr>
                                                <td className="p-2 font-medium">Limpieza Dental</td>
                                                <td className="p-2 text-center text-slate-500">-</td>
                                                <td className="p-2 text-right font-bold">$500.00</td>
                                            </tr>
                                            <tr>
                                                <td className="p-2 font-medium">Resina</td>
                                                <td className="p-2 text-center text-slate-500">14</td>
                                                <td className="p-2 text-right font-bold">$800.00</td>
                                            </tr>
                                        </>
                                    )}
                            </tbody>
                            <tfoot className="border-t-2 border-slate-200">
                                <tr>
                                    <td colSpan={2} className="p-2 text-right font-bold uppercase text-xs text-slate-500">Subtotal</td>
                                    <td className="p-2 text-right font-bold">$1,300.00</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Payment Plan */}
                    <div className="mb-8">
                        <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs border-b pb-1">Desglose del Plan de Pagos Seleccionado</h3>

                        <div className="flex gap-6 mb-4">
                            <div className="flex-1 bg-blue-50 p-3 rounded border border-blue-100">
                                <span className="block text-xs text-blue-600 uppercase font-bold mb-1">Plan Elegido</span>
                                <span className="text-lg font-bold text-blue-900">Mensual (6 Meses)</span>
                            </div>
                            <div className="flex-1 bg-white p-3 rounded border border-slate-200">
                                <span className="block text-xs text-slate-500 uppercase font-bold mb-1">Interés/Comisión</span>
                                <span className="text-lg font-bold text-slate-700">10%</span>
                            </div>
                            <div className="flex-1 bg-green-50 p-3 rounded border border-green-100 text-right">
                                <span className="block text-xs text-green-600 uppercase font-bold mb-1">Total Final</span>
                                <span className="text-xl font-bold text-green-700">$1,430.00</span>
                            </div>
                        </div>

                        <table className="w-full text-sm border border-slate-200 rounded overflow-hidden">
                            <thead className="bg-slate-800 text-white">
                                <tr>
                                    <th className="p-2 text-left">Periodo</th>
                                    <th className="p-2 text-left">Fecha Programada</th>
                                    <th className="p-2 text-right">Monto a Pagar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <tr key={i} className="even:bg-slate-50">
                                        <td className="p-2 font-medium">Pago {i} de 6</td>
                                        <td className="p-2 text-slate-600">{new Date(new Date().setMonth(new Date().getMonth() + i)).toLocaleDateString()}</td>
                                        <td className="p-2 text-right font-bold">$238.33</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Signature */}
                    <div className="mt-12 pt-8 flex justify-between gap-12">
                        <div className="flex-1 text-center border-t border-slate-300 pt-2">
                            <p className="font-bold text-slate-800">{activeDoctor?.name}</p>
                            <p className="text-xs text-slate-500">Firma del Médico</p>
                        </div>
                        <div className="flex-1 text-center border-t border-slate-300 pt-2">
                            <p className="font-bold text-slate-800">{patient?.firstName} {patient?.lastName}</p>
                            <p className="text-xs text-slate-500">Firma de Conformidad del Paciente</p>
                        </div>
                    </div>

                    <div className="mt-12 text-center text-[10px] text-slate-400">
                        <p>Este presupuesto tiene una validez de 15 días a partir de la fecha de emisión.</p>
                        <p>ZenMedix Dental Software</p>
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
        </div>
    );
}
