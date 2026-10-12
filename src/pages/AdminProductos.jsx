import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { actualizarProducto, crearProducto, eliminarProducto, listarProductos } from "../api/productos";
import ProductoForm from "../components/ProductoForm";
import { AlertaAdmin, CabeceraAdmin, CargaAdmin, PaginacionAdmin } from "../components/AdminUI";
import { useModal } from "../hooks/useModal";
import { useFilter } from "../hooks/useFilter";
import { usePagination } from "../hooks/usePagination";
import { useAuthStore } from "../store/authStore";
import ImagenProducto from "../components/ImagenProducto";

const porPagina = 10;

function AdminProductos() {
    const usuario = useAuthStore(function (estado) { return estado.usuario; });
    const esAdministrador = usuario?.rol === "Administrador";
    const { open, close, modalData: modal } = useModal();
    const { data: productosResponse = {}, isLoading: cargando, error, page: pagina, setPage: setPagina, fetchPage: cargar } = usePagination(listarProductos);

    // Extraemos la lista de productos del objeto de respuesta del servidor
    const productos = productosResponse?.data || [];
    const { query: busqueda, setQuery: setBusqueda, filteredData: filtrados } = useFilter(productos, (p) => p.nombre);

    const [guardando, setGuardando] = useState(false);

    
    const visibles = filtrados;
    const totalPaginas = Math.ceil((productosResponse?.total || 0) / porPagina);

    async function guardar(datos, archivoImagen) {
        setGuardando(true);
        try {
            if (modal) await actualizarProducto(modal.id, datos, archivoImagen);
            else await crearProducto(datos, archivoImagen);
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
            <CabeceraAdmin etiqueta="Productos" titulo="Catálogo de productos" />
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
                {esAdministrador && (
                    <button
                        onClick={function () { open({}); }}
                        className="flex cursor-pointer items-center justify-center gap-2 bg-forest px-4 py-2 font-mono-ticket text-sm text-paper"
                    >
                        <Plus size={17} />Nuevo producto
                    </button>
                )}
            </div>

            {error && <AlertaAdmin texto={error} />}
            {cargando ? (
                <CargaAdmin />
            ) : (
                <div className="mt-5 overflow-x-auto border border-line bg-ticket">
                    <table className="w-full min-w-175 text-left">
                        <thead className="border-b border-line bg-paper font-mono-ticket text-xs uppercase text-ink/60">
                            <tr>
                                <th className="p-3">Imagen</th>
                                <th className="p-3">Nombre</th>
                                <th>Precio</th>
                                <th>Disponible</th>
                                <th>Categoría</th>
                                {esAdministrador && <th className="p-3">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {visibles.map(function (p) {
                                return (
                                    <tr key={p.id} className="border-b border-line last:border-0">
                                        <td className="p-3">
                                            <ImagenProducto
                                                imagen={p.imagen}
                                                alt={"Imagen de " + p.nombre}
                                                className="h-10 w-10 rounded object-cover"
                                            />
                                        </td>
                                        <td className="p-3 font-medium">{p.nombre}</td>
                                        <td>${Number(p.precio).toFixed(2)}</td>
                                        <td>{p.stock - (p.stockReservado || 0)}</td>
                                        <td>{p.categoria}</td>
                                        {esAdministrador && (
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
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {!visibles.length && <p className="p-5 font-mono-ticket text-sm text-ink/60">No hay productos que coincidan.</p>}
                </div>
            )}

            <PaginacionAdmin pagina={pagina} total={totalPaginas} cambiar={setPagina} />
            {esAdministrador && modal !== null && (
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

export default AdminProductos;
