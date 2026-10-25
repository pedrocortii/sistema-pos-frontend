import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { checkoutSchema } from "../validations/checkoutSchema";
import { crearVenta } from "../api/ventas";
import { useCarritoStore } from "../store/carritoStore";
import { useAuthStore } from "../store/authStore";
import EncabezadoCliente from "../components/EncabezadoCliente";
import ImagenProducto from "../components/ImagenProducto";
import SelectorCantidad from "../components/SelectorCantidad";
import { PageHeader } from "../components/ui/PageHeader";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { EmptyState } from "../components/ui/EmptyState";
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
                        <div className="bg-ticket border border-line divide-y divide-line">
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
                                                ${item.precio.toFixed(2)} x {item.cantidad}  
                                            </p>
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

                        <div className="flex items-center justify-between mt-8 border-t border-line pt-5">
                            <span className="font-mono-ticket text-sm text-ink/60">
                                Total
                            </span>
                            <span className="font-mono-ticket text-4xl text-forest font-bold">
                                ${obtenerTotal().toFixed(2)}
                            </span>
                        </div>

                        <section className="mt-10">
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
                                </div>

                                {error && <Alert tipo="error" texto={error} className="mt-5" />}

                                <Button
                                    type="submit"
                                    size="xl"
                                    loading={cargando}
                                    loadingText="Procesando..."
                                    icon={ShoppingBag}
                                    className="mt-6"
                                >
                                    Confirmar compra
                                </Button>
                            </form>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}

export default Carrito;
