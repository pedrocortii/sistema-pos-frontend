import http from "./http";

const tipoExcel = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const tipoPdf = "application/pdf";

async function descargarReporte(endpoint, parametros, nombre, tipo) {
    try {
        const respuesta = await http.get(endpoint, {
            params: parametros,
            responseType: "blob"
        });
        const url = URL.createObjectURL(new Blob([respuesta.data], { type: tipo }));
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = nombre;
        enlace.style.display = "none";
        document.body.appendChild(enlace);

        try {
            enlace.click();
        } finally {
            enlace.remove();
            window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        }
    } catch (error) {
        if (error.response?.data instanceof Blob) {
            try {
                const datosError = JSON.parse(await error.response.data.text());
                error.message = datosError.mensaje || "No se pudo generar el reporte.";
            } catch {
                error.message = "No se pudo generar el reporte.";
            }
        }
        throw error;
    }
}

export function exportarVentas(formato, filtros) {
    const parametros = {
        ...(filtros.estado && { estado: filtros.estado }),
        ...(filtros.buscar?.trim() && { buscar: filtros.buscar.trim() }),
        ...(filtros.fechaDesde && {
            fechaDesde: new Date(`${filtros.fechaDesde}T00:00:00`).toISOString()
        }),
        ...(filtros.fechaHasta && {
            fechaHasta: new Date(`${filtros.fechaHasta}T23:59:59.999`).toISOString()
        })
    };
    const excel = formato === "xlsx";
    return descargarReporte(
        `/reportes/ventas.${formato}`,
        parametros,
        `reporte-ventas.${formato}`,
        excel ? tipoExcel : tipoPdf
    );
}

export function exportarStock(formato, filtros) {
    const excel = formato === "xlsx";
    return descargarReporte(
        `/reportes/stock.${formato}`,
        { bajo: filtros.bajo ? "true" : "false" },
        `reporte-stock.${formato}`,
        excel ? tipoExcel : tipoPdf
    );
}
