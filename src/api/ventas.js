import http, { publicHttp } from "./http";

export async function crearVenta(datos) {
    const respuesta = await http.post("/ventas", datos);
    return {
        ...respuesta.data.venta,
        pago: respuesta.data.pago || null
    };
}

// Registra una venta atendida por un cajero. A diferencia de crearVenta,
// esta operación no requiere los datos del comprador del checkout público.
export async function crearVentaDirecta(datos) {
    const respuesta = await http.post("/ventas/directa", datos);
    return respuesta.data.venta || respuesta.data;
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

export async function cancelarCompraCliente(id) {
    const respuesta = await http.patch("/ventas/" + encodeURIComponent(id) + "/cancelar-cliente", {});
    return respuesta.data.venta;
}

export async function listarVentas(filtros) {
    const respuesta = await http.get("/ventas", { params: filtros });
    return respuesta.data;
}

export async function obtenerVenta(id) {
    const respuesta = await http.get("/ventas/" + id);
    return respuesta.data.venta;
}

export async function renombrarVenta(id, nombrePersonalizado) {
    const respuesta = await http.patch("/ventas/" + encodeURIComponent(id) + "/nombre", {
        nombrePersonalizado
    });
    return respuesta.data.venta;
}

export async function descargarComprobante(codigoComprobante) {
    const respuesta = await publicHttp.get("/ventas/comprobante/" + encodeURIComponent(codigoComprobante) + "/pdf", {
        responseType: "blob"
    });
    const archivo = new Blob([respuesta.data], { type: "application/pdf" });
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");
    const codigoSeguro = String(codigoComprobante || "compra").replace(/[^a-zA-Z0-9_-]/g, "-");
    enlace.href = url;
    enlace.download = "comprobante-compra-" + codigoSeguro + ".pdf";
    enlace.style.display = "none";
    document.body.appendChild(enlace);

    try {
        enlace.click();
    } finally {
        enlace.remove();
        window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }
}

export async function consultarEstadoQr(id) {
    const respuesta = await http.get("/ventas/" + id + "/pago-qr");
    return respuesta.data.venta || respuesta.data;
}

export async function cobrarVenta(id, datos = { metodoPago: "Efectivo" }) {
    const respuesta = await http.patch("/ventas/" + id + "/cobrar", datos);
    return respuesta.data.venta;
}

export async function cancelarVenta(id) {
    const respuesta = await http.patch("/ventas/" + id + "/cancelar", {});
    return respuesta.data.venta;
}

export async function prepararVenta(id) {
    const respuesta = await http.patch("/ventas/" + id + "/preparar", {});
    return respuesta.data.venta;
}

export async function marcarVentaListaParaRetirar(id) {
    const respuesta = await http.patch("/ventas/" + id + "/lista-para-retirar", {});
    return respuesta.data.venta;
}

export async function marcarVentaRetirada(id) {
    const respuesta = await http.patch("/ventas/" + id + "/retirar", {});
    return respuesta.data.venta;
}
