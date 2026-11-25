import { describe, test } from "node:test";
import assert from "node:assert/strict";

// Función de estado de promociones tal como se define en AdminPromociones.jsx
function estadoPromocion(promocion, ahora = new Date()) {
    if (!promocion.activo) return "INACTIVO";
    if (new Date(promocion.fechaInicio) > ahora) return "FUTURA";
    if (new Date(promocion.fechaFin) < ahora) return "VENCIDA";
    return "ACTIVA";
}

describe("Administración de promociones: activación, desactivación y estados", () => {
    test("distingue correctamente promociones inactivas, futuras, vencidas y activas", () => {
        const ahora = new Date("2026-11-11T12:00:00Z");
        const unaHoraAntes = new Date("2026-11-11T11:00:00Z").toISOString();
        const unaHoraDespues = new Date("2026-11-11T13:00:00Z").toISOString();
        const dosHorasDespues = new Date("2026-11-11T14:00:00Z").toISOString();
        const dosHorasAntes = new Date("2026-11-11T10:00:00Z").toISOString();

        // 1. Inactiva (incluso si está dentro del rango)
        const promoInactiva = {
            id: "1",
            titulo: "Promo 1",
            activo: false,
            fechaInicio: unaHoraAntes,
            fechaFin: unaHoraDespues
        };
        assert.equal(estadoPromocion(promoInactiva, ahora), "INACTIVO");

        // 2. Futura
        const promoFutura = {
            id: "2",
            titulo: "Promo 2",
            activo: true,
            fechaInicio: unaHoraDespues,
            fechaFin: dosHorasDespues
        };
        assert.equal(estadoPromocion(promoFutura, ahora), "FUTURA");

        // 3. Vencida
        const promoVencida = {
            id: "3",
            titulo: "Promo 3",
            activo: true,
            fechaInicio: dosHorasAntes,
            fechaFin: unaHoraAntes
        };
        assert.equal(estadoPromocion(promoVencida, ahora), "VENCIDA");

        // 4. Activa
        const promoActiva = {
            id: "4",
            titulo: "Promo 4",
            activo: true,
            fechaInicio: unaHoraAntes,
            fechaFin: unaHoraDespues
        };
        assert.equal(estadoPromocion(promoActiva, ahora), "ACTIVA");
    });

    test("botón contextual ofrece Desactivar si está activa y Activar si está inactiva", () => {
        function obtenerTextoBoton(promocion) {
            return promocion.activo ? "Desactivar" : "Activar";
        }

        assert.equal(obtenerTextoBoton({ id: "p1", activo: true }), "Desactivar");
        assert.equal(obtenerTextoBoton({ id: "p2", activo: false }), "Activar");
    });

    test("evita solicitudes simultáneas concurrentes sobre la misma promoción", async () => {
        const procesando = new Set();
        let llamadasApi = 0;

        async function alternarActivo(promocion) {
            if (procesando.has(promocion.id)) return;
            procesando.add(promocion.id);
            try {
                llamadasApi += 1;
                await new Promise((resolve) => setTimeout(resolve, 50));
            } finally {
                procesando.delete(promocion.id);
            }
        }

        const promo = { id: "p1", activo: true };
        // Lanzar dos llamadas simultáneas
        const llamada1 = alternarActivo(promo);
        const llamada2 = alternarActivo(promo);

        await Promise.all([llamada1, llamada2]);

        assert.equal(llamadasApi, 1, "Solo debió ejecutarse una llamada para la misma promoción");
    });

    test("solicita confirmación antes de alternar el estado", async () => {
        let confirmPrompt = null;
        const confirmacionMock = (mensaje) => {
            confirmPrompt = mensaje;
            return false; // Usuario cancela
        };

        let ejecutado = false;
        async function alternarConConfirmacion(promocion, windowConfirm) {
            const nuevoEstado = !promocion.activo;
            const confirmacion = nuevoEstado
                ? `¿Activar la promoción “${promocion.titulo}”?`
                : `¿Desactivar la promoción “${promocion.titulo}”?`;
            if (windowConfirm && !windowConfirm(confirmacion)) return;
            ejecutado = true;
        }

        await alternarConConfirmacion({ id: "p1", titulo: "Descuento 10%", activo: true }, confirmacionMock);

        assert.equal(confirmPrompt, "¿Desactivar la promoción “Descuento 10%”?");
        assert.equal(ejecutado, false, "No debe ejecutarse si el usuario no confirma");

        await alternarConConfirmacion({ id: "p2", titulo: "2x1 Verano", activo: false }, () => true);
        assert.equal(ejecutado, true, "Debe ejecutarse si el usuario confirma");
    });
});
