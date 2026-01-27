/**
 * Importa la imagen PNG del diente correspondiente al número
 * Las imágenes vienen del repositorio alejo8591/periodontal-chart
 */

// Importar todas las imágenes de dientes (32 en total)
import tooth11 from './teeth/11.png';
import tooth12 from './teeth/12.png';
import tooth13 from './teeth/13.png';
import tooth14 from './teeth/14.png';
import tooth15 from './teeth/15.png';
import tooth16 from './teeth/16.png';
import tooth17 from './teeth/17.png';
import tooth18 from './teeth/18.png';

import tooth21 from './teeth/21.png';
import tooth22 from './teeth/22.png';
import tooth23 from './teeth/23.png';
import tooth24 from './teeth/24.png';
import tooth25 from './teeth/25.png';
import tooth26 from './teeth/26.png';
import tooth27 from './teeth/27.png';
import tooth28 from './teeth/28.png';

import tooth31 from './teeth/31.png';
import tooth32 from './teeth/32.png';
import tooth33 from './teeth/33.png';
import tooth34 from './teeth/34.png';
import tooth35 from './teeth/35.png';
import tooth36 from './teeth/36.png';
import tooth37 from './teeth/37.png';
import tooth38 from './teeth/38.png';

import tooth41 from './teeth/41.png';
import tooth42 from './teeth/42.png';
import tooth43 from './teeth/43.png';
import tooth44 from './teeth/44.png';
import tooth45 from './teeth/45.png';
import tooth46 from './teeth/46.png';
import tooth47 from './teeth/47.png';
import tooth48 from './teeth/48.png';

// Mapa de imágenes por número de diente
const toothImages = {
    11: tooth11, 12: tooth12, 13: tooth13, 14: tooth14,
    15: tooth15, 16: tooth16, 17: tooth17, 18: tooth18,
    21: tooth21, 22: tooth22, 23: tooth23, 24: tooth24,
    25: tooth25, 26: tooth26, 27: tooth27, 28: tooth28,
    31: tooth31, 32: tooth32, 33: tooth33, 34: tooth34,
    35: tooth35, 36: tooth36, 37: tooth37, 38: tooth38,
    41: tooth41, 42: tooth42, 43: tooth43, 44: tooth44,
    45: tooth45, 46: tooth46, 47: tooth47, 48: tooth48,
};

/**
 * Obtiene la imagen PNG del diente según su número
 * @param {number} numero - Número del diente (11-18, 21-28, 31-38, 41-48)
 * @returns {string} Ruta a la imagen del diente
 */
export const getToothImage = (numero) => {
    const n = parseInt(numero);
    return toothImages[n] || tooth11; // Fallback al diente 11
};
