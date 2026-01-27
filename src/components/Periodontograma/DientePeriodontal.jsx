import PropTypes from 'prop-types';
import {
    PUNTOS,
    mmAPixels,
    esBolsaPatologica,
    esMaxilar
} from './periodontogramaUtils';
import { getToothImage } from './teethImages';

// Configuración visual
const ANCHO_DIENTE = 55;
const ALTO_GRAFICO = 80;
const ALTO_DIENTE = 40;
// Línea 0: diferentes posiciones para maxilar y mandíbula
const LINEA_CERO_Y_SUPERIOR = 65; // Para dientes superiores (cerca de raíces)
const LINEA_CERO_Y_INFERIOR = 15; // Para dientes inferiores (cerca de coronas)
const ESCALA = 4;

/**
 * Input numérico para mediciones periodontales
 */
function InputMedicion({ valor, onChange, min, max, color, label }) {
    const handleChange = (e) => {
        const newValue = parseInt(e.target.value);
        if (!isNaN(newValue)) {
            const clampedValue = Math.max(min, Math.min(max, newValue));
            onChange(clampedValue);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            onChange(Math.min(max, valor + 1));
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            onChange(Math.max(min, valor - 1));
        }
    };

    const colorClasses = color === 'blue'
        ? 'border-blue-400 text-blue-600 focus:border-blue-500 focus:ring-blue-200'
        : 'border-red-400 text-red-600 focus:border-red-500 focus:ring-red-200';

    return (
        <input
            type="text"
            inputMode="numeric"
            value={valor}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            title={label}
            className={`w-5 h-5 text-[10px] text-center border rounded font-bold bg-white
                focus:outline-none focus:ring-1 ${colorClasses}`}
        />
    );
}

InputMedicion.propTypes = {
    valor: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    min: PropTypes.number,
    max: PropTypes.number,
    color: PropTypes.oneOf(['blue', 'red']),
    label: PropTypes.string
};

/**
 * Componente DientePeriodontal
 * Renderiza un diente con imagen PNG realista y gráfico de mediciones
 */
