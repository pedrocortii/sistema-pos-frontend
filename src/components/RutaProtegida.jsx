import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

function RutaProtegida({ children }) {
    const token = useAuthStore(function (estado) { return estado.token; });

    if (!token) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default RutaProtegida;