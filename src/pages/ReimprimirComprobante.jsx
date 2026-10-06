import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { cancelarVentaPublica, cobrarVentaPublica, obtenerComprobante } from "../api/ventas";
import { useCarritoStore } from "../store/carritoStore";
import EncabezadoCliente from "../components/EncabezadoCliente";
import MensajeCarga from "../components/MensajeCarga";
import MensajeError from "../components/MensajeError";
import { usePeticion } from "../hooks/usePeticion";

function formatearFecha(fechaIso) {
    if (!fechaIso) return "";
    const fecha = new Date(fechaIso);
    return fecha.toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function obtenerErrorComprobante(error) {
    return error.response?.data?.mensaje || "No se encontro el comprobante.";
}

function obtenerErrorPago(error) {
    return error.response?.data?.mensaje || "No se pudo procesar la operación.";
}

function ReimprimirComprobante() {
    const { codigo } = useParams();
    const setUltimoComprobante = useCarritoStore(function (estado) { return estado.setUltimoComprobante; });
    const limpiarUltimoComprobante = useCarritoStore(function (estado) { return estado.limpiarUltimoComprobante; });
    const {
        respuesta: venta,
        cargando,
        error: errorComprobante,
        ejecutar: cargarComprobante,
    } = usePeticion(obtenerComprobante, { obtenerMensajeError: obtenerErrorComprobante });
    const {
        cargando: procesandoPago,
        error: errorPago,
        ejecutar: ejecutarPago,
    } = usePeticion(cobrarVentaPublica, { obtenerMensajeError: obtenerErrorPago });
    const {
        cargando: procesandoCancelacion,
        error: errorCancelacion,
        ejecutar: ejecutarCancelacion,
    } = usePeticion(cancelarVentaPublica, { obtenerMensajeError: obtenerErrorPago });
    const procesando = procesandoPago || procesandoCancelacion;
    const errorPagoVisible = errorPago || errorCancelacion;

    useEffect(function () {
        async function cargar() {
            try {
                const v = await cargarComprobante(codigo);
                if (v.estado === "PENDIENTE") {
                    setUltimoComprobante({
                        codigo: v.codigoComprobante,
                        estado: v.estado,
                        total: v.total
                    });
                } else {
                    limpiarUltimoComprobante();
                }
            } catch {
                // El hook mantiene el mensaje visible para la persona usuaria.
            }
        }
        cargar();
    }, [codigo, cargarComprobante, setUltimoComprobante, limpiarUltimoComprobante]);

    async function manejarPagar() {
        if (!venta) return;

        try {
            // MOCK de pago: en realidad aca iria el redirect a MercadoPago.
            // Cuando MP notifica al webhook del back, el back llama a cobrarVenta.
            // Por ahora simulamos que el pago se concreto y cobramos directo.
            await ejecutarPago(venta.id);
            // Recargamos el comprobante para mostrar el estado actualizado.
            await cargarComprobante(codigo);
            limpiarUltimoComprobante();
        } catch {
            // El hook mantiene el mensaje visible para la persona usuaria.
        }
    }

    async function manejarCancelar() {
        if (!venta) return;
        try {
            await ejecutarCancelacion(venta.id);
            await cargarComprobante(codigo);
            limpiarUltimoComprobante();
        } catch {
            // El hook mantiene el mensaje visible para la persona usuaria.
        }
    }

    if (cargando) {
        return (
            <div className="min-h-screen bg-paper">
                <EncabezadoCliente />
                <main className="max-w-2xl mx-auto px-6 py-20 text-center">
                    <MensajeCarga texto="Cargando comprobante..." />
                </main>
            </div>
        );
    }

    if (errorComprobante) {
        return (
            <div className="min-h-screen bg-paper">
                <EncabezadoCliente />
                <main className="max-w-2xl mx-auto px-6 py-20 text-center">
                    <p className="font-mono-ticket text-xs tracking-[0.25em] uppercase text-red-600">
                        Error
                    </p>
                    <h1 className="font-display text-3xl text-ink mt-3">
                        No se encontro el comprobante
                    </h1>
                    <p className="font-mono-ticket text-sm text-ink/60 mt-3">
                        {errorComprobante}
                    </p>
                    <Link
                        to="/catalogo"
                        className="inline-block mt-8 bg-forest hover:bg-forest-dark text-paper font-mono-ticket text-sm uppercase tracking-wide py-3 px-8 transition-colors no-underline"
                    >
                        Ir al catalogo
                    </Link>
                </main>
            </div>
        );
    }

    const cliente = venta.clienteNombre
        ? (venta.clienteNombre + " " + (venta.clienteApellido || "")).trim()
        : "Consumidor final";

    return (
        <div className="min-h-screen bg-paper">
            <EncabezadoCliente />
            <main className="max-w-2xl mx-auto px-6 py-10">
                <div className="bg-ticket border border-line p-8">
                    <div className="text-center border-b border-dashed border-line pb-4">
                        <p className="font-mono-ticket text-xs tracking-[0.25em] uppercase text-ink/50">
                            Comprobante
                        </p>
                        <h1 className="font-display text-3xl text-ink mt-2">
                            Sistema POS
                        </h1>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 mt-6 font-mono-ticket text-sm">
                        <div>
                            <p className="text-xs text-ink/50 uppercase tracking-wide">Codigo</p>
                            <p className="text-ink">{venta.codigoComprobante}</p>
                        </div>
                        <div>
                            <p className="text-xs text-ink/50 uppercase tracking-wide">Fecha</p>
                            <p className="text-ink">{formatearFecha(venta.creadoEn || venta.fecha)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-ink/50 uppercase tracking-wide">Estado</p>
                            <p className={
                                "text-ink font-bold " +
                                (venta.estado === "COBRADA" ? "text-forest" :
                                 venta.estado === "CANCELADA" ? "text-red-600" :
                                 "text-amber")
                            }>
                                {venta.estado === "PENDIENTE" ? "PENDIENTE DE PAGO" : venta.estado}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-ink/50 uppercase tracking-wide">Cliente</p>
                            <p className="text-ink">{cliente}</p>
                            {venta.clienteDni && (
                                <p className="text-xs text-ink/60">DNI: {venta.clienteDni}</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 border-t border-dashed border-line pt-4">
                        <p className="font-mono-ticket text-xs uppercase tracking-wide text-ink/50 mb-3">
                            Detalle
                        </p>
                        <div className="space-y-2">
                            {(venta.detalles || []).map(function (detalle) {
                                return (
                                    <div key={detalle.id} className="flex items-center justify-between font-mono-ticket text-sm">
                                        <span className="text-ink">
                                            {detalle.cantidad} x {detalle.producto ? detalle.producto.nombre : "Producto"}
                                        </span>
                                        <span className="text-ink">
                                            ${Number(detalle.subtotal).toFixed(2)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 border-t border-line pt-4">
                        <span className="font-mono-ticket text-sm uppercase tracking-wide text-ink/60">
                            Total
                        </span>
                        <span className="font-mono-ticket text-2xl text-forest">
                            ${Number(venta.total).toFixed(2)}
                        </span>
                    </div>

                    {errorPagoVisible && <MensajeError texto={errorPagoVisible} className="mt-4 text-center" />}

                    {venta.estado === "COBRADA" && (
                        <div className="mt-6 bg-emerald-50 border border-emerald-300 p-4 rounded text-center font-mono-ticket text-xs text-emerald-800">
                            Compra cobrada con éxito. Tu comprobante ya está disponible en esta pantalla.
                        </div>
                    )}

                    {venta.estado === "PENDIENTE" && (
                        <div className="mt-6 flex flex-col gap-3">
                            <button
                                onClick={manejarPagar}
                                disabled={procesando}
                                className="w-full bg-forest hover:bg-forest-dark disabled:opacity-60 text-paper font-mono-ticket text-sm uppercase tracking-wide py-3 transition-colors"
                            >
                                {procesando ? "Procesando pago..." : "Pagar con billetera virtual"}
                            </button>
                            <button
                                onClick={manejarCancelar}
                                disabled={procesando}
                                className="font-mono-ticket text-sm uppercase tracking-wide text-red-600 hover:text-red-700 border-b-2 border-red-600 pb-1 self-center"
                            >
                                Cancelar compra
                            </button>
                        </div>
                    )}
                </div>

                <div className="text-center mt-8">
                    <Link
                        to="/catalogo"
                        className="font-mono-ticket text-sm uppercase tracking-wide text-forest border-b-2 border-forest pb-1 no-underline"
                    >
                        Volver al catalogo
                    </Link>
                </div>
            </main>
        </div>
    );
}

export default ReimprimirComprobante;
