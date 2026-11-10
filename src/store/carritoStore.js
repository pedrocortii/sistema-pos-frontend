import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calcularPromocionesCarrito, combinarItemsDuplicados, reconciliarItemsCarrito } from "../utils/carrito.js";

export const useCarritoStore = create(persist(function (set, get) {
    return {
        items: [],
        ultimoComprobante: null,

        setUltimoComprobante: function (comprobante) {
            set({ ultimoComprobante: comprobante });
        },

        limpiarUltimoComprobante: function () {
            set({ ultimoComprobante: null });
        },

        limpiarUltimoComprobanteSiCoincide: function (codigo) {
            if (get().ultimoComprobante?.codigo === codigo) {
                set({ ultimoComprobante: null });
            }
        },

        agregarProducto: function (producto, cantidad) {
            const cantidadAAgregar = Number(cantidad) || 1;
            const items = get().items;
            const existente = items.find(function (item) { return item.productoId === producto.id; });
            const stock = Number(producto.stock);
            const stockReservado = Number(producto.stockReservado || 0);
            const stockDisponible = Number.isFinite(stock)
                ? Math.max(0, stock - (Number.isFinite(stockReservado) ? stockReservado : 0))
                : 0;
            const cantidadActual = existente ? existente.cantidad : 0;
            const cantidadSolicitada = cantidadActual + cantidadAAgregar;

            // La validación ocurre antes de modificar el estado: nunca se agrega
            // una cantidad parcial ni se permite superar el stock disponible.
            if (cantidadAAgregar <= 0 || cantidadSolicitada > stockDisponible) {
                return false;
            }

            if (existente) {
                set({
                    items: items.map(function (item) {
                        if (item.productoId === producto.id) {
                            return {
                                ...item,
                                imagen: producto.imagen || item.imagen,
                                precio: Number(producto.precioFinal ?? producto.precio),
                                precioOriginal: Number(producto.precio),
                                promocion: producto.promocion || null,
                                promocionesDisponibles: producto.promocionesDisponibles || [],
                                promocionNoAplicable: producto.promocionNoAplicable || null,
                                stockDisponible: stockDisponible,
                                cantidad: cantidadSolicitada
                            };
                        }
                        return item;
                    })
                });
            } else {
                set({
                    items: [
                        ...items,
                        {
                            productoId: producto.id,
                            nombre: producto.nombre,
                            imagen: producto.imagen || null,
                            precio: Number(producto.precioFinal ?? producto.precio),
                            precioOriginal: Number(producto.precio),
                            promocion: producto.promocion || null,
                            promocionesDisponibles: producto.promocionesDisponibles || [],
                            promocionNoAplicable: producto.promocionNoAplicable || null,
                            stockDisponible: stockDisponible,
                            cantidad: cantidadAAgregar
                        }
                    ]
                });
            }
            return true;
        },

        agregarCombo: function (productos, cantidadCombos) {
            const cantidad = Number(cantidadCombos);
            if (!Array.isArray(productos) || productos.length < 2 || !Number.isSafeInteger(cantidad) || cantidad < 1) {
                return false;
            }

            const itemsActuales = get().items;
            const ids = new Set();
            const nuevosItems = new Map(itemsActuales.map((item) => [item.productoId, item]));
            for (const producto of productos) {
                if (!producto?.id || ids.has(producto.id)) return false;
                ids.add(producto.id);

                const existente = nuevosItems.get(producto.id);
                const stock = Number(producto.stock);
                const stockReservado = Number(producto.stockReservado || 0);
                const stockDisponible = Number.isFinite(stock)
                    ? Math.max(0, stock - (Number.isFinite(stockReservado) ? stockReservado : 0))
                    : 0;
                const cantidadActual = existente?.cantidad || 0;
                if (cantidadActual + cantidad > stockDisponible) return false;

                nuevosItems.set(producto.id, {
                    ...(existente || {}),
                    productoId: producto.id,
                    nombre: producto.nombre,
                    imagen: producto.imagen || null,
                    precio: Number(producto.precioFinal ?? producto.precio),
                    precioOriginal: Number(producto.precio),
                    promocion: producto.promocion || null,
                    promocionesDisponibles: producto.promocionesDisponibles || [],
                    promocionNoAplicable: producto.promocionNoAplicable || null,
                    stockDisponible,
                    cantidad: cantidadActual + cantidad
                });
            }

            set({
                items: Array.from(nuevosItems.values())
            });
            return true;
        },

        cambiarCantidad: function (productoId, cantidad) {
            if (cantidad <= 0) {
                get().quitarProducto(productoId);
                return;
            }
            const item = get().items.find(function (i) { return i.productoId === productoId; });
            if (item && item.stockDisponible !== undefined && cantidad > item.stockDisponible) {
                cantidad = item.stockDisponible;
            }
            set({
                items: get().items.map(function (item) {
                    if (item.productoId === productoId) {
                        return { ...item, cantidad: cantidad };
                    }
                    return item;
                })
            });
        },

        quitarProducto: function (productoId) {
            set({
                items: get().items.filter(function (item) { return item.productoId !== productoId; })
            });
        },

        vaciarCarrito: function () {
            set({ items: [] });
        },

        reconciliarProductos: function (productos, idsNoDisponibles) {
            const resultado = reconciliarItemsCarrito(
                get().items,
                productos,
                idsNoDisponibles
            );
            set({ items: resultado.items });
            return resultado;
        },

        obtenerTotal: function () {
            const calculos = calcularPromocionesCarrito(get().items);
            const totalCentavos = Array.from(calculos.values()).reduce(
                (acumulado, calculo) => acumulado + calculo.subtotalCentavos,
                0
            );
            return totalCentavos / 100;
        },

        obtenerCantidadTotal: function () {
            return get().items.reduce(function (acumulado, item) {
                return acumulado + item.cantidad;
            }, 0);
        }
    };
}, {
    name: "carrito",
    version: 1,
    merge: function (persistido, actual) {
        return {
            ...actual,
            ...persistido,
            items: combinarItemsDuplicados(persistido?.items)
        };
    }
}));
