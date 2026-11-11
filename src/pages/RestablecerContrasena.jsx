import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { restablecerContrasena } from "../api/usuarios";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import PanelAuth from "../components/PanelAuth";
import { usePeticion } from "../hooks/usePeticion";
import { restablecerContrasenaSchema } from "../validations/recuperacionContrasenaSchema";

function RestablecerContrasena() {
    const [parametros] = useSearchParams();
    const token = parametros.get("token");
    const [contrasenaRestablecida, setContrasenaRestablecida] = useState(false);
    const {
        cargando,
        error,
        ejecutar
    } = usePeticion(restablecerContrasena);
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(restablecerContrasenaSchema),
        defaultValues: {
            contrasena: "",
            confirmarContrasena: ""
        }
    });

    async function manejarEnvio(datos) {
        try {
            await ejecutar({ token, contrasena: datos.contrasena });
            setContrasenaRestablecida(true);
        } catch {
            // usePeticion mantiene el mensaje del error para mostrarlo.
        }
    }

    return (
        <PanelAuth etiqueta="Recuperación de cuenta" titulo="Crear nueva contraseña">
            {contrasenaRestablecida ? (
                <div className="space-y-5">
                    <Alert tipo="success" texto="Tu contraseña se restableció correctamente." />
                    <Link to="/login-cliente" className="block text-center text-sm text-forest underline">
                        Iniciar sesión
                    </Link>
                </div>
            ) : !token ? (
                <div className="space-y-5">
                    <Alert tipo="error" texto="El enlace de recuperación no es válido o venció." />
                    <Link to="/recuperar-contrasena" className="block text-center text-sm text-forest underline">
                        Solicitar otro enlace
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit(manejarEnvio)} className="space-y-5">
                    <Input
                        label="Nueva contraseña"
                        type="password"
                        variant="line"
                        autoComplete="new-password"
                        placeholder="Al menos 6 caracteres"
                        required
                        error={errors.contrasena}
                        {...register("contrasena")}
                    />

                    <Input
                        label="Confirmar nueva contraseña"
                        type="password"
                        variant="line"
                        autoComplete="new-password"
                        placeholder="Repetí tu contraseña"
                        required
                        error={errors.confirmarContrasena}
                        {...register("confirmarContrasena")}
                    />

                    {error && <Alert tipo="error" texto={error} />}

                    <Button
                        type="submit"
                        size="xl"
                        loading={cargando}
                        loadingText="Guardando..."
                        className="w-full"
                    >
                        Restablecer contraseña
                    </Button>
                </form>
            )}

            {!contrasenaRestablecida && (
                <p className="text-center text-sm text-ink/60 mt-6">
                    <Link to="/login-cliente" className="text-forest underline">
                        Volver al inicio de sesión
                    </Link>
                </p>
            )}
        </PanelAuth>
    );
}

export default RestablecerContrasena;
