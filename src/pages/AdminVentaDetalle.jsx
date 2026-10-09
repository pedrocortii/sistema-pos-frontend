import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { cancelarVenta, cobrarVenta, obtenerVenta } from "../api/ventas";
import { Alerta, Carga } from "./AdminProductos";
import { Estado } from "./AdminVentas";
import { usePeticion } from "../hooks/usePeticion";
import { convertirACentavos, formatoMonedaARS, parsearMontoACentavos } from "../utils/moneda";

function AdminVentaDetalle() {
    const { id } = useParams();
    const { data: venta, isLoading: cargando, error, execute: cargar } = usePeticion(obtenerVenta);
    const [accion, setAccion] = useState(false);
    const [efectivoRecibido, setEfectivoRecibido] = useState("");
    const [errorAccion, setErrorAccion] = useState(null);

    useEffect(function () {
        cargar(id).catch(function () {
            // El error queda disponible para que la pantalla lo muestre.
        });
    }, [id, cargar]);

    async function ejecutarAccion(fn, datos) {
        setAccion(true);
        setErrorAccion(null);
        try {
            await fn(id, datos);
            await cargar(id);
            if (fn === cobrarVenta) setEfectivoRecibido("");
        } catch (errorPeticion) {
            setErrorAccion(errorPeticion.response?.data?.mensaje || "No se pudo procesar la operación. Verificá los datos e intentá nuevamente.");
        } finally {
            setAccion(false);
        }
    }

    function cobrarPendiente() {
        const efectivoCentavos = parsearMontoACentavos(efectivoRecibido);
        const totalCentavos = convertirACentavos(venta.total);
        if (efectivoCentavos === null || efectivoCentavos <= 0 || totalCentavos === null || efectivoCentavos < totalCentavos) return;

        ejecutarAccion(cobrarVenta, {
            metodoPago: "Efectivo",
            efectivoRecibido: efectivoCentavos / 100
        });
    }

    const efectivoCentavos = parsearMontoACentavos(efectivoRecibido);
    const totalCentavos = venta ? convertirACentavos(venta.total) : null;
    const efectivoInvalido = efectivoRecibido.trim() !== "" && efectivoCentavos === null;
    const efectivoInsuficiente = efectivoCentavos !== null && totalCentavos !== null && efectivoCentavos < totalCentavos;
    const cambioCentavos = efectivoCentavos !== null && totalCentavos !== null && efectivoCentavos >= totalCentavos
        ? efectivoCentavos - totalCentavos
        : null;

    if (cargando) return <Carga />;
    if (error && !venta) return <Alerta texto={error} />;

    return (
        <section>
            <Link to="/admin/ventas" className="font-mono-ticket text-sm text-forest hover:underline">
                ← Volver a ventas
            </Link>

            {error && <Alerta texto={error} />}
            {errorAccion && <Alerta texto={errorAccion} />}

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
                                    <div className="mb-2 border-t border-line pt-4">
                                        <p className="flex justify-between font-mono-ticket text-sm">
                                            <span>Total</span>
                                            <strong>{formatoMonedaARS.format(Number(venta.total))}</strong>
                                        </p>
                                        <label htmlFor="efectivo-recibido" className="mt-4 block font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                                            Efectivo recibido
                                        </label>
                                        <input
                                            id="efectivo-recibido"
                                            type="text"
                                            inputMode="decimal"
                                            value={efectivoRecibido}
                                            onChange={function (event) { setEfectivoRecibido(event.target.value); }}
                                            placeholder="0,00"
                                            disabled={accion}
                                            className="mt-1 w-full border border-line bg-paper p-2.5 font-mono-ticket text-sm outline-none focus:border-forest disabled:opacity-60"
                                        />
                                        {efectivoInvalido && (
                                            <p role="alert" className="mt-2 font-mono-ticket text-xs text-red-600">
                                                Ingresá un importe válido.
                                            </p>
                                        )}
                                        <p className="mt-3 flex justify-between font-mono-ticket text-sm">
                                            <span>Cambio</span>
                                            <strong>{formatoMonedaARS.format((cambioCentavos || 0) / 100)}</strong>
                                        </p>
                                        {efectivoInsuficiente && (
                                            <p role="alert" className="mt-2 font-mono-ticket text-xs text-red-600">
                                                El efectivo recibido es insuficiente.
                                            </p>
                                        )}
                                        {cambioCentavos > 0 && (
                                            <p role="status" className="mt-2 font-mono-ticket text-xs text-forest">
                                                Vuelto: {formatoMonedaARS.format(cambioCentavos / 100)}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        disabled={accion || efectivoCentavos === null || efectivoCentavos <= 0 || totalCentavos === null || efectivoCentavos < totalCentavos}
                                        onClick={cobrarPendiente}
                                        className="cursor-pointer bg-forest p-2 font-mono-ticket text-sm text-paper disabled:opacity-60 hover:bg-forest-dark transition-colors"
                                    >
                                        {accion ? "Cobrando..." : "Cobrar"}
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
