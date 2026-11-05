import http from "./http";

export async function listarNotificaciones() {
    const respuesta = await http.get("/notificaciones");
    return respuesta.data;
}

export async function marcarNotificacionComoLeida(id) {
    const respuesta = await http.patch("/notificaciones/" + id + "/leida");
    return respuesta.data.notificacion;
}
