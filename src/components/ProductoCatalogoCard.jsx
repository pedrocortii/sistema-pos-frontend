import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { useCarritoStore } from "../store/carritoStore";
import SelectorCantidad from "./SelectorCantidad";
import ImagenProducto from "./ImagenProducto";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

function ProductoCatalogoCard({ producto }) {
    const agregarProducto = useCarritoStore(function (estado) { return estado.agregarProducto; });
    const items = useCarritoStore(function (estado) { return estado.items; });
    const [agregado, setAgregado] = useState(false);
    const [avisoStock, setAvisoStock] = useState("");

    const stock = Number(producto.stock);
    const stockReservado = Number(producto.stockReservado || 0);
    const stockDisponible = Number.isFinite(stock)
        ? Math.max(0, stock - (Number.isFinite(stockReservado) ? stockReservado : 0))
        : 0;
    const itemEnCarrito = items.find(function (item) { return item.productoId === producto.id; });
    const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;
    const cantidadMaxima = Math.max(0, stockDisponible - cantidadEnCarrito);
    const sinStock = cantidadMaxima === 0;
    const [cantidad, setCantidad] = useState(1);

    function manejarAgregar() {
        if (agregarProducto(producto, cantidad)) {
            setAgregado(true);
            setAvisoStock("");
            setCantidad(1);
        } else {
            setAgregado(false);
            setAvisoStock("No hay stock suficiente para agregar ese producto.");
        }
    }

    return (
        <Card hover className="flex flex-col">
            <div className="-mx-6 -mt-6 mb-4 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-t bg-paper p-4">
                <ImagenProducto
                    imagen={producto.imagen}
                    alt={"Imagen de " + producto.nombre}
                    className="h-full w-full object-contain"
                />
            </div>
            <p className="font-mono-ticket text-xs text-ink/50">
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
                <div className="font-mono-ticket text-lg font-bold">
                    {Number(producto.precioFinal) < Number(producto.precio) && <span className="mr-2 text-sm text-ink/45 line-through">${Number(producto.precio).toFixed(2)}</span>}
                    <span className="text-forest">${Number(producto.precioFinal ?? producto.precio).toFixed(2)}</span>
                </div>
                {sinStock && (
                    <Badge variant="danger" size="xs">
                        Sin stock
                    </Badge>
                )}
            </div>
            {!sinStock && (
                <p className="font-mono-ticket text-xs text-ink/60 mt-2">
                    Stock disponible: {cantidadMaxima}
                </p>
            )}

            <div className="flex items-center gap-3 mt-4">
                <SelectorCantidad
                    cantidad={cantidad}
                    onCambiar={function (valor) {
                        setAvisoStock("");
                        setCantidad(valor);
                    }}
                    maximo={cantidadMaxima}
                />
                <Button
                    type="button"
                    onClick={manejarAgregar}
                    disabled={sinStock}
                    size="icon-lg"
                    aria-label={agregado ? "Producto agregado al carrito" : "Agregar al carrito"}
                    title={agregado ? "Producto agregado" : "Agregar al carrito"}
                >
                    {agregado ? <Check size={16} /> : <ShoppingCart size={16} />}
                </Button>
            </div>
            {avisoStock && (
                <p className="mt-3 font-mono-ticket text-xs text-red-600" role="alert">
                    {avisoStock}
                </p>
            )}
        </Card>
    );
}

export default ProductoCatalogoCard;
