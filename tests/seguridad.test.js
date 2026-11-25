import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { rutaInicioPorRol, resolverDestinoRuta } from "../src/utils/rutas.js";
import { obtenerDisponibilidadProducto } from "../src/utils/stock.js";
import { reconciliarItemsCarrito } from "../src/utils/carrito.js";

// Rutas protegidas declaradas en App.jsx y los roles que las pueden usar.
const RUTAS_PROTEGIDAS = {
    "/admin/dashboard": ["Administrador"],
    "/admin/venta-rapida": ["Administrador", "Cajero"],
    "/admin/productos": ["Administrador", "Cajero"],
    "/admin/stock": ["Administrador", "Cajero"],
    "/admin/ventas": ["Administrador", "Cajero"],
    "/admin/promociones": ["Administrador"],
    "/admin/clasificacion": ["Administrador"],
    "/admin/retiros": ["Administrador"],
    "/dashboard": ["Administrador"],
    "/mi-perfil": ["Cliente"],
    "/historial": ["Cliente"]
};

function simularNavegacion(rol, rutaInicial) {
    let ruta = rutaInicial;
    const visitadas = new Set();

    for (let paso = 0; paso < 12; paso += 1) {
        assert.equal(visitadas.has(ruta), false, `redireccion circular para ${rol} en ${ruta}`);
        visitadas.add(ruta);

        const roles = RUTAS_PROTEGIDAS[ruta];
        if (!roles) return ruta; // Ruta publica o pagina de inicio del rol.

        const destino = resolverDestinoRuta({
            token: "token-valido",
            rol,
            rolesPermitidos: roles,
            rutaActual: ruta
        });
        if (!destino) return ruta;
        ruta = destino;
    }

    assert.fail(`demasiadas redirecciones para ${rol} desde ${rutaInicial}`);
}

describe("Redirecciones de rutas protegidas", function () {
    test("cada rol obtiene una pagina de inicio valida", function () {
        assert.equal(rutaInicioPorRol("Administrador"), "/admin/dashboard");
        assert.equal(rutaInicioPorRol("Cajero"), "/admin/venta-rapida");
        assert.equal(rutaInicioPorRol("Cliente"), "/catalogo");
        assert.equal(rutaInicioPorRol(undefined), "/login");
    });

    test("sin sesion siempre se redirige al login", function () {
        assert.equal(resolverDestinoRuta({
            token: null,
            rol: undefined,
            rolesPermitidos: ["Cliente"],
            rutaActual: "/historial"
        }), "/login");
    });

    test("un Cliente no accede a rutas administrativas y no entra en bucle", function () {
        assert.equal(resolverDestinoRuta({
            token: "token",
            rol: "Cliente",
            rolesPermitidos: ["Administrador"],
            rutaActual: "/admin/dashboard"
        }), "/catalogo");

        assert.equal(simularNavegacion("Cliente", "/admin/dashboard"), "/catalogo");
        assert.equal(simularNavegacion("Cliente", "/admin/productos"), "/catalogo");
        assert.equal(simularNavegacion("Cliente", "/admin/clasificacion"), "/catalogo");

        for (const ruta of Object.keys(RUTAS_PROTEGIDAS).filter((item) => item.startsWith("/admin"))) {
            const destino = simularNavegacion("Cliente", ruta);
            assert.equal(destino.startsWith("/admin"), false, `el Cliente termino en ${destino}`);
        }
    });

    test("Cajero es redirigido a venta rapida cuando intenta una ruta de Administrador", function () {
        assert.equal(simularNavegacion("Cajero", "/admin/dashboard"), "/admin/venta-rapida");
        assert.equal(simularNavegacion("Cajero", "/admin/clasificacion"), "/admin/venta-rapida");
        assert.equal(simularNavegacion("Cajero", "/admin/venta-rapida"), "/admin/venta-rapida");
    });

    test("Administrador conserva el acceso a las rutas administrativas", function () {
        assert.equal(simularNavegacion("Administrador", "/admin/dashboard"), "/admin/dashboard");
        assert.equal(simularNavegacion("Administrador", "/admin/productos"), "/admin/productos");
        assert.equal(simularNavegacion("Administrador", "/mi-perfil"), "/admin/dashboard");
    });

    test("un rol desconocido no genera redirecciones circulares", function () {
        assert.equal(simularNavegacion("RolInexistente", "/admin/dashboard"), "/login");
    });
});

describe("Disponibilidad de productos en el catalogo publico", function () {
    test("usa disponible del DTO publico sin depender del stock interno", function () {
        assert.equal(obtenerDisponibilidadProducto({ disponible: 3, stock: 100, stockReservado: 1 }), 3);
        assert.equal(obtenerDisponibilidadProducto({ disponible: 0, stock: 100 }), 0);
    });

    test("mantiene el calculo interno para respuestas de personal autorizado", function () {
        assert.equal(obtenerDisponibilidadProducto({ stock: 8, stockReservado: 3 }), 5);
        assert.equal(obtenerDisponibilidadProducto({ stock: 2, stockReservado: 9 }), 0);
    });

    test("no elimina productos publicos que no incluyen stock", function () {
        const resultado = reconciliarItemsCarrito(
            [{ productoId: "p1", nombre: "Producto", cantidad: 5, precio: 100 }],
            [{ id: "p1", nombre: "Producto", precio: 100, disponible: 2 }]
        );

        assert.equal(resultado.items.length, 1);
        assert.equal(resultado.items[0].cantidad, 2);
        assert.equal(resultado.items[0].stockDisponible, 2);
        assert.equal(resultado.eliminados.length, 0);
        assert.equal(resultado.cantidadesAjustadas.length, 1);
    });

    test("elimina productos publicos sin disponibilidad", function () {
        const resultado = reconciliarItemsCarrito(
            [{ productoId: "p1", nombre: "Producto", cantidad: 1, precio: 100 }],
            [{ id: "p1", nombre: "Producto", precio: 100, disponible: 0 }]
        );

        assert.equal(resultado.items.length, 0);
        assert.deepEqual(resultado.eliminados, ["Producto"]);
    });
});
