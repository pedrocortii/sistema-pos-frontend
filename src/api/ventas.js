import http, { publicHttp } from "./http";

export async function crearVenta(datos) {
    const respuesta = await http.post("/ventas", datos);
    return respuesta.data.venta;
}

export async function obtenerComprobante(codigo) {
    const respuesta = await http.get("/ventas/comprobante/" + codigo);
    return respuesta.data.venta;
}

export async function cobrarVentaPublica(id) {
    await publicHttp.patch("/ventas/" + id + "/cobrar", { metodoPago: "MercadoPago" });
}

export async function cancelarVentaPublica(id) {
    await publicHttp.patch("/ventas/" + id + "/cancelar", {});
}

export async function listarVentas(filtros) {
    const respuesta = await http.get("/ventas", { params: filtros });
    return respuesta.data;
}

export async function obtenerVenta(id) {
    const respuesta = await http.get("/ventas/" + id);
    return respuesta.data.venta;
}

export async function cobrarVenta(id) {
    const respuesta = await http.patch("/ventas/" + id + "/cobrar", { metodoPago: "Efectivo" });
    return respuesta.data.venta;
}

export async function cancelarVenta(id) {
    const respuesta = await http.patch("/ventas/" + id + "/cancelar", {});
    return respuesta.data.venta;
}
