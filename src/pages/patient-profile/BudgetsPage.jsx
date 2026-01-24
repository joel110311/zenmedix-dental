import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePatient } from '../../context/PatientContext';
import { Plus, Check, X, Printer, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { dentalService } from '../../services/dentalService';
import { Spinner } from '../../components/ui/Spinner';

export default function BudgetsPage() {
    const { id: patientId } = useParams();
    const { activePatient, refreshPatient } = usePatient();
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
            // Update budget status
            await dentalService.updateBudget(budget.id, { status: newStatus });

            // Handle Balance Updates
            let balanceChange = 0;
            const currentBalance = activePatient.balance || 0;

            // If accepting a budget, increase debt
            if (newStatus === 'accepted' && budget.status === 'pending') {
                balanceChange = budget.total;
            }
            // If rejecting an accepted budget (undo), decrease debt
            else if (newStatus === 'rejected' && budget.status === 'accepted') {
                balanceChange = -budget.total;
            }

            if (balanceChange !== 0) {
                await dentalService.updatePatient(patientId, {
                    balance: currentBalance + balanceChange
                });
                refreshPatient(); // Refresh global patient state
            }

            toast.success('Estado actualizado y saldo ajustado');
            loadBudgets();
        } catch (error) {
            console.error(error);
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

        const amount = parseFloat(paymentAmount);

        try {
            const newPayment = {
                amount: amount,
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

            // Decrease Patient Balance (Debt)
            const currentBalance = activePatient.balance || 0;
            await dentalService.updatePatient(patientId, {
                balance: currentBalance - amount
            });
            refreshPatient();

            toast.success('Pago registrado y deuda actualizada');
            setShowPaymentModal(false);
            loadBudgets();
        } catch (error) {
            console.error(error);
            toast.error('Error al registrar pago');
        }
    };

    const handlePrint = (budget) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Permite las ventanas emergentes para imprimir');
            return;
        }

        const patientName = budget.patient?.firstName ? `${budget.patient.firstName} ${budget.patient.lastName}` : 'Paciente';
        const date = new Date(budget.created).toLocaleDateString();

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Presupuesto #${budget.id.slice(-4)}</title>
                <style>
                    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #333; max-width: 800px; mx: auto; padding: 20px; }
                    .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                    .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
                    .info { text-align: right; font-size: 14px; }
                    .title { text-align: center; margin: 40px 0; font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th { text-align: left; border-bottom: 2px solid #eee; padding: 10px; font-weight: 600; }
                    td { padding: 10px; border-bottom: 1px solid #f5f5f5; }
                    .total { text-align: right; font-size: 20px; font-weight: bold; margin-top: 20px; }
                    .footer { margin-top: 60px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
                    @media print { body { padding: 0; } .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">ZenMedix Dental</div>
                    <div class="info">
                        <p><strong>Fecha:</strong> ${date}</p>
                        <p><strong>Presupuesto:</strong> #${budget.id.slice(-4)}</p>
                        <p><strong>Paciente:</strong> ${patientName}</p>
                    </div>
                </div>

                <h1 class="title">Presupuesto Dental</h1>

                <table>
                    <thead>
                        <tr>
                            <th>Tratamiento</th>
                            <th style="text-align: right">Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${budget.items?.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td style="text-align: right">$${item.price}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="total">
                    Total: $${budget.total}
                </div>

                <div class="footer">
                    <p>Este presupuesto tiene una validez de 15 días.</p>
                </div>
                <script>
                    window.onload = () => { window.print(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
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
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Presupuestos y Pagos</h1>
                    <p className="text-slate-500">Administra cotizaciones y estado de cuenta</p>
                </div>
                {!showCreate && (
                    <Button onClick={handleCreateClick}>
                        <Plus className="w-4 h-4 mr-2" /> Nuevo Presupuesto
                    </Button>
                )}
            </div>

            {/* Account Summary Card */}
            {activePatient && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-white dark:bg-slate-800">
                        <div className="text-slate-500 text-sm font-medium">Saldo Pendiente (Deuda)</div>
                        <div className={`text-2xl font-bold ${activePatient.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ${(activePatient.balance || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                            {activePatient.balance > 0 ? 'Requiere pago' : 'Al corriente'}
                        </div>
                    </Card>

                    <Card className="bg-white dark:bg-slate-800">
                        <div className="text-slate-500 text-sm font-medium">Total Presupuestado</div>
                        <div className="text-2xl font-bold text-slate-800 dark:text-white">
                            ${budgets.reduce((sum, b) => sum + (b.total || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                            {budgets.length} presupuestos generados
                        </div>
                    </Card>

                    <Card className="bg-white dark:bg-slate-800">
                        <div className="text-slate-500 text-sm font-medium">Estado General</div>
                        <div className="flex items-center gap-2 mt-1">
                            {activePatient.balance > 0
                                ? <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">Con Adeudo</span>
                                : <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">Sin Adeudo</span>
                            }
                        </div>
                    </Card>
                </div>
            )}

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
                                            <Button size="sm" variant="ghost" onClick={() => handlePrint(budget)}>
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
