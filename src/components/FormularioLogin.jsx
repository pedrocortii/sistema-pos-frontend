import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import PanelAuth from "./PanelAuth";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";

function FormularioLogin({ etiqueta, titulo, textoBoton, mensajeExito, children }) {
    const [email, setEmail] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);
    const { login } = useAuth();

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setError("");
        setCargando(true);

        const resultado = await login(email, contrasena);
        if (!resultado.success) {
            setError(resultado.error);
            setCargando(false);
        }
    }

    return (
        <PanelAuth etiqueta={etiqueta} titulo={titulo}>
            {mensajeExito && (
                <p className="text-center text-sm text-forest mb-5 font-semibold">
                    {mensajeExito}
                </p>
            )}
            <form onSubmit={manejarEnvio} className="space-y-5">
                <Input
                    label="Email"
                    type="email"
                    variant="line"
                    value={email}
                    onChange={function (evento) { setEmail(evento.target.value); }}
                    required
                    placeholder="tucorreo@ejemplo.com"
                />

                <Input
                    label="Contraseña"
                    type="password"
                    variant="line"
                    value={contrasena}
                    onChange={function (evento) { setContrasena(evento.target.value); }}
                    required
                    placeholder="••••••••"
                />

                {error && <Alert tipo="error" texto={error} />}

                <Button
                    type="submit"
                    size="xl"
                    loading={cargando}
                    loadingText="Ingresando..."
                    className="w-full mt-2"
                >
                    {textoBoton}
                </Button>

                {children}
            </form>
        </PanelAuth>
    );
}

export default FormularioLogin;
