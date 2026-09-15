import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { cancelarVenta, cobrarVenta, obtenerVenta } from "../api/ventas";
import { Alerta, Carga } from "./AdminProductos";
import { Estado } from "./AdminVentas";
import { usePeticion } from "../hooks/usePeticion";

function AdminVentaDetalle() {
    const { id } = useParams();
    const { data: venta, isLoading: cargando, error, execute: cargar } = usePeticion(obtenerVenta);
    const [accion, setAccion] = useState(false);

    useEffect(function () {
        cargar(id).catch(function () {
            // El error queda disponible para que la pantalla lo muestre.
        });
    }, [id, cargar]);

    async function ejecutarAccion(fn) {
        setAccion(true);
        try {
            await fn(id);
            await cargar(id);
        } catch {
            // Error handled by useApi
        } finally {
            setAccion(false);
        }
    }

    if (cargando) return <Carga />;
    if (error && !venta) return <Alerta texto={error} />;

    return (
        <section>
            <Link to="/admin/ventas" className="font-mono-ticket text-sm text-forest hover:underline">
                ← Volver a ventas
            </Link>

            {error && <Alerta texto={error} />}

            {venta && (
                <>
                    <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="font-mono-ticket text-xs uppercase tracking-wide text-forest">Venta</p>
                            <h1 className="mt-1 font-display text-3xl">{venta.codigoComprobante}</h1>
                            <p className="mt-2 font-mono-ticket text-sm text-ink/60">
                                {new Date(venta.fecha).toLocaleString("es-AR")}
                            </p>
                        </div>
                        <Estado estado={venta.estado} />
                    </div>

                    <div className="mt-6 grid gap-5 lg:grid-cols-3">
                        <div className="border border-line bg-ticket p-5 lg:col-span-2">
                            <h2 className="font-display text-xl mb-4">Productos</h2>
                            <div className="divide-y divide-line">
                                {venta.detalles.map(function (d) {
                                    return (
                                        <div key={d.id} className="flex justify-between py-3 font-mono-ticket text-sm">
                                            <span>{d.producto.nombre} × {d.cantidad}</span>
                                            <span className="font-medium">${Number(d.subtotal).toFixed(2)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-5 border-t border-line pt-4 text-right font-mono-ticket text-xl text-forest font-bold">
                                Total: ${Number(venta.total).toFixed(2)}
                            </div>
                        </div>

                        <aside className="border border-line bg-ticket p-5">
                            <h2 className="font-display text-xl mb-4">Cliente</h2>
                            <div className="space-y-2">
                                <p className="font-mono-ticket text-sm">
                                    {venta.clienteNombre
                                        ? [venta.clienteNombre, venta.clienteApellido].filter(Boolean).join(" ")
                                        : "Venta anónima"}
                                </p>
                                {venta.clienteEmail && (
                                    <p className="font-mono-ticket text-sm text-ink/60">{venta.clienteEmail}</p>
                                )}
                                {venta.clienteDni && (
                                    <p className="font-mono-ticket text-sm text-ink/60">DNI: {venta.clienteDni}</p>
                                )}
                            </div>

                            {venta.estado === "PENDIENTE" && (
                                <div className="mt-6 grid gap-2">
                                    <button
                                        disabled={accion}
                                        onClick={function () { ejecutarAccion(cobrarVenta); }}
                                        className="cursor-pointer bg-forest p-2 font-mono-ticket text-sm text-paper disabled:opacity-60 hover:bg-forest-dark transition-colors"
                                    >
                                        Pagar
                                    </button>
                                    <button
                                        disabled={accion}
                                        onClick={function () { ejecutarAccion(cancelarVenta); }}
                                        className="cursor-pointer border border-red-600 p-2 font-mono-ticket text-sm text-red-600 disabled:opacity-60 hover:bg-red-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </aside>
                    </div>
                </>
            )}
        </section>
    );
}

export default AdminVentaDetalle;
