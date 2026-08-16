import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import http from "../api/http";
import { useCarritoStore } from "../store/carritoStore";
import EncabezadoCliente from "../components/EncabezadoCliente";

function Carrito() {
    const items = useCarritoStore(function (estado) { return estado.items; });
    const cambiarCantidad = useCarritoStore(function (estado) { return estado.cambiarCantidad; });
    const quitarProducto = useCarritoStore(function (estado) { return estado.quitarProducto; });
    const vaciarCarrito = useCarritoStore(function (estado) { return estado.vaciarCarrito; });
    const setUltimoComprobante = useCarritoStore(function (estado) { return estado.setUltimoComprobante; });
    const obtenerTotal = useCarritoStore(function (estado) { return estado.obtenerTotal; });

    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    // Datos fiscales del cliente para la factura (cliente anonimo).
    const [datosFactura, setDatosFactura] = useState({
        nombre: "",
        apellido: "",
        dni: "",
        email: "",
        confirmarEmail: ""
    });

    const navegar = useNavigate();

    function manejarCambioDato(campo, valor) {
        setDatosFactura(function (prev) {
            return { ...prev, [campo]: valor };
        });
    }

    function datosFacturaValidos() {
        return datosFactura.nombre.trim() !== ""
            && datosFactura.apellido.trim() !== ""
            && datosFactura.dni.trim() !== ""
            && datosFactura.email.trim() !== ""
            && datosFactura.confirmarEmail.trim() !== ""
            && datosFactura.email.trim().toLowerCase() === datosFactura.confirmarEmail.trim().toLowerCase();
    }

    async function manejarConfirmarCompra() {
        setError("");

        if (!datosFacturaValidos()) {
            setError("Completa todos los datos y verifica que los emails coincidan antes de confirmar.");
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
                email: datosFactura.email.trim(),
                confirmarEmail: datosFactura.confirmarEmail.trim()
            }
        };

        try {
            const respuesta = await http.post("/ventas", payload);
            const venta = respuesta.data.venta;
            setUltimoComprobante({
                codigo: venta.codigoComprobante,
                estado: venta.estado,
                total: venta.total
            });
            vaciarCarrito();
            // Navegamos por URL para que recargar siga mostrando el comprobante
            // (la pantalla lo trae del back usando el codigo de la URL).
            navegar("/comprobante/" + venta.codigoComprobante, { replace: true });
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
                                <div>
                                    <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                                        Confirmar email
                                    </label>
                                    <input
                                        type="email"
                                        value={datosFactura.confirmarEmail}
                                        onChange={function (e) { manejarCambioDato("confirmarEmail", e.target.value); }}
                                        required
                                        className="w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors"
                                        placeholder="Repite tu correo"
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
