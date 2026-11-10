function cantidadValida(valor) {
    const cantidad = Number(valor);
    return Number.isSafeInteger(cantidad) && cantidad > 0 ? cantidad : 0;
}

function calcularPromocionCarrito(item) {
    const cantidad = cantidadValida(item?.cantidad);
    const precioOriginalCentavos = Math.round(Number(item?.precioOriginal ?? item?.precio) * 100);
    if (!cantidad || !Number.isSafeInteger(precioOriginalCentavos) || precioOriginalCentavos < 0) {
        return { subtotalCentavos: 0, descuentoCentavos: 0, unidadesBonificadas: 0, promocion: null };
    }

    const promociones = Array.isArray(item.promocionesDisponibles)
        ? item.promocionesDisponibles.filter((promocion) => promocion.tipoDescuento !== "COMBO")
        : [];
    let mejor = null;
    promociones.forEach(function (promocion) {
        let precioUnitarioCentavos = precioOriginalCentavos;
        let unidadesBonificadas = 0;
        let descuentoCentavos = 0;

        if (promocion.tipoDescuento === "DOS_POR_UNO") {
            unidadesBonificadas = Math.floor(cantidad / 2);
            descuentoCentavos = unidadesBonificadas * precioOriginalCentavos;
        } else if (promocion.tipoDescuento === "PORCENTAJE") {
            precioUnitarioCentavos = Math.round(precioOriginalCentavos * (10000 - Math.round(Number(promocion.valorDescuento) * 100)) / 10000);
            descuentoCentavos = (precioOriginalCentavos - precioUnitarioCentavos) * cantidad;
        } else if (promocion.tipoDescuento === "IMPORTE") {
            precioUnitarioCentavos = Math.max(0, precioOriginalCentavos - Math.round(Number(promocion.valorDescuento) * 100));
            descuentoCentavos = (precioOriginalCentavos - precioUnitarioCentavos) * cantidad;
        }

        if (descuentoCentavos > 0 && (!mejor || descuentoCentavos > mejor.descuentoCentavos)) {
            mejor = {
                subtotalCentavos: precioOriginalCentavos * cantidad - descuentoCentavos,
                descuentoCentavos,
                unidadesBonificadas,
                precioUnitarioCentavos,
                promocion
            };
        }
    });

    if (mejor) return mejor;

    const precioFinalCentavos = Math.round(Number(item.precio) * 100);
    const subtotalCentavos = Number.isSafeInteger(precioFinalCentavos)
        ? precioFinalCentavos * cantidad
        : precioOriginalCentavos * cantidad;
    return {
        subtotalCentavos,
        descuentoCentavos: Math.max(0, precioOriginalCentavos * cantidad - subtotalCentavos),
        unidadesBonificadas: 0,
        precioUnitarioCentavos: precioFinalCentavos,
        promocion: item.promocion || null
    };
}

export function combinarItemsDuplicados(items) {
    const agrupados = new Map();

    (Array.isArray(items) ? items : []).forEach(function (item) {
        if (!item || typeof item.productoId !== "string") return;
        const cantidad = cantidadValida(item.cantidad);
        if (cantidad === 0) return;

        const existente = agrupados.get(item.productoId);
        agrupados.set(item.productoId, existente
            ? { ...existente, cantidad: existente.cantidad + cantidad }
            : { ...item, cantidad });
    });

    return Array.from(agrupados.values());
}

export function reconciliarItemsCarrito(items, productos, idsNoDisponibles = []) {
    const itemsUnicos = combinarItemsDuplicados(items);
    const productosPorId = new Map((productos || []).map(function (producto) {
        return [producto.id, producto];
    }));
    const noDisponibles = new Set(idsNoDisponibles);
    const resultado = {
        items: [],
        eliminados: [],
        cantidadesAjustadas: [],
        preciosActualizados: []
    };

    itemsUnicos.forEach(function (item) {
        const producto = productosPorId.get(item.productoId);
        if (
            noDisponibles.has(item.productoId) ||
            !producto ||
            producto.activo === false
        ) {
            resultado.eliminados.push(item.nombre || "Producto");
            return;
        }

        const stock = Number(producto.stock);
        const stockReservado = Number(producto.stockReservado || 0);
        const stockDisponible = Number.isFinite(stock) && Number.isFinite(stockReservado)
            ? Math.max(0, stock - stockReservado)
            : 0;
        if (stockDisponible === 0) {
            resultado.eliminados.push(producto.nombre || item.nombre || "Producto");
            return;
        }

        const cantidad = Math.min(item.cantidad, stockDisponible);
        if (cantidad !== item.cantidad) {
            resultado.cantidadesAjustadas.push({
                nombre: producto.nombre || item.nombre || "Producto",
                anterior: item.cantidad,
                actual: cantidad
            });
        }

        const precio = Number(producto.precioFinal ?? producto.precio);
        if (!Number.isFinite(precio) || precio < 0) {
            resultado.eliminados.push(producto.nombre || item.nombre || "Producto");
            return;
        }
        if (Math.round(Number(item.precio) * 100) !== Math.round(precio * 100)) {
            resultado.preciosActualizados.push({
                nombre: producto.nombre || item.nombre || "Producto",
                anterior: Number(item.precio),
                actual: precio
            });
        }

        resultado.items.push({
            ...item,
            nombre: producto.nombre,
            imagen: producto.imagen || null,
            precio,
            precioOriginal: Number(producto.precio),
            promocion: producto.promocion || null,
            promocionesDisponibles: producto.promocionesDisponibles || [],
            promocionNoAplicable: producto.promocionNoAplicable || null,
            stockDisponible,
            cantidad
        });
    });

    return resultado;
}

