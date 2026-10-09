import { create } from "zustand";
import { useCarritoStore } from "./carritoStore";

function normalizarUsuario(usuario) {
    if (!usuario || typeof usuario !== "object") return usuario;

    const dni = usuario.dni ?? usuario.documento ?? usuario.DNI ?? usuario.clienteDni ?? "";

    return {
        ...usuario,
        dni: dni || undefined,
    };
}

function obtenerPerfilGuardado() {
    const perfilGuardado = localStorage.getItem("clientePerfil");
    if (!perfilGuardado) return null;

    try {
        return normalizarUsuario(JSON.parse(perfilGuardado));
    } catch {
        return null;
    }
}

const tokenGuardado = localStorage.getItem("token");
const usuarioGuardado = localStorage.getItem("usuario");
const perfilGuardado = obtenerPerfilGuardado();

export const useAuthStore = create(function (set) {
    return {
        token: tokenGuardado || null,
        usuario: usuarioGuardado ? normalizarUsuario(JSON.parse(usuarioGuardado)) : perfilGuardado,

        iniciarSesion: function (token, usuario) {
            const perfil = normalizarUsuario({ ...(perfilGuardado || {}), ...(usuario || {}) });
            localStorage.setItem("token", token);
            localStorage.setItem("usuario", JSON.stringify(perfil));
            localStorage.setItem("clientePerfil", JSON.stringify(perfil));
            useCarritoStore.getState().vaciarCarrito();
            set({ token: token, usuario: perfil });
        },

        actualizarPerfilCliente: function (datos) {
            const usuarioActual = useAuthStore.getState().usuario || {};
            const perfilActualizado = normalizarUsuario({ ...usuarioActual, ...datos });
            localStorage.setItem("usuario", JSON.stringify(perfilActualizado));
            localStorage.setItem("clientePerfil", JSON.stringify(perfilActualizado));
            set({ usuario: perfilActualizado });
        },

        cerrarSesion: function () {
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");
            localStorage.removeItem("clientePerfil");
            useCarritoStore.getState().vaciarCarrito();
            set({ token: null, usuario: null });
        }
    };
});