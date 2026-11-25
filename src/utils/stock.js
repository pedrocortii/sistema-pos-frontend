export const NIVEL_ADVERTENCIA_STOCK_BAJO = {
    SIN_DATOS: "sin-datos",
    NINGUNA: "ninguna",
    MODERADA: "moderada",
    IMPORTANTE: "importante"
};

export const PORCENTAJE_ADVERTENCIA_MODERADA = 70;
export const PORCENTAJE_ADVERTENCIA_IMPORTANTE = 90;

// Devuelve la cantidad disponible para comprar. El backend publico entrega
// `disponible` (stock menos reservado); para respuestas internas se mantiene el
// calculo anterior a partir de stock y stockReservado.
export function obtenerDisponibilidadProducto(producto) {
    if (!producto) return 0;

    if (producto.disponible !== undefined && producto.disponible !== null) {
        const disponible = Number(producto.disponible);
        if (Number.isFinite(disponible)) return Math.max(0, disponible);
    }

    const stock = Number(producto.stock);
    const reservado = Number(producto.stockReservado || 0);
    if (!Number.isFinite(stock)) return 0;
    return Math.max(0, stock - (Number.isFinite(reservado) ? reservado : 0));
}

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
