import http from "./http";

function crearFormularioProducto(datos, archivoImagen) {
    const formulario = new FormData();
    Object.entries(datos).forEach(function ([campo, valor]) {
        if (valor !== undefined && valor !== null) {
            formulario.append(campo, String(valor));
        }
    });
    formulario.append("imagen", archivoImagen);
    return formulario;
}

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

export async function obtenerProducto(id) {
    const respuesta = await http.get("/productos/" + id);
    return respuesta.data.producto;
}

export async function crearProducto(datos, archivoImagen) {
    const payload = archivoImagen ? crearFormularioProducto(datos, archivoImagen) : datos;
    const respuesta = await http.post("/productos", payload);
    return respuesta.data.producto;
}

export async function actualizarProducto(id, datos, archivoImagen) {
    const payload = archivoImagen ? crearFormularioProducto(datos, archivoImagen) : datos;
    const respuesta = await http.put("/productos/" + id, payload);
    return respuesta.data.producto;
}

export function eliminarProducto(id) {
    return http.delete("/productos/" + id);
}
