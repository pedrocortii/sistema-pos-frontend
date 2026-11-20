import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { resolverDestinoRuta } from "../utils/rutas";

// Protege una ruta. Si recibe `rolesPermitidos`, valida que el rol del
// usuario este en la lista. Si no recibe roles, solo exige estar autenticado.
// Sin sesion redirige al login.
// Con sesion pero sin permiso redirige a la pagina de inicio del rol, evitando
// bucles (por ejemplo, un Cliente nunca es enviado al Dashboard de administracion).
function RutaProtegida({ children, rolesPermitidos }) {
    const token = useAuthStore(function (estado) { return estado.token; });
    const usuario = useAuthStore(function (estado) { return estado.usuario; });
    const ubicacion = useLocation();

    const destino = resolverDestinoRuta({
        token,
        rol: usuario && usuario.rol,
        rolesPermitidos,
        rutaActual: ubicacion.pathname
    });

    if (destino) {
        return <Navigate to={destino} replace />;
    }

    return children || <Outlet />;
}

export default RutaProtegida;
