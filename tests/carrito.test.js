import { after, describe, test } from "node:test";
import assert from "node:assert/strict";
import {
    combinarItemsDuplicados,
    reconciliarItemsCarrito
} from "../src/utils/carrito.js";

const ventanaAnterior = globalThis.window;
const almacenamientoAnterior = globalThis.localStorage;

after(function () {
    if (ventanaAnterior === undefined) delete globalThis.window;
    else globalThis.window = ventanaAnterior;
    if (almacenamientoAnterior === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = almacenamientoAnterior;
});

describe("Persistencia y reconciliación del carrito", function () {
    test("combina productos repetidos sin duplicar filas y suma sus cantidades", function () {
        const resultado = combinarItemsDuplicados([
            { productoId: "producto-1", nombre: "Café", cantidad: 2 },
            { productoId: "producto-1", nombre: "Café", cantidad: 3 },
            { productoId: "producto-2", nombre: "Té", cantidad: 1 }
        ]);

        assert.deepEqual(resultado, [
            { productoId: "producto-1", nombre: "Café", cantidad: 5 },
            { productoId: "producto-2", nombre: "Té", cantidad: 1 }
        ]);
    });

    test("quita productos inactivos o sin stock y ajusta cantidades al stock disponible", function () {
        const resultado = reconciliarItemsCarrito([
            { productoId: "activo", nombre: "Producto activo", cantidad: 5, precio: 100 },
            { productoId: "agotado", nombre: "Producto agotado", cantidad: 1, precio: 50 },
            { productoId: "inactivo", nombre: "Producto inactivo", cantidad: 1, precio: 25 }
        ], [
            { id: "activo", nombre: "Producto activo", precio: 100, precioFinal: 100, stock: 5, stockReservado: 2 },
            { id: "agotado", nombre: "Producto agotado", precio: 50, stock: 2, stockReservado: 2 },
            { id: "inactivo", nombre: "Producto inactivo", activo: false, precio: 25, stock: 1 }
        ]);

        assert.equal(resultado.items.length, 1);
        assert.equal(resultado.items[0].cantidad, 3);
        assert.deepEqual(resultado.eliminados, ["Producto agotado", "Producto inactivo"]);
        assert.deepEqual(resultado.cantidadesAjustadas, [
            { nombre: "Producto activo", anterior: 5, actual: 3 }
        ]);
    });

    test("actualiza precios con el precio promocional actual e identifica el cambio", function () {
        const resultado = reconciliarItemsCarrito([
            { productoId: "producto", nombre: "Producto", cantidad: 2, precio: 100 }
        ], [{
            id: "producto",
            nombre: "Producto",
            precio: 125,
            precioFinal: 110,
            stock: 10,
            stockReservado: 0,
            promocion: { titulo: "Oferta actual" }
        }]);

        assert.equal(resultado.items[0].precio, 110);
        assert.equal(resultado.items[0].precioOriginal, 125);
        assert.equal(resultado.items[0].promocion.titulo, "Oferta actual");
        assert.deepEqual(resultado.preciosActualizados, [
            { nombre: "Producto", anterior: 100, actual: 110 }
        ]);
    });

    test("conserva el carrito persistido al iniciar y cerrar sesión", async function () {
        const valores = new Map([
            ["carrito", JSON.stringify({
                state: {
                    items: [
                        { productoId: "producto", nombre: "Producto", cantidad: 1, precio: 10 },
                        { productoId: "producto", nombre: "Producto", cantidad: 2, precio: 10 }
                    ]
                },
                version: 1
            })]
        ]);
        globalThis.localStorage = {
            getItem: function (clave) { return valores.get(clave) ?? null; },
            setItem: function (clave, valor) { valores.set(clave, String(valor)); },
            removeItem: function (clave) { valores.delete(clave); },
            clear: function () { valores.clear(); }
        };
        globalThis.window = { localStorage: globalThis.localStorage };

        const { useCarritoStore } = await import("../src/store/carritoStore.js");
        const { useAuthStore } = await import("../src/store/authStore.js");

        assert.equal(useCarritoStore.getState().items.length, 1);
        assert.equal(useCarritoStore.getState().items[0].cantidad, 3);

        useAuthStore.getState().iniciarSesion("test-token", {
            id: "cliente-1",
            nombre: "Cliente",
            rol: "Cliente"
        });
        assert.equal(useCarritoStore.getState().items[0].cantidad, 3);

        useAuthStore.getState().cerrarSesion();
        assert.equal(useCarritoStore.getState().items[0].cantidad, 3);
    });
});
