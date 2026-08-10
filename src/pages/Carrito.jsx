import { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import http from "../api/http";
import { useCarritoStore } from "../store/carritoStore";
import EncabezadoCliente from "../components/EncabezadoCliente";

function Carrito() {
    const items = useCarritoStore(function (estado) { return estado.items; });
    const cambiarCantidad = useCarritoStore(function (estado) { return estado.cambiarCantidad; });
    const quitarProducto = useCarritoStore(function (estado) { return estado.quitarProducto; });
    const vaciarCarrito = useCarritoStore(function (estado) { return estado.vaciarCarrito; });
    const obtenerTotal = useCarritoStore(function (estado) { return estado.obtenerTotal; });

    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);
    const [comprobante, setComprobante] = useState(null);

    // Datos fiscales del cliente para la factura (cliente anonimo).
    const [datosFactura, setDatosFactura] = useState({
        nombre: "",
        apellido: "",
        dni: "",
        email: ""
    });

    function manejarCambioDato(campo, valor) {
        setDatosFactura(function (prev) {
            return { ...prev, [campo]: valor };
        });
    }

    function datosFacturaValidos() {
        return datosFactura.nombre.trim() !== ""
            && datosFactura.apellido.trim() !== ""
            && datosFactura.dni.trim() !== ""
            && datosFactura.email.trim() !== "";
    }

    async function manejarConfirmarCompra() {
        setError("");

        if (!datosFacturaValidos()) {
            setError("Completa todos los datos para la factura antes de confirmar.");
            return;
        }

        setCargando(true);

        const itemsParaEnviar = items.map(function (item) {
            return { productoId: item.productoId, cantidad: item.cantidad };
        });

        const payload = {
            items: itemsParaEnviar,
            cliente: {
                nombre: datosFactura.nombre.trim(),
                apellido: datosFactura.apellido.trim(),
                dni: datosFactura.dni.trim(),
                email: datosFactura.email.trim()
            }
        };

        try {
            const respuesta = await http.post("/ventas", payload);
            const venta = respuesta.data.venta;
            vaciarCarrito();
            setComprobante({
                codigo: venta.codigoComprobante,
                ventaId: venta.id,
                total: venta.total
            });
        } catch (error) {
            const datos = error.response && error.response.data;
            let mensaje = "No se pudo completar la compra. Intenta de nuevo.";

            if (datos) {
                if (Array.isArray(datos.errores) && datos.errores.length > 0) {
                    mensaje = datos.errores.map(function (e) { return e.message || e; }).join(". ");
                } else if (Array.isArray(datos.errors) && datos.errors.length > 0) {
                    mensaje = datos.errors.map(function (e) { return e.message || e; }).join(". ");
                } else if (datos.mensaje) {
                    mensaje = datos.mensaje;
                }
            }
            setError(mensaje);
        } finally {
            setCargando(false);
        }
    }

    async function manejarCancelarComprobante() {
        if (!comprobante) return;
        setError("");
        setCargando(true);

        try {
            await http.patch("/ventas/" + comprobante.ventaId + "/cancelar", {});
            setComprobante(null);
        } catch (error) {
            const mensaje = error.response && error.response.data && error.response.data.mensaje
                ? error.response.data.mensaje
                : "No se pudo cancelar la venta.";
            setError(mensaje);
        } finally {
            setCargando(false);
        }
    }

    if (comprobante) {
        return (
            <div className="min-h-screen bg-paper">
                <EncabezadoCliente />
                <main className="max-w-2xl mx-auto px-6 py-20 text-center">
                    <p className="font-mono-ticket text-xs tracking-[0.25em] uppercase text-forest">
                        Compra registrada
                    </p>
                    <h1 className="font-display text-4xl text-ink mt-3">
                        Gracias por tu compra
                    </h1>
                    <p className="font-mono-ticket text-sm text-ink/60 mt-3">
                        Tu venta quedo en estado <span className="font-bold">PENDIENTE</span>.
                        Un cajero se encargara del cobro.
                    </p>

                    <div className="bg-ticket border border-line p-6 mt-8 inline-block">
                        <p className="font-mono-ticket text-xs uppercase tracking-wide text-ink/50">
                            Codigo de comprobante
                        </p>
                        <p className="font-mono-ticket text-xl text-ink mt-1">
                            {comprobante.codigo}
                        </p>
                        <p className="font-mono-ticket text-xs text-ink/50 mt-4">
                            Total: ${Number(comprobante.total).toFixed(2)}
                        </p>
                    </div>

                    <p className="font-mono-ticket text-xs text-ink/50 mt-4">
                        Guarda este codigo para reimprimir tu comprobante mas tarde.
                    </p>

                    {error && (
                        <p className="font-mono-ticket text-sm text-red-600 mt-4">{error}</p>
                    )}

                    <div className="flex flex-col gap-3 mt-8">
                        <Link
                            to={"/comprobante/" + comprobante.codigo}
                            className="inline-block bg-forest hover:bg-forest-dark text-paper font-mono-ticket text-sm uppercase tracking-wide py-3 px-8 transition-colors no-underline"
                        >
                            Ver comprobante
                        </Link>
                        <button
                            onClick={manejarCancelarComprobante}
                            disabled={cargando}
                            className="font-mono-ticket text-sm uppercase tracking-wide text-red-600 hover:text-red-700 border-b-2 border-red-600 pb-1 self-center"
                        >
                            {cargando ? "Cancelando..." : "Cancelar compra"}
                        </button>
                        <Link
                            to="/catalogo"
                            className="font-mono-ticket text-sm uppercase tracking-wide text-forest border-b-2 border-forest pb-1 mt-2 self-center no-underline"
                        >
                            Seguir comprando
                        </Link>
                    </div>
                </main>
            </div>
        );
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
                                    <div key={item.productoId} className="flex items-center justify-between p-5">
                                        <div>
                                            <p className="font-display text-lg text-ink">{item.nombre}</p>
                                            <p className="font-mono-ticket text-xs text-ink/50">
                                                ${item.precio.toFixed(2)} c/u
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={function () { cambiarCantidad(item.productoId, item.cantidad - 1); }}
                                                    className="w-7 h-7 border border-line text-ink flex items-center justify-center"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="font-mono-ticket text-sm w-6 text-center">
                                                    {item.cantidad}
                                                </span>
                                                <button
                                                    onClick={function () { cambiarCantidad(item.productoId, item.cantidad + 1); }}
                                                    className="w-7 h-7 border border-line text-ink flex items-center justify-center"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <span className="font-mono-ticket text-sm text-ink w-20 text-right">
                                                ${(item.precio * item.cantidad).toFixed(2)}
                                            </span>
                                            <button
                                                onClick={function () { quitarProducto(item.productoId); }}
                                                className="text-red-600 hover:text-red-700"
                                                title="Quitar del carrito"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between mt-6">
                            <span className="font-mono-ticket text-sm uppercase tracking-wide text-ink/60">
                                Total
                            </span>
                            <span className="font-mono-ticket text-2xl text-forest">
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
                                No necesitas crear cuenta. Solo completa estos datos para emitir el comprobante.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                                        Nombre
                                    </label>
                                    <input
                                        type="text"
                                        value={datosFactura.nombre}
                                        onChange={function (e) { manejarCambioDato("nombre", e.target.value); }}
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
                                        value={datosFactura.apellido}
                                        onChange={function (e) { manejarCambioDato("apellido", e.target.value); }}
                                        required
                                        className="w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                                        DNI
                                    </label>
                                    <input
                                        type="text"
                                        value={datosFactura.dni}
                                        onChange={function (e) { manejarCambioDato("dni", e.target.value); }}
                                        required
                                        className="w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={datosFactura.email}
                                        onChange={function (e) { manejarCambioDato("email", e.target.value); }}
                                        required
                                        className="w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors"
                                        placeholder="tucorreo@ejemplo.com"
                                    />
                                </div>
                            </div>
                        </section>

                        {error && (
                            <p className="font-mono-ticket text-sm text-red-600 mt-4">{error}</p>
                        )}

                        <button
                            onClick={manejarConfirmarCompra}
                            disabled={cargando}
                            className="w-full mt-6 bg-forest hover:bg-forest-dark disabled:opacity-60 text-paper font-mono-ticket text-sm uppercase tracking-wide py-4 transition-colors flex items-center justify-center gap-2"
                        >
                            <ShoppingBag size={18} />
                            {cargando ? "Procesando..." : "Confirmar compra"}
                        </button>
                    </>
                )}
            </main>
        </div>
    );
}

export default Carrito;