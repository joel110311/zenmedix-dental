import { useState } from 'react';
import PropTypes from 'prop-types';
import {
    PUNTOS,
    mmAPixels,
    esBolsaPatologica,
    calcularNIC,
    ciclarMG,
    ciclarPS,
    esMaxilar
} from './periodontogramaUtils';

// Configuración visual
const ANCHO_DIENTE = 50;
const ALTO_GRAFICO = 80; // Área del gráfico de líneas
const ALTO_DIENTE = 30;  // Área del icono del diente
const LINEA_CERO_Y = 40; // Posición de la línea 0mm
const ESCALA = 4; // pixels por mm

/**
 * Componente DientePeriodontal
 * Renderiza un diente individual con sus mediciones periodontales en SVG
 */
export default function DientePeriodontal({
    numero,
    datos,
    cara = 'vestibular',
    onChange,
    seleccionado = false,
    onSelect
}) {
    const [modoEdicion, setModoEdicion] = useState(null); // 'mg' | 'ps' | null

    const datosCaraActual = datos?.[cara] || {
        margen_gingival: { mesial: 0, central: 0, distal: 0 },
        profundidad_sondaje: { mesial: 0, central: 0, distal: 0 },
        sangrado: { mesial: false, central: false, distal: false },
        placa: { mesial: false, central: false, distal: false }
    };

    const esArriba = esMaxilar(numero);

    // Posiciones X de los puntos (mesial, central, distal)
    const posicionesX = {
        mesial: 8,
        central: ANCHO_DIENTE / 2,
        distal: ANCHO_DIENTE - 8
    };

    // Convierte valor de medición a posición Y en el gráfico
    const valorAY = (valor, tipo) => {
        if (esArriba) {
            // Maxilar: 0 está abajo, valores positivos suben
            if (tipo === 'mg') {
                return LINEA_CERO_Y - mmAPixels(valor, ESCALA);
            }
            // PS: se mide desde el margen gingival hacia arriba
            return LINEA_CERO_Y - mmAPixels(valor, ESCALA);
        } else {
            // Mandíbula: 0 está arriba, valores positivos bajan
            if (tipo === 'mg') {
                return LINEA_CERO_Y + mmAPixels(valor, ESCALA);
            }
            return LINEA_CERO_Y + mmAPixels(valor, ESCALA);
        }
    };

    // Genera puntos para la línea del Margen Gingival (azul)
    const puntosMG = PUNTOS.map(punto => ({
        x: posicionesX[punto],
        y: valorAY(datosCaraActual.margen_gingival[punto], 'mg'),
        valor: datosCaraActual.margen_gingival[punto]
    }));

    // Genera puntos para la línea de Profundidad de Sondaje (roja)
    // PS se mide desde el MG, así que la posición es MG + PS
    const puntosPS = PUNTOS.map((punto, idx) => {
        const mg = datosCaraActual.margen_gingival[punto];
        const ps = datosCaraActual.profundidad_sondaje[punto];
        // La línea roja va desde el margen gingival hacia adentro del tejido
        const yMg = puntosMG[idx].y;
        const yPs = esArriba ? yMg - mmAPixels(ps, ESCALA) : yMg + mmAPixels(ps, ESCALA);
        return {
            x: posicionesX[punto],
            y: yPs,
            valor: ps,
            esBolsa: esBolsaPatologica(ps)
        };
    });

    // Maneja click en punto de medición
    const handleClickPunto = (punto, tipo, e) => {
        e.stopPropagation();
        const incrementar = e.button !== 2; // Click derecho decrementa

        if (tipo === 'mg') {
            const nuevoValor = ciclarMG(datosCaraActual.margen_gingival[punto], incrementar);
            onChange?.(numero, cara, 'margen_gingival', punto, nuevoValor);
        } else {
            const nuevoValor = ciclarPS(datosCaraActual.profundidad_sondaje[punto], incrementar);
            onChange?.(numero, cara, 'profundidad_sondaje', punto, nuevoValor);
        }
    };

    // Toggle sangrado
    const handleToggleSangrado = (punto, e) => {
        e.stopPropagation();
        onChange?.(numero, cara, 'sangrado', punto, !datosCaraActual.sangrado[punto]);
    };

    // Toggle placa
    const handleTogglePlaca = (punto, e) => {
        e.stopPropagation();
        onChange?.(numero, cara, 'placa', punto, !datosCaraActual.placa[punto]);
    };

    // Genera path para línea suave entre puntos
    const generarPath = (puntos) => {
        if (puntos.length < 2) return '';
        return `M ${puntos[0].x} ${puntos[0].y} L ${puntos[1].x} ${puntos[1].y} L ${puntos[2].x} ${puntos[2].y}`;
    };

    // Genera path para área de bolsa patológica
    const generarAreaBolsa = () => {
        const areas = [];
        for (let i = 0; i < PUNTOS.length; i++) {
            if (puntosPS[i].esBolsa) {
                areas.push({
                    mg: puntosMG[i],
                    ps: puntosPS[i]
                });
            }
        }
        if (areas.length === 0) return null;

        // Crear polígono entre MG y PS donde hay bolsa
        const pathPoints = [];
        const psMayorA3 = puntosPS.filter(p => p.esBolsa);
        if (psMayorA3.length === 0) return null;

        // Encontrar el área cerrada entre las líneas
        // Simplificación: área entre todos los puntos donde PS > 3
        const todosLosPuntos = [...puntosMG, ...puntosPS.slice().reverse()];
        return `M ${todosLosPuntos[0].x} ${todosLosPuntos[0].y} ` +
            todosLosPuntos.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z';
    };

    const ausente = datos?.ausente;

    return (
        <svg
            width={ANCHO_DIENTE}
            height={ALTO_GRAFICO + ALTO_DIENTE + 20}
            className={`cursor-pointer transition-all ${seleccionado ? 'ring-2 ring-blue-500 rounded' : ''}`}
            onClick={() => onSelect?.(numero)}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Fondo */}
            <rect
                x="0" y="0"
                width={ANCHO_DIENTE}
                height={ALTO_GRAFICO}
                fill={ausente ? '#f3f4f6' : '#ffffff'}
                stroke="#e5e7eb"
                strokeWidth="1"
            />

            {/* Líneas de cuadrícula (cada 2mm) */}
            {[...Array(8)].map((_, i) => {
                const y = esArriba ? LINEA_CERO_Y - (i * 2 * ESCALA) : LINEA_CERO_Y + (i * 2 * ESCALA);
                if (y < 0 || y > ALTO_GRAFICO) return null;
                return (
                    <line
                        key={i}
                        x1="0" y1={y}
                        x2={ANCHO_DIENTE} y2={y}
                        stroke="#e5e7eb"
                        strokeWidth={i === 0 ? 1.5 : 0.5}
                        strokeDasharray={i === 0 ? 'none' : '2,2'}
                    />
                );
            })}

            {/* Línea 0 (más gruesa) */}
            <line
                x1="0" y1={LINEA_CERO_Y}
                x2={ANCHO_DIENTE} y2={LINEA_CERO_Y}
                stroke="#94a3b8"
                strokeWidth="2"
            />

            {!ausente && (
                <>
                    {/* Área de bolsa patológica (sombreado rojo) */}
                    <path
                        d={generarAreaBolsa() || ''}
                        fill="rgba(239, 68, 68, 0.2)"
                        stroke="none"
                    />

                    {/* Línea de Margen Gingival (azul) */}
                    <path
                        d={generarPath(puntosMG)}
                        stroke="#3b82f6"
                        strokeWidth="2"
                        fill="none"
                    />

                    {/* Línea de Profundidad de Sondaje (roja) */}
                    <path
                        d={generarPath(puntosPS)}
                        stroke="#ef4444"
                        strokeWidth="2"
                        fill="none"
                    />

                    {/* Puntos interactivos para MG */}
                    {puntosMG.map((punto, idx) => (
                        <circle
                            key={`mg-${PUNTOS[idx]}`}
                            cx={punto.x}
                            cy={punto.y}
                            r="5"
                            fill="#3b82f6"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            className="cursor-pointer hover:r-6 transition-all"
                            onClick={(e) => handleClickPunto(PUNTOS[idx], 'mg', e)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                handleClickPunto(PUNTOS[idx], 'mg', { ...e, button: 2 });
                            }}
                        >
                            <title>MG {PUNTOS[idx]}: {punto.valor}mm (Click: +1, Derecho: -1)</title>
                        </circle>
                    ))}

                    {/* Puntos interactivos para PS */}
                    {puntosPS.map((punto, idx) => (
                        <circle
                            key={`ps-${PUNTOS[idx]}`}
                            cx={punto.x}
                            cy={punto.y}
                            r="5"
                            fill={punto.esBolsa ? '#ef4444' : '#f87171'}
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            className="cursor-pointer hover:r-6 transition-all"
                            onClick={(e) => handleClickPunto(PUNTOS[idx], 'ps', e)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                handleClickPunto(PUNTOS[idx], 'ps', { ...e, button: 2 });
                            }}
                        >
                            <title>PS {PUNTOS[idx]}: {punto.valor}mm (Click: +1, Derecho: -1)</title>
                        </circle>
                    ))}

                    {/* Indicadores de sangrado */}
                    {PUNTOS.map((punto, idx) => (
                        datosCaraActual.sangrado[punto] && (
                            <circle
                                key={`sangrado-${punto}`}
                                cx={posicionesX[punto]}
                                cy={ALTO_GRAFICO + 5}
                                r="4"
                                fill="#dc2626"
                                className="cursor-pointer"
                                onClick={(e) => handleToggleSangrado(punto, e)}
                            >
                                <title>Sangrado {punto}</title>
                            </circle>
                        )
                    ))}

                    {/* Indicadores de placa */}
                    {PUNTOS.map((punto, idx) => (
                        datosCaraActual.placa[punto] && (
                            <rect
                                key={`placa-${punto}`}
                                x={posicionesX[punto] - 4}
                                y={ALTO_GRAFICO + 12}
                                width="8"
                                height="4"
                                fill="#facc15"
                                className="cursor-pointer"
                                onClick={(e) => handleTogglePlaca(punto, e)}
                            >
                                <title>Placa {punto}</title>
                            </rect>
                        )
                    ))}
                </>
            )}

            {/* Número del diente */}
            <text
                x={ANCHO_DIENTE / 2}
                y={ALTO_GRAFICO + ALTO_DIENTE + 10}
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill={ausente ? '#9ca3af' : '#1e293b'}
            >
                {numero}
            </text>

            {/* Icono del diente simplificado */}
            <rect
                x="10"
                y={ALTO_GRAFICO + 18}
                width={ANCHO_DIENTE - 20}
                height={ALTO_DIENTE - 10}
                rx="3"
                fill={ausente ? '#d1d5db' : '#f1f5f9'}
                stroke={ausente ? '#9ca3af' : '#64748b'}
                strokeWidth="1"
            />

            {ausente && (
                <line
                    x1="15" y1={ALTO_GRAFICO + 20}
                    x2={ANCHO_DIENTE - 15} y2={ALTO_GRAFICO + ALTO_DIENTE + 5}
                    stroke="#9ca3af"
                    strokeWidth="2"
                />
            )}
        </svg>
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
