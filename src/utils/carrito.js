function cantidadValida(valor) {
    const cantidad = Number(valor);
    return Number.isSafeInteger(cantidad) && cantidad > 0 ? cantidad : 0;
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
            promocionNoAplicable: producto.promocionNoAplicable || null,
            stockDisponible,
            cantidad
        });
    });

    return resultado;
}
