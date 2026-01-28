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
    const { activePatient, setActivePatient, refreshPatient } = usePatient();
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

    // Payment Plan Modal State
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [planType, setPlanType] = useState('Contado');
    const [planDuration, setPlanDuration] = useState(1);
    const [interestRate, setInterestRate] = useState(0);

    // Calculate payment breakdown
    const calculatePayment = (total, type, duration, rate) => {
        const interest = total * (rate / 100);
        const finalTotal = total + interest;
        const count = type === 'Contado' ? 1 : duration;
        return { total: finalTotal, perPayment: finalTotal / count, count, interest };
    };

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

    const handleSaveBudget = () => {
        if (selectedTreatments.length === 0) {
            toast.error('Agrega al menos un tratamiento');
            return;
        }
        // Reset plan config and show modal
        setPlanType('Contado');
        setPlanDuration(1);
        setInterestRate(0);
        setShowPlanModal(true);
    };

    // Save budget as accepted and print
    const handleConfirmBudget = async () => {
        const subtotal = calculateTotal();
        const breakdown = calculatePayment(subtotal, planType, planDuration, interestRate);

        try {
            const newBudget = await dentalService.createBudget({
                patient: patientId,
                items: selectedTreatments.map(t => ({ id: t.id, name: t.name, price: t.price, code: t.code })),
                total: breakdown.total,
                status: 'accepted',
                payments: [],
                plan: {
                    type: planType,
                    duration: planDuration,
                    interest: interestRate,
                    breakdown
                }
            });

            // Add to patient balance (debt)
            const currentBalance = activePatient?.balance || 0;
            await dentalService.updatePatient(patientId, {
                balance: currentBalance + breakdown.total
            });
            await refreshPatient();

            toast.success('Presupuesto aceptado');
            setShowPlanModal(false);
            setShowCreate(false);
            setSelectedTreatments([]);
            loadBudgets();

            // Open print page
            window.open(`/print/budget/${newBudget.id}`, '_blank');
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar');
        }
    };

    // Save budget as pending and print (Solo imprimir)
    const handlePrintOnly = async () => {
        const subtotal = calculateTotal();
        const breakdown = calculatePayment(subtotal, planType, planDuration, interestRate);

        try {
            const newBudget = await dentalService.createBudget({
                patient: patientId,
                items: selectedTreatments.map(t => ({ id: t.id, name: t.name, price: t.price, code: t.code })),
                total: breakdown.total,
                status: 'pending',
                payments: [],
                plan: {
                    type: planType,
                    duration: planDuration,
                    interest: interestRate,
                    breakdown
                }
            });

            toast.success('Presupuesto guardado como pendiente');
            setShowPlanModal(false);
            setShowCreate(false);
            setSelectedTreatments([]);
            loadBudgets();

            // Open print page
            window.open(`/print/budget/${newBudget.id}`, '_blank');
        } catch (error) {
            console.error(error);
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
                // We use refreshPatient to ensure we have the exact server state
                await refreshPatient();
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
            await refreshPatient();

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
            {activePatient && (() => {
                // Calculate stats based on budget statuses
                // Only count accepted/paid/partial budgets (not pending or rejected)
                const activeBudgets = budgets.filter(b => ['accepted', 'paid', 'partial'].includes(b.status));
                const totalPresupuestado = activeBudgets.reduce((sum, b) => sum + (b.total || 0), 0);

                // Calculate pending debt: sum of all active budgets minus payments made
                const totalPaid = activeBudgets.reduce((sum, b) => {
                    const payments = b.payments || [];
                    return sum + payments.reduce((pSum, p) => pSum + (p.amount || 0), 0);
                }, 0);
                const saldoPendiente = totalPresupuestado - totalPaid;

                const acceptedCount = activeBudgets.length;

                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-white dark:bg-slate-800">
                            <div className="text-slate-500 text-sm font-medium">Saldo Pendiente (Deuda)</div>
                            <div className={`text-2xl font-bold ${saldoPendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ${saldoPendiente.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                                {saldoPendiente > 0 ? 'Requiere pago' : 'Al corriente'}
                            </div>
                        </Card>

                        <Card className="bg-white dark:bg-slate-800">
                            <div className="text-slate-500 text-sm font-medium">Total Presupuestado</div>
                            <div className="text-2xl font-bold text-slate-800 dark:text-white">
                                ${totalPresupuestado.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                                {acceptedCount} presupuestos aceptados
                            </div>
                        </Card>

                        <Card className="bg-white dark:bg-slate-800">
                            <div className="text-slate-500 text-sm font-medium">Estado General</div>
                            <div className="flex items-center gap-2 mt-1">
                                {saldoPendiente > 0
                                    ? <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">Con Adeudo</span>
                                    : <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">Sin Adeudo</span>
                                }
                            </div>
                        </Card>
                    </div>
                );
            })()}

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

            {/* Payment Plan Configuration Modal */}
            {showPlanModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        {/* Header */}
                        <div className="bg-primary p-6 text-white text-center">
                            <h2 className="text-xl font-bold">Propuesta de Presupuesto</h2>
                            <p className="text-sm opacity-90">Revise y confirme el plan de pagos seleccionado.</p>
                        </div>

                        {/* Summary Cards */}
                        <div className="p-6">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="text-center p-3 border rounded-lg">
                                    <p className="text-xs uppercase text-slate-500">Paciente</p>
                                    <p className="font-semibold text-slate-800">
                                        {activePatient?.firstName} {activePatient?.lastName}
                                    </p>
                                </div>
                                <div className="text-center p-3 border rounded-lg">
                                    <p className="text-xs uppercase text-slate-500">Plan</p>
                                    <p className="font-semibold text-primary">
                                        {planType} ({calculatePayment(calculateTotal(), planType, planDuration, interestRate).count})
                                    </p>
                                </div>
                                <div className="text-center p-3 border rounded-lg">
                                    <p className="text-xs uppercase text-slate-500">Total Final</p>
                                    <p className="font-bold text-xl text-red-500">
                                        ${calculatePayment(calculateTotal(), planType, planDuration, interestRate).total.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            {/* Plan Configuration */}
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Plan</label>
                                    <select
                                        value={planType}
                                        onChange={e => {
                                            setPlanType(e.target.value);
                                            if (e.target.value === 'Contado') {
                                                setPlanDuration(1);
                                                setInterestRate(0);
                                            }
                                        }}
                                        className="w-full border border-slate-300 rounded-lg p-3 text-slate-800 focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="Contado">Contado (Pago Único)</option>
                                        <option value="Semanal">Semanal</option>
                                        <option value="Quincenal">Quincenal</option>
                                        <option value="Mensual">Mensual</option>
                                    </select>
                                </div>

                                {planType !== 'Contado' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                N° de {planType === 'Semanal' ? 'Semanas' : planType === 'Quincenal' ? 'Quincenas' : 'Meses'}
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="24"
                                                value={planDuration}
                                                onChange={e => setPlanDuration(parseInt(e.target.value) || 1)}
                                                className="w-full border border-slate-300 rounded-lg p-3"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Interés (%)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={interestRate}
                                                onChange={e => setInterestRate(parseFloat(e.target.value) || 0)}
                                                className="w-full border border-slate-300 rounded-lg p-3"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payment Summary */}
                            <div className="bg-green-50 rounded-lg p-4 mb-6">
                                <p className="text-sm font-medium text-slate-500 mb-2">RESUMEN DE PAGOS</p>
                                {(() => {
                                    const breakdown = calculatePayment(calculateTotal(), planType, planDuration, interestRate);
                                    return (
                                        <div className="text-center">
                                            {planType === 'Contado' ? (
                                                <p className="text-lg font-semibold text-green-700">
                                                    Pago Único de ${breakdown.total.toFixed(2)}
                                                </p>
                                            ) : (
                                                <>
                                                    <p className="text-lg font-semibold text-green-700">
                                                        {breakdown.count} pagos de ${breakdown.perPayment.toFixed(2)}
                                                    </p>
                                                    {breakdown.interest > 0 && (
                                                        <p className="text-sm text-slate-500">
                                                            (Incluye ${breakdown.interest.toFixed(2)} de intereses)
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Subtotal Info */}
                            <div className="border-t pt-4 mb-4">
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Subtotal Tratamientos:</span>
                                    <span>${calculateTotal().toFixed(2)}</span>
                                </div>
                                {interestRate > 0 && (
                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Intereses ({interestRate}%):</span>
                                        <span>${(calculateTotal() * interestRate / 100).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-lg mt-2">
                                    <span>Total Final:</span>
                                    <span>${calculatePayment(calculateTotal(), planType, planDuration, interestRate).total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => setShowPlanModal(false)}
                                >
                                    <X className="w-4 h-4 mr-1" /> Cancelar
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handlePrintOnly}
                                >
                                    <Printer className="w-4 h-4 mr-1" /> Solo Imprimir
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleConfirmBudget}
                                >
                                    <Check className="w-4 h-4 mr-1" /> Aceptar y Generar
                                </Button>
                            </div>
                        </div>
                    </div>
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
