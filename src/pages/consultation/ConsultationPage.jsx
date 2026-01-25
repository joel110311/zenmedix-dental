import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { ArrowLeft, Save, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';
import { usePatient } from '../../context/PatientContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Spinner } from '../../components/ui/Spinner';
import { toast } from 'sonner';
import PatientOdontogram from '../../components/PatientOdontogram';

// Calculate age from DOB
const calculateAge = (dob) => {
    if (!dob) return '-';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

export default function ConsultationPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { activePatient, setActivePatient } = usePatient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [patient, setPatient] = useState(null);
    const [consultations, setConsultations] = useState([]);

    // Odontogram state
    const [odontogramSnapshot, setOdontogramSnapshot] = useState({});
    const [initialOdontogram, setInitialOdontogram] = useState(null);

    const { register, handleSubmit, control, formState: { errors } } = useForm({
        defaultValues: {
            allergies: '',
            pathologicalHistory: '',
            nonPathologicalHistory: '',
            chiefComplaint: '',
            diagnosis: '',
            treatmentPlan: '',
            medications: [{ name: '', dose: '', frequency: '', duration: '' }]
        }
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'medications' });

    useEffect(() => {
        loadPatientData();
    }, [id]);

    const loadPatientData = async () => {
        try {
            setLoading(true);
            const patientData = activePatient || await api.patients.get(id);
            setPatient(patientData);
            if (!activePatient) setActivePatient(patientData);

            const history = await api.consultations.listByPatient(id);
            setConsultations(history);

            // Find the most recent odontogram snapshot from previous consultations
            const lastConsultWithOdontogram = history.find(c => c.data_especifica?.odontogram);
            if (lastConsultWithOdontogram) {
                console.log("Loading previous odontogram", lastConsultWithOdontogram.data_especifica.odontogram);
                setInitialOdontogram(lastConsultWithOdontogram.data_especifica.odontogram);
                setOdontogramSnapshot(lastConsultWithOdontogram.data_especifica.odontogram);
            }

        } catch (error) {
            console.error(error);
            toast.error('Error al cargar datos del paciente');
            navigate('/pacientes');
        } finally {
            setLoading(false);
        }
    };

    const handleOdontogramChange = (newTreatments) => {
        setOdontogramSnapshot(newTreatments);
    };

    const onSubmit = async (data) => {
        setSaving(true);
        try {
            // Update patient with allergies and history
            await api.patients.update(id, {
                allergies: data.allergies,
                pathologicalHistory: data.pathologicalHistory,
                nonPathologicalHistory: data.nonPathologicalHistory
            });

            // Create new consultation
            const consultation = await api.consultations.create({
                patientId: id,
                chiefComplaint: data.chiefComplaint,
                diagnosis: data.diagnosis,
                treatmentPlan: data.treatmentPlan,
                medications: data.medications.filter(m => m.name),
                data_especifica: {
                    odontogram: odontogramSnapshot
                }
            });

            toast.success('Consulta guardada correctamente');
            navigate(`/imprimir/receta/${consultation.id}`);
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar la consulta');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/pacientes')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            {patient?.firstName} {patient?.lastName}
                        </h1>
                        <p className="text-slate-500">
                            {calculateAge(patient?.dob)} años • DNI: {patient?.dni}
                        </p>
                    </div>
                </div>
                <p className="text-sm text-slate-500">
                    Fecha: {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Allergies Alert Card */}
                <Card className="border-2 border-red-200 bg-red-50">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-red-100 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-red-700 mb-2">⚠️ ALERGIAS CONOCIDAS</label>
                            <input
                                {...register('allergies')}
                                placeholder="Sin alergias conocidas..."
                                className="w-full px-3 py-2 border-2 border-red-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-red-800 font-medium placeholder:text-red-300"
                                defaultValue={patient?.allergies || ''}
                            />
                        </div>
                    </div>
                </Card>

                {/* Medical History Section */}
                <Card title="Antecedentes Médicos">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Textarea
                            label="Antecedentes Patológicos"
                            {...register('pathologicalHistory')}
                            rows={4}
                            placeholder="Enfermedades previas, cirugías, hospitalizaciones..."
                            defaultValue={patient?.pathologicalHistory || ''}
                        />
                        <Textarea
                            label="Antecedentes No Patológicos"
                            {...register('nonPathologicalHistory')}
                            rows={4}
                            placeholder="Hábitos, ocupación, estilo de vida..."
                            defaultValue={patient?.nonPathologicalHistory || ''}
                        />
                    </div>
                </Card>

                {/* Dental Chart / Odontogram */}
                <Card title="Odontograma (Estado Actual)">
                    <div className="min-h-[500px]">
                        <PatientOdontogram
                            patientId={id}
                            initialTreatments={initialOdontogram}
                            onTreatmentsChange={handleOdontogramChange}
                        />
                    </div>
                </Card>

                {/* Anamnesis Section */}
                <Card title="Anamnesis y Diagnóstico">
                    <div className="space-y-4">
                        <Textarea
                            label="Motivo de Consulta y Nota de Evolución"
                            {...register('chiefComplaint', { required: 'El motivo de consulta es requerido' })}
                            rows={5}
                            placeholder="Describa el motivo de la consulta, síntomas, evolución..."
                            error={errors.chiefComplaint}
                        />
                        <Input
                            label="Diagnóstico Presuntivo"
                            {...register('diagnosis')}
                            placeholder="Ej: Caries dental, Gingivitis..."
                        />
                    </div>
                </Card>

                {/* Treatment Plan Section */}
                <Card title="Plan de Tratamiento y Receta">
                    <div className="space-y-6">
                        <Textarea
                            label="Indicaciones Generales"
                            {...register('treatmentPlan')}
                            rows={3}
                            placeholder="Instrucciones para el paciente..."
                        />

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-slate-700">Medicamentos</label>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => append({ name: '', dose: '', frequency: '', duration: '' })}
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Agregar Medicamento
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-3 items-start p-4 bg-slate-50 rounded-lg">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                                            <Input
                                                placeholder="Medicamento"
                                                {...register(`medications.${index}.name`)}
                                            />
                                            <Input
                                                placeholder="Dosis"
                                                {...register(`medications.${index}.dose`)}
                                            />
                                            <Input
                                                placeholder="Frecuencia"
                                                {...register(`medications.${index}.frequency`)}
                                            />
                                            <Input
                                                placeholder="Duración"
                                                {...register(`medications.${index}.duration`)}
                                            />
                                        </div>
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => remove(index)}
                                                className="text-red-500 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 items-center">
                    <div className="flex-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                            <span className="text-sm text-gray-700 font-medium">Consentimiento Informado Firmado</span>
                        </label>
                    </div>
                    <Button variant="secondary" type="button" onClick={() => navigate('/pacientes')}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={saving}>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Consulta
                    </Button>
                </div>
            </form>
        </div>
    );
}
