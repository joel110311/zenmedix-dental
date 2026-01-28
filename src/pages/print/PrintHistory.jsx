import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, FlaskConical } from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

export default function PrintHistory() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [consultations, setConsultations] = useState([]);
    const [labResults, setLabResults] = useState([]);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const patientData = await api.patients.get(id);
            setPatient(patientData);
            const consultsData = await api.consultations.listByPatient(id);
            setConsultations(consultsData);

            // Load lab results from localStorage
            const storedResults = localStorage.getItem(`medflow_labresults_${id}`);
            setLabResults(storedResults ? JSON.parse(storedResults) : []);
        } catch (error) {
            navigate('/pacientes');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

    return (
        <div className="min-h-screen bg-slate-100 print:bg-white">
            {/* Controls */}
            <div className="no-print bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Button variant="ghost" onClick={() => navigate(`/pacientes/${id}/resumen`)}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver al Perfil
                    </Button>
                    <Button onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir Historia Completa
                    </Button>
                </div>
            </div>

            {/* Document */}
            <div className="max-w-4xl mx-auto p-8 print:p-0 print:max-w-none">
                <div className="bg-white shadow-lg print:shadow-none p-8 min-h-[29.7cm] print:min-h-0">

                    <header className="text-center border-b-2 border-slate-800 pb-6 mb-8">
                        <h1 className="text-3xl font-bold uppercase tracking-wide">Historia Clínica</h1>
                        <p className="text-slate-600 mt-2">Clínica ZenMedix • Dr. Joel W.</p>
                    </header>

                    <section className="mb-8">
                        <h2 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-slate-800 mb-4 uppercase">Datos del Paciente</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p><span className="font-bold">Nombre:</span> {patient.firstName} {patient.lastName}</p>
                                <p><span className="font-bold">DNI:</span> {patient.dni}</p>
                                <p><span className="font-bold">Fecha Nacimiento:</span> {new Date(patient.dob).toLocaleDateString()}</p>
                                <p><span className="font-bold">Dirección:</span> {patient.address}</p>
                            </div>
                            <div>
                                <p><span className="font-bold">Teléfono:</span> {patient.phone}</p>
                                <p><span className="font-bold">Email:</span> {patient.email}</p>
                                <p><span className="font-bold">Sexo:</span> {patient.gender}</p>
                            </div>
                        </div>
                    </section>

                    {(patient.allergies || patient.pathologicalHistory) && (
                        <section className="mb-8">
                            <h2 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-slate-800 mb-4 uppercase">Antecedentes</h2>
                            <div className="space-y-3 text-sm">
                                {patient.allergies && (
                                    <div>
                                        <p className="font-bold text-red-600">⚠ Alergias:</p>
                                        <p className="pl-4">{patient.allergies}</p>
                                    </div>
                                )}
                                {patient.pathologicalHistory && (
                                    <div>
                                        <p className="font-bold">Patológicos:</p>
                                        <p className="pl-4 whitespace-pre-wrap">{patient.pathologicalHistory}</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    <section className="mb-8">
                        <h2 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-slate-800 mb-4 uppercase">Historial de Consultas</h2>

                        {consultations.length === 0 ? (
                            <p className="text-slate-500 italic">No hay consultas registradas.</p>
                        ) : (
                            <div className="space-y-8">
                                {consultations.map((c, i) => (
                                    <div key={c.id} className="border-b border-slate-200 pb-6 break-inside-avoid">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <h3 className="font-bold text-base">Consulta #{consultations.length - i}</h3>
                                            <span className="text-sm text-slate-500">
                                                {new Date(c.date).toLocaleDateString('es-ES', {
                                                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="font-bold text-slate-700">Motivo:</p>
                                                <p className="mb-2">{c.chiefComplaint}</p>

                                                {c.diagnosis && (
                                                    <>
                                                        <p className="font-bold text-slate-700">Diagnóstico:</p>
                                                        <p className="mb-2">{c.diagnosis}</p>
                                                    </>
                                                )}
                                            </div>
                                            <div>
                                                {c.notes && (
                                                    <>
                                                        <p className="font-bold text-slate-700">Notas:</p>
                                                        <p className="mb-2 whitespace-pre-wrap">{c.notes}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {c.medications?.length > 0 && (
                                            <div className="mt-2 bg-slate-50 p-2 rounded text-sm">
                                                <p className="font-bold text-slate-700">Tratamiento:</p>
                                                <ul className="list-disc pl-5">
                                                    {c.medications.map((m, idx) => (
                                                        <li key={idx}>{m.name} {m.dose} ({m.frequency}) - {m.duration}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {c.studies && (
                                            <div className="mt-2 text-sm">
                                                <p className="font-bold text-slate-700">Estudios Solicitados:</p>
                                                <p className="whitespace-pre-wrap">{c.studies}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Clinical Studies Section */}
                    {labResults.length > 0 && (
                        <section className="mb-8">
                            <h2 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-purple-600 mb-4 uppercase flex items-center gap-2">
                                <FlaskConical className="w-5 h-5 text-purple-600" />
                                Estudios Clínicos Realizados
                            </h2>
                            <div className="space-y-4">
                                {labResults.map((result, idx) => (
                                    <div key={result.id || idx} className="border-b border-slate-200 pb-3 break-inside-avoid">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="font-bold text-sm text-purple-700">{result.type}</h3>
                                            <span className="text-xs text-slate-500">
                                                {new Date(result.date).toLocaleDateString('es-ES', {
                                                    year: 'numeric', month: 'long', day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        {result.notes && (
                                            <p className="text-sm text-slate-600 mt-1">
                                                <span className="font-medium">Observaciones:</span> {result.notes}
                                            </p>
                                        )}
                                        {(result.files?.length > 0 || result.attachments?.length > 0) && (
                                            <p className="text-xs text-slate-400 mt-1">
                                                📎 {result.files?.length || result.attachments?.length} archivo(s) adjunto(s)
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <footer className="mt-16 text-center text-xs text-slate-400">
                        <p>Generado por ZenMedix el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()}</p>
                    </footer>

                </div>
            </div>
        </div>
    );
}
