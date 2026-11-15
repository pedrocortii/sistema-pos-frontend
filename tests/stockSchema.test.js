import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { umbralStockBajoSchema } from "../src/validations/stockSchema.js";

describe("Validación del umbral de stock bajo", () => {
    test("acepta cero y enteros positivos", () => {
        assert.equal(umbralStockBajoSchema.isValidSync({ umbralStockBajo: 0 }), true);
        assert.equal(umbralStockBajoSchema.isValidSync({ umbralStockBajo: 10 }), true);
    });

    test("rechaza valores negativos, decimales y vacíos", () => {
        assert.equal(umbralStockBajoSchema.isValidSync({ umbralStockBajo: -1 }), false);
        assert.equal(umbralStockBajoSchema.isValidSync({ umbralStockBajo: 1.5 }), false);
        assert.equal(umbralStockBajoSchema.isValidSync({ umbralStockBajo: "" }), false);
        assert.equal(umbralStockBajoSchema.isValidSync({}), false);
    });
});
