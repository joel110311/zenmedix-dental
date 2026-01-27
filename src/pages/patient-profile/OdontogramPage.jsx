import { useParams } from 'react-router-dom';
import PatientOdontogram from '../../components/PatientOdontogram';

export default function OdontogramPage() {
    const { id } = useParams();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Odontograma</h1>
                <p className="text-slate-500">Gestión de tratamientos y estado dental.</p>
            </div>

            <PatientOdontogram patientId={id} />
        </div>
    );
}
