import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Boxes, CircleDollarSign, Package, ReceiptText, RefreshCw, Trophy } from "lucide-react";
import { obtenerResumenDashboard, crearFechaFin, crearFechaInicio } from "../api/dashboard";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { PageHeader } from "../components/ui/PageHeader";
import { formatoMonedaARS } from "../utils/moneda";
import { usePeticion } from "../hooks/usePeticion";

function Dashboard() {
    const hoy = useMemo(function () { return new Date().toISOString().slice(0, 10); }, []);
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");
    const { data, isLoading, error, execute } = usePeticion(obtenerResumenDashboard);
    const errorFiltro = fechaDesde && fechaHasta && fechaDesde > fechaHasta
        ? "La fecha desde no puede ser posterior a la fecha hasta."
        : null;

    const cargarResumen = useCallback(function () {
        if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
            return;
        }
        return execute({
            fechaDesde: crearFechaInicio(fechaDesde),
            fechaHasta: crearFechaFin(fechaHasta)
        }).catch(function () {});
    }, [execute, fechaDesde, fechaHasta]);

    useEffect(function () {
        cargarResumen();
    }, [cargarResumen]);

    const resumen = data || { totalVendido: 0, cantidadVentas: 0, productosStockBajo: [], productoMasVendido: null, totalProductosActivos: 0 };
    const tarjetas = [
        { etiqueta: "Total vendido", valor: formatoMonedaARS.format(resumen.totalVendido), icono: CircleDollarSign },
        { etiqueta: "Cantidad de ventas", valor: resumen.cantidadVentas, icono: ReceiptText },
        { etiqueta: "Stock bajo", valor: resumen.productosStockBajo.length, icono: Boxes },
        { etiqueta: "Producto más vendido", valor: resumen.productoMasVendido?.nombre || "Sin ventas", detalle: resumen.productoMasVendido ? `${resumen.productoMasVendido.cantidad} unidades` : "En el período", icono: Trophy },
        { etiqueta: "Productos activos", valor: resumen.totalProductosActivos, icono: Package }
    ];

    return (
        <section>
            <PageHeader titulo="Resumen del negocio">
                <div className="flex flex-col gap-3 border border-line bg-ticket p-4 sm:flex-row sm:items-end">
                    <Input label="Desde" type="date" value={fechaDesde} max={fechaHasta || hoy} onChange={function (e) { setFechaDesde(e.target.value); }} />
                    <Input label="Hasta" type="date" value={fechaHasta} min={fechaDesde || undefined} max={hoy} onChange={function (e) { setFechaHasta(e.target.value); }} />
                    <Button variant="secondary" icon={RefreshCw} onClick={cargarResumen} loading={isLoading} loadingText="Actualizando...">Actualizar</Button>
                </div>
            </PageHeader>

            {(errorFiltro || error) && <Alert tipo="error" titulo="No se pudo cargar el dashboard" texto={errorFiltro || error} className="mb-6" />}

            {isLoading && !data ? <p className="font-mono-ticket text-sm text-ink/60">Cargando métricas...</p> : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        {tarjetas.map(function (tarjeta) {
                            const Icono = tarjeta.icono;
                            return <Card key={tarjeta.etiqueta} className="flex min-h-32 flex-col justify-between"><div className="flex items-start justify-between gap-3"><p className="text-xs text-ink/60">{tarjeta.etiqueta}</p><Icono size={20} className="text-forest" aria-hidden="true" /></div><div><p className="mt-4 break-words font-display text-2xl text-ink">{tarjeta.valor}</p>{tarjeta.detalle && <p className="mt-1 text-xs text-ink/50">{tarjeta.detalle}</p>}</div></Card>;
                        })}
                    </div>
                    <Card className="mt-6">
                        <div className="mb-4 flex items-center gap-2"><AlertCircle size={18} className="text-amber" aria-hidden="true" /><h2 className="font-display text-xl text-ink">Productos con stock bajo</h2></div>
                        {resumen.productosStockBajo.length ? <div className="divide-y divide-line border-y border-line">{resumen.productosStockBajo.map(function (producto) { return <div key={producto.id} className="flex items-center justify-between gap-4 py-3 text-sm"><span className="truncate">{producto.nombre}</span><span className="shrink-0 font-mono-ticket text-ink/60">{producto.stockDisponible} disponibles</span></div>; })}</div> : <p className="text-sm text-ink/60">No hay productos que requieran reposición.</p>}
                    </Card>
                </>
            )}
        </section>
    );
}

export default Dashboard;
