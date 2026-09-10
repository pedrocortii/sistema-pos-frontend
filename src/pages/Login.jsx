import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PanelAuth from "../components/PanelAuth";

function Login() {
    const [email, setEmail] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    const ubicacion = useLocation();
    const registroExitoso = ubicacion.state && ubicacion.state.registroExitoso;
    const { login } = useAuth();

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setError("");
        setCargando(true);

        const resultado = await login(email, contrasena);
        if (!resultado.success) {
            setError(resultado.error);
        }
    }

    return (
        <PanelAuth etiqueta="Acceso para cajeros y administradores" titulo="Bienvenido de nuevo">
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
                    Es cliente?{" "}
                    <Link to="/catalogo" className="text-forest underline">
                        Ir al catalogo
                    </Link>
                </p>
            </form>
        </PanelAuth>
    );
}

export default Login;
