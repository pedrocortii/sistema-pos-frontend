import { create } from "zustand";

const tokenGuardado = localStorage.getItem("token");
const usuarioGuardado = localStorage.getItem("usuario");

export const useAuthStore = create(function (set) {
    return {
        token: tokenGuardado || null,
        usuario: usuarioGuardado ? JSON.parse(usuarioGuardado) : null,

        iniciarSesion: function (token, usuario) {
            localStorage.setItem("token", token);
            localStorage.setItem("usuario", JSON.stringify(usuario));
            set({ token: token, usuario: usuario });
        },

        cerrarSesion: function () {
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");
            set({ token: null, usuario: null });
        }
    };
});