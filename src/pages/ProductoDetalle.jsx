import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { obtenerProducto } from "../api/productos";
import { useCarritoStore } from "../store/carritoStore";
import EncabezadoCliente from "../components/EncabezadoCliente";
import SelectorCantidad from "../components/SelectorCantidad";
import MensajeCarga from "../components/MensajeCarga";
import MensajeError from "../components/MensajeError";
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
        }
    }

    // El cliente ve el stock disponible = stock fisico - stock reservado
    // por ventas PENDIENTES. El back ya devuelve ambos campos.
    const stockDisponible = producto ? producto.stock - (producto.stockReservado || 0) : 0;

    return (
        <div className="min-h-screen bg-paper">
            <EncabezadoCliente />

            <main className="max-w-2xl mx-auto px-6 py-10">
                <Link to="/catalogo" className="font-mono-ticket text-sm text-forest underline flex items-center gap-1 w-fit">
                    <ArrowLeft size={16} />
                    Volver al catalogo
                </Link>

                {cargando && <MensajeCarga className="mt-8" />}

                {error && <MensajeError texto={error} className="mt-8" />}

                {producto && (
                    <div className="bg-ticket border border-line p-8 mt-6">
                        <p className="font-mono-ticket text-xs uppercase tracking-wide text-ink/50">
                            {producto.categoria}
                        </p>
                        <h1 className="font-display text-3xl text-ink mt-1">
                            {producto.nombre}
                        </h1>
                        {producto.descripcion && (
                            <p className="text-ink/70 mt-3">
                                {producto.descripcion}
                            </p>
                        )}

                        <p className="font-mono-ticket text-2xl text-forest mt-6">
                            ${Number(producto.precio).toFixed(2)}
                        </p>

                        {stockDisponible === 0 ? (
                            <p className="font-mono-ticket text-sm text-red-600 mt-6">
                                Producto sin stock disponible
                            </p>
                        ) : (
                            <>
                                <p className="font-mono-ticket text-xs text-ink/60 mt-6">
                                    Stock disponible: {stockDisponible} unidades
                                </p>
                                <div className="flex items-center gap-4 mt-3">
                                    <label className="font-mono-ticket text-xs uppercase tracking-wide text-ink/60">
                                        Cantidad
                                    </label>
                                    <SelectorCantidad cantidad={cantidad} onCambiar={setCantidad} maximo={stockDisponible} />
                                </div>

                                <button
                                    onClick={manejarAgregar}
                                    disabled={cantidad > stockDisponible}
                                    className="w-full mt-6 bg-forest hover:bg-forest-dark disabled:opacity-60 disabled:cursor-not-allowed text-paper font-mono-ticket text-sm uppercase tracking-wide py-3.5 transition-colors flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart size={18} />
                                    Agregar al carrito
                                </button>

                                {agregado && (
                                    <div className="mt-4 text-center">
                                        <p className="font-mono-ticket text-sm text-forest">
                                            Producto agregado al carrito.
                                        </p>
                                        <button
                                            onClick={function () { navegar("/carrito"); }}
                                            className="font-mono-ticket text-sm text-forest underline mt-1"
                                        >
                                            Ir al carrito
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default ProductoDetalle;
