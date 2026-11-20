// Ruta inicial valida para cada rol. Se usa tanto en la redireccion de la raiz
// como cuando un usuario autenticado intenta entrar a una ruta no autorizada.
export function rutaInicioPorRol(rol) {
    if (rol === "Administrador") return "/admin/dashboard";
    if (rol === "Cajero") return "/admin/venta-rapida";
    if (rol === "Cliente") return "/catalogo";
    return "/login";
}

// Decide si una ruta protegida debe redirigir. Devuelve null cuando el acceso
// esta permitido o la ruta de destino cuando hay que redirigir.
// La funcion es pura para poder probarla sin renderizar React y para garantizar
// que nunca se redirige a la misma ruta (evitando bucles).
export function resolverDestinoRuta({ token, rol, rolesPermitidos, rutaActual }) {
    if (!token) return "/login";

    if (!Array.isArray(rolesPermitidos) || rolesPermitidos.length === 0) {
        return null;
    }

    if (rol && rolesPermitidos.includes(rol)) {
        return null;
    }

    const destino = rutaInicioPorRol(rol);
    return destino === rutaActual ? "/login" : destino;
}
