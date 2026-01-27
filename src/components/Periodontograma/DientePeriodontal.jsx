import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import {
    PUNTOS,
    mmAPixels,
    esBolsaPatologica,
    esMaxilar
} from './periodontogramaUtils';
import { getToothPath } from './teethPaths';

// Configuración visual mejorada
const ANCHO_DIENTE = 60; // Más ancho para inputs
const ALTO_INPUTS = 48;  // Área para los inputs numéricos
const ALTO_GRAFICO = 100; // Área del gráfico más grande
const ALTO_DIENTE = 35;  // Área del icono del diente
const LINEA_CERO_Y = 50; // Posición de la línea 0mm (centrada)
const ESCALA = 5; // pixels por mm (más grande para mejor visibilidad)

/**
 * Input numérico pequeño para mediciones periodontales
 */
function InputMedicion({ valor, onChange, min, max, color, label }) {
    const handleChange = (e) => {
        const newValue = parseInt(e.target.value) || 0;
        const clampedValue = Math.max(min, Math.min(max, newValue));
        onChange(clampedValue);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        const newValue = Math.max(min, Math.min(max, valor + delta));
        onChange(newValue);
    };

    return (
        <input
            type="number"
            value={valor}
            onChange={handleChange}
            onWheel={handleWheel}
            min={min}
            max={max}
            title={label}
            className={`w-5 h-5 text-[10px] text-center border rounded font-bold p-0 
                focus:outline-none focus:ring-1 focus:ring-offset-0
                ${color === 'blue'
                    ? 'border-blue-400 text-blue-700 focus:ring-blue-400 bg-blue-50'
                    : 'border-red-400 text-red-700 focus:ring-red-400 bg-red-50'
                }`}
            style={{
                MozAppearance: 'textfield',
                WebkitAppearance: 'none'
            }}
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
 * Componente DientePeriodontal Mejorado
 * Renderiza un diente individual con inputs numéricos y gráfico SVG
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

    // Posiciones X de los puntos (mesial, central, distal)
    const posicionesX = {
        mesial: 10,
        central: ANCHO_DIENTE / 2,
        distal: ANCHO_DIENTE - 10
    };

    // Convierte valor de medición a posición Y en el gráfico
    const valorAY = (valor) => {
        if (esArriba) {
            return LINEA_CERO_Y - mmAPixels(valor, ESCALA);
        } else {
            return LINEA_CERO_Y + mmAPixels(valor, ESCALA);
        }
    };

    // Calcula posiciones de los puntos MG
    const puntosMG = PUNTOS.map(punto => ({
        x: posicionesX[punto],
        y: valorAY(datosCaraActual.margen_gingival[punto]),
        valor: datosCaraActual.margen_gingival[punto]
    }));

    // Calcula posiciones de los puntos PS (desde el MG hacia adentro)
    const puntosPS = PUNTOS.map((punto, idx) => {
        const mg = datosCaraActual.margen_gingival[punto];
        const ps = datosCaraActual.profundidad_sondaje[punto];
        const yMg = puntosMG[idx].y;
        const yPs = esArriba ? yMg - mmAPixels(ps, ESCALA) : yMg + mmAPixels(ps, ESCALA);
        return {
            x: posicionesX[punto],
            y: yPs,
            valor: ps,
            esBolsa: esBolsaPatologica(ps)
        };
    });

    // Genera path para línea entre puntos
    const generarPath = (puntos) => {
        if (puntos.length < 2) return '';
        return `M ${puntos[0].x} ${puntos[0].y} L ${puntos[1].x} ${puntos[1].y} L ${puntos[2].x} ${puntos[2].y}`;
    };

    // Genera path para área de bolsa patológica
    const generarAreaBolsa = () => {
        const tieneBolsa = puntosPS.some(p => p.esBolsa);
        if (!tieneBolsa) return '';

        const todosLosPuntos = [...puntosMG, ...puntosPS.slice().reverse()];
        return `M ${todosLosPuntos[0].x} ${todosLosPuntos[0].y} ` +
            todosLosPuntos.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z';
    };

    // Handlers de cambio
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
            className={`flex flex-col items-center bg-white rounded-lg border transition-all
                ${seleccionado ? 'ring-2 ring-blue-500 border-blue-300' : 'border-slate-200 hover:border-slate-300'}
                ${ausente ? 'opacity-50' : ''}`}
            onClick={() => onSelect?.(numero)}
            style={{ width: ANCHO_DIENTE + 4 }}
        >
            {/* Inputs PS (arriba para maxilar, abajo para mandíbula) */}
            {esArriba && !ausente && (
                <div className="flex justify-between w-full px-0.5 py-1 bg-red-50/50 rounded-t-lg">
                    {PUNTOS.map(punto => (
                        <InputMedicion
                            key={`ps-${punto}`}
                            valor={datosCaraActual.profundidad_sondaje[punto]}
                            onChange={(v) => handleChangePS(punto, v)}
                            min={0}
                            max={15}
                            color="red"
                            label={`PS ${punto}`}
                        />
                    ))}
                </div>
            )}

            {/* Inputs MG */}
            {!ausente && (
                <div className="flex justify-between w-full px-0.5 py-1 bg-blue-50/50">
                    {PUNTOS.map(punto => (
                        <InputMedicion
                            key={`mg-${punto}`}
                            valor={datosCaraActual.margen_gingival[punto]}
                            onChange={(v) => handleChangeMG(punto, v)}
                            min={-10}
                            max={10}
                            color="blue"
                            label={`MG ${punto}`}
                        />
                    ))}
                </div>
            )}

            {/* Gráfico SVG */}
            <svg
                width={ANCHO_DIENTE}
                height={ALTO_GRAFICO}
                className="block"
            >
                {/* Fondo con pointer-events desactivados */}
                <g pointerEvents="none">
                    {/* Fondo blanco */}
                    <rect
                        x="0" y="0"
                        width={ANCHO_DIENTE}
                        height={ALTO_GRAFICO}
                        fill={ausente ? '#f9fafb' : '#ffffff'}
                    />

                    {/* Forma anatómica de fondo */}
                    <g transform={`translate(${ANCHO_DIENTE * 0.05}, ${esArriba ? 5 : 0}) scale(0.9, 0.9)`} opacity="0.15">
                        <path d={toothPath} fill="#475569" />
                    </g>

                    {/* Líneas de cuadrícula */}
                    {[-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10].map(mm => {
                        const y = valorAY(mm);
                        if (y < 0 || y > ALTO_GRAFICO) return null;
                        const isZero = mm === 0;
                        return (
                            <line
                                key={mm}
                                x1="0" y1={y}
                                x2={ANCHO_DIENTE} y2={y}
                                stroke={isZero ? '#64748b' : '#e2e8f0'}
                                strokeWidth={isZero ? 1.5 : 0.5}
                                strokeDasharray={isZero ? 'none' : '3,3'}
                            />
                        );
                    })}
                </g>

                {!ausente && (
                    <>
                        {/* Área de bolsa patológica */}
                        <path
                            d={generarAreaBolsa()}
                            fill="rgba(239, 68, 68, 0.15)"
                            stroke="none"
                            pointerEvents="none"
                        />

                        {/* Línea MG (azul) */}
                        <path
                            d={generarPath(puntosMG)}
                            stroke="#3b82f6"
                            strokeWidth="2.5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            pointerEvents="none"
                        />

                        {/* Línea PS (roja) */}
                        <path
                            d={generarPath(puntosPS)}
                            stroke="#ef4444"
                            strokeWidth="2.5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            pointerEvents="none"
                        />

                        {/* Puntos MG (azules) - más grandes y visibles */}
                        {puntosMG.map((punto, idx) => (
                            <circle
                                key={`mg-${PUNTOS[idx]}`}
                                cx={punto.x}
                                cy={punto.y}
                                r="6"
                                fill="#3b82f6"
                                stroke="#ffffff"
                                strokeWidth="2"
                            >
                                <title>MG {PUNTOS[idx]}: {punto.valor}mm</title>
                            </circle>
                        ))}

                        {/* Puntos PS (rojos) - más grandes y visibles */}
                        {puntosPS.map((punto, idx) => (
                            <circle
                                key={`ps-${PUNTOS[idx]}`}
                                cx={punto.x}
                                cy={punto.y}
                                r="6"
                                fill={punto.esBolsa ? '#dc2626' : '#ef4444'}
                                stroke="#ffffff"
                                strokeWidth="2"
                            >
                                <title>PS {PUNTOS[idx]}: {punto.valor}mm</title>
                            </circle>
                        ))}
                    </>
                )}
            </svg>

            {/* Inputs PS (abajo para mandíbula) */}
            {!esArriba && !ausente && (
                <div className="flex justify-between w-full px-0.5 py-1 bg-red-50/50">
                    {PUNTOS.map(punto => (
                        <InputMedicion
                            key={`ps-${punto}`}
                            valor={datosCaraActual.profundidad_sondaje[punto]}
                            onChange={(v) => handleChangePS(punto, v)}
                            min={0}
                            max={15}
                            color="red"
                            label={`PS ${punto}`}
                        />
                    ))}
                </div>
            )}

            {/* Indicadores de sangrado y placa */}
            {!ausente && (
                <div className="flex justify-between w-full px-1 py-0.5 gap-0.5">
                    {PUNTOS.map(punto => (
                        <div key={punto} className="flex flex-col items-center gap-0.5">
                            {/* Toggle Sangrado */}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleToggleSangrado(punto); }}
                                className={`w-3 h-3 rounded-full border transition-colors
                                    ${datosCaraActual.sangrado[punto]
                                        ? 'bg-red-500 border-red-600'
                                        : 'bg-white border-slate-300 hover:border-red-300'}`}
                                title={`Sangrado ${punto}: ${datosCaraActual.sangrado[punto] ? 'Sí' : 'No'}`}
                            />
                            {/* Toggle Placa */}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleTogglePlaca(punto); }}
                                className={`w-3 h-3 rounded-sm border transition-colors
                                    ${datosCaraActual.placa[punto]
                                        ? 'bg-amber-400 border-amber-500'
                                        : 'bg-white border-slate-300 hover:border-amber-300'}`}
                                title={`Placa ${punto}: ${datosCaraActual.placa[punto] ? 'Sí' : 'No'}`}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Icono del diente */}
            <svg width={ANCHO_DIENTE} height={ALTO_DIENTE} className="block">
                <g transform={`translate(${ANCHO_DIENTE * 0.05}, 0) scale(0.9, 0.35)`}>
                    <path
                        d={toothPath}
                        fill={ausente ? '#e2e8f0' : '#f1f5f9'}
                        stroke={ausente ? '#94a3b8' : '#64748b'}
                        strokeWidth="2"
                    />
                </g>
                {ausente && (
                    <line
                        x1="10" y1="5"
                        x2={ANCHO_DIENTE - 10} y2={ALTO_DIENTE - 5}
                        stroke="#94a3b8"
                        strokeWidth="2"
                    />
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
