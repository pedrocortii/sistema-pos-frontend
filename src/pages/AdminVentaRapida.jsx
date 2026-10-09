import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { CheckCircle2, Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { listarProductos } from "../api/productos";
import { cobrarVenta, consultarEstadoQr, crearVentaDirecta } from "../api/ventas";
import { usePeticion } from "../hooks/usePeticion";
import { useAuthStore } from "../store/authStore";
import { Alerta, Cabecera, Carga } from "./AdminProductos";
import { formatoMonedaARS, parsearMontoACentavos } from "../utils/moneda";

function obtenerErrorVenta(error) {
    const datos = error.response?.data;
    if (Array.isArray(datos?.errores)) {
        return datos.errores.map(function (item) { return item.message || item; }).join(". ");
    }
    return datos?.mensaje || "No se pudo registrar la venta. Intenta nuevamente.";
}

function esVentaPagada(venta) {
    if (!venta) return false;
    const estado = String(
        venta.estado ??
        venta.status ??
        venta.pago?.estado ??
        venta.pago?.status ??
        venta.pagoStatus ??
        ""
    ).toUpperCase();

    return ["COBRADA", "PAGADA", "PAGADO", "CONFIRMADA", "APROBADA", "PAID", "AUTHORIZED"].includes(estado);
}

function AdminVentaRapida() {
    const usuario = useAuthStore(function (estado) { return estado.usuario; });
    const clavePersistencia = "venta-rapida-" + (usuario?.id || usuario?.email || "usuario");
    const [busqueda, setBusqueda] = useState("");
    const [items, setItems] = useState(function () {
        try {
            const guardado = localStorage.getItem(clavePersistencia);
            return guardado ? JSON.parse(guardado).items || [] : [];
        } catch {
            return [];
        }
    });
    const [metodoPago, setMetodoPago] = useState(function () {
        try {
            const guardado = localStorage.getItem(clavePersistencia);
            return guardado ? JSON.parse(guardado).metodoPago || "Efectivo" : "Efectivo";
        } catch {
            return "Efectivo";
        }
    });
    const [efectivoRecibido, setEfectivoRecibido] = useState("");
    const [ventaPendienteCobro, setVentaPendienteCobro] = useState(null);
    const [ultimaVenta, setUltimaVenta] = useState(null);
    const [urlQr, setUrlQr] = useState("");
    const {
        data: productosResponse,
        isLoading: cargandoProductos,
        error: errorProductos,
        execute: cargarProductos
    } = usePeticion(listarProductos);
    const {
        isLoading: registrando,
        error: errorVenta,
        execute: registrarVenta
    } = usePeticion(crearVentaDirecta, { obtenerMensajeError: obtenerErrorVenta });
    const {
        isLoading: cobrando,
        error: errorCobro,
        execute: procesarCobro
    } = usePeticion(cobrarVenta);

    useEffect(function () {
        cargarProductos({ page: 1, limit: 100 }).catch(function () {
            // El hook expone el mensaje para mostrarlo en pantalla.
        });
    }, [cargarProductos]);

    // Conserva la venta en curso al cambiar de sección, recargar o abrir otra
    // pestaña del navegador. Se limpia después de una venta confirmada.
    useEffect(function () {
        localStorage.setItem(clavePersistencia, JSON.stringify({ items: items, metodoPago: metodoPago }));
    }, [clavePersistencia, items, metodoPago]);

    useEffect(function () {
        let activo = true;
        setUrlQr("");

        const qrData = ventaPendienteCobro?.pagoQrData || ventaPendienteCobro?.pago?.qrData || ventaPendienteCobro?.pago?.qr || ventaPendienteCobro?.qrData;
        if (!qrData) return undefined;

        if (/^data:image\//i.test(qrData)) {
            setUrlQr(qrData);
            return undefined;
        }

        QRCode.toDataURL(qrData, {
            width: 192,
            margin: 2,
            errorCorrectionLevel: "H"
        }).then(function (dataUrl) {
            if (activo) setUrlQr(dataUrl);
        }).catch(function () {
            if (activo) setUrlQr("");
        });

        return function () { activo = false; };
    }, [ventaPendienteCobro]);

    useEffect(function () {
        if (metodoPago !== "MercadoPago" || !ventaPendienteCobro?.id) return undefined;

        let activo = true;
        let intervaloId;

        async function verificarEstado() {
            try {
                const ventaActualizada = await consultarEstadoQr(ventaPendienteCobro.id);
                if (!activo) return;

                const estadoReal = ventaActualizada.estado ?? ventaActualizada.status ?? ventaActualizada.pago?.estado ?? ventaActualizada.pago?.status ?? ventaActualizada.pagoStatus;

                setVentaPendienteCobro(function (actual) {
                    if (!actual || actual.id !== ventaActualizada.id) return actual;
                    return { ...actual, ...ventaActualizada, estado: estadoReal };
                });

                if (esVentaPagada(ventaActualizada)) {
                    setUltimaVenta(ventaActualizada);
                    setVentaPendienteCobro(null);
                    setItems([]);
                    setEfectivoRecibido("");
                    await cargarProductos({ page: 1, limit: 100 });
                    return;
                }
            } catch {
                // Se reintenta en el siguiente ciclo.
            }
        }

        verificarEstado();
        intervaloId = window.setInterval(verificarEstado, 2000);

        return function () {
            activo = false;
            window.clearInterval(intervaloId);
        };
    }, [cargarProductos, metodoPago, ventaPendienteCobro?.id]);

    const productos = useMemo(function () {
        return productosResponse?.data || productosResponse?.productos || [];
    }, [productosResponse]);
    const productosVisibles = useMemo(function () {
        const termino = busqueda.trim().toLowerCase();
        if (!termino) return productos;
        return productos.filter(function (producto) {
            return [producto.nombre, producto.categoria].filter(Boolean).some(function (valor) {
                return valor.toLowerCase().includes(termino);
            });
        });
    }, [busqueda, productos]);

    const totalCentavos = items.reduce(function (acumulado, item) {
        return acumulado + Math.round(item.precio * 100) * item.cantidad;
    }, 0);
    const total = totalCentavos / 100;
    const efectivoCentavos = parsearMontoACentavos(efectivoRecibido);
    const cambioCentavos = efectivoCentavos !== null && efectivoCentavos >= totalCentavos
        ? efectivoCentavos - totalCentavos
        : null;
    const efectivoInvalido = efectivoRecibido.trim() !== "" && efectivoCentavos === null;
    const efectivoInsuficiente = efectivoCentavos !== null && efectivoCentavos < totalCentavos;

    function disponible(producto) {
        return Math.max(0, Number(producto.stock || 0) - Number(producto.stockReservado || 0));
    }

    function agregarProducto(producto) {
        if (ventaPendienteCobro) return;
        const yaAgregado = items.find(function (item) { return item.productoId === producto.id; });
        if (yaAgregado && yaAgregado.cantidad >= disponible(producto)) return;
        if (!yaAgregado && disponible(producto) === 0) return;

        setUltimaVenta(null);
        setItems(function (actuales) {
            const existente = actuales.find(function (item) { return item.productoId === producto.id; });
            if (existente) {
                return actuales.map(function (item) {
                    return item.productoId === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item;
                });
            }
            return [...actuales, {
                productoId: producto.id,
                nombre: producto.nombre,
                precio: Number(producto.precio),
                disponible: disponible(producto),
                cantidad: 1
            }];
        });
    }

    function cambiarCantidad(productoId, cantidad) {
        if (ventaPendienteCobro) return;
        setUltimaVenta(null);
        setItems(function (actuales) {
            if (cantidad <= 0) return actuales.filter(function (item) { return item.productoId !== productoId; });
            return actuales.map(function (item) {
                if (item.productoId !== productoId) return item;
                return { ...item, cantidad: Math.min(cantidad, item.disponible) };
            });
        });
    }

    async function confirmarVenta() {
        if (!items.length || registrando || cobrando) return;

        if (metodoPago === "Efectivo") {
            if (efectivoCentavos === null || efectivoCentavos <= 0 || efectivoCentavos < totalCentavos) return;

            try {
                let venta = ventaPendienteCobro;
                if (!venta) {
                    venta = await registrarVenta({
                        items: items.map(function (item) {
                            return { productoId: item.productoId, cantidad: item.cantidad };
                        }),
                        metodoPago: "Efectivo",
                        cobrar: false
                    });
                    setVentaPendienteCobro(venta);
                }

                const ventaCobrada = await procesarCobro(venta.id, {
                    metodoPago: "Efectivo",
                    efectivoRecibido: efectivoCentavos / 100
                });
                setUltimaVenta(ventaCobrada || venta);
                setVentaPendienteCobro(null);
                setItems([]);
                setEfectivoRecibido("");
                await cargarProductos({ page: 1, limit: 100 });
            } catch {
                // Si falla el cobro, se conserva el id para reintentar sin duplicar la venta.
            }
            return;
        }

        if (metodoPago === "MercadoPago") {
            try {
                const venta = ventaPendienteCobro || await registrarVenta({
                    items: items.map(function (item) {
                        return { productoId: item.productoId, cantidad: item.cantidad };
                    }),
                    metodoPago: "MercadoPago",
                    cobrar: false
                });

                setVentaPendienteCobro(venta);
                return;
            } catch {
                // El hook deja el error visible para el cajero.
            }
            return;
        }

        try {
            const venta = await registrarVenta({
                items: items.map(function (item) {
                    return { productoId: item.productoId, cantidad: item.cantidad };
                }),
                metodoPago: metodoPago,
                cobrar: true
            });
            setUltimaVenta(venta);
            setItems([]);
            await cargarProductos({ page: 1, limit: 100 });
        } catch {
            // El hook deja el error visible para el cajero.
        }
    }

    return (
        <section>
            <Cabecera etiqueta="Caja" titulo="Venta rápida" />
            <p className="mt-2 font-mono-ticket text-sm text-ink/60">Selecciona productos y registra la venta en un solo paso.</p>

            {ultimaVenta && (
                <div className="mt-6 flex gap-3 border border-green-200 bg-green-50 p-4 text-green-800" role="status">
                    <CheckCircle2 className="mt-0.5 shrink-0" aria-hidden="true" />
                    <div className="font-mono-ticket text-sm">
                        <p className="font-bold">Venta registrada correctamente.</p>
                        <p>Comprobante: <span className="font-bold">{ultimaVenta.codigoComprobante || ultimaVenta.codigo}</span></p>
                        {ultimaVenta.total != null && <p>Total: {formatoMonedaARS.format(Number(ultimaVenta.total))}</p>}
                        {ultimaVenta.metodoPago && <p>Medio de pago: {ultimaVenta.metodoPago}</p>}
                    </div>
                </div>
            )}

            {(errorProductos || errorVenta || errorCobro) && <Alerta texto={errorProductos || errorVenta || errorCobro} />}

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_25rem]">
                <div className="border border-line bg-ticket">
                    <div className="border-b border-line p-4">
                        <label htmlFor="buscar-producto" className="sr-only">Buscar producto</label>
                        <div className="flex items-center gap-2 border border-line bg-paper px-3">
                            <Search size={18} className="text-ink/50" aria-hidden="true" />
                            <input id="buscar-producto" value={busqueda} onChange={function (event) { setBusqueda(event.target.value); }} placeholder="Buscar por nombre o categoría" className="w-full bg-transparent py-3 font-mono-ticket text-sm outline-none" />
                        </div>
                    </div>
                    {cargandoProductos ? <Carga /> : (
                        <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                            {productosVisibles.map(function (producto) {
                                const stock = disponible(producto);
                                const enVenta = items.find(function (item) { return item.productoId === producto.id; });
                                const sinStock = stock === 0;
                                return <button key={producto.id} type="button" disabled={sinStock || Boolean(ventaPendienteCobro)} onClick={function () { agregarProducto(producto); }} className="cursor-pointer p-4 text-left transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-45">
                                    <p className="font-display text-lg">{producto.nombre}</p>
                                    <p className="mt-1 font-mono-ticket text-xs text-ink/55">{producto.categoria || "Sin categoría"} · {stock} disponibles</p>
                                    <div className="mt-3 flex items-center justify-between font-mono-ticket text-sm">
                                        <span className="text-forest">{formatoMonedaARS.format(Number(producto.precio))}</span>
                                        <span>{enVenta ? enVenta.cantidad + " en venta" : sinStock ? "Sin stock" : "Agregar +"}</span>
                                    </div>
                                </button>;
                            })}
                            {!productosVisibles.length && <p className="p-5 font-mono-ticket text-sm text-ink/60 sm:col-span-2">No se encontraron productos.</p>}
                        </div>
                    )}
                </div>

                <aside className="h-fit border border-line bg-ticket xl:sticky xl:top-24">
                    <div className="flex items-center gap-2 border-b border-line p-4"><ShoppingCart size={19} aria-hidden="true" /><h2 className="font-display text-xl">Venta actual</h2></div>
                    {ventaPendienteCobro && <p role="status" className="border-b border-amber/40 bg-amber/15 p-4 font-mono-ticket text-xs">{metodoPago === "MercadoPago" ? "Venta registrada. Escaneá el QR y esperá a que el pago quede confirmado." : "La venta ya está registrada. Reintentá el cobro para evitar duplicarla."}</p>}
                    {!items.length ? <p className="p-5 font-mono-ticket text-sm text-ink/60">Agrega productos para comenzar.</p> : <>
                        <ul className="divide-y divide-line">
                            {items.map(function (item) {
                                return <li key={item.productoId} className="p-4">
                                    <div className="flex justify-between gap-3"><p className="font-display">{item.nombre}</p><button type="button" disabled={Boolean(ventaPendienteCobro)} onClick={function () { cambiarCantidad(item.productoId, 0); }} className="cursor-pointer text-red-600 disabled:opacity-35" aria-label={"Quitar " + item.nombre}><Trash2 size={17} /></button></div>
                                    <div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-2"><button type="button" disabled={Boolean(ventaPendienteCobro)} onClick={function () { cambiarCantidad(item.productoId, item.cantidad - 1); }} className="cursor-pointer border border-line p-1 disabled:opacity-35" aria-label="Restar una unidad"><Minus size={14} /></button><span className="w-6 text-center font-mono-ticket text-sm">{item.cantidad}</span><button type="button" disabled={item.cantidad >= item.disponible || Boolean(ventaPendienteCobro)} onClick={function () { cambiarCantidad(item.productoId, item.cantidad + 1); }} className="cursor-pointer border border-line p-1 disabled:cursor-not-allowed disabled:opacity-35" aria-label="Sumar una unidad"><Plus size={14} /></button></div><span className="font-mono-ticket text-sm">{formatoMonedaARS.format(item.precio * item.cantidad)}</span></div>
                                </li>;
                            })}
                        </ul>
                        <div className="border-t border-line p-4">
                            <div className="flex items-center justify-between font-mono-ticket"><span className="text-sm uppercase tracking-wide text-ink/60">Total</span><span className="text-2xl text-forest">{formatoMonedaARS.format(total)}</span></div>
                            <label htmlFor="metodo-pago" className="mt-5 block font-mono-ticket text-xs uppercase tracking-wide text-ink/60">Método de pago</label>
                            <select id="metodo-pago" value={metodoPago} onChange={function (event) { setMetodoPago(event.target.value); }} disabled={registrando || cobrando || Boolean(ventaPendienteCobro)} className="mt-1 w-full border border-line bg-paper p-2.5 font-mono-ticket text-sm outline-none focus:border-forest">
                                <option value="Efectivo">Efectivo</option>
                                <option value="Tarjeta">Tarjeta</option>
                                <option value="MercadoPago">Mercado Pago</option>
                            </select>
                            {metodoPago === "Efectivo" && <>
                                <label htmlFor="efectivo-recibido" className="mt-5 block font-mono-ticket text-xs uppercase tracking-wide text-ink/60">Efectivo recibido</label>
                                <input id="efectivo-recibido" type="text" inputMode="decimal" value={efectivoRecibido} onChange={function (event) { setEfectivoRecibido(event.target.value); }} placeholder="0,00" disabled={registrando || cobrando} className="mt-1 w-full border border-line bg-paper p-2.5 font-mono-ticket text-sm outline-none focus:border-forest disabled:opacity-60" />
                                <p className="mt-3 flex justify-between font-mono-ticket text-sm"><span>Cambio</span><strong>{formatoMonedaARS.format((cambioCentavos || 0) / 100)}</strong></p>
                                {efectivoInvalido && <p role="alert" className="mt-2 font-mono-ticket text-xs text-red-600">Ingresá un importe válido.</p>}
                                {efectivoInsuficiente && <p role="alert" className="mt-2 font-mono-ticket text-xs text-red-600">El efectivo recibido es insuficiente.</p>}
                                {cambioCentavos > 0 && <p role="status" className="mt-2 font-mono-ticket text-xs text-forest">Vuelto: {formatoMonedaARS.format(cambioCentavos / 100)}</p>}
                            </>}

                            {metodoPago === "MercadoPago" && ventaPendienteCobro && (
                                <div className="mt-5 border border-line bg-paper p-3 text-center">
                                    <p className="font-mono-ticket text-xs uppercase tracking-wide text-ink/50">Escanea para pagar</p>
                                    {urlQr ? (
                                        <img src={urlQr} alt="Código QR para pagar con Mercado Pago" className="mx-auto mt-3 h-40 w-40 object-contain" />
                                    ) : (
                                        <p className="mt-3 font-mono-ticket text-xs text-ink/60">Generando código QR...</p>
                                    )}
                                    <p className="mt-3 font-mono-ticket text-[11px] text-ink/60">
                                        Estado: {esVentaPagada(ventaPendienteCobro) ? "Pago confirmado" : "Esperando pago"}
                                    </p>
                                </div>
                            )}

                            <button type="button" disabled={registrando || cobrando || Boolean(ventaPendienteCobro) || (metodoPago === "Efectivo" && (efectivoCentavos === null || efectivoCentavos <= 0 || efectivoCentavos < totalCentavos))} onClick={confirmarVenta} className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 bg-forest py-3 font-mono-ticket text-sm uppercase tracking-wide text-paper hover:bg-forest-dark disabled:cursor-wait disabled:opacity-60"><ShoppingCart size={17} aria-hidden="true" />{cobrando ? "Cobrando..." : registrando ? "Registrando..." : ventaPendienteCobro ? "Esperando pago" : metodoPago === "Efectivo" ? "Cobrar" : metodoPago === "MercadoPago" ? "Registrar venta" : "Cobrar y confirmar venta"}</button>
                        </div>
                    </>}
                </aside>
            </div>
        </section>
    );
}

export default AdminVentaRapida;
