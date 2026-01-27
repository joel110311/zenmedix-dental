/**
 * Utilidades para el Periodontograma
 * Contiene funciones auxiliares y constantes para la cartilla periodontal
 */

// Orden de los dientes por cuadrante (FDI)
export const DIENTES_MAXILAR_DERECHO = [18, 17, 16, 15, 14, 13, 12, 11];
export const DIENTES_MAXILAR_IZQUIERDO = [21, 22, 23, 24, 25, 26, 27, 28];
export const DIENTES_MANDIBULA_IZQUIERDO = [31, 32, 33, 34, 35, 36, 37, 38];
export const DIENTES_MANDIBULA_DERECHO = [48, 47, 46, 45, 44, 43, 42, 41];

export const TODOS_LOS_DIENTES = [
    ...DIENTES_MAXILAR_DERECHO,
    ...DIENTES_MAXILAR_IZQUIERDO,
    ...DIENTES_MANDIBULA_IZQUIERDO,
    ...DIENTES_MANDIBULA_DERECHO
];

// Constantes de medición
export const MG_MIN = -5;  // Recesión máxima
export const MG_MAX = 5;   // Hiperplasia máxima
export const PS_MIN = 0;   // Profundidad mínima
export const PS_MAX = 15;  // Profundidad máxima
export const UMBRAL_BOLSA_PATOLOGICA = 3; // Mayor a 3mm = bolsa

// Puntos de medición
export const PUNTOS = ['mesial', 'central', 'distal'];

/**
 * Calcula el Nivel de Inserción Clínica (NIC)
 * NIC = PS + MG (cuando MG es negativo/recesión)
 * NIC = PS - MG (cuando MG es positivo/hiperplasia)
 * @param {number} mg - Margen Gingival
 * @param {number} ps - Profundidad de Sondaje
 * @returns {number} NIC calculado
 */
export function calcularNIC(mg, ps) {
    // Si hay recesión (MG negativo), NIC = PS + |MG|
    // Si hay hiperplasia (MG positivo), NIC = PS - MG
    return ps - mg;
}

/**
 * Determina si un diente está en el maxilar (arriba)
 * @param {number} numero - Número del diente (FDI)
 * @returns {boolean}
 */
export function esMaxilar(numero) {
    return numero >= 11 && numero <= 28;
}

/**
 * Determina si un diente está en el lado derecho
 * @param {number} numero - Número del diente (FDI)
 * @returns {boolean}
 */
export function esLadoDerecho(numero) {
    const decena = Math.floor(numero / 10);
    return decena === 1 || decena === 4;
}

/**
 * Genera estructura de datos vacía para un diente
 * @returns {Object} Estructura de mediciones vacías
 */
export function generarDatosDienteVacio() {
    const crearMedicionesCara = () => ({
        margen_gingival: { mesial: 0, central: 0, distal: 0 },
        profundidad_sondaje: { mesial: 0, central: 0, distal: 0 },
        sangrado: { mesial: false, central: false, distal: false },
        placa: { mesial: false, central: false, distal: false }
    });

    return {
        vestibular: crearMedicionesCara(),
        lingual: crearMedicionesCara(),
        movilidad: 0,
        furcacion: 0,
        ausente: false
    };
}

/**
 * Genera estructura de datos vacía para todos los dientes
 * @returns {Object} Objeto con todos los dientes y sus mediciones vacías
 */
export function generarDatosVacios() {
    const datos = {};
    TODOS_LOS_DIENTES.forEach(numero => {
        datos[numero] = generarDatosDienteVacio();
    });
    return datos;
}

/**
 * Cicla el valor de Margen Gingival entre -5 y 5
 * @param {number} valorActual
 * @param {boolean} incrementar - true para incrementar, false para decrementar
 * @returns {number}
 */
export function ciclarMG(valorActual, incrementar = true) {
    if (incrementar) {
        return valorActual >= MG_MAX ? MG_MIN : valorActual + 1;
    }
    return valorActual <= MG_MIN ? MG_MAX : valorActual - 1;
}

/**
 * Cicla el valor de Profundidad de Sondaje entre 0 y 15
 * @param {number} valorActual
 * @param {boolean} incrementar
 * @returns {number}
 */
export function ciclarPS(valorActual, incrementar = true) {
    if (incrementar) {
        return valorActual >= PS_MAX ? PS_MIN : valorActual + 1;
    }
    return valorActual <= PS_MIN ? PS_MAX : valorActual - 1;
}

/**
 * Determina si hay bolsa patológica
 * @param {number} ps - Profundidad de Sondaje
 * @returns {boolean}
 */
export function esBolsaPatologica(ps) {
    return ps > UMBRAL_BOLSA_PATOLOGICA;
}

/**
 * Obtiene el color para un valor de PS
 * @param {number} ps
 * @returns {string} Color CSS
 */
export function colorPorPS(ps) {
    if (ps <= 3) return '#22c55e'; // Verde - normal
    if (ps <= 5) return '#eab308'; // Amarillo - leve
    if (ps <= 7) return '#f97316'; // Naranja - moderado
    return '#ef4444'; // Rojo - severo
}

/**
 * Convierte mm a pixels para renderizado SVG
 * @param {number} mm
 * @param {number} escala - pixels por mm
 * @returns {number}
 */
export function mmAPixels(mm, escala = 4) {
    return mm * escala;
}
