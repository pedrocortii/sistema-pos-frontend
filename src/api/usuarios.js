import http, { publicHttp } from "./http";

export async function registrarUsuario(datos) {
    const respuesta = await publicHttp.post("/usuarios/registro", datos);
    return respuesta.data;
}

export async function obtenerPerfilUsuario() {
    const respuesta = await http.get("/usuarios/perfil");
    return respuesta.data.usuario;
}
