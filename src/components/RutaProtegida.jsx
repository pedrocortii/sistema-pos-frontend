import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

// Protege una ruta. Si recibe `rolesPermitidos`, valida que el rol del
// usuario este en la lista. Si no recibe roles, solo exige estar autenticado.
// Si no hay token, redirige a "/".
function RutaProtegida({ children, rolesPermitidos }) {
    const token = useAuthStore(function (estado) { return estado.token; });
    const usuario = useAuthStore(function (estado) { return estado.usuario; });

    if (!token) {
        return <Navigate to="/" replace />;
    }

    if (rolesPermitidos && Array.isArray(rolesPermitidos) && rolesPermitidos.length > 0) {
        const rol = usuario && usuario.rol;
        if (!rol || !rolesPermitidos.includes(rol)) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
}

export default RutaProtegida;