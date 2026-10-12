import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { checkoutSchema } from "../validations/checkoutSchema";
import { crearVenta } from "../api/ventas";
import { useCarritoStore } from "../store/carritoStore";
import { useAuthStore } from "../store/authStore";
import EncabezadoCliente from "../components/EncabezadoCliente";
import MensajeError from "../components/MensajeError";
import { usePeticion } from "../hooks/usePeticion";

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
    const setUltimoComprobante = useCarritoStore(function (estado) { return estado.setUltimoComprobante; });
    const obtenerTotal = useCarritoStore(function (estado) { return estado.obtenerTotal; });
    const usuario = useAuthStore(function (estado) { return estado.usuario; });
    const actualizarPerfilCliente = useAuthStore(function (estado) { return estado.actualizarPerfilCliente; });
    const dniCliente = usuario?.dni ?? usuario?.documento ?? usuario?.DNI ?? usuario?.clienteDni ?? "";

    const { cargando, error, ejecutar: confirmarCompra } = usePeticion(crearVenta, { obtenerMensajeError: obtenerErrorCheckout });

    const navegar = useNavigate();

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
            confirmarEmail: usuario?.email || ""
        }
    });

    useEffect(function () {
        reset({
            nombre: usuario?.nombre || "",
            apellido: usuario?.apellido || "",
            dni: dniCliente,
            email: usuario?.email || "",
            confirmarEmail: usuario?.email || ""
        });
    }, [usuario, dniCliente, reset]);

    async function manejarConfirmarCompra(datosFactura) {
        const itemsParaEnviar = items.map(function (item) {
            return { productoId: item.productoId, cantidad: item.cantidad };
        });

        const payload = {
            items: itemsParaEnviar,
            cliente: {
                nombre: datosFactura.nombre.trim(),
                apellido: datosFactura.apellido.trim(),
                dni: datosFactura.dni.trim(),
                email: datosFactura.email.trim(),
                confirmarEmail: datosFactura.confirmarEmail.trim()
            },
            metodoPago: "MercadoPago"
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
            // El hook mantiene el mensaje visible para la persona usuaria.
        }
    }

    return (
        <div className="min-h-screen bg-paper">
            <EncabezadoCliente />

            <main className="max-w-3xl mx-auto px-6 py-10">
                <p className="font-mono-ticket text-xs tracking-[0.25em] uppercase text-ink/50">
                    Tu compra
                </p>
                <h1 className="font-display text-4xl text-ink mt-1 mb-8">
                    Carrito
                </h1>

                {items.length === 0 && (
                    <div className="text-center py-16">
                        <p className="font-mono-ticket text-sm text-ink/60 mb-6">
                            Todavia no agregaste productos.
                        </p>
                        <Link to="/catalogo" className="text-forest underline font-mono-ticket text-sm">
                            Ir al catalogo
                        </Link>
                    </div>
                )}

                {items.length > 0 && (
                    <>
                        <div className="bg-ticket border border-line divide-y divide-line">
                            {items.map(function (item) {
                                return (
                                    <div key={item.productoId} className="flex items-center justify-between gap-4 p-5">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-display text-2xl leading-tight text-ink">{item.nombre}</p>
                                            <p className="font-mono-ticket text-sm text-ink/60 mt-1">
                                                ${item.precio.toFixed(2)} x {item.cantidad}  
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 ml-auto">
                                            <div className="flex items-center gap-3 border border-line bg-paper px-2 py-1">
                                                <button
                                                    onClick={function () { cambiarCantidad(item.productoId, item.cantidad - 1); }}
                                                    className="w-8 h-8 border border-line text-ink flex items-center justify-center transition-colors hover:bg-forest/5"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="font-mono-ticket text-xl w-7 text-center text-ink leading-none">
                                                    {item.cantidad}
                                                </span>
                                                <button
                                                    onClick={function () { cambiarCantidad(item.productoId, item.cantidad + 1); }}
                                                    className="w-8 h-8 border border-line text-ink flex items-center justify-center transition-colors hover:bg-forest/5"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <span className="font-mono-ticket text-2xl text-ink min-w-[110px] text-right">
                                                ${(item.precio * item.cantidad).toFixed(2)}
                                            </span>
                                            <button
                                                onClick={function () { quitarProducto(item.productoId); }}
                                                className="text-red-600 hover:text-red-700 transition-colors"
                                                title="Quitar del carrito"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between mt-8 border-t border-line pt-5">
                            <span className="font-mono-ticket text-sm uppercase tracking-wide text-ink/60">
                                Total
                            </span>
                            <span className="font-mono-ticket text-4xl text-forest">
                                ${obtenerTotal().toFixed(2)}
                            </span>
                        </div>

                        <section className="mt-10">
                            <p className="font-mono-ticket text-xs tracking-[0.25em] uppercase text-ink/50">
                                Paso final
                            </p>
                            <h2 className="font-display text-2xl text-ink mt-1 mb-4">
                                Datos para la factura
                            </h2>
                            <p className="font-mono-ticket text-xs text-ink/60 mb-5">
                                {usuario && usuario.rol === "Cliente"
                                    ? "Podés editar tus datos para esta compra y quedarán guardados en tu perfil."
                                    : "No necesitas crear cuenta. Solo completa estos datos para emitir el comprobante."}
                            </p>

                            <form onSubmit={handleSubmit(manejarConfirmarCompra)}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                                            Nombre
                                        </label>
                                        <input
                                            type="text"
                                            {...register("nombre")}
                                            className="w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors"
                                        />
                                        {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre.message}</p>}
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                                            Apellido
                                        </label>
                                        <input
                                            type="text"
                                            {...register("apellido")}
                                            className="w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors"
                                        />
                                        {errors.apellido && <p className="mt-1 text-xs text-red-600">{errors.apellido.message}</p>}
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                                            DNI
                                        </label>
                                        <input
                                            type="text"
                                            {...register("dni")}
                                            className="w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors"
                                        />
                                        {errors.dni && <p className="mt-1 text-xs text-red-600">{errors.dni.message}</p>}
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            {...register("email")}
                                            className="w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors"
                                            placeholder="tucorreo@ejemplo.com"
                                        />
                                        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                                            Confirmar email
                                        </label>
                                        <input
                                            type="email"
                                            {...register("confirmarEmail")}
                                            className="w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors"
                                            placeholder="Repite tu correo"
                                        />
                                        {errors.confirmarEmail && <p className="mt-1 text-xs text-red-600">{errors.confirmarEmail.message}</p>}
                                    </div>
                                </div>

                                {error && <MensajeError texto={error} className="mt-4" />}

                                <button
                                    type="submit"
                                    disabled={cargando}
                                    className="w-full mt-6 bg-forest hover:bg-forest-dark disabled:opacity-60 text-paper font-mono-ticket text-sm uppercase tracking-wide py-4 transition-colors flex items-center justify-center gap-2"
                                >
                                    <ShoppingBag size={18} />
                                    {cargando ? "Procesando..." : "Confirmar compra"}
                                </button>
                            </form>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}

export default Carrito;