export function calcularPromocionesCarrito(items) {
    const itemsValidos = Array.isArray(items) ? items : [];
    const itemsPorId = new Map(itemsValidos.map((item) => [item.productoId, item]));
    const cantidadesDisponibles = new Map(itemsValidos.map((item) => [item.productoId, cantidadValida(item.cantidad)]));
    const asignaciones = new Map(itemsValidos.map((item) => [item.productoId, {
        cantidadCombo: 0,
        subtotalComboCentavos: 0,
        descuentoComboCentavos: 0,
        titulos: []
    }]));
    const promocionesCombo = new Map();
    itemsValidos.forEach((item) => {
        (Array.isArray(item.promocionesDisponibles) ? item.promocionesDisponibles : [])
            .filter((promocion) => promocion.tipoDescuento === "COMBO")
            .forEach((promocion) => promocionesCombo.set(promocion.id, promocion));
    });

    while (true) {
        let mejor = null;
        promocionesCombo.forEach(function (promocion) {
            const productoIds = [...new Set(promocion.productoIds || [])];
            if (productoIds.length < 2 || productoIds.some((id) => !itemsPorId.has(id))) return;
            const cantidadCombos = Math.min(...productoIds.map((id) => cantidadesDisponibles.get(id) || 0));
            if (cantidadCombos <= 0) return;

            const componentes = productoIds.map((id) => itemsPorId.get(id));
            const precioRegularUnitario = componentes.reduce(
                (total, item) => total + Math.round(Number(item.precioOriginal ?? item.precio) * 100),
                0
            );
            const precioComboCentavos = Math.round(Number(promocion.precioCombo) * 100);
            if (!Number.isSafeInteger(precioRegularUnitario) || precioComboCentavos >= precioRegularUnitario) return;

            const ahorroCombo = (precioRegularUnitario - precioComboCentavos) * cantidadCombos;
            const ahorroIndividual = componentes.reduce((total, item) => {
                const promosIndividuales = (item.promocionesDisponibles || [])
                    .filter((itemPromocion) => itemPromocion.tipoDescuento !== "COMBO");
                return total + calcularPromocionCarrito({
                    ...item,
                    cantidad: cantidadCombos,
                    promocionesDisponibles: promosIndividuales
                }).descuentoCentavos;
            }, 0);
            const ahorroAdicional = ahorroCombo - ahorroIndividual;
            if (ahorroAdicional > 0 && (!mejor || ahorroAdicional > mejor.ahorroAdicional)) {
                mejor = {
                    promocion,
                    componentes,
                    cantidadCombos,
                    precioRegularUnitario,
                    precioComboCentavos,
                    ahorroAdicional
                };
            }
        });
        if (!mejor) break;

        let precioAsignado = 0;
        mejor.componentes.forEach((item, indice) => {
            const productoId = item.productoId;
            const precioRegularComponente = Math.round(Number(item.precioOriginal ?? item.precio) * 100) *
                mejor.cantidadCombos;
            const subtotalComponente = indice === mejor.componentes.length - 1
                ? mejor.precioComboCentavos * mejor.cantidadCombos - precioAsignado
                : Math.floor(
                    mejor.precioComboCentavos *
                    mejor.cantidadCombos *
                    precioRegularComponente /
                    (mejor.precioRegularUnitario * mejor.cantidadCombos)
                );
            precioAsignado += subtotalComponente;

            const asignacion = asignaciones.get(productoId);
            asignacion.cantidadCombo += mejor.cantidadCombos;
            asignacion.subtotalComboCentavos += subtotalComponente;
            asignacion.descuentoComboCentavos += precioRegularComponente - subtotalComponente;
            if (!asignacion.titulos.includes(mejor.promocion.titulo)) {
                asignacion.titulos.push(mejor.promocion.titulo);
            }
            cantidadesDisponibles.set(productoId, cantidadesDisponibles.get(productoId) - mejor.cantidadCombos);
        });
    }

    return new Map(itemsValidos.map((item) => {
        const asignacion = asignaciones.get(item.productoId);
        const cantidadRestante = cantidadesDisponibles.get(item.productoId);
        const promocionesIndividuales = (item.promocionesDisponibles || [])
            .filter((promocion) => promocion.tipoDescuento !== "COMBO");
        const calculoRestante = cantidadRestante
            ? calcularPromocionCarrito({
                ...item,
                cantidad: cantidadRestante,
                promocionesDisponibles: promocionesIndividuales
            })
            : { subtotalCentavos: 0, descuentoCentavos: 0, unidadesBonificadas: 0, promocion: null };
        const comboAplicado = asignacion.cantidadCombo > 0;
        const titulos = [
            ...asignacion.titulos.map((titulo) => "Combo: " + titulo),
            ...(calculoRestante.promocion ? [calculoRestante.promocion.titulo] : [])
        ];

        return [item.productoId, {
            subtotalCentavos: asignacion.subtotalComboCentavos + calculoRestante.subtotalCentavos,
            descuentoCentavos: asignacion.descuentoComboCentavos + calculoRestante.descuentoCentavos,
            unidadesBonificadas: calculoRestante.unidadesBonificadas,
            combosAplicados: asignacion.cantidadCombo,
            promocion: titulos.length
                ? {
                    titulo: [...new Set(titulos)].join(" + "),
                    tipoDescuento: comboAplicado ? "COMBO" : calculoRestante.promocion?.tipoDescuento
                }
                : null
        }];
    }));
}

export { calcularPromocionCarrito };
