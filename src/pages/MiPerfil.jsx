import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { KeyRound, Pencil, UserX } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import {
    actualizarPerfilUsuario,
    cambiarContrasenaUsuario,
    obtenerPerfilUsuario
} from "../api/usuarios";
import EncabezadoCliente from "../components/EncabezadoCliente";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Alert } from "../components/ui/Alert";
import { Input } from "../components/ui/Input";
import { usePeticion } from "../hooks/usePeticion";
import { cambiarContrasenaSchema, perfilSchema } from "../validations/perfilSchema";

const VALORES_CONTRASENA_VACIOS = {
    contrasenaActual: "",
    contrasenaNueva: "",
    confirmarContrasena: ""
};

function obtenerValoresPerfil(usuario) {
    return {
        nombre: usuario?.nombre || "",
        apellido: usuario?.apellido || "",
        dni: usuario?.dni || "",
        email: usuario?.email || ""
    };
}

function obtenerMensajeErrorPerfil(error) {
    const datos = error.response?.data;
    if (Array.isArray(datos?.errores) && datos.errores.length > 0) {
        return datos.errores.join(". ");
    }
    return datos?.mensaje || "No se pudieron guardar los datos del perfil.";
}

function obtenerMensajeErrorContrasena(error) {
    const datos = error.response?.data;
    if (Array.isArray(datos?.errores) && datos.errores.length > 0) {
        return datos.errores.join(". ");
    }
    return datos?.mensaje || "No se pudo cambiar la contraseña.";
}

function DatoPerfil({ etiqueta, valor, cargando }) {
    return (
        <div>
            <p className="text-xs text-ink/50">{etiqueta}</p>
            <p className="text-ink mt-1 font-medium break-words">
                {cargando ? "Consultando..." : valor || "No informado"}
            </p>
        </div>
    );
}

