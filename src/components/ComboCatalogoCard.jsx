import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ShoppingCart, Tag } from "lucide-react";
import { useCarritoStore } from "../store/carritoStore";
import SelectorCantidad from "./SelectorCantidad";
import ImagenProducto from "./ImagenProducto";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { formatoMonedaARS } from "../utils/moneda";

function promocionesDisponiblesPara(producto, promociones) {
    return promociones.filter(function (promocion) {
        return (promocion.productos || []).some(function (item) {
            return item.producto?.id === producto.id;
        }) || (promocion.categorias || []).some(function (item) {
            return item.categoria === producto.categoria;
        });
    }).map(function (promocion) {
        return {
            id: promocion.id,
            titulo: promocion.titulo,
            tipoDescuento: promocion.tipoDescuento,
            valorDescuento: promocion.valorDescuento == null ? null : Number(promocion.valorDescuento),
            precioCombo: promocion.precioCombo == null ? null : Number(promocion.precioCombo),
            productoIds: (promocion.productos || []).map((item) => item.producto.id),
            productos: (promocion.productos || []).map((item) => ({
                id: item.producto.id,
                nombre: item.producto.nombre
            }))
        };
    });
}

function ComboCatalogoCard({ promocion, promociones }) {
    const agregarCombo = useCarritoStore((estado) => estado.agregarCombo);
    const itemsCarrito = useCarritoStore((estado) => estado.items);
    const [cantidad, setCantidad] = useState(1);
    const [agregado, setAgregado] = useState(false);
    const [error, setError] = useState("");

    const productos = useMemo(function () {
        return (promocion.productos || []).map(function (relacion) {
            const producto = relacion.producto;
            return {
                ...producto,
                precio: Number(producto.precio),
                promocionesDisponibles: promocionesDisponiblesPara(producto, promociones)
            };
        });
    }, [promocion.productos, promociones]);

    const cantidadesCarrito = new Map(itemsCarrito.map((item) => [item.productoId, item.cantidad]));
    const maximoCombos = productos.length >= 2 && productos.every((producto) => producto.activo !== false)
        ? Math.min(...productos.map(function (producto) {
            const stockDisponible = Math.max(0, Number(producto.stock || 0) - Number(producto.stockReservado || 0));
            const cantidadEnCarrito = cantidadesCarrito.get(producto.id) || 0;
            return Math.max(0, stockDisponible - cantidadEnCarrito);
        }))
        : 0;
    const precioRegular = productos.reduce((total, producto) => total + producto.precio, 0);
    const precioCombo = Number(promocion.precioCombo);
    const ahorro = Math.max(0, precioRegular - precioCombo);
    const cantidadSeleccionada = maximoCombos > 0 ? Math.min(cantidad, maximoCombos) : 1;

    function manejarAgregar() {
        setError("");
        if (agregarCombo(productos, cantidadSeleccionada)) {
            setAgregado(true);
            return;
        }
        setAgregado(false);
        setError("No hay stock suficiente para agregar todos los productos del combo.");
    }

    return (
        <Card hover className="flex h-full flex-col border-forest/40">
            <div className="mb-4 flex items-center gap-2 font-mono-ticket text-xs uppercase tracking-wide text-forest">
                <Tag size={15} aria-hidden="true" />
                Combo
            </div>
            <h2 className="font-display text-2xl text-ink">{promocion.titulo}</h2>
            {promocion.descripcion && <p className="mt-2 text-sm text-ink/60">{promocion.descripcion}</p>}

            <div className="my-5 space-y-3">
                {productos.map(function (producto) {
                    return (
                        <Link
                            key={producto.id}
                            to={"/catalogo/" + producto.id}
                            className="flex items-center gap-3 border border-line p-2 text-ink no-underline transition-colors hover:border-forest"
                        >
                            <ImagenProducto
                                imagen={producto.imagen}
                                alt={"Imagen de " + producto.nombre}
                                className="h-12 w-12 shrink-0 object-contain"
                            />
                            <span className="min-w-0 flex-1 truncate font-display text-sm">{producto.nombre}</span>
                            <span className="font-mono-ticket text-xs text-ink/60">
                                {formatoMonedaARS.format(producto.precio)}
                            </span>
                        </Link>
                    );
                })}
            </div>

            <div className="mt-auto border-t border-line pt-4">
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <p className="font-mono-ticket text-xs text-ink/50 line-through">
                            Por separado: {formatoMonedaARS.format(precioRegular)}
                        </p>
                        <p className="font-mono-ticket text-2xl font-bold text-forest">
                            {formatoMonedaARS.format(precioCombo)}
                        </p>
                    </div>
                    <p className="text-right font-mono-ticket text-xs text-forest">
                        Ahorrás {formatoMonedaARS.format(ahorro)}
                    </p>
                </div>

                {maximoCombos > 0 ? (
                    <>
                        <p className="mt-3 font-mono-ticket text-xs text-ink/60">
                            Stock disponible para {maximoCombos} {maximoCombos === 1 ? "combo" : "combos"} completos.
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                            <SelectorCantidad
                                cantidad={cantidadSeleccionada}
                                onCambiar={setCantidad}
                                maximo={maximoCombos}
                            />
                            <Button
                                onClick={manejarAgregar}
                                disabled={productos.length < 2}
                                icon={agregado ? Check : ShoppingCart}
                                className="flex-1"
                            >
                                {agregado ? "Combo agregado" : "Agregar combo"}
                            </Button>
                        </div>
                    </>
                ) : (
                    <p className="mt-3 font-mono-ticket text-xs text-red-700" role="status">
                        No hay stock suficiente para completar este combo.
                    </p>
                )}
                {error && <p className="mt-3 text-xs text-red-700" role="alert">{error}</p>}
                {agregado && (
                    <Link to="/carrito" className="mt-3 inline-block font-mono-ticket text-xs text-forest underline">
                        Ver carrito
                    </Link>
                )}
            </div>
        </Card>
    );
}

export default ComboCatalogoCard;
