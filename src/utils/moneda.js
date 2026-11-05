export const formatoMonedaARS = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS"
});

export function parsearMontoACentavos(valor) {
    if (typeof valor !== "string") return null;

    const importe = valor.trim();
    const agrupado = /^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(importe);
    if (!agrupado && !/^\d+(?:[.,]\d{1,2})?$/.test(importe)) return null;

    const normalizado = agrupado
        ? importe.replace(/\./g, "").replace(",", ".")
        : importe.replace(",", ".");
    const partes = normalizado.split(".");
    const centavos = Number(partes[0]) * 100 + Number(((partes[1] || "") + "00").slice(0, 2));
    return Number.isSafeInteger(centavos) ? centavos : null;
}

export function convertirACentavos(valor) {
    const importe = Number(valor);
    if (!Number.isFinite(importe) || importe < 0) return null;

    const centavos = Math.round(importe * 100);
    return Number.isSafeInteger(centavos) ? centavos : null;
}