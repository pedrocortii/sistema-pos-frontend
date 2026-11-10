import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import QRCode from "qrcode";
import { AlertCircle } from "lucide-react";
import { cancelarVentaPublica, obtenerComprobante } from "../api/ventas";
import { useCarritoStore } from "../store/carritoStore";
import EncabezadoCliente from "../components/EncabezadoCliente";
import MensajeCarga from "../components/MensajeCarga";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { DescargarComprobante } from "../components/DescargarComprobante";
import { RetiroProgramado } from "../components/RetiroProgramado";
import { Alert } from "../components/ui/Alert";
import { EmptyState } from "../components/ui/EmptyState";
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
    const [qrGenerado, setQrGenerado] = useState({ fuente: "", url: "" });
    const [ventaLocal, setVentaLocal] = useState(null);
    const [errorVerificacionPago, setErrorVerificacionPago] = useState("");
    const setUltimoComprobante = useCarritoStore(function (estado) { return estado.setUltimoComprobante; });
    const limpiarUltimoComprobante = useCarritoStore(function (estado) { return estado.limpiarUltimoComprobante; });
    const {
        respuesta: respuestaVenta,
        cargando,
        error: errorComprobante,
        ejecutar: cargarComprobante,
    } = usePeticion(obtenerComprobante, { obtenerMensajeError: obtenerErrorComprobante });
    const {
        cargando: procesandoCancelacion,
        error: errorCancelacion,
        ejecutar: ejecutarCancelacion,
    } = usePeticion(cancelarVentaPublica, { obtenerMensajeError: obtenerErrorPago });
    const venta = ventaLocal || respuestaVenta;
    const procesando = procesandoCancelacion;
    const errorPagoVisible = errorCancelacion;

    useEffect(function () {
        async function cargar() {
            try {
                const v = await cargarComprobante(codigo);
                setVentaLocal(v);
                if (!["CANCELADA", "RETIRADA"].includes(v.estado)) {
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

    useEffect(function () {
        if (venta?.estado !== "PENDIENTE" || !venta.pagoQrData) return undefined;

        let activo = true;
        let temporizador;
        async function verificarPago() {
            try {
                const v = await obtenerComprobante(codigo);
                if (!activo) return;
                setVentaLocal(v);
                setErrorVerificacionPago(v.verificacionPagoPendiente
                    ? "No pudimos consultar a Mercado Pago en este momento. No vuelvas a pagar; seguiremos verificando automáticamente."
                    : "");
                if (!["CANCELADA", "RETIRADA"].includes(v.estado)) {
                    setUltimoComprobante({
                        codigo: v.codigoComprobante,
                        estado: v.estado,
                        total: v.total
                    });
                } else {
                    limpiarUltimoComprobante();
                }
            } catch {
                if (activo) {
                    setErrorVerificacionPago("No pudimos confirmar el estado del pago. No vuelvas a pagar; intentaremos consultarlo nuevamente.");
                }
            } finally {
                if (activo) temporizador = window.setTimeout(verificarPago, 10000);
            }
        }

        temporizador = window.setTimeout(verificarPago, 10000);
        return function () {
            activo = false;
            window.clearTimeout(temporizador);
        };
    }, [codigo, venta?.estado, venta?.pagoQrData, setUltimoComprobante, limpiarUltimoComprobante]);

    useEffect(function () {
        let activo = true;

        if (!venta?.pagoQrData) return undefined;

        const contenido = venta.pagoQrData;
        if (/^data:image\//i.test(contenido)) {
            return undefined;
        }

        QRCode.toDataURL(contenido, {
            width: 192,
            margin: 2,
            errorCorrectionLevel: "H"
        }).then(function (dataUrl) {
            if (activo) setQrGenerado({ fuente: contenido, url: dataUrl });
        }).catch(function () {
            if (activo) setQrGenerado({ fuente: contenido, url: "" });
        });

        return function () { activo = false; };
    }, [venta?.pagoQrData]);

    const urlQr = /^data:image\//i.test(venta?.pagoQrData || "")
        ? venta.pagoQrData
        : qrGenerado.fuente === venta?.pagoQrData ? qrGenerado.url : "";

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
                    <EmptyState
                        icono={AlertCircle}
                        titulo="No se encontró el comprobante"
                        descripcion={errorComprobante}
                        accion={
                            <Link to="/catalogo">
                                <Button>Ir al catálogo</Button>
                            </Link>
                        }
                    />
                </main>
            </div>
        );
    }

    if (!venta) {
        return (
            <div className="min-h-screen bg-paper">
                <EncabezadoCliente />
                <main className="max-w-2xl mx-auto px-6 py-20 text-center">
                    <MensajeCarga texto="Cargando comprobante..." />
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
                <Card className="p-8 shadow-sm">
                    <div className="text-center border-b border-dashed border-line pb-4">
                        <p className="font-mono-ticket text-xs text-forest">
                            Comprobante
                        </p>
                        <h1 className="font-display text-3xl text-ink mt-1">
                            Sistema POS
                        </h1>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 mt-6 font-mono-ticket text-sm">
                        {venta.nombrePersonalizado && (
                            <div className="col-span-2">
                                <p className="text-xs text-ink/50">Nombre de la compra</p>
                                <p className="text-ink font-bold break-words">{venta.nombrePersonalizado}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-xs text-ink/50">Código</p>
                            <p className="text-ink font-bold">{venta.codigoComprobante}</p>
                        </div>
                        <div>
                            <p className="text-xs text-ink/50">Fecha</p>
                            <p className="text-ink">{formatearFecha(venta.creadoEn || venta.fecha)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-ink/50 mb-1">Estado</p>
                            <Badge estado={venta.estado === "PENDIENTE" ? "PENDIENTE DE PAGO" : venta.estado} />
                        </div>
                        <div>
                            <p className="text-xs text-ink/50">Cliente</p>
                            <p className="text-ink font-medium">{cliente}</p>
                            {venta.clienteDni && (
                                <p className="text-xs text-ink/60">DNI: {venta.clienteDni}</p>
                            )}
                        </div>
                    </div>

                    <RetiroProgramado venta={venta} className="mt-5 border-t border-dashed border-line pt-4 font-mono-ticket" />

                    <div className="mt-6 border-t border-dashed border-line pt-4">
                        <p className="font-mono-ticket text-xs text-ink/50 mb-3">
                            Detalle de productos
                        </p>
                        <div className="space-y-2">
                            {(venta.detalles || []).map(function (detalle) {
                                return (
                                    <div key={detalle.id} className="flex items-center justify-between font-mono-ticket text-sm">
                                        <span className="text-ink">
                                            {detalle.cantidad} x {detalle.producto ? detalle.producto.nombre : "Producto"}
                                            {detalle.promocionTitulo && (
                                                <span className="block text-xs text-forest">
                                                    {detalle.promocionTitulo}
                                                    {detalle.combosAplicados > 0
                                                        ? ` · ${detalle.combosAplicados} ${detalle.combosAplicados === 1 ? "combo aplicado" : "combos aplicados"}`
                                                        : detalle.unidadesBonificadas > 0
                                                            ? ` · ${detalle.unidadesBonificadas} ${detalle.unidadesBonificadas === 1 ? "unidad bonificada" : "unidades bonificadas"}`
                                                            : ""}
                                                    {Number(detalle.descuentoTotal) > 0
                                                        ? ` · ahorro $${Number(detalle.descuentoTotal).toFixed(2)}`
                                                        : ""}
                                                </span>
                                            )}
                                        </span>
                                        <span className="text-ink font-medium">
                                            ${Number(detalle.subtotal).toFixed(2)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {Number(venta.detalles?.reduce((total, detalle) => total + Number(detalle.descuentoTotal || 0), 0)) > 0 && (
                        <div className="flex items-center justify-between mt-4 text-sm">
                            <span className="font-mono-ticket text-ink/60">Descuento aplicado</span>
                            <span className="font-mono-ticket text-forest">
                                -${Number(venta.detalles.reduce((total, detalle) => total + Number(detalle.descuentoTotal || 0), 0)).toFixed(2)}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-6 border-t border-line pt-4">
                        <span className="font-mono-ticket text-sm text-ink/60">
                            Total
                        </span>
                        <span className="font-mono-ticket text-3xl text-forest font-bold">
                            ${Number(venta.total).toFixed(2)}
                        </span>
                    </div>

                    {["COBRADA", "EN_PREPARACION", "LISTA_PARA_RETIRAR", "RETIRADA", "REEMBOLSADA"].includes(venta.estado) && (
                        <DescargarComprobante
                            codigoComprobante={venta.codigoComprobante}
                            className="mt-5 flex justify-center"
                        />
                    )}

                    {errorPagoVisible && <Alert tipo="error" texto={errorPagoVisible} className="mt-4 text-center" />}

                    {venta.pagoQrData && (
                        <div className="mt-6 bg-white border border-line p-4 text-center">
                            <p className="font-mono-ticket text-xs text-ink/50 mb-3">
                                Escanea para pagar
                            </p>
                            {urlQr ? (
                                <img
                                    src={urlQr}
                                    alt="Código QR para pagar la compra"
                                    className="mx-auto w-48 h-48 object-contain"
                                />
                            ) : (
                                <p className="font-mono-ticket text-xs text-ink/60">
                                    Generando código QR...
                                </p>
                            )}
                            <p className="font-mono-ticket text-xs text-ink/60 mt-3">
                                La orden expira en 15 minutos.
                            </p>
                        </div>
                    )}

                    {errorVerificacionPago && (
                        <Alert tipo="warning" texto={errorVerificacionPago} className="mt-4" />
                    )}

                    {venta.estado === "CANCELADA" && ["expired", "canceled"].includes(venta.estadoPago) && (
                        <Alert
                            tipo="warning"
                            titulo={venta.estadoPago === "expired" ? "El QR venció" : "El pago fue cancelado"}
                            texto="La compra quedó cancelada y el importe no fue confirmado. Si Mercado Pago te debitó el pago, conservá este comprobante y contactá al comercio antes de volver a pagar."
                            className="mt-6"
                        />
                    )}

                    {venta.estado === "REEMBOLSADA" && (
                        <Alert
                            tipo="info"
                            titulo="Pago reembolsado"
                            texto="Mercado Pago informó que este pago fue reembolsado. Consultá el plazo de acreditación con tu proveedor de pago."
                            className="mt-6"
                        />
                    )}

                    {venta.estado === "LISTA_PARA_RETIRAR" && (
                        <Alert
                            variant="success"
                            titulo="Tu pedido está listo para retirar"
                            texto="Ya podés pasar a buscarlo presentando este comprobante."
                            className="mt-6 text-center"
                        />
                    )}

                    {venta.estado === "EN_PREPARACION" && (
                        <Alert
                            variant="info"
                            titulo="Estamos preparando tu pedido"
                            texto="Te avisaremos cuando esté listo para retirar."
                            className="mt-6 text-center"
                        />
                    )}

                    {venta.estado === "COBRADA" && (
                        <Alert
                            variant="success"
                            titulo="¡Pago realizado con éxito!"
                            texto="Tu comprobante ya está acreditado y disponible en esta pantalla."
                            className="mt-6 text-center"
                        />
                    )}

                    {venta.estado === "PENDIENTE" && (
                        <div className="mt-6 flex flex-col items-center">
                            <Button
                                variant="danger-outline"
                                size="sm"
                                onClick={manejarCancelar}
                                loading={procesando}
                                loadingText="Cancelando..."
                            >
                                Cancelar compra
                            </Button>
                        </div>
                    )}
                </Card>

                <div className="text-center mt-8">
                    <Link to="/catalogo">
                        <Button variant="ghost">← Volver al catálogo</Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}

export default ReimprimirComprobante;
