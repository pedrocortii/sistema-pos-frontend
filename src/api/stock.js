import http from "./http";

export async function listarStock(params = {}) {
    const { page = 1, limit = 100, ...filtros } = params;
    const respuesta = await http.get("/stock", {
        params: {
            page,
            limit,
            ...filtros
        }
    });
    return respuesta.data;
}

export function ajustarStock(id, datos) {
    return http.patch("/stock/" + id, datos);
}

export async function obtenerResumenStockBajo() {
    const respuesta = await http.get("/stock/resumen");
    return respuesta.data;
}

export async function obtenerVistaPreviaStockBajo(umbral) {
    const respuesta = await http.get("/stock/vista-previa", { params: { umbral } });
    return respuesta.data;
}

export async function obtenerConfiguracionStock() {
    const respuesta = await http.get("/stock/configuracion");
    return respuesta.data.configuracion;
}

export async function guardarConfiguracionStock(umbralStockBajo) {
    const respuesta = await http.put("/stock/configuracion", { umbralStockBajo });
    return respuesta.data.configuracion;
}
