import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Odontogram from './Odontogram/src/Odontogram';
import { dentalService } from '../services/dentalService';
import { toast } from 'sonner';

/**
 * Wrapper for the Odontogram component to handle patient interactions.
 * Supports both standalone mode (fetches data) and controlled mode (props).
 */
export default function PatientOdontogram({
    patientId,
    readOnly = false,
    initialTreatments = null, // If provided, we don't fetch
    onTreatmentsChange = null // Callback when treatments change
}) {
    const navigate = useNavigate();
    const [selectedTeeth, setSelectedTeeth] = useState([]);
    const [patientTreatments, setPatientTreatments] = useState({}); // Map tooth ID to treatment
    const [availableTreatments, setAvailableTreatments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTooth, setCurrentTooth] = useState(null);

    // Payment Plan Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [planType, setPlanType] = useState('Contado'); // Contado, Semanal, Quincenal, Mensual
    const [planDuration, setPlanDuration] = useState(1);
    const [interestRate, setInterestRate] = useState(0);

    const calculatePayment = () => {
        const total = Object.values(patientTreatments).reduce((sum, tx) => sum + (tx.treatment.price || 0), 0);
        if (planType === 'Contado') return { total, perPayment: total, count: 1 };

        const interest = total * (interestRate / 100);
        const finalTotal = total + interest;
        // planDuration = número de pagos directamente (semanas, quincenas o meses)
        const count = planDuration;
        return { total: finalTotal, perPayment: finalTotal / count, count, interest };
    };

    const handleSaveBudget = async () => {
        if (Object.keys(patientTreatments).length === 0) return;

        try {
            const calculation = calculatePayment();
            const budgetData = {
                patient: patientId,
                items: Object.entries(patientTreatments).map(([tooth, tx]) => ({
                    tooth: tooth.replace('teeth-', ''),
                    name: tx.treatment.name,
                    price: tx.treatment.price,
                    code: tx.treatment.code
                })),
                total: calculation.total,
                status: 'pending',
                plan: {
                    type: planType,
                    duration: planDuration,
                    interest: interestRate,
                    breakdown: calculation
                }
            };

            const newBudget = await dentalService.createBudget(budgetData);
            toast.success('Presupuesto creado');
            setIsPaymentModalOpen(false);

            // Navigate to print view
            navigate(`/imprimir/presupuesto/${newBudget.id}`);

            // Clear
            setPatientTreatments({});
            setSelectedTeeth([]);
            if (onTreatmentsChange) onTreatmentsChange({});

        } catch (error) {
            console.error(error);
            toast.error('Error al guardar presupuesto');
        }
    };

    useEffect(() => {
        loadData();
    }, [patientId, initialTreatments]);

    const loadData = async () => {
        try {
            // Always fetch available treatments types
            const txs = await dentalService.getTreatments();
            setAvailableTreatments(txs);

            if (initialTreatments) {
                // Controlled mode
                setPatientTreatments(initialTreatments || {});
                // Sync selected teeth from treatments
                setSelectedTeeth(Object.keys(initialTreatments));
            } else if (patientId) {
                // Standalone mode - fetch from backend (mocked/placeholder)
                // const state = await dentalService.getOdontogramState(patientId);
                // setPatientTreatments(state || {});
                // setSelectedTeeth(Object.keys(state || {}));
            }
        } catch (error) {
            console.error('Error loading dental data', error);
            toast.error('Error loading dental data');
        }
    };

    const handleSelectTreatment = async (treatment) => {
        if (!currentTooth) return;

        const newEntry = {
            toothId: currentTooth,
            treatment: treatment,
            date: new Date().toISOString(),
            status: 'planned' // Default status
        };

        const updatedTreatments = {
            ...patientTreatments,
            [currentTooth]: newEntry
        };

        // Update local state
        setPatientTreatments(updatedTreatments);

        // Notify parent if controlled
        if (onTreatmentsChange) {
            onTreatmentsChange(updatedTreatments);
        }

        toast.success(`Treatment ${treatment.name} added to tooth ${currentTooth.replace('teeth-', '')}`);
        setIsModalOpen(false);
        setCurrentTooth(null);
    };

    const handleOdontogramChange = (details) => {
        if (readOnly) return;

        const newSelectedIds = details.map(d => d.id);

        // Find if a tooth was ADDED
        const added = newSelectedIds.find(id => !selectedTeeth.includes(id));

        // Update selection state
        setSelectedTeeth(newSelectedIds);

        if (added) {
            setCurrentTooth(added);
            setIsModalOpen(true);
        } else {
            // Tooth was removed/unselected
            // Optional: Remove treatment?
            // For now, let's keep the treatment record but maybe we should allow clearing it?
            // Let's defer that.
        }
    };

    // Map treatments to colors for the odontogram
    const getToothColors = () => {
        const colors = {};
        Object.keys(patientTreatments).forEach(toothId => {
            const param = patientTreatments[toothId];
            if (param.status === 'planned') colors[toothId] = 'blue';
            if (param.status === 'completed') colors[toothId] = 'green';
            // Add more statuses as needed
        });
        return colors;
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Odontogram</h2>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 border rounded-xl p-6 flex justify-center bg-gray-50">
                    <Odontogram
                        defaultSelected={selectedTeeth}
                        onChange={handleOdontogramChange}
                        colors={getToothColors()}
                        theme="light"
                        showTooltip={true}
                    />
                </div>

                <div className="w-full md:w-80 flex flex-col">
                    <h3 className="font-semibold mb-3 text-gray-700 uppercase">RESUMEN</h3>
                    <div className="flex-1 border rounded-lg bg-white overflow-hidden flex flex-col shadow-sm">
                        <div className="overflow-y-auto p-4 space-y-3 max-h-[400px] flex-1">
                            {Object.entries(patientTreatments).map(([tooth, tx]) => (
                                <div key={tooth} className="p-3 border-l-4 border-blue-500 bg-slate-50 rounded flex justify-between items-start group">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">{tx.treatment.name}</span>
                                        <span className="text-xs text-slate-500 uppercase">{tx.treatment.code || 'S/C'}</span>
                                        <span className="text-xs text-blue-600 font-semibold mt-1">Diente {tooth.replace('teeth-', '')}</span>
                                    </div>
                                    <div className="text-right flex items-center gap-2">
                                        <span className="font-bold text-gray-800">${tx.treatment.price || 0}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newTreatments = { ...patientTreatments };
                                                delete newTreatments[tooth];
                                                setPatientTreatments(newTreatments);
                                                const newSelected = selectedTeeth.filter(t => t !== tooth);
                                                setSelectedTeeth(newSelected);
                                                if (onTreatmentsChange) onTreatmentsChange(newTreatments);
                                            }}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                            title="Eliminar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {Object.keys(patientTreatments).length === 0 && (
                                <div className="text-center py-10 text-gray-400 text-sm">
                                    Selecciona un diente para agregar tratamientos.
                                </div>
                            )}
                        </div>

                        {/* Budget Footer */}
                        {Object.keys(patientTreatments).length > 0 && (
                            <div className="border-t p-4 bg-gray-50">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-lg font-bold text-gray-800">Total</span>
                                    <span className="text-2xl font-bold text-slate-900">
                                        ${Object.values(patientTreatments).reduce((sum, tx) => sum + (tx.treatment.price || 0), 0)}
                                    </span>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                                        onClick={() => {
                                            setPatientTreatments({});
                                            setSelectedTeeth([]);
                                            if (onTreatmentsChange) onTreatmentsChange({});
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                        onClick={() => setIsPaymentModalOpen(true)}
                                    >
                                        Guardar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Plan Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">Configurar Plan de Pagos</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Plan</label>
                                <select
                                    className="w-full border rounded-lg p-2"
                                    value={planType}
                                    onChange={e => setPlanType(e.target.value)}
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duración ({planType === 'Mensual' ? 'Meses' : planType === 'Semanal' ? 'Semanas' : 'Quincenas'})</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="24"
                                            className="w-full border rounded-lg p-2"
                                            value={planDuration}
                                            onChange={e => setPlanDuration(Number(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Interés / Comisión (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            className="w-full border rounded-lg p-2"
                                            value={interestRate}
                                            onChange={e => setInterestRate(Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-50 p-4 rounded-lg border mt-4">
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-600">Subtotal Tratamientos:</span>
                                    <span className="font-semibold">${Object.values(patientTreatments).reduce((sum, tx) => sum + (tx.treatment.price || 0), 0)}</span>
                                </div>
                                {planType !== 'Contado' && (
                                    <div className="flex justify-between mb-2 text-sm text-blue-600">
                                        <span>+ Interés ({interestRate}%):</span>
                                        <span>${calculatePayment().interest.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t pt-2 mt-2 text-lg font-bold text-gray-900">
                                    <span>Total Final:</span>
                                    <span>${calculatePayment().total.toFixed(2)}</span>
                                </div>
                                {planType !== 'Contado' && (
                                    <div className="mt-2 text-center text-sm font-medium bg-white p-2 rounded border border-blue-100 text-blue-800">
                                        {Math.ceil(calculatePayment().count)} pagos de ${calculatePayment().perPayment.toFixed(2)}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg"
                                    onClick={() => setIsPaymentModalOpen(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                                    onClick={handleSaveBudget}
                                >
                                    Confirmar e Imprimir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Treatment Selection Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">
                        <div className="p-5 border-b">
                            <h3 className="text-xl font-bold text-gray-800">Select Treatment</h3>
                            <p className="text-gray-500 text-sm">Tooth {currentTooth?.replace('teeth-', '')}</p>
                        </div>

                        <div className="p-2 overflow-y-auto flex-1">
                            {availableTreatments.length === 0 ? (
                                <div className="text-center p-4 text-gray-500">No treatments configured in system.</div>
                            ) : (
                                <div className="grid gap-2">
                                    {availableTreatments.map(tx => (
                                        <button
                                            type="button"
                                            key={tx.id}
                                            onClick={() => handleSelectTreatment(tx)}
                                            className="w-full text-left p-3 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200 transition-all group"
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-gray-700 group-hover:text-blue-700">{tx.name}</span>
                                                <span className="font-bold text-blue-600">${tx.price}</span>
                                            </div>
                                            {tx.code && <div className="text-xs text-gray-400 mt-1">Code: {tx.code}</div>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setCurrentTooth(null);
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
