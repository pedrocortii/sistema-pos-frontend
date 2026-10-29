import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, FileText, Package, Calendar, CreditCard, RefreshCw, ShoppingCart } from "lucide-react";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";
import { formatoMonedaARS } from "../utils/moneda";
import { obtenerProducto } from "../api/productos";
import { obtenerVenta } from "../api/ventas";
import { useCarritoStore } from "../store/carritoStore";

function agruparDetalles(detalles) {
    const agrupados = new Map();

    (detalles || []).forEach(function (detalle) {
        if (!detalle.productoId) return;
        const actual = agrupados.get(detalle.productoId) || { ...detalle, cantidad: 0 };
        actual.cantidad += Number(detalle.cantidad) || 0;
        agrupados.set(detalle.productoId, actual);
    });

    return Array.from(agrupados.values());
}

export function CompraCard({ compra }) {
    const [estaAbierto, setEstaAbierto] = useState(false);
    const [repitiendo, setRepitiendo] = useState(false);
    const [resultadoRepetir, setResultadoRepetir] = useState(null);
    const agregarProducto = useCarritoStore(function (estado) { return estado.agregarProducto; });
    const fechaFormateada = new Date(compra.fecha).toLocaleString("es-AR", {
        dateStyle: "medium",
        timeStyle: "short"
    });

    async function repetirCompra() {
        if (repitiendo) return;

        setRepitiendo(true);
        setResultadoRepetir(null);

        let detalles;
        try {
            const ventaActual = await obtenerVenta(compra.id);
            detalles = agruparDetalles(ventaActual.detalles);
        } catch (error) {
            setResultadoRepetir({
                tipo: "error",
                texto: error.response?.status === 403
                    ? "No tenés permisos para repetir esta compra."
                    : "No se pudo consultar el detalle de la compra. Intentá nuevamente."
            });
            setRepitiendo(false);
            return;
        }

        if (!detalles.length) {
            setResultadoRepetir({ tipo: "error", texto: "Esta compra no tiene productos disponibles para repetir." });
            setRepitiendo(false);
            return;
        }

        const resultados = await Promise.all(detalles.map(async function (detalle) {
            try {
                const producto = await obtenerProducto(detalle.productoId);
                const stock = Number(producto.stock);
                const reservado = Number(producto.stockReservado || 0);
                const stockDisponible = Math.max(0, stock - reservado);

                if (!Number.isFinite(stock) || !Number.isFinite(reservado) || stockDisponible < detalle.cantidad) {
                    return {
                        ok: false,
                        nombre: producto.nombre || detalle.producto?.nombre || "Producto",
                        motivo: `stock insuficiente (disponibles: ${stockDisponible})`
                    };
                }

                const agregado = agregarProducto(producto, detalle.cantidad);
                if (!agregado) {
                    return {
                        ok: false,
                        nombre: producto.nombre || detalle.producto?.nombre || "Producto",
                        motivo: "la cantidad supera el stock disponible considerando tu carrito actual"
                    };
                }

                return { ok: true, nombre: producto.nombre || detalle.producto?.nombre || "Producto" };
            } catch (error) {
                const noDisponible = error.response?.status === 404;
                return {
                    ok: false,
                    nombre: detalle.producto?.nombre || "Producto",
                    motivo: noDisponible ? "producto inexistente o inactivo" : "no se pudo verificar su disponibilidad"
                };
            }
        }));

        const agregados = resultados.filter(function (resultado) { return resultado.ok; });
        const noAgregados = resultados.filter(function (resultado) { return !resultado.ok; });
        const textoAgregados = agregados.length
            ? `Agregados al carrito: ${agregados.map(function (resultado) { return resultado.nombre; }).join(", ")}.`
            : "No se pudo agregar ningún producto al carrito.";
        const textoNoAgregados = noAgregados.length
            ? ` No disponibles: ${noAgregados.map(function (resultado) { return `${resultado.nombre} (${resultado.motivo})`; }).join("; ")}.`
            : "";

        setResultadoRepetir({
            tipo: agregados.length ? "success" : "error",
            texto: textoAgregados + textoNoAgregados
        });
        setRepitiendo(false);
    }

    return (
        <Card className="p-5 transition-shadow hover:shadow-sm">
            {/* Cabecera de la compra */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono-ticket font-bold text-base text-ink">
                            {compra.codigoComprobante}
                        </span>
                        <Badge estado={compra.estado} />
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono-ticket text-ink/60 flex-wrap">
                        <span className="flex items-center gap-1">
                            <Calendar size={13} aria-hidden="true" />
                            {fechaFormateada}
                        </span>
                        {compra.metodoPago && (
                            <span className="flex items-center gap-1">
                                <CreditCard size={13} aria-hidden="true" />
                                {compra.metodoPago}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-line">
                    <div className="text-left sm:text-right">
                        <span className="text-xs font-mono-ticket text-ink/50 block">Total</span>
                        <span className="font-mono-ticket font-bold text-xl text-forest">
                            {formatoMonedaARS.format(Number(compra.total))}
                        </span>
                    </div>

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEstaAbierto(!estaAbierto)}
                        aria-expanded={estaAbierto}
                    >
                        <span>{estaAbierto ? "Ocultar" : "Detalle"}</span>
                        {estaAbierto ? (
                            <ChevronUp size={14} aria-hidden="true" />
                        ) : (
                            <ChevronDown size={14} aria-hidden="true" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Detalle desplegable de productos */}
            {estaAbierto && (
                <div className="mt-5 pt-4 border-t border-line">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-mono-ticket text-xs text-ink/60 flex items-center gap-1.5 font-bold">
                            <Package size={14} aria-hidden="true" />
                            Productos adquiridos
                        </h3>
                        {compra.codigoComprobante && (
                            <Link
                                to={"/comprobante/" + compra.codigoComprobante}
                                className="font-mono-ticket text-xs text-forest underline hover:opacity-80 flex items-center gap-1"
                            >
                                <FileText size={13} aria-hidden="true" />
                                Ver comprobante
                            </Link>
                        )}
                    </div>

                    {compra.detalles && compra.detalles.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-mono-ticket text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-line text-xs text-ink/50 bg-paper">
                                        <th className="py-2 px-3">Producto</th>
                                        <th className="py-2 px-3 text-center">Cant.</th>
                                        <th className="py-2 px-3 text-right">Precio unitario</th>
                                        <th className="py-2 px-3 text-right">Importe</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line/60">
                                    {compra.detalles.map((item) => (
                                        <tr key={item.id} className="hover:bg-paper/40">
                                            <td className="py-2.5 px-3 font-medium text-ink">
                                                {item.producto?.nombre || "Producto"}
                                            </td>
                                            <td className="py-2.5 px-3 text-center text-ink/80">
                                                {item.cantidad}
                                            </td>
                                            <td className="py-2.5 px-3 text-right text-ink/80">
                                                {formatoMonedaARS.format(Number(item.precioUnitario))}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-semibold text-ink">
                                                {formatoMonedaARS.format(Number(item.subtotal))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-line bg-paper/60">
                                    <td colSpan={3} className="py-2.5 px-3 text-right font-bold text-xs text-ink/70">
                                            Total de la compra:
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-bold text-forest text-base">
                                            {formatoMonedaARS.format(Number(compra.total))}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <p className="font-mono-ticket text-xs text-ink/50 py-2">
                            No hay detalles de productos registrados para esta compra.
                        </p>
                    )}

                    <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                            variant="outline"
                            size="sm"
                            icon={RefreshCw}
                            onClick={repetirCompra}
                            loading={repitiendo}
                            loadingText="Verificando..."
                        >
                            Repetir compra
                        </Button>
                        {resultadoRepetir && (
                            <Alert tipo={resultadoRepetir.tipo} texto={resultadoRepetir.texto} className="m-0 flex-1" />
                        )}
                        {resultadoRepetir?.tipo === "success" && (
                            <Link to="/carrito" className="shrink-0">
                                <Button variant="primary" size="sm" icon={ShoppingCart}>Ir al carrito</Button>
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
}
