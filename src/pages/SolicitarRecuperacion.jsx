import { useState } from "react";
import { Link } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { solicitarRecuperacionContrasena } from "../api/usuarios";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import PanelAuth from "../components/PanelAuth";
import { usePeticion } from "../hooks/usePeticion";
import { solicitarRecuperacionSchema } from "../validations/recuperacionContrasenaSchema";

function SolicitarRecuperacion() {
    const [solicitudEnviada, setSolicitudEnviada] = useState(false);
    const {
        cargando,
        error,
        ejecutar
    } = usePeticion(solicitarRecuperacionContrasena);
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(solicitarRecuperacionSchema),
        defaultValues: { email: "" }
    });

    async function manejarEnvio(datos) {
        try {
            await ejecutar({ email: datos.email.trim() });
            setSolicitudEnviada(true);
        } catch {
            // usePeticion mantiene el mensaje del error para mostrarlo.
        }
    }

    return (
        <PanelAuth etiqueta="Recuperación de cuenta" titulo="¿Olvidaste tu contraseña?">
            {solicitudEnviada ? (
                <div className="space-y-5">
                    <Alert
                        tipo="success"
                        texto="Si el correo está asociado a una cuenta, recibirás instrucciones para restablecer tu contraseña."
                    />
                    <p className="text-center text-sm text-ink/60">
                        Revisá tu bandeja de entrada y la carpeta de correo no deseado.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit(manejarEnvio)} className="space-y-5">
                    <p className="text-sm text-ink/60">
                        Ingresá el email de tu cuenta y te enviaremos un enlace para crear una nueva contraseña.
                    </p>

                    <Input
                        label="Email"
                        type="email"
                        variant="line"
                        autoComplete="email"
                        placeholder="tucorreo@ejemplo.com"
                        required
                        error={errors.email}
                        {...register("email")}
                    />

                    {error && <Alert tipo="error" texto={error} />}

                    <Button
                        type="submit"
                        size="xl"
                        loading={cargando}
                        loadingText="Enviando..."
                        className="w-full"
                    >
                        Enviar enlace de recuperación
                    </Button>
                </form>
            )}

            <p className="text-center text-sm text-ink/60 mt-6">
                <Link to="/login-cliente" className="text-forest underline">
                    Volver al inicio de sesión
                </Link>
            </p>
        </PanelAuth>
    );
}

export default SolicitarRecuperacion;
