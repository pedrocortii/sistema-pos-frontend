import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { useCarritoStore } from "../store/carritoStore";
import SelectorCantidad from "./SelectorCantidad";

function ProductoCatalogoCard({ producto }) {
    const agregarProducto = useCarritoStore(function (estado) { return estado.agregarProducto; });
    const items = useCarritoStore(function (estado) { return estado.items; });
    const [agregado, setAgregado] = useState(false);

    const stockDisponible = Math.max(0, producto.stock - (producto.stockReservado || 0));
    const itemEnCarrito = items.find(function (item) { return item.productoId === producto.id; });
    const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;
    const cantidadMaxima = Math.max(0, stockDisponible - cantidadEnCarrito);
    const sinStock = cantidadMaxima === 0;
    const [cantidad, setCantidad] = useState(1);

    function manejarAgregar() {
        if (agregarProducto(producto, cantidad)) {
            setAgregado(true);
            setCantidad(1);
        }
    }

    return (
        <article className="bg-ticket border border-line p-6 flex flex-col hover:border-forest transition-colors">
            <p className="font-mono-ticket text-xs uppercase tracking-wide text-ink/50">
                {producto.categoria}
            </p>
            <h2 className="font-display text-xl text-ink mt-1">
                {producto.nombre}
            </h2>
            {producto.descripcion && (
                <p className="text-sm text-ink/60 mt-2 flex-1">
                    {producto.descripcion}
                </p>
            )}

            <div className="flex items-center justify-between mt-5">
                <span className="font-mono-ticket text-lg text-forest">
                    ${Number(producto.precio).toFixed(2)}
                </span>
                {sinStock && (
                    <span className="font-mono-ticket text-xs text-red-600">
                        Sin stock
                    </span>
                )}
            </div>
            {!sinStock && (
                <p className="font-mono-ticket text-xs text-ink/60 mt-2">
                    Stock disponible: {cantidadMaxima}
                </p>
            )}

            <div className="flex items-center gap-3 mt-4">
                <SelectorCantidad cantidad={cantidad} onCambiar={setCantidad} maximo={cantidadMaxima} />
                <button
                    type="button"
                    onClick={manejarAgregar}
                    disabled={sinStock}
                    aria-label={agregado ? "Producto agregado al carrito" : "Agregar al carrito"}
                    title={agregado ? "Producto agregado" : "Agregar al carrito"}
                    className="w-11 h-9 bg-forest hover:bg-forest-dark disabled:bg-ink/30 disabled:cursor-not-allowed text-paper transition-colors flex items-center justify-center"
                >
                    {agregado ? <Check size={16} /> : <ShoppingCart size={16} />}
                </button>
            </div>
        </article>
    );
}

export default ProductoCatalogoCard;
