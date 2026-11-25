import http, { publicHttp } from "./http";

export async function consultarDisponibilidadRetiro(dias = 60) {
    const respuesta = await publicHttp.get("/retiros/disponibilidad", { params: { dias } });
    return respuesta.data;
}

export async function obtenerConfiguracionRetiro() {
    const respuesta = await http.get("/retiros/configuracion");
    return respuesta.data.configuracion;
}

export async function guardarConfiguracionRetiro(configuracion) {
    const respuesta = await http.put("/retiros/configuracion", configuracion);
    return respuesta.data.configuracion;
}
