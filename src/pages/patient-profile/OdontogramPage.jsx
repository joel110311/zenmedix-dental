import { useParams } from 'react-router-dom';
import PatientOdontogram from '../../components/PatientOdontogram';
import Periodontograma from '../../components/Periodontograma/Periodontograma';

export default function OdontogramPage() {
    const { id } = useParams();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Odontograma</h1>
                <p className="text-slate-500">Gestión de tratamientos y estado dental.</p>
            </div>

            <PatientOdontogram patientId={id} />

            {/* Separador visual */}
            <div className="border-t-2 border-dashed border-slate-200 my-8"></div>

            {/* Periodontograma */}
            <Periodontograma patientId={id} />
        </div>
    );
}
