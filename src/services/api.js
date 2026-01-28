import pb from './pocketbase';
import { dentalService } from './dentalService';

// API wrapper for PocketBase operations
export const api = {
    // ==================== AUTHENTICATION ====================
    auth: {
        login: async (email, password) => {
            try {
                const authData = await pb.collection('users').authWithPassword(email, password);
                return {
                    user: {
                        id: authData.record.id,
                        email: authData.record.email,
                        name: authData.record.name,
                        role: authData.record.role,
                        specialty: authData.record.specialty,
                        license: authData.record.license
                    },
                    token: authData.token
                };
            } catch (error) {
                console.error('Login error:', error);
                throw new Error('Credenciales inválidas');
            }
        },

        logout: () => {
            pb.authStore.clear();
        },

        getCurrentUser: () => {
            if (!pb.authStore.isValid) return null;
            const record = pb.authStore.record;
            return {
                id: record.id,
                email: record.email,
                name: record.name,
                role: record.role,
                specialty: record.specialty,
                license: record.license
            };
        },

        isAuthenticated: () => {
            return pb.authStore.isValid;
        }
    },

    // ==================== USERS ====================
    users: {
        // Role constants
        getRoles: () => ({
            SUPER_ADMIN: 'superadmin',
            MEDICO: 'medico',
            RECEPCION: 'recepcion'
        }),

        list: async () => {
            const records = await pb.collection('users').getFullList({
                sort: 'name'
            });
            return records.map(r => ({
                id: r.id,
                email: r.email,
                name: r.name,
                role: r.role,
                specialty: r.specialty,
                license: r.license,
                created: r.created
            }));
        },

        create: async (data) => {
            const record = await pb.collection('users').create({
                ...data,
                passwordConfirm: data.password,
                emailVisibility: true
            });
            return record;
        },

        update: async (id, data) => {
            const record = await pb.collection('users').update(id, data);
            return record;
        },

        delete: async (id) => {
            await pb.collection('users').delete(id);
            return true;
        }
    },

    // ==================== PATIENTS ====================
    patients: {
        list: async () => {
            const records = await pb.collection('patients').getFullList({
                sort: '-created'
            });
            return records;
        },

        get: async (id) => {
            const record = await pb.collection('patients').getOne(id);
            return record;
        },

        create: async (data) => {
            const record = await pb.collection('patients').create(data);
            return record;
        },

        update: async (id, data) => {
            const record = await pb.collection('patients').update(id, data);
            return record;
        },

        delete: async (id) => {
            await pb.collection('patients').delete(id);
            return true;
        },

        search: async (query) => {
            const records = await pb.collection('patients').getList(1, 50, {
                filter: `firstName ~ "${query}" || lastName ~ "${query}" || dni ~ "${query}" || phone ~ "${query}"`,
                sort: '-created'
            });
            return records.items;
        }
    },

    // ==================== APPOINTMENTS ====================
    appointments: {
        list: async () => {
            const records = await pb.collection('appointments').getFullList({
                sort: '-created',
                expand: 'patient,doctor,clinic'
            });
            return records.map(r => ({
                ...r,
                patientId: r.patient, // Preserve ID explicitly
                doctorId: r.doctor,
                clinicId: r.clinic,
                patient: r.expand?.patient,
                doctor: r.expand?.doctor,
                clinic: r.expand?.clinic
            }));
        },

        listByDate: async (date) => {
            const records = await pb.collection('appointments').getFullList({
                filter: `date >= "${date}T00:00:00" && date <= "${date}T23:59:59"`,
                sort: 'time',
                expand: 'patient,doctor,clinic'
            });
            return records;
        },

        create: async (data) => {
            // Handle both relation IDs and legacy format
            const appointmentData = {
                patientName: data.patientName,
                phone: data.phone,
                date: new Date(data.date).toISOString(),
                time: data.time,
                reason: data.reason || 'Consulta General',
                notes: data.notes,
                status: data.status || 'scheduled',
                source: data.source || 'manual'
            };

            // Add relations if provided as IDs
            if (data.patientId) appointmentData.patient = data.patientId;
            // Send clinicId even if not standard length, but ensure it's not empty string to avoid 400
            if (data.clinicId && data.clinicId.trim()) appointmentData.clinic = data.clinicId;
            if (data.resourceId) appointmentData.resource_id = data.resourceId;

            // FIX: Only send doctor relation if ID is valid (15 chars), otherwise append to notes
            if (data.doctorId) {
                if (data.doctorId.length === 15) {
                    appointmentData.doctor = data.doctorId;
                } else if (data.doctor?.name) {
                    // Fallback for settings-based doctors: add to notes
                    const doctorNote = `[Dr: ${data.doctor.name}]`;
                    appointmentData.notes = appointmentData.notes
                        ? `${appointmentData.notes}\n${doctorNote}`
                        : doctorNote;
                }
            }

            // Pack duration into notes if present
            if (data.duration) {
                const durationNote = `[duration:${data.duration}]`;
                appointmentData.notes = appointmentData.notes
                    ? `${appointmentData.notes} ${durationNote}`
                    : durationNote;
            }

            try {
                const record = await pb.collection('appointments').create(appointmentData);
                return record;
            } catch (error) {
                console.error('Error creating appointment:', error);
                if (error.response?.data) {
                    console.error('Validation errors:', error.response.data);
                }
                throw error;
            }
        },

        update: async (id, data) => {
            const updateData = { ...data };
            // Pack duration into notes if present in update
            if (data.duration) {
                // Fetch current note first to append/replace? Or just append if simple update.
                // For simplicity, we assume the caller handles the note merging or we just append.
                // Ideally we should preserve existing notes.
                // Let's rely on the caller passing the full 'notes' string if they want to keep it, 
                // OR we can implement a smarter update here. 
                // BUT, to keep it simple: if 'notes' is passed, we append duration. 
                // If 'notes' is NOT passed, we need to be careful not to overwrite.

                // Better approach: The caller (AdvancedCalendar) should pass the full new note string.
                // So here we might not need to do anything if the caller already formatted the string.
                // However, for consistency with create, let's check.

                // Actually, let's keep it simple: we expect the UI to handle the note formatting for updates
                // to avoid double fetching.
                // BUT, for the drag-resize, we only get 'duration'. So we DO need to handle it.

                if (!updateData.notes) {
                    // We need to get the existing record to preserve notes? 
                    // Or we can just let the backend handle partial updates, but we need to append to the existing string.
                    // PocketBase doesn't support 'append' operation natively in one go without fetching.
                    // So we will assume the UI sends the full note payload OR we do a fetch-update here.
                    try {
                        const existing = await pb.collection('appointments').getOne(id);
                        let currentNotes = existing.notes || '';
                        // Remove old duration tag if exists
                        currentNotes = currentNotes.replace(/\[duration:\d+\]/g, '').trim();
                        updateData.notes = `${currentNotes} [duration:${data.duration}]`;
                        delete updateData.duration; // Clean up
                    } catch (e) {
                        console.error("Error updating duration", e);
                    }
                } else {
                    // If notes ARE passed, ensure duration is there
                    if (!updateData.notes.includes('[duration:')) {
                        updateData.notes = `${updateData.notes} [duration:${data.duration}]`;
                    }
                    delete updateData.duration;
                }
            }

            const record = await pb.collection('appointments').update(id, updateData);
            return record;
        },

        delete: async (id) => {
            await pb.collection('appointments').delete(id);
            return true;
        },

        // Check availability for n8n integration
        checkAvailability: async (clinicId, doctorId, date, time, resourceId) => {
            try {
                // Build base filter
                let baseFilter = `date = "${date}" && time = "${time}" && status != "cancelled"`;
                if (clinicId) baseFilter += ` && clinic = "${clinicId}"`;

                // Check Doctor Availability
                if (doctorId) {
                    const docFilter = `${baseFilter} && doctor = "${doctorId}"`;
                    const docBusy = await pb.collection('appointments').getList(1, 1, { filter: docFilter });
                    if (docBusy.totalItems > 0) return { available: false, reason: 'Doctor ocupado en este horario' };
                }

                // Check Resource/Chair Availability
                if (resourceId) {
                    const resFilter = `${baseFilter} && resource_id = "${resourceId}"`;
                    const resBusy = await pb.collection('appointments').getList(1, 1, { filter: resFilter });
                    if (resBusy.totalItems > 0) return { available: false, reason: 'Sillón/Box ocupado en este horario' };
                }

                // Check clinic schedule if clinicId provided
                if (clinicId) {
                    try {
                        const clinic = await pb.collection('clinics').getOne(clinicId);
                        if (clinic.schedule) {
                            const dayOfWeek = new Date(date).getDay();
                            const daySchedule = clinic.schedule[dayOfWeek];

                            if (!daySchedule || !daySchedule.open) {
                                return { available: false, reason: 'Clínica cerrada este día' };
                            }

                            if (time < daySchedule.start || time > daySchedule.end) {
                                return { available: false, reason: 'Fuera de horario de atención' };
                            }
                        }
                    } catch (e) {
                        console.warn('Could not check clinic schedule:', e);
                    }
                }

                return { available: true };
            } catch (error) {
                console.error('Availability check error:', error);
                return { available: false, reason: 'Error al verificar disponibilidad' };
            }
        }
    },

    // ==================== CONSULTATIONS ====================
    consultations: {
        listByPatient: async (patientId) => {
            const records = await pb.collection('consultations').getFullList({
                filter: `patient = "${patientId}"`,
                sort: '-created',
                expand: 'doctor,appointment'
            });
            return records;
        },

        get: async (id) => {
            const record = await pb.collection('consultations').getOne(id, {
                expand: 'patient,doctor,appointment'
            });
            return record;
        },

        create: async (data) => {
            const consultationData = {
                ...data,
                type: data.type || 'consultation'
            };

            // Convert patientId to patient relation
            if (data.patientId && !data.patient) {
                consultationData.patient = data.patientId;
                delete consultationData.patientId;
            }

            if (data.appointmentId && !data.appointment) {
                consultationData.appointment = data.appointmentId;
                delete consultationData.appointmentId;
            }

            const record = await pb.collection('consultations').create(consultationData);

            // Update patient's lastVisit
            if (consultationData.patient) {
                try {
                    await pb.collection('patients').update(consultationData.patient, {
                        lastVisit: new Date().toISOString()
                    });
                } catch (e) {
                    console.warn('Could not update patient lastVisit:', e);
                }
            }

            return record;
        },

        update: async (id, data) => {
            const record = await pb.collection('consultations').update(id, data);
            return record;
        }
    },

    // ==================== CLINICS ====================
    clinics: {
        list: async () => {
            const records = await pb.collection('clinics').getFullList({
                sort: 'name'
            });
            return records;
        },

        get: async (id) => {
            const record = await pb.collection('clinics').getOne(id);
            return record;
        },

        create: async (data) => {
            const record = await pb.collection('clinics').create(data);
            return record;
        },

        update: async (id, data) => {
            const record = await pb.collection('clinics').update(id, data);
            return record;
        },

        delete: async (id) => {
            await pb.collection('clinics').delete(id);
            return true;
        }
    },

    // ==================== CONFIG (Settings) ====================
    config: {
        get: async (key) => {
            try {
                const records = await pb.collection('config').getFullList({
                    filter: `key = "${key}"`
                });
                return records.length > 0 ? records[0].value : null;
            } catch (error) {
                console.error('Config get error:', error);
                return null;
            }
        },

        set: async (key, value) => {
            try {
                // Try to find existing
                const existing = await pb.collection('config').getFullList({
                    filter: `key = "${key}"`
                });

                if (existing.length > 0) {
                    await pb.collection('config').update(existing[0].id, { value });
                } else {
                    await pb.collection('config').create({ key, value });
                }
                return true;
            } catch (error) {
                console.error('Config set error:', error);
                return false;
            }
        },

        getAll: async () => {
            try {
                const records = await pb.collection('config').getFullList();
                const config = {};
                records.forEach(r => {
                    config[r.key] = r.value;
                });
                return config;
            } catch (error) {
                console.error('Config getAll error:', error);
                return {};
            }
        }
    },

    // ==================== AUDIT LOGS ====================
    auditLogs: {
        list: async (page = 1, perPage = 50, filters = {}) => {
            let filter = '';

            if (filters.action) {
                filter += `action ~ "${filters.action}"`;
            }
            if (filters.entity) {
                if (filter) filter += ' && ';
                filter += `entity = "${filters.entity}"`;
            }
            if (filters.userId) {
                if (filter) filter += ' && ';
                filter += `user = "${filters.userId}"`;
            }

            const records = await pb.collection('audit_logs').getList(page, perPage, {
                filter: filter || undefined,
                sort: '-created',
                expand: 'user'
            });

            return {
                items: records.items,
                totalPages: records.totalPages,
                totalItems: records.totalItems
            };
        },

        create: async (data) => {
            const user = pb.authStore.record;
            const record = await pb.collection('audit_logs').create({
                user: user?.id,
                userName: user?.name || 'Sistema',
                action: data.action,
                entity: data.entity,
                entityId: data.entityId,
                details: data.details,
                ipAddress: data.ipAddress
            });
            return record;
        }
    },

    // ==================== DENTAL SERVICE (Proxy) ====================
    dentalService: dentalService
};

// Export default
export default api;
