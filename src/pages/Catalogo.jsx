import { useEffect, useState } from "react";
import { listarProductos } from "../api/productos";
import EncabezadoCliente from "../components/EncabezadoCliente";
import ProductoCatalogoCard from "../components/ProductoCatalogoCard";
import MensajeCarga from "../components/MensajeCarga";
import MensajeError from "../components/MensajeError";
import { usePeticion } from "../hooks/usePeticion";

function obtenerErrorCatalogo() {
    return "No se pudieron cargar los productos.";
}

function Catalogo() {
    const [paginacion, setPaginacion] = useState(null);
    const [pagina, setPagina] = useState(1);
    const { respuesta, cargando, error, ejecutar } = usePeticion(listarProductos, { obtenerMensajeError: obtenerErrorCatalogo });
    const productos = respuesta?.data || [];

    useEffect(function () {
        async function cargarProductos() {
            try {
                const respuesta = await ejecutar({ page: pagina, limit: 9 });
                setPaginacion({
                    paginaActual: respuesta.page,
                    totalPaginas: Math.ceil(respuesta.total / respuesta.limit)
                });
            } catch {
                // El hook mantiene el mensaje visible para la persona usuaria.
            }
        }

        cargarProductos();
    }, [pagina, ejecutar]);

    return (
        <div className="min-h-screen bg-paper">
            <EncabezadoCliente />

            <main className="max-w-6xl mx-auto px-6 py-10">
                <p className="font-mono-ticket text-xs tracking-[0.25em] uppercase text-ink/50">
                    Catalogo
                </p>
                <h1 className="font-display text-4xl text-ink mt-1 mb-8">
                    Nuestros productos
                </h1>

                {cargando && <MensajeCarga texto="Cargando productos..." />}

                {error && <MensajeError texto={error} />}

                {!cargando && !error && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {productos.map(function (producto) {
                            return <ProductoCatalogoCard key={producto.id} producto={producto} />;
                        })}
                    </div>
                )}

                {paginacion && paginacion.totalPaginas > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-10 font-mono-ticket text-sm">
                        <button
                            onClick={function () { setPagina(function (actual) { return actual - 1; }); }}
                            disabled={pagina === 1}
                            className="disabled:opacity-30 text-forest underline"
                        >
                            Anterior
                        </button>
                        <span className="text-ink/60">
                            Pagina {paginacion.paginaActual} de {paginacion.totalPaginas}
                        </span>
                        <button
                            onClick={function () { setPagina(function (actual) { return actual + 1; }); }}
                            disabled={pagina === paginacion.totalPaginas}
                            className="disabled:opacity-30 text-forest underline"
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Catalogo;
