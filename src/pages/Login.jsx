import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import http from "../api/http";
import { useAuthStore } from "../store/authStore";
import PanelAuth from "../components/PanelAuth";

function Login() {
    const [email, setEmail] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    const navegar = useNavigate();
    const ubicacion = useLocation();
    const registroExitoso = ubicacion.state && ubicacion.state.registroExitoso;
    const iniciarSesion = useAuthStore(function (estado) { return estado.iniciarSesion; });

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setError("");
        setCargando(true);

        try {
            const respuesta = await http.post("/usuarios/login", { email, contrasena });
            iniciarSesion(respuesta.data.token, respuesta.data.usuario);
            navegar("/dashboard");
        } catch (error) {
            const mensaje = error.response && error.response.data && error.response.data.mensaje
                ? error.response.data.mensaje
                : "No se pudo iniciar sesion. Intenta de nuevo.";
            setError(mensaje);
        } finally {
            setCargando(false);
        }
    }

    return (
        <PanelAuth etiqueta="Inicio de sesion" titulo="Bienvenido de nuevo">
            {registroExitoso && (
                <p className="text-center font-mono-ticket text-sm text-forest mb-5">
                    Cuenta creada correctamente. Ya podes iniciar sesion.
                </p>
            )}
            <form onSubmit={manejarEnvio} className="space-y-5">
                <div>
                    <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={function (evento) { setEmail(evento.target.value); }}
                        required
                        className="w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors"
                        placeholder="tucorreo@ejemplo.com"
                    />
                </div>

                <div>
                    <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                        Contrasena
                    </label>
                    <input
                        type="password"
                        value={contrasena}
                        onChange={function (evento) { setContrasena(evento.target.value); }}
                        required
                        className="w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors"
                        placeholder="••••••••"
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-600 font-mono-ticket">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={cargando}
                    className="w-full bg-forest hover:bg-forest-dark disabled:opacity-60 text-paper font-mono-ticket text-sm uppercase tracking-wide py-3 mt-2 transition-colors"
                >
                    {cargando ? "Ingresando..." : "Ingresar"}
                </button>

                <p className="text-center font-mono-ticket text-sm text-ink/60">
                    No tenes cuenta?{" "}
                    <Link to="/registro" className="text-forest underline">
                        Registrate
                    </Link>
                </p>
            </form>
        </PanelAuth>
    );
}

export default Login;