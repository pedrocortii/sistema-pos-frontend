import http from "./http";

function crearApi(recurso) {
    return {
        listar: async function () { return (await http.get("/" + recurso)).data.data; },
        crear: async function (nombre) { return (await http.post("/" + recurso, { nombre })).data.dato; },
        actualizar: async function (id, nombre) { return (await http.put("/" + recurso + "/" + id, { nombre })).data.dato; },
        desactivar: function (id) { return http.delete("/" + recurso + "/" + id); }
    };
}

export const categoriasApi = crearApi("categorias");
export const tiposProductoApi = crearApi("tipos-producto");
