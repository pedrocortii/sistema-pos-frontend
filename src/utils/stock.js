export const NIVEL_ADVERTENCIA_STOCK_BAJO = {
    SIN_DATOS: "sin-datos",
    NINGUNA: "ninguna",
    MODERADA: "moderada",
    IMPORTANTE: "importante"
};

export const PORCENTAJE_ADVERTENCIA_MODERADA = 70;
export const PORCENTAJE_ADVERTENCIA_IMPORTANTE = 90;

export function obtenerAdvertenciaStockBajo(porcentajeAfectado) {
    if (!Number.isFinite(porcentajeAfectado) || porcentajeAfectado < 0) {
        return {
            nivel: NIVEL_ADVERTENCIA_STOCK_BAJO.SIN_DATOS,
            requiereConfirmacion: false
        };
    }

    if (porcentajeAfectado >= PORCENTAJE_ADVERTENCIA_IMPORTANTE) {
        return {
            nivel: NIVEL_ADVERTENCIA_STOCK_BAJO.IMPORTANTE,
            requiereConfirmacion: true
        };
    }

    if (porcentajeAfectado >= PORCENTAJE_ADVERTENCIA_MODERADA) {
        return {
            nivel: NIVEL_ADVERTENCIA_STOCK_BAJO.MODERADA,
            requiereConfirmacion: true
        };
    }

    return {
        nivel: NIVEL_ADVERTENCIA_STOCK_BAJO.NINGUNA,
        requiereConfirmacion: false
    };
}
