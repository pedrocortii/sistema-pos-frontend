import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCarritoStore = create(persist(function (set, get) {
    return {
        items: [],

        agregarProducto: function (producto, cantidad) {
            const cantidadAAgregar = cantidad || 1;
            const items = get().items;
            const existente = items.find(function (item) { return item.productoId === producto.id; });

            if (existente) {
                set({
                    items: items.map(function (item) {
                        if (item.productoId === producto.id) {
                            return { ...item, cantidad: item.cantidad + cantidadAAgregar };
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
                            precio: Number(producto.precio),
                            stockDisponible: producto.stock,
                            cantidad: cantidadAAgregar
                        }
                    ]
                });
            }
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

        obtenerTotal: function () {
            return get().items.reduce(function (acumulado, item) {
                return acumulado + item.precio * item.cantidad;
            }, 0);
        },

        obtenerCantidadTotal: function () {
            return get().items.reduce(function (acumulado, item) {
                return acumulado + item.cantidad;
            }, 0);
        }
    };
}, {
    name: "carrito",
    version: 1
}));