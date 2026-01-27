import { useState } from 'react';
import PropTypes from 'prop-types';
import {
    PUNTOS,
    mmAPixels,
    esBolsaPatologica,
    esMaxilar
} from './periodontogramaUtils';
import { getToothPath } from './teethPaths';

// Configuración visual
const ANCHO_DIENTE = 70;
const ALTO_GRAFICO = 80;
const ALTO_DIENTE = 35;
// La línea 0 está ligeramente arriba del centro (más espacio para raíces)
const LINEA_CERO_Y = 45;
const ESCALA = 4;

// El path SVG original tiene ancho ~40 (de X=5 a X=45) y alto ~80
const PATH_ANCHO_ORIGINAL = 40;
const PATH_ALTO_ORIGINAL = 80;

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
            className={`w-6 h-6 text-xs text-center border-2 rounded font-bold bg-white
                focus:outline-none focus:ring-2 ${colorClasses}`}
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
    const toothPath = getToothPath(numero);

    // Posiciones X de los puntos
    const posicionesX = {
        mesial: 12,
        central: ANCHO_DIENTE / 2,
        distal: ANCHO_DIENTE - 12
    };

    const getMG = (punto) => datosCaraActual.margen_gingival[punto] || 0;
    const getPS = (punto) => datosCaraActual.profundidad_sondaje[punto] || 0;

    // Posición Y para MG
    const valorAY_MG = (valor) => {
        if (esArriba) {
            return LINEA_CERO_Y - mmAPixels(valor, ESCALA);
        } else {
            return LINEA_CERO_Y + mmAPixels(valor, ESCALA);
        }
    };

    // Posición Y para PS (independiente de MG)
    const valorAY_PS = (valorPS) => {
        if (esArriba) {
            return LINEA_CERO_Y - mmAPixels(valorPS, ESCALA);
        } else {
            return LINEA_CERO_Y + mmAPixels(valorPS, ESCALA);
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

    // Cálculo para centrar el path del diente en el gráfico
    // Los paths originales van de X=5 a X=45 (centro en X=25)
    // Queremos que el centro del path quede en ANCHO_DIENTE/2
    const scaleGrafico = (ANCHO_DIENTE - 10) / PATH_ANCHO_ORIGINAL; // ~1.5
    const offsetXGrafico = (ANCHO_DIENTE / 2) - 25 * scaleGrafico; // Centrar

    // Para el icono de abajo (más pequeño)
    const scaleIcono = 0.7;
    const iconoAncho = PATH_ANCHO_ORIGINAL * scaleIcono;
    const offsetXIcono = (ANCHO_DIENTE - iconoAncho) / 2 - 5 * scaleIcono;
    const scaleYIcono = 0.35;

    return (
        <div
            className={`flex flex-col items-center bg-white rounded-lg border-2 transition-all cursor-pointer
                ${seleccionado ? 'border-blue-500 shadow-lg' : 'border-slate-200 hover:border-slate-300'} 
                ${ausente ? 'opacity-40' : ''}`}
            onClick={() => onSelect?.(numero)}
            style={{ width: ANCHO_DIENTE + 8, minWidth: ANCHO_DIENTE + 8 }}
        >
            {/* Inputs arriba */}
            {!ausente && (
                <div className="flex flex-col gap-0.5 py-1 px-1 w-full">
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

            {/* Gráfico SVG */}
            <svg
                width={ANCHO_DIENTE}
                height={ALTO_GRAFICO}
                className="block"
                style={{ pointerEvents: 'none' }}
            >
                <rect x="0" y="0" width={ANCHO_DIENTE} height={ALTO_GRAFICO} fill="#ffffff" />

                {/* Silueta del diente - CENTRADA */}
                <g
                    transform={`translate(${offsetXGrafico}, 0) scale(${scaleGrafico}, ${ALTO_GRAFICO / PATH_ALTO_ORIGINAL})`}
                    opacity="0.15"
                >
                    <path d={toothPath} fill="#475569" />
                </g>

                {/* Líneas de referencia */}
                {[-8, -6, -4, -2, 0, 2, 4, 6].map(mm => {
                    const y = esArriba
                        ? LINEA_CERO_Y - mm * ESCALA
                        : LINEA_CERO_Y + mm * ESCALA;
                    if (y < 2 || y > ALTO_GRAFICO - 2) return null;
                    return (
                        <line
                            key={mm}
                            x1="0" y1={y}
                            x2={ANCHO_DIENTE} y2={y}
                            stroke={mm === 0 ? '#94a3b8' : '#e2e8f0'}
                            strokeWidth={mm === 0 ? 2 : 0.5}
                            strokeDasharray={mm === 0 ? 'none' : '2,2'}
                        />
                    );
                })}

                {!ausente && (
                    <>
                        {/* Línea MG (azul) */}
                        <path
                            d={generarPath(puntosMG)}
                            stroke="#3b82f6"
                            strokeWidth="2.5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Línea PS (roja) */}
                        <path
                            d={generarPath(puntosPS)}
                            stroke="#ef4444"
                            strokeWidth="2.5"
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
                                r="5"
                                fill="#3b82f6"
                                stroke="#fff"
                                strokeWidth="2"
                            />
                        ))}

                        {/* Puntos PS */}
                        {puntosPS.map((punto, idx) => (
                            <circle
                                key={`ps-${PUNTOS[idx]}`}
                                cx={punto.x}
                                cy={punto.y}
                                r="5"
                                fill={punto.esBolsa ? '#dc2626' : '#ef4444'}
                                stroke="#fff"
                                strokeWidth="2"
                            />
                        ))}
                    </>
                )}
            </svg>

            {/* Indicadores de sangrado y placa */}
            {!ausente && (
                <div className="flex justify-between w-full px-1.5 py-0.5">
                    {PUNTOS.map(punto => (
                        <div key={punto} className="flex flex-col items-center gap-0.5">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleToggleSangrado(punto); }}
                                className={`w-3 h-3 rounded-full border-2 transition-colors
                                    ${datosCaraActual.sangrado[punto]
                                        ? 'bg-red-500 border-red-600'
                                        : 'bg-white border-slate-300 hover:border-red-400'}`}
                                title={`Sangrado ${punto}`}
                            />
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleTogglePlaca(punto); }}
                                className={`w-3 h-3 rounded-sm border-2 transition-colors
                                    ${datosCaraActual.placa[punto]
                                        ? 'bg-amber-400 border-amber-500'
                                        : 'bg-white border-slate-300 hover:border-amber-400'}`}
                                title={`Placa ${punto}`}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Icono del diente - CENTRADO */}
            <svg width={ANCHO_DIENTE} height={ALTO_DIENTE} className="block">
                <g transform={`translate(${offsetXIcono}, 0) scale(${scaleIcono}, ${scaleYIcono})`}>
                    <path
                        d={toothPath}
                        fill={ausente ? '#e2e8f0' : '#f1f5f9'}
                        stroke={ausente ? '#94a3b8' : '#64748b'}
                        strokeWidth="2"
                    />
                </g>
                {ausente && (
                    <line x1="15" y1="5" x2={ANCHO_DIENTE - 15} y2={ALTO_DIENTE - 5} stroke="#94a3b8" strokeWidth="2" />
                )}
            </svg>

            {/* Número del diente */}
            <div className={`text-xs font-bold pb-1 ${ausente ? 'text-slate-400' : 'text-slate-700'}`}>
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
