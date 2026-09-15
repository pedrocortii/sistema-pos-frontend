import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { actualizarProducto, crearProducto, eliminarProducto, listarProductos } from "../api/productos";
import ProductoForm from "../components/ProductoForm";
import { useModal } from "../hooks/useModal";
import { useFilter } from "../hooks/useFilter";
import { usePagination } from "../hooks/usePagination";
import MensajeCarga from "../components/MensajeCarga";
import MensajeError from "../components/MensajeError";

const porPagina = 10;

function AdminProductos() {
    const { open, close, modalData: modal } = useModal();
    const { data: productosResponse = {}, isLoading: cargando, error, page: pagina, setPage: setPagina, fetchPage: cargar } = usePagination(listarProductos);

    // Extraemos la lista de productos del objeto de respuesta del servidor
    const productos = productosResponse?.data || [];
    const { query: busqueda, setQuery: setBusqueda, filteredData: filtrados } = useFilter(productos, (p) => p.nombre);

    const [guardando, setGuardando] = useState(false);

    
    const visibles = filtrados;
    const totalPaginas = Math.ceil((productosResponse?.total || 0) / porPagina);

    async function guardar(datos) {
        setGuardando(true);
        try {
            if (modal) await actualizarProducto(modal.id, datos);
            else await crearProducto(datos);
            close();
            await cargar();
        } catch {
            // El error queda disponible en usePeticion.
        } finally {
            setGuardando(false);
        }
    }

    async function borrar(producto) {
        if (!window.confirm(`¿Eliminar “${producto.nombre}”?`)) return;
        try {
            await eliminarProducto(producto.id);
            await cargar();
        } catch {
            // El error queda disponible en usePeticion.
        }
    }

    return (
        <section>
            <Cabecera etiqueta="Productos" titulo="Catálogo de productos" />
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <input
                    value={busqueda}
                    onChange={function (e) {
                        setBusqueda(e.target.value);
                        setPagina(1);
                    }}
                    placeholder="Buscar por nombre"
                    className="border border-line bg-ticket px-3 py-2 font-mono-ticket text-sm outline-none focus:border-forest"
                />
                <button
                    onClick={function () { open({}); }}
                    className="flex cursor-pointer items-center justify-center gap-2 bg-forest px-4 py-2 font-mono-ticket text-sm text-paper"
                >
                    <Plus size={17} />Nuevo producto
                </button>
            </div>

            {error && <Alerta texto={error} />}
            {cargando ? (
                <Carga />
            ) : (
                <div className="mt-5 overflow-x-auto border border-line bg-ticket">
                    <table className="w-full min-w-175 text-left">
                        <thead className="border-b border-line bg-paper font-mono-ticket text-xs uppercase text-ink/60">
                            <tr>
                                <th className="p-3">Nombre</th>
                                <th>Precio</th>
                                <th>Disponible</th>
                                <th>Categoría</th>
                                <th className="p-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibles.map(function (p) {
                                return (
                                    <tr key={p.id} className="border-b border-line last:border-0">
                                        <td className="p-3 font-medium">{p.nombre}</td>
                                        <td>${Number(p.precio).toFixed(2)}</td>
                                        <td>{p.stock - (p.stockReservado || 0)}</td>
                                        <td>{p.categoria}</td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <button onClick={function () { open(p); }} className="cursor-pointer text-forest" aria-label="Editar">
                                                    <Pencil size={17} />
                                                </button>
                                                <button onClick={function () { borrar(p); }} className="cursor-pointer text-red-600" aria-label="Eliminar">
                                                    <Trash2 size={17} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {!visibles.length && <p className="p-5 font-mono-ticket text-sm text-ink/60">No hay productos que coincidan.</p>}
                </div>
            )}

            <Paginacion pagina={pagina} total={totalPaginas} cambiar={setPagina} />
            {modal !== null && (
                <ProductoForm
                    producto={modal.id ? modal : null}
                    alCerrar={close}
                    alGuardar={guardar}
                    guardando={guardando}
                />
            )}
        </section>
    );
}

export function Cabecera({ etiqueta, titulo }) {
    return (
        <>
            <p className="font-mono-ticket text-xs uppercase tracking-[.25em] text-forest">{etiqueta}</p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl">{titulo}</h1>
        </>
    );
}

export function Carga() {
    return <MensajeCarga className="mt-8" />;
}

export function Alerta({ texto }) {
    return <MensajeError texto={texto} className="mt-4" />;
}

export function Paginacion({ pagina, total, cambiar }) {
    return (
        total > 1 && (
            <div className="mt-6 flex justify-center gap-4 font-mono-ticket text-sm">
                <button disabled={pagina === 1} onClick={function () { cambiar(pagina - 1); }} className="cursor-pointer text-forest disabled:opacity-30">
                    Anterior
                </button>
                <span>{pagina} / {total}</span>
                <button disabled={pagina === total} onClick={function () { cambiar(pagina + 1); }} className="cursor-pointer text-forest disabled:opacity-30">
                    Siguiente
                </button>
            </div>
        )
    );
}

export default AdminProductos;
