import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Minus, Plus, Search, ShoppingCart, Trash2, User, X } from "lucide-react";
import { listarProductos } from "../api/productos";
import { cobrarVenta, consultarEstadoQr, crearVentaDirecta } from "../api/ventas";
import { buscarClientePorDni } from "../api/usuarios";
import { usePeticion } from "../hooks/usePeticion";
import { useAuthStore } from "../store/authStore";
import { CargaAdmin } from "../components/AdminUI";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Alert } from "../components/ui/Alert";
import { formatoMonedaARS, parsearMontoACentavos } from "../utils/moneda";
import { calcularPromocionesCarrito } from "../utils/carrito";
import { limpiarDni, validarFormatoDni } from "../validations/dni";

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
    const [clienteSeleccionado, setClienteSeleccionado] = useState(function () {
        return null;
    });
    const [dniBusqueda, setDniBusqueda] = useState("");
    const [errorDniBusqueda, setErrorDniBusqueda] = useState("");
    const [efectivoRecibido, setEfectivoRecibido] = useState("");
    const [ventaPendienteCobro, setVentaPendienteCobro] = useState(null);
    const [ultimaVenta, setUltimaVenta] = useState(null);
    const [qrGenerado, setQrGenerado] = useState({ fuente: "", url: "" });
    const [errorVerificacionQr, setErrorVerificacionQr] = useState("");
    const [estadoFinalQr, setEstadoFinalQr] = useState("");
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
    const {
        isLoading: buscandoCliente,
        error: errorBusquedaCliente,
        execute: ejecutarBusquedaCliente,
        setError: setErrorBusquedaCliente
    } = usePeticion(buscarClientePorDni, {
        obtenerMensajeError: function (error) {
            if (error.response?.status === 404) {
                return "No se encontró ningún cliente con el DNI ingresado. Podés continuar con una venta sin cliente registrado.";
            }
            return error.response?.data?.mensaje || "Error al buscar cliente por DNI.";
        }
    });

    useEffect(function () {
        cargarProductos({ page: 1, limit: 100 }).catch(function () {
            // El hook expone el mensaje para mostrarlo en pantalla.
        });
    }, [cargarProductos]);

    useEffect(function () {
        localStorage.setItem(clavePersistencia, JSON.stringify({
            items: items,
            metodoPago: metodoPago
        }));
    }, [clavePersistencia, items, metodoPago]);

    useEffect(function () {
        let activo = true;

        const qrData = ventaPendienteCobro?.pagoQrData || ventaPendienteCobro?.pago?.qrData || ventaPendienteCobro?.pago?.qr || ventaPendienteCobro?.qrData;
        if (!qrData) return undefined;

        if (/^data:image\//i.test(qrData)) {
            return undefined;
        }

        QRCode.toDataURL(qrData, {
            width: 192,
            margin: 2,
        }).then(function (url) {
            if (activo) setQrGenerado({ fuente: qrData, url: url });
        }).catch(function () {
            // Si falla la conversión del QR no se rompe la pantalla.
        });

        return function () {
            activo = false;
        };
    }, [ventaPendienteCobro]);

    useEffect(function () {
        if (metodoPago !== "MercadoPago" || !ventaPendienteCobro?.id) return undefined;

        let activo = true;
        let temporizador;

        async function verificarEstado() {
            try {
                const ventaActualizada = await consultarEstadoQr(ventaPendienteCobro.id);
                if (!activo) return;

                const estadoReal = ventaActualizada.estado ?? ventaActualizada.status ?? ventaActualizada.pago?.estado ?? ventaActualizada.pago?.status ?? ventaActualizada.pagoStatus;
                setErrorVerificacionQr("");

                if (esVentaPagada(ventaActualizada)) {
                    setUltimaVenta(ventaActualizada);
                    setVentaPendienteCobro(null);
                    setItems([]);
                    setClienteSeleccionado(null);
                    setEfectivoRecibido("");
                    setEstadoFinalQr("");
                    cargarProductos({ page: 1, limit: 100 }).catch(function () {});
                    return;
                }

                if (["CANCELADA", "REEMBOLSADA"].includes(estadoReal)) {
                    setVentaPendienteCobro(null);
                    setEstadoFinalQr(estadoReal === "REEMBOLSADA"
                        ? "Mercado Pago informó que el pago fue reembolsado."
                        : ventaActualizada.mpOrderStatus === "expired"
                            ? "El QR venció y la venta quedó cancelada. Podés generar un nuevo QR si el cliente todavía desea comprar."
                            : "El pago fue cancelado y la venta quedó cancelada. Podés generar un nuevo QR si el cliente todavía desea comprar.");
                    cargarProductos({ page: 1, limit: 100 }).catch(function () {});
                    return;
                }
                setVentaPendienteCobro(function (actual) {
                    if (!actual || actual.id !== ventaActualizada.id) return actual;
                    return { ...actual, ...ventaActualizada, estado: estadoReal };
                });
            } catch {
                if (activo) {
                    setErrorVerificacionQr("No se pudo consultar el estado del pago. No vuelvas a registrar la venta; la consulta se reintentará automáticamente.");
                }
            } finally {
                if (activo) temporizador = window.setTimeout(verificarEstado, 10000);
            }
        }

        temporizador = window.setTimeout(verificarEstado, 10000);

        return function () {
            activo = false;
            window.clearTimeout(temporizador);
        };
    }, [cargarProductos, metodoPago, ventaPendienteCobro?.id]);

    const qrData = ventaPendienteCobro?.pagoQrData || ventaPendienteCobro?.pago?.qrData || ventaPendienteCobro?.pago?.qr || ventaPendienteCobro?.qrData;
    const urlQr = /^data:image\//i.test(qrData || "")
        ? qrData
        : qrGenerado.fuente === qrData ? qrGenerado.url : "";

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

    const calculosCarrito = calcularPromocionesCarrito(items);
    const totalCentavos = Array.from(calculosCarrito.values()).reduce(
        (acumulado, calculo) => acumulado + calculo.subtotalCentavos,
        0
    );
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
                precio: Number(producto.precioFinal ?? producto.precio),
                precioOriginal: Number(producto.precio),
                promocionesDisponibles: producto.promocionesDisponibles || [],
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

    async function buscarCliente(event) {
        event.preventDefault();
        const dni = dniBusqueda.trim();
        if (!validarFormatoDni(dni)) {
            setErrorDniBusqueda("Ingresá un DNI válido de 7 u 8 números.");
            return;
        }

        setErrorDniBusqueda("");
        setClienteSeleccionado(null);
        try {
            const cliente = await ejecutarBusquedaCliente(limpiarDni(dni));
            setClienteSeleccionado(cliente);
        } catch {
            // El hook expone el mensaje de error para que el cajero pueda continuar sin cliente.
        }
    }

    function quitarCliente() {
        setClienteSeleccionado(null);
        setDniBusqueda("");
        setErrorDniBusqueda("");
        setErrorBusquedaCliente(null);
    }

    async function confirmarVenta() {
        if (!items.length || registrando || cobrando) return;
        setEstadoFinalQr("");
        setErrorVerificacionQr("");
        const datosCliente = clienteSeleccionado
            ? { cliente: { id: clienteSeleccionado.id, dni: clienteSeleccionado.dni } }
            : {};

        if (metodoPago === "Efectivo") {
            if (efectivoCentavos === null || efectivoCentavos <= 0 || efectivoCentavos < totalCentavos) return;

            try {
                let venta = ventaPendienteCobro;
                if (!venta) {
                    venta = await registrarVenta({
                        items: items.map(function (item) {
                            return { productoId: item.productoId, cantidad: item.cantidad };
                        }),
                        ...datosCliente,
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
                setClienteSeleccionado(null);
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
                    ...datosCliente,
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
                ...datosCliente,
                metodoPago: metodoPago,
                cobrar: true
            });
            setUltimaVenta(venta);
            setItems([]);
            setClienteSeleccionado(null);
            await cargarProductos({ page: 1, limit: 100 });
        } catch {
            // El hook deja el error visible para el cajero.
        }
    }

    return (
        <section>
            <PageHeader
                etiqueta="Caja"
                titulo="Venta rápida"
                descripcion="Selecciona productos y registra la venta en un solo paso."
            />

            {ultimaVenta && (
                <Alert
                    variant="success"
                    titulo="Venta registrada correctamente."
                    className="mb-6"
                >
                    <p>Comprobante: <span className="font-bold">{ultimaVenta.codigoComprobante || ultimaVenta.codigo}</span></p>
                    {ultimaVenta.total != null && <p>Total: {formatoMonedaARS.format(Number(ultimaVenta.total))}</p>}
                    {ultimaVenta.metodoPago && <p>Medio de pago: {ultimaVenta.metodoPago}</p>}
                </Alert>
            )}

            {(errorProductos || errorVenta || errorCobro) && (
                <Alert
                    variant="error"
                    texto={errorProductos || errorVenta || errorCobro}
                    className="mb-6"
                />
            )}
            {estadoFinalQr && (
                <Alert variant="warning" texto={estadoFinalQr} className="mb-6" />
            )}

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_25rem] xl:gap-6">
                <div className="order-2 border border-line bg-ticket xl:order-1">
                    <div className="border-b border-line p-4">
                        <Input
                            id="buscar-producto"
                            value={busqueda}
                            onChange={function (event) { setBusqueda(event.target.value); }}
                            placeholder="Buscar por nombre o categoría..."
                            icon={Search}
                        />
                    </div>
                    {cargandoProductos ? (
                        <CargaAdmin />
                    ) : (
                        <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                            {productosVisibles.map(function (producto) {
                                const stock = disponible(producto);
                                const enVenta = items.find(function (item) { return item.productoId === producto.id; });
                                const sinStock = stock === 0;
                                return (
                                    <button
                                        key={producto.id}
                                        type="button"
                                        disabled={sinStock || Boolean(producto.promocionNoAplicable) || Boolean(ventaPendienteCobro)}
                                        onClick={function () { agregarProducto(producto); }}
                                        className="cursor-pointer p-2 text-left transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-45"
                                    >
                                        <p className="font-display text-base text-ink">{producto.nombre}</p>
                                        <p className="text-[11px] text-ink/55">
                                            {producto.categoria || "Sin categoría"} · {stock} disponibles
                                        </p>
                                        <div className="mt-1 flex items-center justify-between text-sm">
                                            <span className="font-mono-ticket text-forest font-bold">
                                                {Number(producto.precioFinal) < Number(producto.precio) && <span className="mr-2 text-xs text-ink/45 line-through">{formatoMonedaARS.format(Number(producto.precio))}</span>}
                                                {formatoMonedaARS.format(Number(producto.precioFinal ?? producto.precio))}
                                            </span>
                                            <span className="text-xs">
                                                {producto.promocionNoAplicable
                                                    ? "Promoción no aplicable"
                                                    : enVenta ? enVenta.cantidad + " en venta" : sinStock ? "Sin stock" : "+ Agregar"}
                                            </span>
                                        </div>
                                        {producto.promocionNoAplicable && (
                                            <p role="alert" className="mt-2 text-xs text-red-700">
                                                {producto.promocionNoAplicable.mensaje}
                                            </p>
                                        )}
                                    </button>
                                );
                            })}
                            {!productosVisibles.length && (
                                <p className="p-5 text-sm text-ink/60 sm:col-span-2 text-center">
                                    No se encontraron productos.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <aside className="order-1 h-fit border border-line bg-ticket xl:sticky xl:top-20 xl:order-2 xl:max-h-[calc(100vh-5.5rem)] xl:self-start xl:overflow-y-auto">
                    <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-ticket px-3 py-2">
                        <ShoppingCart size={19} aria-hidden="true" />
                        <h2 className="font-display text-lg text-ink">Venta actual</h2>
                    </div>

                    <section className="border-b border-line px-3 py-2" aria-labelledby="cliente-venta-rapida">
                        <h3 id="cliente-venta-rapida" className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                            <User size={16} aria-hidden="true" />
                            Cliente registrado (opcional)
                        </h3>
                        {clienteSeleccionado ? (
                            <div className="flex items-start gap-2 border border-line bg-paper px-3 py-2">
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold leading-5 text-ink">
                                        {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}
                                    </p>
                                    <p className="text-xs leading-4 text-ink/60">DNI: {clienteSeleccionado.dni}</p>
                                    <p className="break-all text-xs leading-4 text-ink/60">{clienteSeleccionado.email}</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    icon={X}
                                    aria-label="Quitar cliente"
                                    title="Quitar cliente"
                                    className="shrink-0"
                                    disabled={buscandoCliente || registrando || cobrando || Boolean(ventaPendienteCobro)}
                                    onClick={quitarCliente}
                                />
                            </div>
                        ) : (
                            <form onSubmit={buscarCliente} className="space-y-3">
                                <Input
                                    id="dni-cliente-venta-rapida"
                                    label="Buscar por DNI"
                                    value={dniBusqueda}
                                    onChange={function (event) {
                                        setDniBusqueda(event.target.value);
                                        setErrorDniBusqueda("");
                                        setErrorBusquedaCliente(null);
                                    }}
                                    placeholder="Ej.: 12345678"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    error={errorDniBusqueda}
                                    disabled={buscandoCliente || registrando || cobrando || Boolean(ventaPendienteCobro)}
                                />
                                <Button
                                    type="submit"
                                    variant="secondary"
                                    icon={Search}
                                    loading={buscandoCliente}
                                    loadingText="Buscando..."
                                    disabled={registrando || cobrando || Boolean(ventaPendienteCobro)}
                                    className="w-full"
                                >
                                    Buscar cliente
                                </Button>
                                {errorBusquedaCliente && (
                                    <Alert variant="warning" texto={errorBusquedaCliente} />
                                )}
                            </form>
                        )}
                    </section>

                    {ventaPendienteCobro && (
                        <Alert
                            variant="warning"
                            texto={
                                metodoPago === "MercadoPago"
                                    ? "Venta registrada. Escaneá el QR y esperá a que el pago quede confirmado."
                                    : "La venta ya está registrada. Reintentá el cobro para evitar duplicarla."
                            }
                        />
                    )}
                    {errorVerificacionQr && (
                        <Alert variant="warning" texto={errorVerificacionQr} />
                    )}

                    {!items.length ? (
                        <p className="p-6 text-sm text-ink/60 text-center">
                            Agrega productos para comenzar.
                        </p>
                    ) : (
                        <>
                            <ul className="divide-y divide-line max-h-48 overflow-y-auto">
                                {items.map(function (item) {
                                    const precioCarrito = calculosCarrito.get(item.productoId);
                                    return (
                                        <li key={item.productoId} className="p-3">
                                            <div className="flex justify-between gap-3">
                                                <p className="font-display text-ink">{item.nombre}</p>
                                                <button
                                                    type="button"
                                                    disabled={Boolean(ventaPendienteCobro)}
                                                    onClick={function () { cambiarCantidad(item.productoId, 0); }}
                                                    className="cursor-pointer text-red-600 disabled:opacity-35 hover:text-red-700"
                                                    aria-label={"Quitar " + item.nombre}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={Boolean(ventaPendienteCobro)}
                                                        onClick={function () { cambiarCantidad(item.productoId, item.cantidad - 1); }}
                                                        className="cursor-pointer border border-line p-1 disabled:opacity-35 hover:bg-paper"
                                                        aria-label="Restar una unidad"
                                                    >
                                                        <Minus size={13} />
                                                    </button>
                                                    <span className="w-6 text-center font-mono-ticket text-sm font-bold">
                                                        {item.cantidad}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        disabled={item.cantidad >= item.disponible || Boolean(ventaPendienteCobro)}
                                                        onClick={function () { cambiarCantidad(item.productoId, item.cantidad + 1); }}
                                                        className="cursor-pointer border border-line p-1 disabled:cursor-not-allowed disabled:opacity-35 hover:bg-paper"
                                                        aria-label="Sumar una unidad"
                                                    >
                                                        <Plus size={13} />
                                                    </button>
                                                </div>
                                                <span className="font-mono-ticket text-sm font-bold">
                                                    {formatoMonedaARS.format(precioCarrito.subtotalCentavos / 100)}
                                                </span>
                                            </div>
                                            {precioCarrito.promocion && (
                                                <p className="mt-2 text-xs text-forest">
                                                    {precioCarrito.promocion.tipoDescuento === "COMBO"
                                                        ? `${precioCarrito.promocion.titulo}: ${precioCarrito.combosAplicados} ${precioCarrito.combosAplicados === 1 ? "combo aplicado" : "combos aplicados"}${precioCarrito.unidadesBonificadas ? ` · ${precioCarrito.unidadesBonificadas} unidad(es) bonificada(s)` : ""}`
                                                        : `${precioCarrito.promocion.titulo}${precioCarrito.unidadesBonificadas > 0
                                                            ? `: ${precioCarrito.unidadesBonificadas} ${precioCarrito.unidadesBonificadas === 1 ? "unidad bonificada" : "unidades bonificadas"}`
                                                            : ""}`}
                                                    {" · "}ahorro {formatoMonedaARS.format(precioCarrito.descuentoCentavos / 100)}
                                                </p>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>

                            <div className="border-t border-line p-3 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-ink/60">Total</span>
                                    <span className="font-mono-ticket text-2xl text-forest font-bold">{formatoMonedaARS.format(total)}</span>
                                </div>

                                <Select
                                    id="metodo-pago"
                                    label="Método de pago"
                                    value={metodoPago}
                                    onChange={function (event) { setMetodoPago(event.target.value); }}
                                    disabled={registrando || cobrando || Boolean(ventaPendienteCobro)}
                                    options={[
                                        { value: "Efectivo", label: "Efectivo" },
                                        { value: "Tarjeta", label: "Tarjeta" },
                                        { value: "MercadoPago", label: "Mercado Pago" }
                                    ]}
                                />

                                {metodoPago === "Efectivo" && (
                                    <div className="space-y-3 pt-1">
                                        <Input
                                            id="efectivo-recibido"
                                            label="Efectivo recibido"
                                            type="text"
                                            inputMode="decimal"
                                            value={efectivoRecibido}
                                            onChange={function (event) { setEfectivoRecibido(event.target.value); }}
                                            placeholder="0,00"
                                            disabled={registrando || cobrando}
                                            error={
                                                efectivoInvalido
                                                    ? "Ingresá un importe válido."
                                                    : efectivoInsuficiente
                                                    ? "El efectivo recibido es insuficiente."
                                                    : null
                                            }
                                        />

                                        <p className="flex justify-between text-sm">
                                            <span>Cambio</span>
                                            <strong className="font-mono-ticket">{formatoMonedaARS.format((cambioCentavos || 0) / 100)}</strong>
                                        </p>

                                        {cambioCentavos > 0 && (
                                            <p role="status" className="text-xs text-forest">
                                                Vuelto: <span className="font-mono-ticket">{formatoMonedaARS.format(cambioCentavos / 100)}</span>
                                            </p>
                                        )}
                                    </div>
                                )}

                                {metodoPago === "MercadoPago" && ventaPendienteCobro && (
                                    <div className="border border-line bg-paper p-3 text-center">
                                        <p className="text-xs text-ink/50">
                                            Escanea para pagar
                                        </p>
                                        {urlQr ? (
                                            <img
                                                src={urlQr}
                                                alt="Código QR para pagar con Mercado Pago"
                                                className="mx-auto mt-3 h-40 w-40 object-contain"
                                            />
                                        ) : (
                                            <p className="mt-3 text-xs text-ink/60">
                                                Generando código QR...
                                            </p>
                                        )}
                                        <p className="mt-3 text-[11px] text-ink/60">
                                            Estado: {esVentaPagada(ventaPendienteCobro)
                                                ? "Pago confirmado"
                                                : ventaPendienteCobro.mpOrderStatusDetail || ventaPendienteCobro.mpOrderStatus || "Esperando pago"}
                                        </p>
                                    </div>
                                )}

                                <Button
                                    type="button"
                                    disabled={
                                        registrando ||
                                        cobrando ||
                                        Boolean(ventaPendienteCobro) ||
                                        (metodoPago === "Efectivo" &&
                                            (efectivoCentavos === null || efectivoCentavos <= 0 || efectivoCentavos < totalCentavos))
                                    }
                                    onClick={confirmarVenta}
                                    loading={registrando || cobrando}
                                    loadingText={cobrando ? "Cobrando..." : "Registrando..."}
                                    icon={ShoppingCart}
                                    className="w-full"
                                >
                                    {ventaPendienteCobro
                                        ? "Esperando pago"
                                        : metodoPago === "Efectivo"
                                        ? "Cobrar"
                                        : metodoPago === "MercadoPago"
                                        ? "Registrar venta"
                                        : "Cobrar y confirmar venta"}
                                </Button>
                            </div>
                        </>
                    )}
                </aside>
            </div>
        </section>
    );
}

export default AdminVentaRapida;
