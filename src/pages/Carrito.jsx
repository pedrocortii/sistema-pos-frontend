import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useCallback, useEffect, useRef, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { checkoutSchema } from "../validations/checkoutSchema";
import { crearVenta } from "../api/ventas";
import { obtenerProducto } from "../api/productos";
import { consultarDisponibilidadRetiro } from "../api/retiros";
import { useCarritoStore } from "../store/carritoStore";
import { useAuthStore } from "../store/authStore";
import EncabezadoCliente from "../components/EncabezadoCliente";
import ImagenProducto from "../components/ImagenProducto";
import SelectorCantidad from "../components/SelectorCantidad";
import { PageHeader } from "../components/ui/PageHeader";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { EmptyState } from "../components/ui/EmptyState";
import { usePeticion } from "../hooks/usePeticion";
import { formatearFechaRetiro } from "../utils/retiro";
import { formatoMonedaARS } from "../utils/moneda";

function describirCambiosCarrito(cambios) {
    const mensajes = [];
    if (cambios.eliminados.length > 0) {
        mensajes.push("Se quitaron productos que ya no están disponibles: " + cambios.eliminados.join(", ") + ".");
    }
    if (cambios.cantidadesAjustadas.length > 0) {
        mensajes.push("Se ajustaron cantidades por falta de stock: " + cambios.cantidadesAjustadas.map(function (item) {
            return `${item.nombre} (${item.anterior} → ${item.actual})`;
        }).join(", ") + ".");
    }
    if (cambios.preciosActualizados.length > 0) {
        mensajes.push("Se actualizaron precios según el catálogo actual: " + cambios.preciosActualizados.map(function (item) {
            return `${item.nombre} (${formatoMonedaARS.format(item.anterior)} → ${formatoMonedaARS.format(item.actual)})`;
        }).join(", ") + ".");
    }
    return mensajes;
}

function obtenerErrorCheckout(error) {
    const datos = error.response?.data;

    if (Array.isArray(datos?.errores) && datos.errores.length > 0) {
        return datos.errores.map(function (item) { return item.message || item; }).join(". ");
    }
    if (Array.isArray(datos?.errors) && datos.errors.length > 0) {
        return datos.errors.map(function (item) { return item.message || item; }).join(". ");
    }
    return datos?.mensaje || "No se pudo completar la compra. Intenta de nuevo.";
}

