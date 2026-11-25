import { obtenerResumenStockBajo } from "./stock";
import { listarVentas } from "./ventas";

// El backend valida que page/limit no supere 100 en ventas.
const limiteConsulta = 100;

async function listarTodosLosResultados(listar, parametros, obtenerResultados, obtenerTotal, crearPaginacion) {
    const primeraRespuesta = await listar({ ...parametros, ...crearPaginacion(1) });
    const resultadosIniciales = obtenerResultados(primeraRespuesta);
    const total = obtenerTotal(primeraRespuesta);
    const totalPaginas = Math.ceil(total / limiteConsulta);

    if (totalPaginas <= 1) return resultadosIniciales;

    const respuestasRestantes = await Promise.all(
        Array.from({ length: totalPaginas - 1 }, function (_, indice) {
            const pagina = indice + 2;
            return listar({ ...parametros, ...crearPaginacion(pagina) });
        })
    );

    return resultadosIniciales.concat(respuestasRestantes.flatMap(obtenerResultados));
}

function obtenerVentas(respuesta) {
    return respuesta?.ventas || [];
}

function obtenerTotalVentas(respuesta) {
    return respuesta?.paginacion?.totalRegistros || respuesta?.total || obtenerVentas(respuesta).length;
}

function monto(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
}

async function listarVentasDashboard(parametros) {
    try {
        return await listarVentas(parametros);
    } catch (error) {
        if (error.response?.status !== 400) throw error;
        const { page, limit, ...filtros } = parametros;
        return listarVentas({
            ...filtros,
            pagina: page,
            limite: limit
        });
    }
}

export async function obtenerResumenDashboard(filtros = {}) {
    // El resumen de stock lo calcula el backend con el mismo umbral que usa el
    // inventario, para que Dashboard y Stock nunca muestren resultados distintos.
    const [ventasRegistradas, resumenStock] = await Promise.all([
        listarTodosLosResultados(listarVentasDashboard, {
            ...(filtros.fechaDesde && { fechaDesde: filtros.fechaDesde }),
            ...(filtros.fechaHasta && { fechaHasta: filtros.fechaHasta })
        }, obtenerVentas, obtenerTotalVentas, function (pagina) { return { page: pagina, limit: limiteConsulta }; }),
        obtenerResumenStockBajo()
    ]);

    const ventas = ventasRegistradas.filter(function (venta) {
        return ["COBRADA", "EN_PREPARACION", "LISTA_PARA_RETIRAR", "RETIRADA"].includes(venta.estado);
    });

    const cantidadesPorProducto = new Map();
    let totalVendido = 0;

    ventas.forEach(function (venta) {
        totalVendido += monto(venta.total);
        (venta.detalles || []).forEach(function (detalle) {
            const productoId = detalle.productoId || detalle.producto?.id;
            if (!productoId) return;
            const actual = cantidadesPorProducto.get(productoId) || {
                cantidad: 0,
                nombre: detalle.producto?.nombre || "Producto"
            };
            actual.cantidad += Number(detalle.cantidad) || 0;
            cantidadesPorProducto.set(productoId, actual);
        });
    });

    const productoMasVendido = Array.from(cantidadesPorProducto.values())
        .sort(function (a, b) { return b.cantidad - a.cantidad; })[0] || null;

    return {
        totalVendido,
        cantidadVentas: ventas.length,
        productosStockBajo: resumenStock.productosStockBajo,
        umbralStockBajo: resumenStock.umbralStockBajo,
        productoMasVendido,
        totalProductosActivos: resumenStock.totalProductosActivos
    };
}

export function crearFechaInicio(valor) {
    if (!valor) return undefined;
    return new Date(valor + "T00:00:00").toISOString();
}

export function crearFechaFin(valor) {
    if (!valor) return undefined;
    return new Date(valor + "T23:59:59.999").toISOString();
}
