import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Check, X, Printer, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { dentalService } from '../../services/dentalService';
import { Spinner } from '../../components/ui/Spinner';

export default function BudgetsPage() {
    const { id: patientId } = useParams();
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');

    // Create Form State
    const [treatments, setTreatments] = useState([]);
    const [selectedTreatments, setSelectedTreatments] = useState([]); // Array of treatment objects
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        loadBudgets();
    }, [patientId]);

    const loadBudgets = async () => {
        try {
            const data = await dentalService.getBudgets(patientId);
            setBudgets(data);
        } catch (error) {
            toast.error('Error al cargar presupuestos');
        } finally {
            setLoading(false);
        }
    };

    const loadTreatments = async () => {
        if (treatments.length > 0) return;
        setFormLoading(true);
        try {
            const data = await dentalService.getTreatments();
            setTreatments(data);
        } catch (error) {
            toast.error('Error al cargar tratamientos');
        } finally {
            setFormLoading(false);
        }
    };

    const handleCreateClick = () => {
        setShowCreate(true);
        loadTreatments();
    };

    const addTreatmentToBudget = (tx) => {
        setSelectedTreatments([...selectedTreatments, { ...tx, _tempId: Math.random() }]);
    };

    const removeTreatmentFromBudget = (tempId) => {
        setSelectedTreatments(selectedTreatments.filter(t => t._tempId !== tempId));
    };

    const calculateTotal = () => {
        return selectedTreatments.reduce((sum, tx) => sum + (tx.price || 0), 0);
    };

    const handleSaveBudget = async () => {
        if (selectedTreatments.length === 0) {
            toast.error('Agrega al menos un tratamiento');
            return;
        }

        try {
            await dentalService.createBudget({
                patient: patientId,
                items: selectedTreatments.map(t => ({ id: t.id, name: t.name, price: t.price, code: t.code })),
                total: calculateTotal(),
                status: 'pending',
                payments: []
            });
            toast.success('Presupuesto creado');
            setShowCreate(false);
            setSelectedTreatments([]);
            loadBudgets();
        } catch (error) {
            toast.error('Error al guardar');
        }
    };

    const handleStatusChange = async (budget, newStatus) => {
        try {
            await dentalService.updateBudget(budget.id, { status: newStatus });
            toast.success('Estado actualizado');
            loadBudgets();
        } catch (error) {
            toast.error('Error al actualizar');
        }
    };

    const handleAddPaymentClick = (budget) => {
        setSelectedBudget(budget);
        setPaymentAmount('');
        setShowPaymentModal(true);
    };

    const handleSavePayment = async () => {
        if (!paymentAmount || isNaN(paymentAmount)) {
            toast.error('Monto inválido');
            return;
        }

        try {
            const newPayment = {
                amount: parseFloat(paymentAmount),
                date: new Date().toISOString(),
                method: paymentMethod
            };

            const updatedPayments = [...(selectedBudget.payments || []), newPayment];

            // Calculate if fully paid
            const totalPaid = updatedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const newStatus = totalPaid >= selectedBudget.total ? 'paid' : 'partial';

            await dentalService.updateBudget(selectedBudget.id, {
                payments: updatedPayments,
                status: selectedBudget.status === 'paid' ? 'paid' : newStatus
            });

            toast.success('Pago registrado');
            setShowPaymentModal(false);
            loadBudgets();
        } catch (error) {
            toast.error('Error al registrar pago');
        }
    };

    const renderStatus = (status) => {
        switch (status) {
            case 'pending': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">Pendiente</span>;
            case 'accepted': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Aceptado</span>;
            case 'rejected': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">Rechazado</span>;
            case 'paid': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">Pagado</span>;
            case 'partial': return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">Parcial</span>;
            default: return status;
        }
    };

    if (loading) return <Spinner />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Presupuestos</h1>
                    <p className="text-slate-500">Administra cotizaciones y pagos</p>
                </div>
                {!showCreate && (
                    <Button onClick={handleCreateClick}>
                        <Plus className="w-4 h-4 mr-2" /> Nuevo Presupuesto
                    </Button>
                )}
            </div>

            {showCreate ? (
                <Card>
                    <h2 className="text-lg font-bold mb-4">Nuevo Presupuesto</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Selector */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm text-slate-500 uppercase">Tratamientos Disponibles</h3>
                            {formLoading ? <Spinner /> : (
                                <div className="space-y-2 h-96 overflow-y-auto border p-2 rounded">
                                    {treatments.map(tx => (
                                        <button
                                            key={tx.id}
                                            onClick={() => addTreatmentToBudget(tx)}
                                            className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded flex justify-between items-center"
                                        >
                                            <span className="text-sm font-medium">{tx.name}</span>
                                            <span className="text-sm text-green-600 font-bold">${tx.price}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Selected */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm text-slate-500 uppercase">Resumen</h3>
                            <div className="border rounded p-4 h-96 overflow-y-auto flex flex-col">
                                <div className="flex-1 space-y-2">
                                    {selectedTreatments.map((tx, idx) => (
                                        <div key={tx._tempId} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
                                            <div className="text-sm">
                                                <div className="font-medium">{tx.name}</div>
                                                <div className="text-xs text-slate-500">{tx.code}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold">${tx.price}</span>
                                                <button onClick={() => removeTreatmentFromBudget(tx._tempId)} className="text-red-500">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedTreatments.length === 0 && <p className="text-center text-slate-400 mt-10">Agrega tratamientos</p>}
                                </div>
                                <div className="border-t pt-4 mt-4">
                                    <div className="flex justify-between text-xl font-bold">
                                        <span>Total</span>
                                        <span>${calculateTotal()}</span>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancelar</Button>
                                        <Button className="flex-1" onClick={handleSaveBudget}>Guardar Presupuesto</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {budgets.length === 0 ? <p className="text-center text-slate-500 py-10">No hay presupuestos registrados</p> : (
                        budgets.map(budget => (
                            <Card key={budget.id} className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-bold text-lg">Presupuesto #{budget.id.slice(-4)}</span>
                                            {renderStatus(budget.status)}
                                            <span className="text-slate-400 text-sm">{new Date(budget.created).toLocaleDateString()}</span>
                                        </div>
                                        <div className="space-y-1">
                                            {budget.items?.map((item, i) => (
                                                <div key={i} className="text-sm text-slate-600 flex justify-between w-64">
                                                    <span>{item.name}</span>
                                                    <span>${item.price}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-2xl font-bold text-slate-800">${budget.total}</span>
                                        <div className="flex gap-2">
                                            {budget.status === 'pending' && (
                                                <>
                                                    <Button size="sm" variant="outline" className="text-green-600 border-green-200" onClick={() => handleStatusChange(budget, 'accepted')}>
                                                        <Check className="w-4 h-4 mr-1" /> Aceptar
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => handleStatusChange(budget, 'rejected')}>
                                                        <X className="w-4 h-4 mr-1" /> Rechazar
                                                    </Button>
                                                </>
                                            )}
                                            {(budget.status === 'accepted' || budget.status === 'partial') && (
                                                <Button size="sm" onClick={() => handleAddPaymentClick(budget)}>
                                                    <DollarSign className="w-4 h-4 mr-1" /> Registrar Pago
                                                </Button>
                                            )}
                                            <Button size="sm" variant="ghost">
                                                <Printer className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h3 className="text-lg font-bold mb-4">Registrar Pago</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm mb-1">Monto ($)</label>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                    className="w-full border rounded p-2"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Método</label>
                                <select
                                    value={paymentMethod}
                                    onChange={e => setPaymentMethod(e.target.value)}
                                    className="w-full border rounded p-2"
                                >
                                    <option>Efectivo</option>
                                    <option>Tarjeta</option>
                                    <option>Transferencia</option>
                                </select>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button variant="outline" className="flex-1" onClick={() => setShowPaymentModal(false)}>Cancelar</Button>
                                <Button className="flex-1" onClick={handleSavePayment}>Guardar</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
