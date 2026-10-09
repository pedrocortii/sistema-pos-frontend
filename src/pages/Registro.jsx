import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { registrarUsuario } from "../api/usuarios";
import PanelAuth from "../components/PanelAuth";
import { usePeticion } from "../hooks/usePeticion";
import { registroSchema } from "../validations/registroSchema";

const valoresIniciales = {
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    contrasena: "",
    confirmarContrasena: ""
};

function obtenerMensajeError(error) {
    return error.response?.data?.mensaje || "No se pudo crear la cuenta. Inténtalo de nuevo.";
}

function Registro() {
    const navegar = useNavigate();
    const ubicacion = useLocation();
    const datosCompra = ubicacion.state || {};
    const nombreCompra = datosCompra.nombre || "";
    const apellidoCompra = datosCompra.apellido || "";
    const dniCompra = datosCompra.dni || "";
    const emailCompra = datosCompra.email || "";
    const {
        cargando,
        error,
        ejecutar: ejecutarRegistro
    } = usePeticion(registrarUsuario, {
        obtenerMensajeError
    });

    const {
        register,
        handleSubmit,
        reset,
        setError,
        clearErrors,
        formState: { errors }
    } = useForm({
        defaultValues: {
            ...valoresIniciales,
            nombre: nombreCompra,
            apellido: apellidoCompra,
            dni: dniCompra,
            email: emailCompra
        }
    });

    useEffect(function () {
        reset({
            ...valoresIniciales,
            nombre: nombreCompra,
            apellido: apellidoCompra,
            dni: dniCompra,
            email: emailCompra
        });
    }, [nombreCompra, apellidoCompra, dniCompra, emailCompra, reset]);

    async function manejarEnvio(datos) {
        clearErrors();

        const datosRegistro = {
            nombre: datos.nombre.trim(),
            apellido: datos.apellido.trim(),
            dni: datos.dni.trim(),
            email: datos.email.trim(),
            contrasena: datos.contrasena,
            confirmarContrasena: datos.confirmarContrasena
        };

        try {
            await registroSchema.validate(datosRegistro, { abortEarly: false });
        } catch (error) {
            const errores = error.inner || [];
            errores.forEach(function (errorValidacion) {
                const campo = errorValidacion.path;
                if (campo) {
                    setError(campo, {
                        type: errorValidacion.type,
                        message: errorValidacion.message
                    });
                }
            });
            return;
        }

        try {
            await ejecutarRegistro({
                nombre: datosRegistro.nombre,
                apellido: datosRegistro.apellido,
                dni: datosRegistro.dni,
                email: datosRegistro.email,
                contrasena: datosRegistro.contrasena
            });
            localStorage.setItem("clientePerfil", JSON.stringify({
                nombre: datosRegistro.nombre,
                apellido: datosRegistro.apellido,
                dni: datosRegistro.dni,
                email: datosRegistro.email,
                rol: "Cliente"
            }));
            navegar("/login-cliente", {
                state: { registroExitoso: true }
            });
        } catch {
            // El hook mantiene el mensaje de error para mostrarlo al usuario.
        }
    }

    return (
        <PanelAuth etiqueta="Cuenta de cliente" titulo="Crear cuenta">
            <form onSubmit={handleSubmit(manejarEnvio)} className="space-y-5">
                <div>
                    <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                        Nombre
                    </label>
                    <input
                        type="text"
                        {...register("nombre")}
                        className="w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors"
                        autoComplete="given-name"
                    />
                    {errors.nombre && <p className="text-xs text-red-600 mt-1">{errors.nombre.message}</p>}
                </div>

                <div>
                    <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                        Apellido
                    </label>
                    <input
                        type="text"
                        {...register("apellido")}
                        className="w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors"
                        autoComplete="family-name"
                    />
                    {errors.apellido && <p className="text-xs text-red-600 mt-1">{errors.apellido.message}</p>}
                </div>

                <div>
                    <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                        DNI
                    </label>
                    <input
                        type="text"
                        {...register("dni")}
                        className="w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors"
                        autoComplete="off"
                    />
                    {errors.dni && <p className="text-xs text-red-600 mt-1">{errors.dni.message}</p>}
                </div>

                <div>
                    <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                        Email
                    </label>
                    <input
                        type="email"
                        {...register("email")}
                        className="w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors"
                        autoComplete="email"
                    />
                    {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
                </div>

                <div>
                    <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                        Contraseña
                    </label>
                    <input
                        type="password"
                        {...register("contrasena")}
                        className="w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors"
                        autoComplete="new-password"
                    />
                    {errors.contrasena && <p className="text-xs text-red-600 mt-1">{errors.contrasena.message}</p>}
                </div>

                <div>
                    <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                        Confirmar contraseña
                    </label>
                    <input
                        type="password"
                        {...register("confirmarContrasena")}
                        className="w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors"
                        autoComplete="new-password"
                    />
                    {errors.confirmarContrasena && (
                        <p className="text-xs text-red-600 mt-1">{errors.confirmarContrasena.message}</p>
                    )}
                </div>

                {error && (
                    <p role="alert" className="text-sm text-red-600 font-mono-ticket">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={cargando}
                    className="w-full bg-forest hover:bg-forest-dark disabled:opacity-60 text-paper font-mono-ticket text-sm uppercase tracking-wide py-3 transition-colors"
                >
                    {cargando ? "Creando cuenta..." : "Crear cuenta"}
                </button>
            </form>

            <p className="text-center font-mono-ticket text-sm text-ink/60 mt-6">
                Ya tienes una cuenta?{" "}
                <Link to="/login-cliente" className="text-forest underline">
                    Iniciar sesión
                </Link>
            </p>
        </PanelAuth>
    );
}

export default Registro;