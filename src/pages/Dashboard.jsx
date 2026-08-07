import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

function Dashboard() {
    const usuario = useAuthStore(function (estado) { return estado.usuario; });
    const cerrarSesion = useAuthStore(function (estado) { return estado.cerrarSesion; });
    const navegar = useNavigate();

    function manejarCerrarSesion() {
        cerrarSesion();
        navegar("/");
    }

    return (
        <div className="min-h-screen bg-paper flex items-center justify-center">
            <div className="text-center">
                <p className="font-mono-ticket text-xs uppercase tracking-[0.25em] text-ink/50">
                    Sesion iniciada
                </p>
                <h1 className="font-display text-3xl text-ink mt-2">
                    Hola, {usuario ? usuario.nombre : ""}
                </h1>
                <p className="font-mono-ticket text-sm text-ink/60 mt-2">
                    Rol: {usuario ? usuario.rol : ""}
                </p>
                <button
                    onClick={manejarCerrarSesion}
                    className="mt-8 font-mono-ticket text-sm uppercase tracking-wide text-forest border-b-2 border-forest pb-1"
                >
                    Cerrar sesion
                </button>
            </div>
        </div>
    );
}

export default Dashboard;