export default function DientePeriodontal({
    numero,
    datos,
    cara = 'vestibular',
    onChange,
    seleccionado = false,
    onSelect
}) {
    const datosCaraActual = datos?.[cara] || {
        margen_gingival: { mesial: 0, central: 0, distal: 0 },
        profundidad_sondaje: { mesial: 0, central: 0, distal: 0 },
        sangrado: { mesial: false, central: false, distal: false },
        placa: { mesial: false, central: false, distal: false }
    };

    const esArriba = esMaxilar(numero);
    const toothImage = getToothImage(numero);

    // Posiciones X de los puntos
    const posicionesX = {
        mesial: 8,
        central: ANCHO_DIENTE / 2,
        distal: ANCHO_DIENTE - 8
    };

    const getMG = (punto) => datosCaraActual.margen_gingival[punto] || 0;
    const getPS = (punto) => datosCaraActual.profundidad_sondaje[punto] || 0;

    // Línea base según arco dental
    const lineaCeroY = esArriba ? LINEA_CERO_Y_SUPERIOR : LINEA_CERO_Y_INFERIOR;

    // Posición Y para MG
    const valorAY_MG = (valor) => {
        if (esArriba) {
            return lineaCeroY - mmAPixels(valor, ESCALA);
        } else {
            return lineaCeroY + mmAPixels(valor, ESCALA);
        }
    };

    // Posición Y para PS (independiente de MG)
    const valorAY_PS = (valorPS) => {
        if (esArriba) {
            return lineaCeroY - mmAPixels(valorPS, ESCALA);
        } else {
            return lineaCeroY + mmAPixels(valorPS, ESCALA);
        }
    };

    // Puntos de MG
    const puntosMG = PUNTOS.map(punto => ({
        x: posicionesX[punto],
        y: valorAY_MG(getMG(punto)),
        valor: getMG(punto)
    }));

    // Puntos de PS
    const puntosPS = PUNTOS.map(punto => ({
        x: posicionesX[punto],
        y: valorAY_PS(getPS(punto)),
        valor: getPS(punto),
        esBolsa: esBolsaPatologica(getPS(punto))
    }));

    const generarPath = (puntos) => {
        if (puntos.length < 2) return '';
        return `M ${puntos[0].x} ${puntos[0].y} L ${puntos[1].x} ${puntos[1].y} L ${puntos[2].x} ${puntos[2].y}`;
    };

    const handleChangeMG = (punto, valor) => {
        onChange?.(numero, cara, 'margen_gingival', punto, valor);
    };

    const handleChangePS = (punto, valor) => {
        onChange?.(numero, cara, 'profundidad_sondaje', punto, valor);
    };

    const handleToggleSangrado = (punto) => {
        onChange?.(numero, cara, 'sangrado', punto, !datosCaraActual.sangrado[punto]);
    };

    const handleTogglePlaca = (punto) => {
        onChange?.(numero, cara, 'placa', punto, !datosCaraActual.placa[punto]);
    };

    const ausente = datos?.ausente;

    return (
        <div
            className={`flex flex-col items-center bg-white rounded border transition-all cursor-pointer
                ${seleccionado ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-slate-200 hover:border-slate-300'} 
                ${ausente ? 'opacity-40' : ''}`}
            onClick={() => onSelect?.(numero)}
            style={{ width: ANCHO_DIENTE + 6, minWidth: ANCHO_DIENTE + 6 }}
        >
            {/* Inputs arriba */}
            {!ausente && (
                <div className="flex flex-col gap-0.5 py-0.5 px-0.5 w-full">
                    <div className="flex justify-between w-full">
                        {PUNTOS.map(punto => (
                            <InputMedicion
                                key={`ps-${punto}`}
                                valor={getPS(punto)}
                                onChange={(v) => handleChangePS(punto, v)}
                                min={0}
                                max={15}
                                color="red"
                                label={`PS ${punto}`}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between w-full">
                        {PUNTOS.map(punto => (
                            <InputMedicion
                                key={`mg-${punto}`}
                                valor={getMG(punto)}
                                onChange={(v) => handleChangeMG(punto, v)}
                                min={-10}
                                max={10}
                                color="blue"
                                label={`MG ${punto}`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Gráfico SVG con imagen de diente de fondo */}
            <div className="relative" style={{ width: ANCHO_DIENTE, height: ALTO_GRAFICO }}>
                {/* Imagen del diente como fondo */}
                <img
                    src={toothImage}
                    alt={`Diente ${numero}`}
                    className="absolute inset-0 w-full h-full object-contain opacity-70 pointer-events-none"
                    style={{ filter: ausente ? 'grayscale(1)' : 'none' }}
                />

                {/* SVG de líneas y puntos superpuesto */}
                <svg
                    width={ANCHO_DIENTE}
                    height={ALTO_GRAFICO}
                    className="absolute inset-0"
                    style={{ pointerEvents: 'none' }}
                >
                    {/* Línea de referencia 0 */}
                    <line
                        x1="0" y1={lineaCeroY}
                        x2={ANCHO_DIENTE} y2={lineaCeroY}
                        stroke="#94a3b8"
                        strokeWidth="1"
                        strokeDasharray="3,3"
                    />

                    {!ausente && (
                        <>
                            {/* Línea MG (azul) */}
                            <path
                                d={generarPath(puntosMG)}
                                stroke="#3b82f6"
                                strokeWidth="2"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Línea PS (roja) */}
                            <path
                                d={generarPath(puntosPS)}
                                stroke="#ef4444"
                                strokeWidth="2"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Puntos MG */}
                            {puntosMG.map((punto, idx) => (
                                <circle
                                    key={`mg-${PUNTOS[idx]}`}
                                    cx={punto.x}
                                    cy={punto.y}
                                    r="4"
                                    fill="#3b82f6"
                                    stroke="#fff"
                                    strokeWidth="1.5"
                                />
                            ))}

                            {/* Puntos PS */}
                            {puntosPS.map((punto, idx) => (
                                <circle
                                    key={`ps-${PUNTOS[idx]}`}
                                    cx={punto.x}
                                    cy={punto.y}
                                    r="4"
                                    fill={punto.esBolsa ? '#dc2626' : '#ef4444'}
                                    stroke="#fff"
                                    strokeWidth="1.5"
                                />
                            ))}
                        </>
                    )}
                </svg>
            </div>

            {/* Indicadores de sangrado y placa */}
            {!ausente && (
                <div className="flex justify-between w-full px-1 py-0.5">
                    {PUNTOS.map(punto => (
                        <div key={punto} className="flex flex-col items-center gap-0.5">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleToggleSangrado(punto); }}
                                className={`w-2.5 h-2.5 rounded-full border transition-colors
                                    ${datosCaraActual.sangrado[punto]
                                        ? 'bg-red-500 border-red-600'
                                        : 'bg-white border-slate-300 hover:border-red-400'}`}
                                title={`Sangrado ${punto}`}
                            />
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleTogglePlaca(punto); }}
                                className={`w-2.5 h-2.5 rounded-sm border transition-colors
                                    ${datosCaraActual.placa[punto]
                                        ? 'bg-amber-400 border-amber-500'
                                        : 'bg-white border-slate-300 hover:border-amber-400'}`}
                                title={`Placa ${punto}`}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Número del diente */}
            <div className={`text-xs font-bold pb-0.5 ${ausente ? 'text-slate-400' : 'text-slate-700'}`}>
                {numero}
            </div>
        </div>
    );
}

DientePeriodontal.propTypes = {
    numero: PropTypes.number.isRequired,
    datos: PropTypes.object,
    cara: PropTypes.oneOf(['vestibular', 'lingual']),
    onChange: PropTypes.func,
    seleccionado: PropTypes.bool,
    onSelect: PropTypes.func
};