function Carrito() {
    const items = useCarritoStore(function (estado) { return estado.items; });
    const cambiarCantidad = useCarritoStore(function (estado) { return estado.cambiarCantidad; });
    const quitarProducto = useCarritoStore(function (estado) { return estado.quitarProducto; });
    const vaciarCarrito = useCarritoStore(function (estado) { return estado.vaciarCarrito; });
    const reconciliarProductos = useCarritoStore(function (estado) { return estado.reconciliarProductos; });
    const setUltimoComprobante = useCarritoStore(function (estado) { return estado.setUltimoComprobante; });
    const obtenerTotal = useCarritoStore(function (estado) { return estado.obtenerTotal; });
    const usuario = useAuthStore(function (estado) { return estado.usuario; });
    const actualizarPerfilCliente = useAuthStore(function (estado) { return estado.actualizarPerfilCliente; });
    const [fechasDisponibles, setFechasDisponibles] = useState([]);
    const [fechaRetiro, setFechaRetiro] = useState("");
    const [horaRetiro, setHoraRetiro] = useState("");
    const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(true);
    const [errorDisponibilidad, setErrorDisponibilidad] = useState(null);
    const [validacionCargando, setValidacionCargando] = useState(false);
    const [validacionLista, setValidacionLista] = useState(false);
    const [errorValidacion, setErrorValidacion] = useState("");
    const [avisosCarrito, setAvisosCarrito] = useState([]);
    const ultimaFirmaValidada = useRef("");
    const dniCliente = usuario?.dni ?? usuario?.documento ?? usuario?.DNI ?? usuario?.clienteDni ?? "";
    const promocionesNoAplicables = items.filter(function (item) { return item.promocionNoAplicable; });

    const { cargando, error, ejecutar: confirmarCompra } = usePeticion(crearVenta, { obtenerMensajeError: obtenerErrorCheckout });

    const navegar = useNavigate();
    const horariosDisponibles = fechasDisponibles.find(function (fecha) {
        return fecha.fecha === fechaRetiro;
    })?.horarios || [];
    const horarioElegido = horariosDisponibles.find(function (horario) {
        return horario.horaInicio === horaRetiro;
    });
    const firmaCarrito = items.map(function (item) {
        return `${item.productoId}:${item.cantidad}`;
    }).join("|");

    const sincronizarCarrito = useCallback(async function () {
        const itemsActuales = useCarritoStore.getState().items;
        if (itemsActuales.length === 0) {
            setValidacionLista(true);
            setErrorValidacion("");
            return { ok: true, huboCambios: false };
        }

        setValidacionCargando(true);
        setErrorValidacion("");
        setValidacionLista(false);

        const resultados = await Promise.allSettled(itemsActuales.map(function (item) {
            return obtenerProducto(item.productoId);
        }));
        const productos = [];
        const noDisponibles = [];
        const errores = [];

        resultados.forEach(function (resultado, indice) {
            if (resultado.status === "fulfilled") {
                productos.push(resultado.value);
            } else if (resultado.reason.response?.status === 404) {
                noDisponibles.push(itemsActuales[indice].productoId);
            } else {
                errores.push(resultado.reason);
            }
        });

        if (errores.length > 0) {
            setErrorValidacion("No se pudo verificar el stock y el precio de todos los productos. Reintentá antes de confirmar la compra.");
            setValidacionCargando(false);
            return { ok: false, huboCambios: false };
        }

        const cambios = reconciliarProductos(productos, noDisponibles);
        const mensajes = describirCambiosCarrito(cambios);
        if (mensajes.length > 0) setAvisosCarrito(mensajes);
        setValidacionLista(true);
        setValidacionCargando(false);
        return {
            ok: true,
            huboCambios: mensajes.length > 0,
            cambios: cambios
        };
    }, [reconciliarProductos]);

    useEffect(function () {
        if (firmaCarrito.length === 0) {
            ultimaFirmaValidada.current = "";
            return undefined;
        }
        if (ultimaFirmaValidada.current === firmaCarrito) return undefined;

        ultimaFirmaValidada.current = firmaCarrito;
        sincronizarCarrito().catch(function () {
            ultimaFirmaValidada.current = "";
            setErrorValidacion("No se pudo verificar el carrito. Reintentá antes de confirmar la compra.");
            setValidacionCargando(false);
            setValidacionLista(false);
        });
        return undefined;
    }, [firmaCarrito, sincronizarCarrito]);

    useEffect(function () {
        let activo = true;
        consultarDisponibilidadRetiro().then(function (respuesta) {
            if (activo) setFechasDisponibles(respuesta.fechas || []);
        }).catch(function (errorPeticion) {
            if (activo) {
                setErrorDisponibilidad(
                    errorPeticion.response?.data?.mensaje || "No se pudo consultar la disponibilidad de retiro."
                );
            }
        }).finally(function () {
            if (activo) setCargandoDisponibilidad(false);
        });
        return function () { activo = false; };
    }, []);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(checkoutSchema),
        defaultValues: {
            nombre: usuario?.nombre || "",
            apellido: usuario?.apellido || "",
            dni: dniCliente,
            email: usuario?.email || "",
            confirmarEmail: usuario?.email || "",
            nombrePersonalizado: ""
        }
    });

    useEffect(function () {
        reset({
            nombre: usuario?.nombre || "",
            apellido: usuario?.apellido || "",
            dni: dniCliente,
            email: usuario?.email || "",
            confirmarEmail: usuario?.email || "",
            nombrePersonalizado: ""
        });
    }, [usuario, dniCliente, reset]);

    async function manejarConfirmarCompra(datosFactura) {
        const validacion = await sincronizarCarrito();
        if (!validacion.ok) return;
        if (validacion.huboCambios) return;

        if (!fechaRetiro || !horarioElegido) {
            setErrorDisponibilidad("Seleccioná una fecha y un horario de retiro disponibles.");
            return;
        }

        const itemsParaEnviar = useCarritoStore.getState().items.map(function (item) {
            return { productoId: item.productoId, cantidad: item.cantidad };
        });

        const nombrePersonalizado = (datosFactura.nombrePersonalizado || "").trim();

        const payload = {
            items: itemsParaEnviar,
            cliente: {
                nombre: datosFactura.nombre.trim(),
                apellido: datosFactura.apellido.trim(),
                dni: datosFactura.dni.trim(),
                email: datosFactura.email.trim(),
                confirmarEmail: datosFactura.confirmarEmail.trim()
            },
            nombrePersonalizado: nombrePersonalizado || undefined,
            metodoPago: "MercadoPago",
            retiro: {
                fecha: fechaRetiro,
                horaInicio: horarioElegido.horaInicio,
                horaFin: horarioElegido.horaFin
            }
        };

        try {
            if (usuario && usuario.rol === "Cliente") {
                actualizarPerfilCliente({
                    nombre: datosFactura.nombre.trim(),
                    apellido: datosFactura.apellido.trim(),
                    dni: datosFactura.dni.trim(),
                    email: datosFactura.email.trim()
                });
            }

            const venta = await confirmarCompra(payload);
            setUltimoComprobante({
                codigo: venta.codigoComprobante,
                estado: venta.estado,
                total: venta.total
            });
            vaciarCarrito();
            navegar("/comprobante/" + venta.codigoComprobante, { replace: true });
        } catch {
            await sincronizarCarrito();
            try {
                const disponibilidad = await consultarDisponibilidadRetiro();
                setFechasDisponibles(disponibilidad.fechas || []);
                if (!disponibilidad.fechas?.some(function (fecha) {
                    return fecha.fecha === fechaRetiro && fecha.horarios.some(function (horario) {
                        return horario.horaInicio === horaRetiro;
                    });
                })) {
                    setFechaRetiro("");
                    setHoraRetiro("");
                }
            } catch (errorPeticion) {
                setErrorDisponibilidad(
                    errorPeticion.response?.data?.mensaje || "No se pudo actualizar la disponibilidad de retiro."
                );
            }
        }
    }

    return (
        <div className="min-h-screen bg-paper">
            <EncabezadoCliente />

            <main className="max-w-3xl mx-auto px-6 py-10">
                <PageHeader
                    etiqueta="Tu compra"
                    titulo="Carrito"
                    className="mb-8"
                />

                {items.length === 0 && (
                    <EmptyState
                        icono={ShoppingBag}
                        titulo="Tu carrito está vacío"
                        descripcion="Todavía no agregaste productos a tu compra."
                        accion={
                            <Link to="/catalogo">
                                <Button>Ir al catálogo</Button>
                            </Link>
                        }
                    />
                )}

                {items.length > 0 && (
                    <>
                        <div className="bg-ticket border border-line">
                            <div className="divide-y divide-line">
                                {items.map(function (item) {
                                    return (
                                        <div key={item.productoId} className="flex items-center justify-between gap-4 p-5">
                                        <ImagenProducto
                                            imagen={item.imagen}
                                            alt={"Imagen de " + item.nombre}
                                            className="h-14 w-14 shrink-0 rounded border border-line object-cover"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-display text-2xl leading-tight text-ink">{item.nombre}</p>
                                            <p className="font-mono-ticket text-sm text-ink/60 mt-1">
                                                {item.precioOriginal > item.precio && <span className="mr-2 line-through">${item.precioOriginal.toFixed(2)}</span>}
                                                ${item.precio.toFixed(2)} x {item.cantidad}
                                            </p>
                                            {item.promocion && item.promocionNoAplicable === null && (
                                                <p className="font-mono-ticket text-xs text-forest mt-1">
                                                    {item.promocion.titulo}: ahorrás ${((item.precioOriginal - item.precio) * item.cantidad).toFixed(2)}
                                                </p>
                                            )}
                                            {item.promocionNoAplicable && (
                                                <p role="alert" className="mt-1 text-xs text-red-700">
                                                    {item.promocionNoAplicable.mensaje}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 ml-auto">
                                            <div className="border border-line bg-paper px-2 py-1">
                                                <SelectorCantidad
                                                    cantidad={item.cantidad}
                                                    minimo={1}
                                                    size="sm"
                                                    onCambiar={function (nueva) {
                                                        cambiarCantidad(item.productoId, nueva);
                                                    }}
                                                />
                                            </div>
                                            <span className="font-mono-ticket text-2xl text-ink min-w-[110px] text-right">
                                                ${(item.precio * item.cantidad).toFixed(2)}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={function () { quitarProducto(item.productoId); }}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                title="Quitar del carrito"
                                                aria-label={"Quitar " + item.nombre}
                                            >
                                                <Trash2 size={18} />
                                            </Button>
                                        </div>
                                        </div>
                                    );
                                })}
                            </div>

                        <div className="flex items-center justify-between border-t border-line p-5">
                            <span className="font-mono-ticket text-sm text-ink/60">
                                Total
                            </span>
                            <span className="font-mono-ticket text-4xl text-forest font-bold">
                                ${obtenerTotal().toFixed(2)}
                            </span>
                        </div>

                        {validacionCargando && (
                            <p role="status" className="border-t border-line px-5 py-3 text-sm text-ink/60">
                                Verificando disponibilidad y precios actuales...
                            </p>
                        )}
                        {errorValidacion && (
                            <Alert tipo="error" texto={errorValidacion} className="m-5" />
                        )}
                        {avisosCarrito.length > 0 && (
                            <Alert tipo="warning" titulo="Revisá los cambios en tu carrito" className="m-5">
                                <ul className="list-disc space-y-1 pl-5">
                                    {avisosCarrito.map(function (mensaje) {
                        return <li key={mensaje}>{mensaje}</li>;
                                    })}
                                </ul>
                                {items.length > 0 && (
                                    <p className="mt-2">Revisá el total actualizado y confirmá nuevamente.</p>
                                )}
                            </Alert>
                        )}

                        <section className="border-t border-line p-5 sm:p-6">
                            <p className="font-mono-ticket text-xs text-forest">
                                Paso final
                            </p>
                            <h2 className="font-display text-2xl text-ink mt-1 mb-2">
                                Datos para la factura
                            </h2>
                            <p className="font-mono-ticket text-xs text-ink/60 mb-5">
                                {usuario && usuario.rol === "Cliente"
                                    ? "Podés editar tus datos para esta compra y quedarán guardados en tu perfil."
                                    : "No necesitas crear cuenta. Solo completa estos datos para emitir el comprobante."}
                            </p>

                            <form onSubmit={handleSubmit(manejarConfirmarCompra)}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input
                                        label="Nombre"
                                        variant="line"
                                        {...register("nombre")}
                                        error={errors.nombre}
                                    />
                                    <Input
                                        label="Apellido"
                                        variant="line"
                                        {...register("apellido")}
                                        error={errors.apellido}
                                    />
                                    <Input
                                        label="DNI"
                                        variant="line"
                                        {...register("dni")}
                                        error={errors.dni}
                                    />
                                    <Input
                                        label="Email"
                                        type="email"
                                        variant="line"
                                        placeholder="tucorreo@ejemplo.com"
                                        {...register("email")}
                                        error={errors.email}
                                    />
                                    <div className="sm:col-span-2">
                                        <Input
                                            label="Confirmar email"
                                            type="email"
                                            variant="line"
                                            placeholder="Repite tu correo"
                                            {...register("confirmarEmail")}
                                            error={errors.confirmarEmail}
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Input
                                            label="Nombre para tu compra"
                                            variant="line"
                                            placeholder="Ej.: Compra semanal"
                                            {...register("nombrePersonalizado")}
                                            error={errors.nombrePersonalizado}
                                        />
                                        <p className="mt-1 font-mono-ticket text-[11px] text-ink/60">
                                            Opcional. Te ayuda a identificar esta compra en tu historial.
                                        </p>
                                    </div>
                                </div>

                                <section className="mt-6 border-t border-line pt-5">
                                    <p className="font-mono-ticket text-xs text-forest">Retiro en el comercio</p>
                                    <h3 className="font-display text-xl text-ink mt-1 mb-2">
                                        Fecha y horario de retiro
                                    </h3>
                                    <p className="font-mono-ticket text-xs text-ink/60 mb-4">
                                        Elegí un turno habilitado. La disponibilidad se verifica nuevamente al confirmar la compra.
                                    </p>

                                    {cargandoDisponibilidad ? (
                                        <p role="status" className="text-sm text-ink/60">Consultando fechas disponibles...</p>
                                    ) : fechasDisponibles.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Select
                                                label="Fecha"
                                                value={fechaRetiro}
                                                onChange={function (evento) {
                                                    setFechaRetiro(evento.target.value);
                                                    setHoraRetiro("");
                                                }}
                                                required
                                            >
                                                <option value="">Seleccioná una fecha</option>
                                                {fechasDisponibles.map(function (fecha) {
                                                    return (
                                                        <option key={fecha.fecha} value={fecha.fecha}>
                                                            {formatearFechaRetiro(fecha.fecha, true)}
                                                        </option>
                                                    );
                                                })}
                                            </Select>
                                            <Select
                                                label="Horario"
                                                value={horaRetiro}
                                                onChange={function (evento) { setHoraRetiro(evento.target.value); }}
                                                disabled={!fechaRetiro}
                                                required
                                            >
                                                <option value="">Seleccioná un horario</option>
                                                {horariosDisponibles.map(function (horario) {
                                                    return (
                                                        <option key={horario.horaInicio} value={horario.horaInicio}>
                                                            {horario.horaInicio} a {horario.horaFin}
                                                        </option>
                                                    );
                                                })}
                                            </Select>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-ink/60">
                                            {errorDisponibilidad || "El comercio todavía no configuró fechas y horarios de retiro."}
                                        </p>
                                    )}

                                    {horarioElegido && (
                                        <div className="mt-4 border border-forest/20 bg-forest/5 p-3 text-sm">
                                            <p className="font-semibold text-forest">Retiro programado</p>
                                            <p>Fecha de retiro: {formatearFechaRetiro(fechaRetiro)}</p>
                                            <p>Horario: {horarioElegido.horaInicio} a {horarioElegido.horaFin}</p>
                                        </div>
                                    )}
                                    {errorDisponibilidad && fechasDisponibles.length > 0 && (
                                        <Alert tipo="error" texto={errorDisponibilidad} className="mt-4" />
                                    )}
                                </section>

                                {error && <Alert tipo="error" texto={error} className="mt-5" />}
                                {errorValidacion && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={validacionCargando}
                                        onClick={function () {
                                            ultimaFirmaValidada.current = "";
                                            sincronizarCarrito();
                                        }}
                                        className="mt-4"
                                    >
                                        Reintentar validación
                                    </Button>
                                )}
                                {promocionesNoAplicables.length > 0 && (
                                    <Alert
                                        tipo="error"
                                        texto="La acción no se puede realizar: corregí las promociones indicadas antes de confirmar la compra."
                                        className="mt-5"
                                    />
                                )}

                                <Button
                                    type="submit"
                                    size="xl"
                                    loading={cargando}
                                    loadingText="Procesando..."
                                    icon={ShoppingBag}
                                    disabled={
                                        promocionesNoAplicables.length > 0 ||
                                        !horarioElegido ||
                                        cargandoDisponibilidad ||
                                        validacionCargando ||
                                        !validacionLista ||
                                        Boolean(errorValidacion)
                                    }
                                    className="mt-6"
                                >
                                    Confirmar compra
                                </Button>
                            </form>
                        </section>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default Carrito;
