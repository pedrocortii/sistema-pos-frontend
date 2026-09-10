import http from "./http";

export async function listarProductos(params = {}) {
    const respuesta = await http.get("/productos", {
        params: {
            page: params.page || 1,
            limit: params.limit || 10,
            ...params
        }
    });
    return respuesta.data;
}

export async function crearProducto(datos) {
    const respuesta = await http.post("/productos", datos);
    return respuesta.data.producto;
}

export async function actualizarProducto(id, datos) {
    const respuesta = await http.put("/productos/" + id, datos);
    return respuesta.data.producto;
}

export function eliminarProducto(id) {
    return http.delete("/productos/" + id);
}
