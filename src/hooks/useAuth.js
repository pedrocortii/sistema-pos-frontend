import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import http from "../api/http";

export function useAuth() {
    const navigate = useNavigate();
    const { token, usuario, iniciarSesion, cerrarSesion } = useAuthStore();

    async function login(email, contrasena) {
        try {
            const respuesta = await http.post("/usuarios/login", { email, contrasena });
            const { token: newToken, usuario: nuevoUsuario } = respuesta.data;

            iniciarSesion(newToken, nuevoUsuario);

            const destinos = {
                Administrador: "/admin/productos",
                Cajero: "/admin/ventas",
                Cliente: "/catalogo"
            };

            const destino = destinos[nuevoUsuario.rol] || "/catalogo";
            navigate(destino);
            return { success: true };
        } catch (error) {
            const mensaje = error.response?.data?.mensaje || "No se pudo iniciar sesión. Intenta de nuevo.";
            return { success: false, error: mensaje };
        }
    }

    function logout() {
        cerrarSesion();
        navigate("/login");
    }

    return {
        isAuthenticated: !!token,
        usuario,
        login,
        logout,
        rol: usuario?.rol,
    };
}
