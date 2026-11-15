import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
    NIVEL_ADVERTENCIA_STOCK_BAJO,
    obtenerAdvertenciaStockBajo
} from "../src/utils/stock.js";

describe("Advertencias de la vista previa del umbral de stock bajo", () => {
    test("no advierte por debajo del 70 %", () => {
        for (const porcentaje of [0, 25, 69]) {
            const advertencia = obtenerAdvertenciaStockBajo(porcentaje);
            assert.equal(advertencia.nivel, NIVEL_ADVERTENCIA_STOCK_BAJO.NINGUNA);
            assert.equal(advertencia.requiereConfirmacion, false);
        }
    });

    test("advierte de forma moderada entre el 70 % y el 89 %", () => {
        for (const porcentaje of [70, 75, 89]) {
            const advertencia = obtenerAdvertenciaStockBajo(porcentaje);
            assert.equal(advertencia.nivel, NIVEL_ADVERTENCIA_STOCK_BAJO.MODERADA);
            assert.equal(advertencia.requiereConfirmacion, true);
        }
    });

    test("advierte de forma importante desde el 90 %", () => {
        for (const porcentaje of [90, 92, 100]) {
            const advertencia = obtenerAdvertenciaStockBajo(porcentaje);
            assert.equal(advertencia.nivel, NIVEL_ADVERTENCIA_STOCK_BAJO.IMPORTANTE);
            assert.equal(advertencia.requiereConfirmacion, true);
        }
    });

    test("no calcula advertencias sin datos válidos", () => {
        for (const porcentaje of [null, undefined, NaN, -1]) {
            const advertencia = obtenerAdvertenciaStockBajo(porcentaje);
            assert.equal(advertencia.nivel, NIVEL_ADVERTENCIA_STOCK_BAJO.SIN_DATOS);
            assert.equal(advertencia.requiereConfirmacion, false);
        }
    });
});
