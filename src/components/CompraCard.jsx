import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, FileText, Package, Calendar, CreditCard } from "lucide-react";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { formatoMonedaARS } from "../utils/moneda";

export function CompraCard({ compra }) {
    const [estaAbierto, setEstaAbierto] = useState(false);
    const fechaFormateada = new Date(compra.fecha).toLocaleString("es-AR", {
        dateStyle: "medium",
        timeStyle: "short"
    });

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
                </div>
            )}
        </Card>
    );
}
