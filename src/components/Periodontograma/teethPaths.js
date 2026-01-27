/**
 * Rutas SVG para las formas de los dientes
 * Basado en formas anatómicas estándar (Molares, Premolares, Caninos, Incisivos)
 */

// Rutas genéricas reutilizables (simplificadas pero anatómicas)
// Coordenadas normalizadas para un viewBox aproximado de 50x80

// Molares Superiores (3 raíces)
const PATH_MOLAR_SUP = "M5,25 Q5,10 15,5 Q25,0 35,5 Q45,10 45,25 L45,45 Q45,55 35,65 L30,75 L25,65 L20,75 L15,65 Q5,55 5,45 Z";
// Premolares Superiores (2 raíces o 1 ancha)
const PATH_PREMOLAR_SUP = "M10,25 Q10,10 25,5 Q40,10 40,25 L40,45 Q40,55 32,65 L25,75 L18,65 Q10,55 10,45 Z";
// Caninos/Incisivos Superiores (1 raíz cónica)
const PATH_ANTERIOR_SUP = "M12,25 Q12,10 25,5 Q38,10 38,25 L38,45 Q38,60 25,80 Q12,60 12,45 Z";

// Molares Inferiores (2 raíces separadas)
const PATH_MOLAR_INF = "M5,55 Q5,70 15,75 Q25,80 35,75 Q45,70 45,55 L45,35 Q45,25 40,15 L35,5 L30,15 L20,15 L15,5 L10,15 Q5,25 5,35 Z";
// Premolares Inferiores (1 raíz)
const PATH_PREMOLAR_INF = "M10,55 Q10,70 25,75 Q40,70 40,55 L40,35 Q40,25 32,15 L25,5 L18,15 Q10,25 10,35 Z";
// Caninos/Incisivos Inferiores (1 raíz delgada)
const PATH_ANTERIOR_INF = "M15,55 Q15,70 25,75 Q35,70 35,55 L35,35 Q35,20 25,5 Q15,20 15,35 Z";


export const getToothPath = (numero) => {
    // Convertir a número por si viene como string
    const n = parseInt(numero);

    // Molares Superiores (18, 17, 16, 26, 27, 28)
    if ([18, 17, 16, 26, 27, 28].includes(n)) return PATH_MOLAR_SUP;

    // Premolares Superiores (15, 14, 24, 25)
    if ([15, 14, 24, 25].includes(n)) return PATH_PREMOLAR_SUP;

    // Anteriores Superiores (13, 12, 11, 21, 22, 23)
    if ([13, 12, 11, 21, 22, 23].includes(n)) return PATH_ANTERIOR_SUP;

    // Molares Inferiores (48, 47, 46, 36, 37, 38)
    if ([48, 47, 46, 36, 37, 38].includes(n)) return PATH_MOLAR_INF;

    // Premolares Inferiores (45, 44, 34, 35)
    if ([45, 44, 34, 35].includes(n)) return PATH_PREMOLAR_INF;

    // Anteriores Inferiores (43, 42, 41, 31, 32, 33)
    if ([43, 42, 41, 31, 32, 33].includes(n)) return PATH_ANTERIOR_INF;

    // Temporal fallback
    return PATH_ANTERIOR_SUP;
};
