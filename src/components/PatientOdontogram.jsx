import React, { useState, useEffect } from 'react';
import Odontogram from './Odontogram/src/Odontogram';
import { dentalService } from '../services/dentalService';
import { toast } from 'sonner';

/**
 * Wrapper for the Odontogram component to handle patient interactions.
 */
export default function PatientOdontogram({ patientId, readOnly = false }) {
    const [treatments, setTreatments] = useState([]);
    const [selectedTeeth, setSelectedTeeth] = useState([]);
    const [patientTreatments, setPatientTreatments] = useState({}); // Map tooth ID to treatment
    const [availableTreatments, setAvailableTreatments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTooth, setCurrentTooth] = useState(null);

    useEffect(() => {
        loadData();
    }, [patientId]);

    const loadData = async () => {
        try {
            const txs = await dentalService.getTreatments();
            setAvailableTreatments(txs);

            // Load patient existing treatments/odontogram state
            // For now, we mock or try to fetch from a hypothetic field
            // const state = await dentalService.getOdontogramState(patientId);
            // setPatientTreatments(state || {});
        } catch (error) {
            console.error('Error loading dental data', error);
            toast.error('Error loading dental data');
        }
    };

    const handleToothClick = (toothId) => {
        if (readOnly) return;
        setCurrentTooth(toothId);
        setIsModalOpen(true);
    };

    const handleSelectTreatment = async (treatment) => {
        if (!currentTooth) return;

        const newEntry = {
            toothId: currentTooth,
            treatment: treatment,
            date: new Date().toISOString(),
            status: 'planned'
        };

        // Update local state
        setPatientTreatments(prev => ({
            ...prev,
            [currentTooth]: newEntry
        }));

        // In a real app, save to backend immediately or via a "Save" button
        // await dentalService.addTreatmentToPatient(patientId, newEntry);

        toast.success(`Treatment ${treatment.name} added to tooth ${currentTooth}`);
        setIsModalOpen(false);
        setCurrentTooth(null);
    };

    const handleOdontogramChange = (details) => {
        // This prop gives details about selected teeth
        // We can use it to sync selection state
        const ids = details.map(d => d.id);
        // On click logic is handled via custom interaction usually, 
        // but the library provides 'onChange' when a tooth is toggled.
        // We might need to map that to our "Open Modal" logic.
        // The library's default behavior is toggle selection.
        // We can iterate the 'details' to find which one was just added?
        // Or just use the 'selected' state if we controlled it.
        // The library manages internal state but exports via onChange.

        // For this implementation, let's assume valid click opens modal if we can trap it.
        // The library implementation 'handleToggle' calls 'onChange'.
        // If we want to capture the clicked tooth, we might need to diff 'selectedTeeth' vs 'details'.
    };

    // Map treatments to colors for the odontogram
    const getToothColors = () => {
        const colors = {};
        Object.keys(patientTreatments).forEach(toothId => {
            // Example logic: Blue for planned, Green for completed
            const param = patientTreatments[toothId];
            if (param.status === 'planned') colors[toothId] = 'blue';
            if (param.status === 'completed') colors[toothId] = 'green';
        });
        return colors;
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Odontogram</h2>
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 border rounded p-4 flex justify-center bg-gray-50">
                    <Odontogram
                        onChange={handleOdontogramChange}
                        colors={getToothColors()}
                        theme="light"
                        showTooltip={true}
                    />
                </div>

                <div className="w-full md:w-1/3">
                    <h3 className="font-semibold mb-2">Treatments</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {/* List of current treatments applied to patient */}
                        {Object.entries(patientTreatments).map(([tooth, tx]) => (
                            <div key={tooth} className="p-2 border rounded flex justify-between items-center bg-gray-50">
                                <span>Tooth {tooth.replace('teeth-', '')}</span>
                                <span className="font-medium">{tx.treatment.name}</span>
                            </div>
                        ))}
                        {Object.keys(patientTreatments).length === 0 && (
                            <p className="text-gray-500 text-sm">No treatments recorded.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Simple Modal for Selection */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h3 className="text-lg font-bold mb-4">Select Treatment for Tooth {currentTooth}</h3>
                        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                            {availableTreatments.map(tx => (
                                <button
                                    key={tx.id}
                                    onClick={() => handleSelectTreatment(tx)}
                                    className="w-full text-left p-2 hover:bg-blue-50 rounded border border-transparent hover:border-blue-200"
                                >
                                    <div className="font-semibold">{tx.name}</div>
                                    <div className="text-sm text-gray-500">${tx.price}</div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="w-full py-2 bg-gray-200 rounded hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
