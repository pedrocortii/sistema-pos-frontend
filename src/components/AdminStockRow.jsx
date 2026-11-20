import { SlidersHorizontal } from "lucide-react";
import ImagenProducto from "./ImagenProducto";
import { Button } from "./ui/Button";
import { formatoMonedaARS } from "../utils/moneda";

const ESTADOS_STOCK = {
    "en-stock": {
        texto: "En Stock",
        clase: "bg-emerald-50 text-emerald-600"
    },
    "stock-bajo": {
        texto: "Stock Bajo",
        clase: "bg-amber-50 text-amber-600"
    },
    "sin-stock": {
        texto: "Sin Stock",
        clase: "bg-red-50 text-red-600"
    }
};

function obtenerEstadoStock(producto) {
    const disponible = Number(producto?.stockDisponible);
    if (!Number.isFinite(disponible) || disponible <= 0) return "sin-stock";
    if (producto?.stockBajo === true) return "stock-bajo";
    return "en-stock";
}

function colorCantidad(estado) {
    if (estado === "sin-stock") return "text-red-500";
    if (estado === "stock-bajo") return "text-orange-500";
    return "text-slate-800";
}

export function AdminStockRow({ producto, onAdjust, esAdministrador }) {
    const estado = obtenerEstadoStock(producto);
    const badge = ESTADOS_STOCK[estado];
    const disponible = Math.max(0, Number(producto.stockDisponible) || 0);
    const precio = Number(producto.precio);
    const reservado = Number(producto.stockReservado) || 0;

    return (
        <tr className="border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50/70">
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <ImagenProducto
                        imagen={producto.imagen}
                        alt={"Imagen de " + producto.nombre}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                        <p className="truncate font-medium text-slate-700">{producto.nombre}</p>
                        {reservado > 0 && (
                            <p className="text-xs text-slate-400">{reservado} reservado(s)</p>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 text-sm text-slate-500">
                {producto.categoria || "Sin categoría"}
            </td>
            <td className={`px-4 py-3 text-sm font-bold ${colorCantidad(estado)}`}>
                {disponible}
            </td>
            <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                {Number.isFinite(precio) ? formatoMonedaARS.format(precio) : "—"}
            </td>
            <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${badge.clase}`}>
                    {badge.texto}
                </span>
            </td>
            {esAdministrador && (
                <td className="px-4 py-3 text-right">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAdjust(producto)}
                        icon={SlidersHorizontal}
                        className="rounded-lg text-slate-500 hover:text-slate-800"
                    >
                        Ajustar
                    </Button>
                </td>
            )}
        </tr>
    );
}

export default AdminStockRow;
