import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../services/api';

const PatientContext = createContext(null);

export const PatientProvider = ({ children }) => {
    const [activePatient, setActivePatient] = useState(null);

    const clearActivePatient = () => setActivePatient(null);

    // Robust way to refresh data from server
    const refreshPatient = useCallback(async (patientId = null) => {
        const idToFetch = patientId || activePatient?.id;
        if (!idToFetch) return;

        try {
            const data = await api.patients.get(idToFetch);
            setActivePatient(data);
            return data;
        } catch (error) {
            console.error("Error refreshing patient:", error);
            throw error;
        }
    }, [activePatient?.id]);

    return (
        <PatientContext.Provider value={{ activePatient, setActivePatient, clearActivePatient, refreshPatient }}>
            {children}
        </PatientContext.Provider>
    );
};

export const usePatient = () => useContext(PatientContext);
