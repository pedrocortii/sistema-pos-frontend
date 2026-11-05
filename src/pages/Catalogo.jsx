import { useEffect, useState } from "react";
import { Package, Search } from "lucide-react";
import { listarProductos } from "../api/productos";
import { listarPromocionesVigentes } from "../api/promociones";
import EncabezadoCliente from "../components/EncabezadoCliente";
import ProductoCatalogoCard from "../components/ProductoCatalogoCard";
import MensajeCarga from "../components/MensajeCarga";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { Alert } from "../components/ui/Alert";
import { EmptyState } from "../components/ui/EmptyState";
import { usePeticion } from "../hooks/usePeticion";
import BannerPromociones from "../components/BannerPromociones";

function obtenerErrorCatalogo() {
    return "No se pudieron cargar los productos.";
}

function Catalogo() {
    const [paginacion, setPaginacion] = useState(null);
    const [pagina, setPagina] = useState(1);
    const [busqueda, setBusqueda] = useState("");
    const [categoria, setCategoria] = useState("");
    const { respuesta, cargando, error, ejecutar } = usePeticion(listarProductos, { obtenerMensajeError: obtenerErrorCatalogo });
    const { respuesta: promocionesRespuesta, cargando: promocionesCargando, ejecutar: ejecutarPromociones } = usePeticion(listarPromocionesVigentes);
    const productos = respuesta?.data || [];
    const categorias = respuesta?.categorias || [];
    const hayFiltros = Boolean(busqueda.trim() || categoria);

    useEffect(function () {
        let vigente = true;
        const temporizador = window.setTimeout(function () {
            async function cargarProductos() {
                try {
                    const resultado = await ejecutar({
                        page: pagina,
                        limit: 9,
                        nombre: busqueda.trim() || undefined,
                        categoria: categoria || undefined
                    });
                    if (vigente) {
                        setPaginacion({
                            paginaActual: resultado.page,
                            totalPaginas: Math.ceil(resultado.total / resultado.limit)
                        });
                    }
                } catch {
                    // El hook mantiene el mensaje visible para la persona usuaria.
                }
            }

            cargarProductos();
        }, busqueda ? 250 : 0);

        return function () {
            vigente = false;
            window.clearTimeout(temporizador);
        };
    }, [busqueda, categoria, pagina, ejecutar]);

    useEffect(function () {
        ejecutarPromociones().catch(function () {
            // Las promociones son complementarias y no deben bloquear el catálogo.
        });
    }, [ejecutarPromociones]);

    function limpiarFiltros() {
        setBusqueda("");
        setCategoria("");
        setPagina(1);
    }

    return (
        <div className="min-h-screen bg-paper">
            <EncabezadoCliente />

            <main className="max-w-6xl mx-auto px-6 py-10">
                <PageHeader
                    etiqueta="Catálogo"
                    titulo="Nuestros productos"
                    className="mb-8"
                />

                <BannerPromociones promociones={promocionesRespuesta?.promociones} cargando={promocionesCargando} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div>
                        <label htmlFor="busqueda-productos" className="block font-mono-ticket text-xs uppercase text-ink/60 mb-2">
                            Buscar por nombre
                        </label>
                        <div className="relative">
                            <Search size={18} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/50" />
                            <input
                                id="busqueda-productos"
                                type="search"
                                value={busqueda}
                                onChange={function (evento) { setBusqueda(evento.target.value); setPagina(1); }}
                                placeholder="Ej. Café molido"
                                className="w-full border border-line bg-ticket py-3 pl-10 pr-3 text-ink outline-none focus:border-forest"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="filtro-categoria" className="block font-mono-ticket text-xs uppercase text-ink/60 mb-2">
                            Categoría
                        </label>
                        <select
                            id="filtro-categoria"
                            value={categoria}
                            onChange={function (evento) { setCategoria(evento.target.value); setPagina(1); }}
                            className="w-full border border-line bg-ticket px-3 py-3 text-ink outline-none focus:border-forest"
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map(function (opcionCategoria) {
                                return <option key={opcionCategoria} value={opcionCategoria}>{opcionCategoria}</option>;
                            })}
                        </select>
                    </div>
                </div>

                {cargando && <MensajeCarga texto="Cargando productos..." className="my-8" />}

                {error && <Alert tipo="error" texto={error} className="mb-8" />}

                {!cargando && !error && productos.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {productos.map(function (producto) {
                            return <ProductoCatalogoCard key={producto.id} producto={producto} />;
                        })}
                    </div>
                )}

                {!cargando && !error && respuesta && productos.length === 0 && (
                    hayFiltros ? (
                        <div className="border border-line bg-ticket px-6 py-10 text-center" aria-live="polite">
                            <h2 className="font-display text-2xl text-ink">
                                No encontramos productos con esos filtros.
                            </h2>
                            <button
                                type="button"
                                onClick={limpiarFiltros}
                                className="mt-4 font-mono-ticket text-sm text-forest underline underline-offset-4"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    ) : (
                        <EmptyState
                            icono={Package}
                            titulo="No hay productos disponibles"
                            descripcion="Actualmente no contamos con productos en el catálogo. Volvé a consultar pronto."
                        />
                    )
                )}

                {!cargando && paginacion && (
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
