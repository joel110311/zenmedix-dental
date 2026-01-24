import pb from './pocketbase';

export const dentalService = {
    // Treatments
    getTreatments: async () => {
        return await pb.collection('tratamientos_dentales').getFullList({
            sort: 'name',
        });
    },

    createTreatment: async (data) => {
        return await pb.collection('tratamientos_dentales').create(data);
    },

    updateTreatment: async (id, data) => {
        return await pb.collection('tratamientos_dentales').update(id, data);
    },

    deleteTreatment: async (id) => {
        return await pb.collection('tratamientos_dentales').delete(id);
    },

    // Resources (Sillones)
    getResources: async () => {
        return await pb.collection('resources').getFullList({
            sort: 'created',
        });
    },

    createResource: async (data) => {
        return await pb.collection('resources').create(data);
    },

    deleteResource: async (id) => {
        return await pb.collection('resources').delete(id);
    },

    // Budgets
    getBudgets: async (patientId) => {
        return await pb.collection('presupuestos').getFullList({
            filter: `patient="${patientId}"`,
            sort: '-created',
        });
    },

    createBudget: async (data) => {
        return await pb.collection('presupuestos').create(data);
    },

    updateBudget: async (id, data) => {
        return await pb.collection('presupuestos').update(id, data);
    },

    // Helpers for Odontogram State
    // We can store odontogram state in the patient record or a separate collection
    // For now, let's assume we might store it in a 'dental_history' field in patients or a separate collection if needed.
    // Ideally, 'consultations' could hold odontogram snapshots, or we can add a 'currentOdontogram' field to patient.
    // For this MVP, let's assume we just save/load from a state object, maybe stored in patient.nonPathologicalHistory (abusing field) or a new field if we could add one.
    // Or better, let's add a 'odontogramState' JSON field to patients collection if possible, strictly we shouldn't modify schema too much without reason.
    // Let's use a new collection `surveys` or just `consultations` json field?
    // Let's assume we save it in `consultations` of type "odontogram"? Or just in local state for now/budgets.

    // Patient Balance Helper
    updatePatient: async (id, data) => {
        return await pb.collection('patients').update(id, data);
    },
};
