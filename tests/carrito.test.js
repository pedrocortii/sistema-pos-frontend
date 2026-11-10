import { after, describe, test } from "node:test";
import assert from "node:assert/strict";
import {
    combinarItemsDuplicados,
    calcularPromocionCarrito,
    calcularPromocionesCarrito,
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

    test("calcula las unidades bonificadas de una promoción 2x1 sin acumular descuentos", function () {
        const promocion2x1 = { id: "2x1", tipoDescuento: "DOS_POR_UNO" };
        const esperados = [
            { cantidad: 1, total: 2000, ahorro: 0, bonificadas: 0 },
            { cantidad: 2, total: 2000, ahorro: 2000, bonificadas: 1 },
            { cantidad: 3, total: 4000, ahorro: 2000, bonificadas: 1 },
            { cantidad: 4, total: 4000, ahorro: 4000, bonificadas: 2 }
        ];

        esperados.forEach(function (esperado) {
            const calculo = calcularPromocionCarrito({
                cantidad: esperado.cantidad,
                precio: 2000,
                promocionesDisponibles: [promocion2x1]
            });
            assert.equal(calculo.subtotalCentavos, esperado.total * 100);
            assert.equal(calculo.descuentoCentavos, esperado.ahorro * 100);
            assert.equal(calculo.unidadesBonificadas, esperado.bonificadas);
            assert.equal(calculo.promocion?.id, esperado.bonificadas ? "2x1" : undefined);
        });
    });

    test("no aplica 2x1 a productos no alcanzados y recalcula el mayor ahorro", function () {
        const sinPromocion = calcularPromocionCarrito({ cantidad: 4, precio: 300 });
        assert.equal(sinPromocion.subtotalCentavos, 120000);
        assert.equal(sinPromocion.descuentoCentavos, 0);

        const calculo = calcularPromocionCarrito({
            cantidad: 4,
            precio: 2000,
            promocionesDisponibles: [
                { id: "20", tipoDescuento: "PORCENTAJE", valorDescuento: 20 },
                { id: "30", tipoDescuento: "PORCENTAJE", valorDescuento: 30 }
            ]
        });
        assert.equal(calculo.descuentoCentavos, 240000);
        assert.equal(calculo.subtotalCentavos, 560000);
        assert.equal(calculo.promocion.id, "30");
    });

    test("aplica el precio fijo por cada conjunto completo y cobra unidades sobrantes a precio normal", function () {
        const combo = {
            id: "combo",
            titulo: "Café + medialuna",
            tipoDescuento: "COMBO",
            precioCombo: 250,
            productoIds: ["cafe", "medialuna"]
        };
        const calculos = calcularPromocionesCarrito([
            { productoId: "cafe", cantidad: 2, precio: 200, promocionesDisponibles: [combo] },
            { productoId: "medialuna", cantidad: 3, precio: 100, promocionesDisponibles: [combo] }
        ]);
        assert.equal(calculos.get("cafe").combosAplicados, 2);
        assert.equal(calculos.get("medialuna").combosAplicados, 2);
        assert.equal(calculos.get("cafe").subtotalCentavos + calculos.get("medialuna").subtotalCentavos, 60000);
        assert.equal(calculos.get("cafe").descuentoCentavos + calculos.get("medialuna").descuentoCentavos, 10000);
    });

    test("no aplica combos incompletos ni si otra promoción produce un ahorro mayor", function () {
        const combo = {
            id: "combo",
            titulo: "Café + medialuna",
            tipoDescuento: "COMBO",
            precioCombo: 250,
            productoIds: ["cafe", "medialuna"]
        };
        const incompleto = calcularPromocionesCarrito([
            { productoId: "cafe", cantidad: 1, precio: 200, promocionesDisponibles: [combo] }
        ]);
        assert.equal(incompleto.get("cafe").combosAplicados, 0);
        assert.equal(incompleto.get("cafe").subtotalCentavos, 20000);

        const promos = [
            combo,
            { id: "cafe-desc", tipoDescuento: "PORCENTAJE", valorDescuento: 50 },
            { id: "medialuna-desc", tipoDescuento: "PORCENTAJE", valorDescuento: 50 }
        ];
        const alternativo = calcularPromocionesCarrito([
            { productoId: "cafe", cantidad: 1, precio: 200, promocionesDisponibles: promos },
            { productoId: "medialuna", cantidad: 1, precio: 100, promocionesDisponibles: promos }
        ]);
        assert.equal(alternativo.get("cafe").combosAplicados, 0);
        assert.equal(alternativo.get("cafe").subtotalCentavos + alternativo.get("medialuna").subtotalCentavos, 15000);
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

        useCarritoStore.getState().setUltimoComprobante({
            codigo: "V-TEST-PENDIENTE",
            estado: "PENDIENTE"
        });
        useCarritoStore.getState().limpiarUltimoComprobanteSiCoincide("V-OTRO");
        assert.equal(useCarritoStore.getState().ultimoComprobante.codigo, "V-TEST-PENDIENTE");
        useCarritoStore.getState().limpiarUltimoComprobanteSiCoincide("V-TEST-PENDIENTE");
        assert.equal(useCarritoStore.getState().ultimoComprobante, null);

        useAuthStore.getState().iniciarSesion("test-token", {
            id: "cliente-1",
            nombre: "Cliente",
            rol: "Cliente"
        });
        assert.equal(useCarritoStore.getState().items[0].cantidad, 3);

        useAuthStore.getState().cerrarSesion();
        assert.equal(useCarritoStore.getState().items[0].cantidad, 3);

        const store = useCarritoStore.getState();
        store.vaciarCarrito();
        const componentes = [
            { id: "cafe", nombre: "Café", precio: 200, stock: 5, stockReservado: 0 },
            { id: "medialuna", nombre: "Medialuna", precio: 100, stock: 3, stockReservado: 0 }
        ];
        assert.equal(store.agregarCombo(componentes, 2), true);
        assert.deepEqual(
            useCarritoStore.getState().items.map((item) => [item.productoId, item.cantidad]),
            [["cafe", 2], ["medialuna", 2]]
        );
        assert.equal(store.agregarCombo(componentes, 2), false);
        assert.deepEqual(
            useCarritoStore.getState().items.map((item) => [item.productoId, item.cantidad]),
            [["cafe", 2], ["medialuna", 2]]
        );
        useCarritoStore.getState().vaciarCarrito();
    });
});
