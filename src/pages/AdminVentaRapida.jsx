import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { listarProductos } from "../api/productos";
import { crearVentaDirecta } from "../api/ventas";
import { usePeticion } from "../hooks/usePeticion";
import { useAuthStore } from "../store/authStore";
import { Alerta, Cabecera, Carga } from "./AdminProductos";

const formatoMoneda = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS"
});

function obtenerErrorVenta(error) {
    const datos = error.response?.data;
    if (Array.isArray(datos?.errores)) {
        return datos.errores.map(function (item) { return item.message || item; }).join(". ");
    }
    return datos?.mensaje || "No se pudo registrar la venta. Intenta nuevamente.";
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
    const [ultimaVenta, setUltimaVenta] = useState(null);
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

    const total = items.reduce(function (acumulado, item) {
        return acumulado + item.precio * item.cantidad;
    }, 0);

    function disponible(producto) {
        return Math.max(0, Number(producto.stock || 0) - Number(producto.stockReservado || 0));
    }

    function agregarProducto(producto) {
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
        if (!items.length || registrando) return;
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
                        {ultimaVenta.total != null && <p>Total: {formatoMoneda.format(Number(ultimaVenta.total))}</p>}
                        {ultimaVenta.metodoPago && <p>Medio de pago: {ultimaVenta.metodoPago}</p>}
                    </div>
                </div>
            )}

            {(errorProductos || errorVenta) && <Alerta texto={errorProductos || errorVenta} />}

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
                                return <button key={producto.id} type="button" disabled={sinStock} onClick={function () { agregarProducto(producto); }} className="cursor-pointer p-4 text-left transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-45">
                                    <p className="font-display text-lg">{producto.nombre}</p>
                                    <p className="mt-1 font-mono-ticket text-xs text-ink/55">{producto.categoria || "Sin categoría"} · {stock} disponibles</p>
                                    <div className="mt-3 flex items-center justify-between font-mono-ticket text-sm">
                                        <span className="text-forest">{formatoMoneda.format(Number(producto.precio))}</span>
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
                    {!items.length ? <p className="p-5 font-mono-ticket text-sm text-ink/60">Agrega productos para comenzar.</p> : <>
                        <ul className="divide-y divide-line">
                            {items.map(function (item) {
                                return <li key={item.productoId} className="p-4">
                                    <div className="flex justify-between gap-3"><p className="font-display">{item.nombre}</p><button type="button" onClick={function () { cambiarCantidad(item.productoId, 0); }} className="cursor-pointer text-red-600" aria-label={"Quitar " + item.nombre}><Trash2 size={17} /></button></div>
                                    <div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-2"><button type="button" onClick={function () { cambiarCantidad(item.productoId, item.cantidad - 1); }} className="cursor-pointer border border-line p-1" aria-label="Restar una unidad"><Minus size={14} /></button><span className="w-6 text-center font-mono-ticket text-sm">{item.cantidad}</span><button type="button" disabled={item.cantidad >= item.disponible} onClick={function () { cambiarCantidad(item.productoId, item.cantidad + 1); }} className="cursor-pointer border border-line p-1 disabled:cursor-not-allowed disabled:opacity-35" aria-label="Sumar una unidad"><Plus size={14} /></button></div><span className="font-mono-ticket text-sm">{formatoMoneda.format(item.precio * item.cantidad)}</span></div>
                                </li>;
                            })}
                        </ul>
                        <div className="border-t border-line p-4">
                            <div className="flex items-center justify-between font-mono-ticket"><span className="text-sm uppercase tracking-wide text-ink/60">Total</span><span className="text-2xl text-forest">{formatoMoneda.format(total)}</span></div>
                            <label htmlFor="metodo-pago" className="mt-5 block font-mono-ticket text-xs uppercase tracking-wide text-ink/60">Método de pago</label>
                            <select id="metodo-pago" value={metodoPago} onChange={function (event) { setMetodoPago(event.target.value); }} disabled={registrando} className="mt-1 w-full border border-line bg-paper p-2.5 font-mono-ticket text-sm outline-none focus:border-forest">
                                <option value="Efectivo">Efectivo</option>
                                <option value="Tarjeta">Tarjeta</option>
                                <option value="MercadoPago">Mercado Pago</option>
                            </select>
                            <button type="button" disabled={registrando} onClick={confirmarVenta} className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 bg-forest py-3 font-mono-ticket text-sm uppercase tracking-wide text-paper hover:bg-forest-dark disabled:cursor-wait disabled:opacity-60"><ShoppingCart size={17} aria-hidden="true" />{registrando ? "Registrando..." : "Cobrar y confirmar venta"}</button>
                        </div>
                    </>}
                </aside>
            </div>
        </section>
    );
}

export default AdminVentaRapida;
