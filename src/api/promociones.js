import { publicHttp } from "./http";
import http from "./http";

export async function listarPromocionesVigentes() {
    const respuesta = await publicHttp.get("/promociones/vigentes");
    return respuesta.data;
}

export async function listarPromociones() {
    const respuesta = await http.get("/promociones");
    return respuesta.data.promociones;
}

export async function crearPromocion(datos) {
    const respuesta = await http.post("/promociones", datos);
    return respuesta.data.promocion;
}

export async function actualizarPromocion(id, datos) {
    const respuesta = await http.put("/promociones/" + id, datos);
    return respuesta.data.promocion;
}

export function eliminarPromocion(id) {
    return http.delete("/promociones/" + id);
}
