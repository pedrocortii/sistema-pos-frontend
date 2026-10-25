import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { obtenerProducto } from "../api/productos";
import { useCarritoStore } from "../store/carritoStore";
import EncabezadoCliente from "../components/EncabezadoCliente";
import SelectorCantidad from "../components/SelectorCantidad";
import MensajeCarga from "../components/MensajeCarga";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Alert } from "../components/ui/Alert";
import { usePeticion } from "../hooks/usePeticion";

function obtenerErrorProducto() {
    return "No se pudo cargar el producto.";
}

function ProductoDetalle() {
    const { id } = useParams();
    const navegar = useNavigate();
    const agregarProducto = useCarritoStore(function (estado) { return estado.agregarProducto; });

    const [cantidad, setCantidad] = useState(1);
    const [agregado, setAgregado] = useState(false);
    const [avisoStock, setAvisoStock] = useState("");
    const { respuesta: producto, cargando, error, ejecutar } = usePeticion(obtenerProducto, { obtenerMensajeError: obtenerErrorProducto });

    useEffect(function () {
        async function cargarProducto() {
            try {
                await ejecutar(id);
                setCantidad(1);
            } catch {
                // El hook mantiene el mensaje visible para la persona usuaria.
            }
        }

        cargarProducto();
    }, [id, ejecutar]);

    function manejarAgregar() {
        if (agregarProducto(producto, cantidad)) {
            setAgregado(true);
            setAvisoStock("");
        } else {
            setAgregado(false);
            setAvisoStock("No hay stock suficiente para agregar esa cantidad al carrito.");
        }
    }

    const stock = producto ? Number(producto.stock) : 0;
    const stockReservado = producto ? Number(producto.stockReservado || 0) : 0;
    const stockDisponible = Number.isFinite(stock)
        ? Math.max(0, stock - (Number.isFinite(stockReservado) ? stockReservado : 0))
        : 0;

    return (
        <div className="min-h-screen bg-paper">
            <EncabezadoCliente />

            <main className="max-w-2xl mx-auto px-6 py-10">
                <PageHeader
                    volverA="/catalogo"
                    textoVolver="Volver al catálogo"
                    className="mb-4"
                />

                {cargando && <MensajeCarga className="mt-8" />}

                {error && <Alert tipo="error" texto={error} className="mt-8" />}

                {producto && (
                    <Card className="p-8 mt-6">
                        <div className="flex items-center justify-between gap-4">
                            <p className="font-mono-ticket text-xs text-forest">
                                {producto.categoria}
                            </p>
                            {stockDisponible === 0 && (
                                <Badge variant="danger">Sin stock</Badge>
                            )}
                        </div>

                        <h1 className="font-display text-3xl text-ink mt-2">
                            {producto.nombre}
                        </h1>

                        {producto.descripcion && (
                            <p className="text-ink/70 mt-3 font-sans">
                                {producto.descripcion}
                            </p>
                        )}

                        <p className="font-mono-ticket text-3xl text-forest font-bold mt-6">
                            ${Number(producto.precio).toFixed(2)}
                        </p>

                        {stockDisponible === 0 ? (
                            <Alert
                                variant="warning"
                                texto="Este producto se encuentra temporalmente sin stock disponible."
                                className="mt-6"
                            />
                        ) : (
                            <>
                                <p className="font-mono-ticket text-xs text-ink/60 mt-6">
                                    Stock disponible: {stockDisponible} unidades
                                </p>
                                <div className="flex items-center gap-4 mt-3">
                                    <label className="font-mono-ticket text-xs text-ink/60">
                                        Cantidad
                                    </label>
                                    <SelectorCantidad
                                        cantidad={cantidad}
                                        onCambiar={function (valor) {
                                            setAvisoStock("");
                                            setCantidad(valor);
                                        }}
                                        maximo={stockDisponible}
                                    />
                                </div>

                                <Button
                                    onClick={manejarAgregar}
                                    disabled={cantidad > stockDisponible}
                                    icon={ShoppingCart}
                                    size="lg"
                                    className="w-full mt-6"
                                >
                                    Agregar al carrito
                                </Button>

                                {avisoStock && (
                                    <Alert tipo="error" texto={avisoStock} className="mt-4" />
                                )}

                                {agregado && (
                                    <Alert
                                        variant="success"
                                        titulo="¡Producto agregado al carrito!"
                                        className="mt-4 text-center"
                                    >
                                        <button
                                            type="button"
                                            onClick={function () { navegar("/carrito"); }}
                                            className="font-mono-ticket text-sm text-forest font-bold underline mt-1 cursor-pointer"
                                        >
                                            Ver carrito y pagar →
                                        </button>
                                    </Alert>
                                )}
                            </>
                        )}
                    </Card>
                )}
            </main>
        </div>
    );
}

export default ProductoDetalle;
