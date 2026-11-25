import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useCarritoStore } from "../store/carritoStore";
import http from "../api/http";

export function useAuth() {
    const navigate = useNavigate();
    const location = useLocation();
    const { token, usuario, iniciarSesion, cerrarSesion } = useAuthStore();

    async function login(email, contrasena) {
        try {
            const respuesta = await http.post("/usuarios/login", { email, contrasena });
            const { token: newToken, usuario: nuevoUsuario } = respuesta.data;
            const perfilGuardado = JSON.parse(localStorage.getItem("clientePerfil") || "null");
            const usuarioFinal = { ...(perfilGuardado || {}), ...(nuevoUsuario || {}) };

            iniciarSesion(newToken, usuarioFinal);

            const destinos = {
                Administrador: "/admin/dashboard",
                Cajero: "/admin/venta-rapida",
                Cliente: "/catalogo"
            };

            const returnTo = location.state?.returnTo;
            const destino = nuevoUsuario.rol === "Cliente"
                ? typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//")
                    ? returnTo
                    : useCarritoStore.getState().items.length > 0
                        ? "/carrito"
                        : destinos.Cliente
                : destinos[nuevoUsuario.rol] || "/catalogo";
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
