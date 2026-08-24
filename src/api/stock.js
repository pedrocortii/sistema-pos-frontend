import http from "./http";

export async function listarStock() {
    const respuesta = await http.get("/stock", { params: { page: 1, limit: 100 } });
    return respuesta.data;
}

export function ajustarStock(id, datos) {
    return http.patch("/stock/" + id, datos);
}
