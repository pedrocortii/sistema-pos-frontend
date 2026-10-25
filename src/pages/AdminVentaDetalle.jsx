import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { cancelarVenta, cobrarVenta, obtenerVenta } from "../api/ventas";
import { CargaAdmin } from "../components/AdminUI";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Alert } from "../components/ui/Alert";
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

    if (cargando) return <CargaAdmin />;
    if (error && !venta) return <Alert tipo="error" texto={error} className="mt-4" />;

    return (
        <section>
            <PageHeader
                volverA="/admin/ventas"
                textoVolver="Volver a ventas"
                etiqueta="Venta"
                titulo={venta ? venta.codigoComprobante : "Detalle de venta"}
                descripcion={venta ? new Date(venta.fecha).toLocaleString("es-AR") : ""}
                acciones={venta && <Badge estado={venta.estado} size="md" />}
            />

            {error && <Alert tipo="error" texto={error} className="mb-4" />}
            {errorAccion && <Alert tipo="error" texto={errorAccion} className="mb-4" />}

            {venta && (
                <div className="grid gap-5 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardTitle className="mb-4">Productos</CardTitle>
                        <div className="divide-y divide-line">
                            {venta.detalles.map(function (d) {
                                return (
                                    <div key={d.id} className="flex justify-between py-3 text-sm">
                                        <span>{d.producto.nombre} × {d.cantidad}</span>
                                        <span className="font-mono-ticket font-medium">${Number(d.subtotal).toFixed(2)}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-5 border-t border-line pt-4 text-right text-xl text-forest font-bold">
                            Total: ${Number(venta.total).toFixed(2)}
                        </div>
                    </Card>

                    <Card>
                        <CardTitle className="mb-4">Cliente</CardTitle>
                        <div className="space-y-2 text-sm">
                            <p className="font-medium">
                                {venta.clienteNombre
                                    ? [venta.clienteNombre, venta.clienteApellido].filter(Boolean).join(" ")
                                    : "Venta anónima"}
                            </p>
                            {venta.clienteEmail && (
                                <p className="text-ink/60">{venta.clienteEmail}</p>
                            )}
                            {venta.clienteDni && (
                                <p className="text-ink/60">DNI: {venta.clienteDni}</p>
                            )}
                        </div>

                        {venta.estado === "PENDIENTE" && (
                            <div className="mt-6 border-t border-line pt-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span>Total</span>
                                    <strong className="font-mono-ticket">{formatoMonedaARS.format(Number(venta.total))}</strong>
                                </div>

                                <Input
                                    label="Efectivo recibido"
                                    type="text"
                                    inputMode="decimal"
                                    value={efectivoRecibido}
                                    onChange={function (event) { setEfectivoRecibido(event.target.value); }}
                                    placeholder="0,00"
                                    disabled={accion}
                                    error={
                                        efectivoInvalido
                                            ? "Ingresá un importe válido."
                                            : efectivoInsuficiente
                                            ? "El efectivo recibido es insuficiente."
                                            : null
                                    }
                                />

                                <div className="flex justify-between text-sm pt-1">
                                    <span>Cambio</span>
                                    <strong className="font-mono-ticket">{formatoMonedaARS.format((cambioCentavos || 0) / 100)}</strong>
                                </div>

                                {cambioCentavos > 0 && (
                                    <p role="status" className="text-xs text-forest">
                                        Vuelto: <span className="font-mono-ticket">{formatoMonedaARS.format(cambioCentavos / 100)}</span>
                                    </p>
                                )}

                                <div className="pt-2 flex flex-col gap-2">
                                    <Button
                                        disabled={accion || efectivoCentavos === null || efectivoCentavos <= 0 || totalCentavos === null || efectivoCentavos < totalCentavos}
                                        onClick={cobrarPendiente}
                                        loading={accion}
                                        loadingText="Cobrando..."
                                        className="w-full"
                                    >
                                        Cobrar
                                    </Button>
                                    <Button
                                        variant="danger-outline"
                                        disabled={accion}
                                        onClick={function () { ejecutarAccion(cancelarVenta); }}
                                        className="w-full"
                                    >
                                        Cancelar venta
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </section>
    );
}

export default AdminVentaDetalle;
