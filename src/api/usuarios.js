import http, { publicHttp } from "./http";

export async function registrarUsuario(datos) {
    const respuesta = await publicHttp.post("/usuarios/registro", datos);
    return respuesta.data;
}

export async function solicitarRecuperacionContrasena(datos) {
    const respuesta = await publicHttp.post("/usuarios/solicitar-recuperacion", datos);
    return respuesta.data;
}

export async function restablecerContrasena(datos) {
    const respuesta = await publicHttp.post("/usuarios/restablecer-contrasena", datos);
    return respuesta.data;
}

export async function obtenerPerfilUsuario() {
    const respuesta = await http.get("/usuarios/perfil");
    return respuesta.data.usuario;
}

export async function buscarClientePorDni(dni) {
    const respuesta = await http.get("/usuarios/dni/" + encodeURIComponent(dni));
    return respuesta.data.cliente || respuesta.data.usuario || respuesta.data;
}
