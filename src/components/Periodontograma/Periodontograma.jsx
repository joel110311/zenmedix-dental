import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'sonner';
import DientePeriodontal from './DientePeriodontal';
import {
    DIENTES_MAXILAR_DERECHO,
    DIENTES_MAXILAR_IZQUIERDO,
    DIENTES_MANDIBULA_IZQUIERDO,
    DIENTES_MANDIBULA_DERECHO,
    generarDatosVacios,
    calcularNIC,
    PUNTOS
} from './periodontogramaUtils';
import { dentalService } from '../../services/dentalService';

/**
 * Componente Periodontograma
 * Renderiza la cartilla periodontal completa con todos los dientes
 */
export default function Periodontograma({ patientId }) {
    const [datos, setDatos] = useState(() => generarDatosVacios());
    const [caraActual, setCaraActual] = useState('vestibular');
    const [dienteSeleccionado, setDienteSeleccionado] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [modificado, setModificado] = useState(false);

    // Cargar datos del paciente
    useEffect(() => {
        const cargarDatos = async () => {
            if (!patientId) return;
            setCargando(true);
            try {
                const datosGuardados = await dentalService.getPeriodontoData(patientId);
                if (datosGuardados && Object.keys(datosGuardados).length > 0) {
                    setDatos(datosGuardados);
                }
            } catch (error) {
                console.error('Error al cargar periodontograma:', error);
            } finally {
                setCargando(false);
            }
        };
        cargarDatos();
    }, [patientId]);

    // Manejador de cambios en mediciones
    const handleChange = useCallback((numeroDiente, cara, tipoMedicion, punto, valor) => {
        setDatos(prev => {
            const nuevosDatos = { ...prev };
            if (!nuevosDatos[numeroDiente]) {
                nuevosDatos[numeroDiente] = generarDatosVacios()[numeroDiente];
            }
            if (!nuevosDatos[numeroDiente][cara]) {
                nuevosDatos[numeroDiente][cara] = {
                    margen_gingival: { mesial: 0, central: 0, distal: 0 },
                    profundidad_sondaje: { mesial: 0, central: 0, distal: 0 },
                    sangrado: { mesial: false, central: false, distal: false },
                    placa: { mesial: false, central: false, distal: false }
                };
            }
            nuevosDatos[numeroDiente][cara][tipoMedicion][punto] = valor;
            return nuevosDatos;
        });
        setModificado(true);
    }, []);

    // Guardar datos
    const handleGuardar = async () => {
        if (!patientId) return;
        setGuardando(true);
        try {
            await dentalService.updatePeriodontoData(patientId, datos);
            toast.success('Periodontograma guardado');
            setModificado(false);
        } catch (error) {
            console.error('Error al guardar:', error);
            toast.error('Error al guardar periodontograma');
        } finally {
            setGuardando(false);
        }
    };

    // Toggle diente ausente
    const handleToggleAusente = (numeroDiente) => {
        setDatos(prev => ({
            ...prev,
            [numeroDiente]: {
                ...prev[numeroDiente],
                ausente: !prev[numeroDiente]?.ausente
            }
        }));
        setModificado(true);
    };

    // Cambiar movilidad
    const handleCambiarMovilidad = (numeroDiente, valor) => {
        setDatos(prev => ({
            ...prev,
            [numeroDiente]: {
                ...prev[numeroDiente],
                movilidad: Math.max(0, Math.min(3, valor))
            }
        }));
        setModificado(true);
    };

    // Cambiar furcación
    const handleCambiarFurcacion = (numeroDiente, valor) => {
        setDatos(prev => ({
            ...prev,
            [numeroDiente]: {
                ...prev[numeroDiente],
                furcacion: Math.max(0, Math.min(3, valor))
            }
        }));
        setModificado(true);
    };

    // Calcular estadísticas
    const calcularEstadisticas = () => {
        let totalSitios = 0;
        let sitiosSangrado = 0;
        let sitiosPlaca = 0;
        let sitiosBolsa = 0;

        Object.entries(datos).forEach(([numero, diente]) => {
            if (diente?.ausente) return;

            ['vestibular', 'lingual'].forEach(cara => {
                if (!diente?.[cara]) return;
                PUNTOS.forEach(punto => {
                    totalSitios++;
                    if (diente[cara].sangrado?.[punto]) sitiosSangrado++;
                    if (diente[cara].placa?.[punto]) sitiosPlaca++;
                    if ((diente[cara].profundidad_sondaje?.[punto] || 0) > 3) sitiosBolsa++;
                });
            });
        });

        return {
            porcSangrado: totalSitios > 0 ? Math.round((sitiosSangrado / totalSitios) * 100) : 0,
            porcPlaca: totalSitios > 0 ? Math.round((sitiosPlaca / totalSitios) * 100) : 0,
            porcBolsas: totalSitios > 0 ? Math.round((sitiosBolsa / totalSitios) * 100) : 0,
            totalSitios
        };
    };

    const stats = calcularEstadisticas();

    // Renderizar fila de dientes
    const renderFilaDientes = (dientes, etiqueta) => (
        <div className="flex flex-col items-center">
            <span className="text-xs text-slate-500 mb-1">{etiqueta}</span>
            <div className="flex gap-0.5">
                {dientes.map(numero => (
                    <DientePeriodontal
                        key={numero}
                        numero={numero}
                        datos={datos[numero]}
                        cara={caraActual}
                        onChange={handleChange}
                        seleccionado={dienteSeleccionado === numero}
                        onSelect={setDienteSeleccionado}
                    />
                ))}
            </div>
        </div>
    );

    if (cargando) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-slate-600">Cargando periodontograma...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Periodontograma</h2>
                        <p className="text-emerald-100 text-sm">Cartilla de evaluación periodontal</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleGuardar}
                        disabled={guardando || !modificado}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${modificado
                            ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                            : 'bg-emerald-500/50 text-emerald-200 cursor-not-allowed'
                            }`}
                    >
                        {guardando ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>

            {/* Toggle Vestibular/Lingual */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-700">Vista:</span>
                    <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200">
                        <button
                            type="button"
                            onClick={() => setCaraActual('vestibular')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${caraActual === 'vestibular'
                                ? 'bg-emerald-600 text-white shadow'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Vestibular
                        </button>
                        <button
                            type="button"
                            onClick={() => setCaraActual('lingual')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${caraActual === 'lingual'
                                ? 'bg-emerald-600 text-white shadow'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Lingual/Palatino
                        </button>
                    </div>

                    {/* Leyenda */}
                    <div className="flex items-center gap-4 ml-auto text-xs">
                        <div className="flex items-center gap-1">
                            <span className="w-3 h-0.5 bg-blue-500"></span>
                            <span className="text-slate-600">MG (Margen Gingival)</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="w-3 h-0.5 bg-red-500"></span>
                            <span className="text-slate-600">PS (Prof. Sondaje)</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-red-500/20 border border-red-300"></span>
                            <span className="text-slate-600">Bolsa Patológica</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="px-6 py-3 bg-slate-100/50 border-b border-slate-200">
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-600">Sangrado:</span>
                        <span className={`font-bold ${stats.porcSangrado > 20 ? 'text-red-600' : 'text-green-600'}`}>
                            {stats.porcSangrado}%
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-600">Placa:</span>
                        <span className={`font-bold ${stats.porcPlaca > 20 ? 'text-amber-600' : 'text-green-600'}`}>
                            {stats.porcPlaca}%
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-600">Bolsas &gt;3mm:</span>
                        <span className={`font-bold ${stats.porcBolsas > 10 ? 'text-red-600' : 'text-green-600'}`}>
                            {stats.porcBolsas}%
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                        <span>({stats.totalSitios} sitios evaluados)</span>
                    </div>
                </div>
            </div>

            {/* Área del gráfico */}
            <div className="p-6 overflow-x-auto">
                {/* Maxilar */}
                <div className="mb-6">
                    <div className="text-center mb-2">
                        <span className="inline-block px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-700">
                            MAXILAR (Superior)
                        </span>
                    </div>
                    <div className="flex justify-center gap-8">
                        {renderFilaDientes(DIENTES_MAXILAR_DERECHO, 'Cuadrante 1 (Der.)')}
                        <div className="w-px bg-slate-300"></div>
                        {renderFilaDientes(DIENTES_MAXILAR_IZQUIERDO, 'Cuadrante 2 (Izq.)')}
                    </div>
                </div>

                {/* Línea divisoria */}
                <div className="border-t-2 border-slate-300 my-6"></div>

                {/* Mandíbula */}
                <div>
                    <div className="flex justify-center gap-8">
                        {renderFilaDientes(DIENTES_MANDIBULA_DERECHO, 'Cuadrante 4 (Der.)')}
                        <div className="w-px bg-slate-300"></div>
                        {renderFilaDientes(DIENTES_MANDIBULA_IZQUIERDO, 'Cuadrante 3 (Izq.)')}
                    </div>
                    <div className="text-center mt-2">
                        <span className="inline-block px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-700">
                            MANDÍBULA (Inferior)
                        </span>
                    </div>
                </div>
            </div>

            {/* Panel de edición del diente seleccionado */}
            {dienteSeleccionado && datos[dienteSeleccionado] && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <div className="flex items-center gap-6">
                        <span className="font-bold text-lg text-slate-800">
                            Diente {dienteSeleccionado}
                        </span>

                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Ausente:</label>
                            <input
                                type="checkbox"
                                checked={datos[dienteSeleccionado]?.ausente || false}
                                onChange={() => handleToggleAusente(dienteSeleccionado)}
                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Movilidad:</label>
                            <select
                                value={datos[dienteSeleccionado]?.movilidad || 0}
                                onChange={(e) => handleCambiarMovilidad(dienteSeleccionado, parseInt(e.target.value))}
                                className="px-2 py-1 rounded border border-slate-300 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value={0}>0 - Normal</option>
                                <option value={1}>1 - Leve</option>
                                <option value={2}>2 - Moderada</option>
                                <option value={3}>3 - Severa</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Furcación:</label>
                            <select
                                value={datos[dienteSeleccionado]?.furcacion || 0}
                                onChange={(e) => handleCambiarFurcacion(dienteSeleccionado, parseInt(e.target.value))}
                                className="px-2 py-1 rounded border border-slate-300 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value={0}>0 - Sin lesión</option>
                                <option value={1}>Grado I</option>
                                <option value={2}>Grado II</option>
                                <option value={3}>Grado III</option>
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={() => setDienteSeleccionado(null)}
                            className="ml-auto text-slate-500 hover:text-slate-700"
                        >
                            ✕ Cerrar
                        </button>
                    </div>

                    {/* Valores detallados */}
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <h4 className="font-medium text-slate-700 mb-2">Vestibular</h4>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                {PUNTOS.map(punto => {
                                    const mg = datos[dienteSeleccionado]?.vestibular?.margen_gingival?.[punto] || 0;
                                    const ps = datos[dienteSeleccionado]?.vestibular?.profundidad_sondaje?.[punto] || 0;
                                    const nic = calcularNIC(mg, ps);
                                    return (
                                        <div key={punto} className="text-xs">
                                            <div className="font-medium text-slate-500 uppercase">{punto.charAt(0)}</div>
                                            <div className="text-blue-600">MG: {mg}</div>
                                            <div className="text-red-600">PS: {ps}</div>
                                            <div className="text-purple-600">NIC: {nic}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <h4 className="font-medium text-slate-700 mb-2">Lingual/Palatino</h4>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                {PUNTOS.map(punto => {
                                    const mg = datos[dienteSeleccionado]?.lingual?.margen_gingival?.[punto] || 0;
                                    const ps = datos[dienteSeleccionado]?.lingual?.profundidad_sondaje?.[punto] || 0;
                                    const nic = calcularNIC(mg, ps);
                                    return (
                                        <div key={punto} className="text-xs">
                                            <div className="font-medium text-slate-500 uppercase">{punto.charAt(0)}</div>
                                            <div className="text-blue-600">MG: {mg}</div>
                                            <div className="text-red-600">PS: {ps}</div>
                                            <div className="text-purple-600">NIC: {nic}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Instrucciones */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
                <strong>Instrucciones:</strong> Click izquierdo en los puntos azules (MG) o rojos (PS) para incrementar el valor.
                Click derecho para decrementar. Click en un diente para ver detalles y opciones adicionales.
            </div>
        </div>
    );
}

Periodontograma.propTypes = {
    patientId: PropTypes.string.isRequired
};
