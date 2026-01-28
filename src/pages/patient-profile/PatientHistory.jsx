import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, AlertTriangle, FlaskConical, Eye, ClipboardList, ChevronRight } from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { toast } from 'sonner';

export default function PatientHistory() {
    const { activePatient, setActivePatient } = usePatient();
    const [saving, setSaving] = useState(false);
    const [labResults, setLabResults] = useState([]);
    const [studyRequests, setStudyRequests] = useState([]);

    const { register, handleSubmit } = useForm({
        defaultValues: {
            allergies: activePatient?.allergies || '',
            pathologicalHistory: activePatient?.pathologicalHistory || '',
            nonPathologicalHistory: activePatient?.nonPathologicalHistory || ''
        }
    });

    useEffect(() => {
        if (activePatient?.id) {
            // Load lab results from localStorage
            const storedResults = localStorage.getItem(`medflow_labresults_${activePatient.id}`);
            setLabResults(storedResults ? JSON.parse(storedResults) : []);

            const storedRequests = localStorage.getItem(`medflow_studyrequests_${activePatient.id}`);
            setStudyRequests(storedRequests ? JSON.parse(storedRequests) : []);
        }
    }, [activePatient?.id]);

    const onSubmit = async (data) => {
        setSaving(true);
        try {
            await api.patients.update(activePatient.id, data);
            setActivePatient({ ...activePatient, ...data });
            toast.success('Antecedentes actualizados');
        } catch (error) {
            toast.error('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    if (!activePatient) return null;

    // Combine and sort all clinical events by date
    const clinicalTimeline = [
        ...labResults.map(r => ({ ...r, eventType: 'labResult' })),
        ...studyRequests.map(r => ({ ...r, eventType: 'studyRequest' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Antecedentes Médicos</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                                className="w-full px-3 py-2 border-2 border-red-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-red-800 font-medium placeholder:text-red-300"
                            />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="grid grid-cols-1 gap-6">
                        <Textarea
                            label="Antecedentes Patológicos"
                            {...register('pathologicalHistory')}
                            rows={6}
                            placeholder="Enfermedades crónicas, cirugías, hospitalizaciones previas..."
                        />
                        <Textarea
                            label="Antecedentes No Patológicos"
                            {...register('nonPathologicalHistory')}
                            rows={6}
                            placeholder="Hábitos, tabaquismo, alcohol, actividad física, alimentación..."
                        />
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button type="submit" loading={saving}>
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Cambios
                        </Button>
                    </div>
                </Card>
            </form>

            {/* Clinical Studies Timeline */}
            {clinicalTimeline.length > 0 && (
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <FlaskConical className="w-5 h-5 text-purple-600" />
                            Estudios Clínicos
                        </h2>
                        <Link
                            to={`/paciente/${activePatient.id}/analisis`}
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                            Ver todos <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {clinicalTimeline.slice(0, 5).map((event) => (
                            <div
                                key={event.id}
                                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${event.eventType === 'labResult'
                                            ? 'bg-purple-100 text-purple-600'
                                            : 'bg-green-100 text-green-600'
                                        }`}>
                                        {event.eventType === 'labResult'
                                            ? <FlaskConical className="w-4 h-4" />
                                            : <ClipboardList className="w-4 h-4" />
                                        }
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white text-sm">
                                            {event.eventType === 'labResult'
                                                ? `Estudios de Gabinete: ${event.type}`
                                                : `Solicitud: ${event.studies?.slice(0, 2).join(', ')}${event.studies?.length > 2 ? '...' : ''}`
                                            }
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(event.date).toLocaleDateString('es-ES')}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    to={`/paciente/${activePatient.id}/analisis`}
                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                                >
                                    <Eye className="w-4 h-4" />
                                    Ver Detalles
                                </Link>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
