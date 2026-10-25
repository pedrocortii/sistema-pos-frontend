import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { listarProductos } from "../api/productos";
import EncabezadoCliente from "../components/EncabezadoCliente";
import ProductoCatalogoCard from "../components/ProductoCatalogoCard";
import MensajeCarga from "../components/MensajeCarga";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { Alert } from "../components/ui/Alert";
import { EmptyState } from "../components/ui/EmptyState";
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
                <PageHeader
                    etiqueta="Catálogo"
                    titulo="Nuestros productos"
                    className="mb-8"
                />

                {cargando && <MensajeCarga texto="Cargando productos..." className="my-8" />}

                {error && <Alert tipo="error" texto={error} className="mb-8" />}

                {!cargando && !error && productos.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {productos.map(function (producto) {
                            return <ProductoCatalogoCard key={producto.id} producto={producto} />;
                        })}
                    </div>
                )}

                {!cargando && !error && productos.length === 0 && (
                    <EmptyState
                        icono={Package}
                        titulo="No hay productos disponibles"
                        descripcion="Actualmente no contamos con productos en el catálogo. Volvé a consultar pronto."
                    />
                )}

                {paginacion && (
                    <Pagination
                        pagina={paginacion.paginaActual}
                        total={paginacion.totalPaginas}
                        cambiar={setPagina}
                        className="mt-10"
                    />
                )}
            </main>
        </div>
    );
}

export default Catalogo;
