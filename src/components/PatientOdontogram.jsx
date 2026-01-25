import React, { useState, useEffect } from 'react';
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
    const [selectedTeeth, setSelectedTeeth] = useState([]);
    const [patientTreatments, setPatientTreatments] = useState({}); // Map tooth ID to treatment
    const [availableTreatments, setAvailableTreatments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTooth, setCurrentTooth] = useState(null);

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
                    <h3 className="font-semibold mb-3 text-gray-700">Treatments Summary</h3>
                    <div className="flex-1 border rounded-lg bg-gray-50 overflow-hidden flex flex-col">
                        <div className="overflow-y-auto p-2 space-y-2 max-h-[400px]">
                            {Object.entries(patientTreatments).map(([tooth, tx]) => (
                                <div key={tooth} className="p-3 border rounded-md bg-white shadow-sm flex justify-between items-center group hover:border-blue-200 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-800">Tooth {tooth.replace('teeth-', '')}</span>
                                        <span className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-blue-600">{tx.treatment.name}</div>
                                        <div className="text-xs text-gray-400 capitalize">{tx.status}</div>
                                    </div>
                                </div>
                            ))}
                            {Object.keys(patientTreatments).length === 0 && (
                                <div className="text-center p-8 text-gray-400">
                                    No treatments recorded yet.
                                    <br />Select a tooth to start.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
