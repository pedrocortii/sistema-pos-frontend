import { Alert } from "./ui/Alert";
import { formatoMonedaARS } from "../utils/moneda";

function PrecioProducto({ producto, className = "" }) {
    const precioOriginal = Number(producto.precioOriginal ?? producto.precio);
    const precioFinal = Number(producto.precioFinal ?? producto.precio);
    const descuento = Number(producto.descuentoAplicado || 0);

    return (
        <div className={className}>
            {producto.promocion && descuento > 0 && (
                <p className="text-xs text-ink/60">
                    Precio original: <span className="line-through">{formatoMonedaARS.format(precioOriginal)}</span>
                </p>
            )}
            {producto.promocionesDisponibles?.some(function (promocion) {
                return promocion.tipoDescuento === "DOS_POR_UNO";
            }) && (
                <p className="text-xs font-semibold text-forest">2x1: llevás 2 unidades y pagás 1</p>
            )}
            {producto.promocionesDisponibles?.filter(function (promocion) {
                return promocion.tipoDescuento === "COMBO";
            }).map(function (promocion) {
                const productosCombo = (promocion.productos || [])
                    .map(function (item) { return item.nombre; })
                    .filter(Boolean)
                    .join(" + ");
                return (
                    <p key={promocion.id} className="text-xs font-semibold text-forest">
                        {promocion.titulo}: {productosCombo} por {formatoMonedaARS.format(Number(promocion.precioCombo))}
                    </p>
                );
            })}
            <p className="font-mono-ticket font-bold text-forest">
                {formatoMonedaARS.format(precioFinal)}
            </p>
            {producto.promocion && descuento > 0 && (
                <p className="text-xs text-forest">
                    {producto.promocion.titulo}: ahorrás {formatoMonedaARS.format(descuento)}
                </p>
            )}
            {producto.promocionNoAplicable && (
                <Alert
                    tipo="error"
                    texto={producto.promocionNoAplicable.mensaje}
                    className="mt-2 text-xs"
                />
            )}
        </div>
    );
}

export default PrecioProducto;
