import { publicHttp } from "./http";

export async function registrarUsuario(datos) {
    const respuesta = await publicHttp.post("/usuarios/registro", datos);
    return respuesta.data;
}
