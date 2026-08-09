import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";
import EncabezadoCliente from "../components/EncabezadoCliente";

function Catalogo() {
    const [productos, setProductos] = useState([]);
    const [paginacion, setPaginacion] = useState(null);
    const [pagina, setPagina] = useState(1);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(function () {
        async function cargarProductos() {
            setCargando(true);
            setError("");
            try {
                const respuesta = await http.get("/productos", { params: { pagina: pagina, limite: 9 } });
                setProductos(respuesta.data.productos);
                setPaginacion(respuesta.data.paginacion);
            } catch {
                setError("No se pudieron cargar los productos.");
            } finally {
                setCargando(false);
            }
        }

        cargarProductos();
    }, [pagina]);

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

                {cargando && (
                    <p className="font-mono-ticket text-sm text-ink/60">Cargando productos...</p>
                )}

                {error && (
                    <p className="font-mono-ticket text-sm text-red-600">{error}</p>
                )}

                {!cargando && !error && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {productos.map(function (producto) {
                            return (
                                <Link
                                    key={producto.id}
                                    to={"/catalogo/" + producto.id}
                                    className="bg-ticket border border-line p-6 flex flex-col no-underline hover:border-forest transition-colors"
                                >
                                    <p className="font-mono-ticket text-xs uppercase tracking-wide text-ink/50">
                                        {producto.categoria}
                                    </p>
                                    <h2 className="font-display text-xl text-ink mt-1">
                                        {producto.nombre}
                                    </h2>
                                    {producto.descripcion && (
                                        <p className="text-sm text-ink/60 mt-2 flex-1">
                                            {producto.descripcion}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between mt-5">
                                        <span className="font-mono-ticket text-lg text-forest">
                                            ${Number(producto.precio).toFixed(2)}
                                        </span>
                                        {producto.stock === 0 && (
                                            <span className="font-mono-ticket text-xs text-red-600">
                                                Sin stock
                                            </span>
                                        )}
                                    </div>

                                    <span className="w-full mt-4 text-center border border-forest text-forest font-mono-ticket text-sm uppercase tracking-wide py-2.5">
                                        Ver producto
                                    </span>
                                </Link>
                            );
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