function MiPerfil() {
    const usuario = useAuthStore(function (estado) { return estado.usuario; });
    const actualizarPerfilCliente = useAuthStore(function (estado) { return estado.actualizarPerfilCliente; });
    const [cargandoPerfil, setCargandoPerfil] = useState(true);
    const [errorPerfil, setErrorPerfil] = useState("");
    const [editandoPerfil, setEditandoPerfil] = useState(false);
    const [mensajePerfil, setMensajePerfil] = useState("");
    const [mensajeContrasena, setMensajeContrasena] = useState("");
    const hayUsuario = Boolean(usuario);

    const {
        register: registrarPerfil,
        handleSubmit: enviarPerfil,
        reset: resetPerfil,
        formState: { errors: erroresPerfil }
    } = useForm({
        resolver: yupResolver(perfilSchema),
        defaultValues: obtenerValoresPerfil(usuario)
    });

    const {
        register: registrarContrasena,
        handleSubmit: enviarContrasena,
        reset: resetContrasena,
        formState: { errors: erroresContrasena }
    } = useForm({
        resolver: yupResolver(cambiarContrasenaSchema),
        defaultValues: VALORES_CONTRASENA_VACIOS
    });

    const {
        cargando: guardandoPerfil,
        error: errorGuardarPerfil,
        ejecutar: ejecutarGuardarPerfil,
        setError: setErrorGuardarPerfil
    } = usePeticion(actualizarPerfilUsuario, {
        obtenerMensajeError: obtenerMensajeErrorPerfil
    });

    const {
        cargando: cambiandoContrasena,
        error: errorCambiarContrasena,
        ejecutar: ejecutarCambiarContrasena
    } = usePeticion(cambiarContrasenaUsuario, {
        obtenerMensajeError: obtenerMensajeErrorContrasena
    });

    useEffect(function () {
        if (!hayUsuario) return undefined;

        let activo = true;

        obtenerPerfilUsuario().then(function (perfil) {
            if (!activo) return;
            actualizarPerfilCliente(perfil);
            resetPerfil(obtenerValoresPerfil(perfil));
        }).catch(function (error) {
            if (activo) {
                setErrorPerfil(obtenerMensajeErrorPerfil(error));
            }
        }).finally(function () {
            if (activo) setCargandoPerfil(false);
        });

        return function () { activo = false; };
    }, [actualizarPerfilCliente, hayUsuario, resetPerfil]);

    function iniciarEdicion() {
        setMensajePerfil("");
        setErrorGuardarPerfil(null);
        resetPerfil(obtenerValoresPerfil(usuario));
        setEditandoPerfil(true);
    }

    function cancelarEdicion() {
        setErrorGuardarPerfil(null);
        resetPerfil(obtenerValoresPerfil(usuario));
        setEditandoPerfil(false);
    }

    async function manejarGuardarPerfil(datos) {
        setMensajePerfil("");

        try {
            const perfilActualizado = await ejecutarGuardarPerfil({
                nombre: datos.nombre.trim(),
                apellido: datos.apellido.trim(),
                dni: datos.dni.trim(),
                email: datos.email.trim()
            });

            actualizarPerfilCliente(perfilActualizado);
            resetPerfil(obtenerValoresPerfil(perfilActualizado));
            setEditandoPerfil(false);
            setMensajePerfil("Tus datos se actualizaron correctamente.");
        } catch {
            // usePeticion conserva el mensaje de error para mostrarlo.
        }
    }

    async function manejarCambiarContrasena(datos) {
        setMensajeContrasena("");

        try {
            await ejecutarCambiarContrasena({
                contrasenaActual: datos.contrasenaActual,
                contrasenaNueva: datos.contrasenaNueva,
                confirmarContrasena: datos.confirmarContrasena
            });

            resetContrasena(VALORES_CONTRASENA_VACIOS);
            setMensajeContrasena("Tu contraseña se actualizó correctamente.");
        } catch {
            // usePeticion conserva el mensaje de error para mostrarlo.
        }
    }

    if (!usuario) {
        return (
            <div className="min-h-screen bg-paper flex items-center justify-center px-6">
                <Card className="max-w-md w-full text-center p-8">
                    <EmptyState
                        icono={UserX}
                        titulo="No iniciaste sesión"
                        descripcion="Iniciá sesión para consultar y editar tus datos."
                        accion={
                            <Link to="/login-cliente">
                                <Button>Iniciar sesión</Button>
                            </Link>
                        }
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-paper flex flex-col">
            <EncabezadoCliente />
            <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 flex-1">
                <Card className="p-6 sm:p-8">
                    <PageHeader
                        etiqueta="Mi perfil"
                        titulo={`${usuario.nombre} ${usuario.apellido || ""}`.trim()}
                        descripcion="Administrá tus datos personales y la seguridad de tu cuenta."
                        className="mb-6"
                    />

                    {cargandoPerfil && (
                        <p role="status" className="mb-5 text-xs text-ink/50">
                            Actualizando datos del perfil...
                        </p>
                    )}

                    {errorPerfil && <Alert tipo="error" texto={errorPerfil} className="mb-5" />}
                    {mensajePerfil && <Alert tipo="success" texto={mensajePerfil} className="mb-5" />}
                    {errorGuardarPerfil && <Alert tipo="error" texto={errorGuardarPerfil} className="mb-5" />}

                    {editandoPerfil ? (
                        <form noValidate onSubmit={enviarPerfil(manejarGuardarPerfil)} className="border-t border-line pt-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input
                                    label="Nombre"
                                    autoComplete="given-name"
                                    required
                                    error={erroresPerfil.nombre}
                                    {...registrarPerfil("nombre")}
                                />
                                <Input
                                    label="Apellido"
                                    autoComplete="family-name"
                                    required
                                    error={erroresPerfil.apellido}
                                    {...registrarPerfil("apellido")}
                                />
                                <Input
                                    label="DNI"
                                    autoComplete="off"
                                    required
                                    error={erroresPerfil.dni}
                                    {...registrarPerfil("dni")}
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    error={erroresPerfil.email}
                                    {...registrarPerfil("email")}
                                />
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Button
                                    type="submit"
                                    loading={guardandoPerfil}
                                    loadingText="Guardando..."
                                >
                                    Guardar cambios
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={cancelarEdicion}
                                    disabled={guardandoPerfil}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <div className="grid gap-5 sm:grid-cols-2 font-mono-ticket text-sm border-t border-line pt-6">
                                <DatoPerfil etiqueta="Nombre" valor={usuario.nombre} cargando={cargandoPerfil} />
                                <DatoPerfil etiqueta="Apellido" valor={usuario.apellido} cargando={cargandoPerfil} />
                                <DatoPerfil etiqueta="DNI" valor={usuario.dni} cargando={cargandoPerfil} />
                                <DatoPerfil etiqueta="Email" valor={usuario.email} cargando={cargandoPerfil} />
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Button onClick={iniciarEdicion} icon={Pencil}>
                                    Editar datos
                                </Button>
                            </div>
                        </>
                    )}
                </Card>

                <Card className="p-6 sm:p-8 mt-6">
                    <PageHeader
                        etiqueta="Seguridad"
                        titulo="Cambiar contraseña"
                        descripcion="Ingresá tu contraseña actual para definir una nueva."
                        className="mb-6"
                    />

                    {mensajeContrasena && <Alert tipo="success" texto={mensajeContrasena} className="mb-5" />}
                    {errorCambiarContrasena && <Alert tipo="error" texto={errorCambiarContrasena} className="mb-5" />}

                    <form noValidate onSubmit={enviarContrasena(manejarCambiarContrasena)} className="border-t border-line pt-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Contraseña actual"
                                type="password"
                                autoComplete="current-password"
                                containerClassName="sm:col-span-2"
                                required
                                error={erroresContrasena.contrasenaActual}
                                {...registrarContrasena("contrasenaActual")}
                            />
                            <Input
                                label="Nueva contraseña"
                                type="password"
                                autoComplete="new-password"
                                hint="Mínimo 6 caracteres."
                                required
                                error={erroresContrasena.contrasenaNueva}
                                {...registrarContrasena("contrasenaNueva")}
                            />
                            <Input
                                label="Confirmar nueva contraseña"
                                type="password"
                                autoComplete="new-password"
                                required
                                error={erroresContrasena.confirmarContrasena}
                                {...registrarContrasena("confirmarContrasena")}
                            />
                        </div>

                        <div className="mt-6">
                            <Button
                                type="submit"
                                loading={cambiandoContrasena}
                                loadingText="Actualizando..."
                                icon={KeyRound}
                            >
                                Actualizar contraseña
                            </Button>
                        </div>
                    </form>
                </Card>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link to="/historial">
                        <Button variant="secondary">Historial de compras</Button>
                    </Link>
                    <Link to="/catalogo">
                        <Button variant="secondary">Ir al catálogo</Button>
                    </Link>
                    <Link to="/carrito">
                        <Button variant="secondary">Ver carrito</Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}

export default MiPerfil;
