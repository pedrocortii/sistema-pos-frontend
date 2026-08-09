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
    const [compraExitosa, setCompraExitosa] = useState(false);

    async function manejarConfirmarCompra() {
        setError("");
        setCargando(true);

        const itemsParaEnviar = items.map(function (item) {
            return { productoId: item.productoId, cantidad: item.cantidad };
        });

        try {
            await http.post("/ventas", { items: itemsParaEnviar });
            vaciarCarrito();
            setCompraExitosa(true);
        } catch (error) {
            const datos = error.response && error.response.data;
            let mensaje = "No se pudo completar la compra. Intenta de nuevo.";

            if (datos) {
                if (Array.isArray(datos.errors) && datos.errors.length > 0) {
                    mensaje = datos.errors.map(function (e) { return e.message || e; }).join(". ");
                } else if (datos.mensaje) {
                    mensaje = datos.mensaje;
                } else if (datos.message) {
                    mensaje = datos.message;
                }
            }
            setError(mensaje);
        } finally {
            setCargando(false);
        }
    }

    if (compraExitosa) {
        return (
            <div className="min-h-screen bg-paper">
                <EncabezadoCliente />
                <main className="max-w-2xl mx-auto px-6 py-20 text-center">
                    <p className="font-mono-ticket text-xs tracking-[0.25em] uppercase text-forest">
                        Compra confirmada
                    </p>
                    <h1 className="font-display text-4xl text-ink mt-3">
                        Gracias por tu compra
                    </h1>
                    <p className="font-mono-ticket text-sm text-ink/60 mt-3">
                        Tu venta quedo registrada correctamente.
                    </p>
                    <Link
                        to="/catalogo"
                        className="inline-block mt-8 bg-forest hover:bg-forest-dark text-paper font-mono-ticket text-sm uppercase tracking-wide py-3 px-8 transition-colors"
                    >
                        Seguir comprando
                    </Link>
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