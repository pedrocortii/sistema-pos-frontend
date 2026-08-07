import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import http from "../api/http";
import PanelAuth from "../components/PanelAuth";

function Registro() {
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [email, setEmail] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [rol, setRol] = useState("Cajero");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    const navegar = useNavigate();

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setError("");
        setCargando(true);

        try {
            await http.post("/usuarios/registro", { nombre, apellido, email, contrasena, rol: "Cliente" });
            navegar("/", { state: { registroExitoso: true } });
        } catch (error) {
            const mensaje = error.response && error.response.data && error.response.data.mensaje
                ? error.response.data.mensaje
                : "No se pudo completar el registro. Intenta de nuevo.";
            setError(mensaje);
        } finally {
            setCargando(false);
        }
    }

    return (
        <PanelAuth etiqueta="Crear cuenta" titulo="Sumate al equipo">
            <form onSubmit={manejarEnvio} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                            Nombre
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={function (evento) { setNombre(evento.target.value); }}
                            required
                            className="w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors"
                        />
                    </div>

                    <div>
                        <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                            Apellido
                        </label>
                        <input
                            type="text"
                            value={apellido}
                            onChange={function (evento) { setApellido(evento.target.value); }}
                            required
                            className="w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors"
                        />
                    </div>
                </div>

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
                        placeholder="Minimo 6 caracteres"
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
                    {cargando ? "Creando cuenta..." : "Crear cuenta"}
                </button>

                <p className="text-center font-mono-ticket text-sm text-ink/60">
                    Ya tenes cuenta?{" "}
                    <Link to="/" className="text-forest underline">
                        Inicia sesion
                    </Link>
                </p>
            </form>
        </PanelAuth>
    );
}

export default Registro;