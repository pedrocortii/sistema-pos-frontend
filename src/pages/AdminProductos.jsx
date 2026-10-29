import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { actualizarProducto, crearProducto, eliminarProducto, listarProductos } from "../api/productos";
import ProductoForm from "../components/ProductoForm";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { TableBody, TableEmpty, TableHead, TableHeader } from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { DataTable } from "../components/ui/DataTable";
import { FilterBar } from "../components/ui/FilterBar";
import { AdminProductoRow } from "../components/AdminProductoRow";
import { useModal } from "../hooks/useModal";
import { useAuthStore } from "../store/authStore";
import { useDataTable } from "../hooks/useDataTable";
import { categoriasApi, tiposProductoApi } from "../api/clasificacion";

const porPagina = 10;

function AdminProductos() {
    const usuario = useAuthStore(function (estado) { return estado.usuario; });
    const esAdministrador = usuario?.rol === "Administrador";
    const { open, close, modalData: modal } = useModal();

    const {
        data: productosResponse,
        isLoading: cargando,
        error,
        page: pagina,
        setPage,
        setSearch,
        search: busqueda,
        refresh
    } = useDataTable(listarProductos, {
        initialParams: { limit: porPagina }
    });

    const productos = productosResponse?.data || [];

    const [guardando, setGuardando] = useState(false);
    const [errorGuardar, setErrorGuardar] = useState(null);
    const [categorias, setCategorias] = useState([]);
    const [tiposProducto, setTiposProducto] = useState([]);
    const [errorClasificacion, setErrorClasificacion] = useState(null);

    useEffect(function () {
        if (!esAdministrador) return;
        Promise.all([categoriasApi.listar(), tiposProductoApi.listar()])
            .then(function ([categoriasApiResult, tiposApiResult]) { setCategorias(categoriasApiResult); setTiposProducto(tiposApiResult); })
            .catch(function (errorPeticion) { setErrorClasificacion(errorPeticion.response?.data?.mensaje || "No se pudieron cargar las categorías y tipos."); });
    }, [esAdministrador]);

    function abrirModal(datos = {}) {
        setErrorGuardar(null);
        open(datos);
    }

    function cerrarModal() {
        setErrorGuardar(null);
        close();
    }

    async function guardar(datos, archivoImagen) {
        setGuardando(true);
        setErrorGuardar(null);
        try {
            if (modal?.id) {
                await actualizarProducto(modal.id, datos, archivoImagen);
            } else {
                await crearProducto(datos, archivoImagen);
            }
            cerrarModal();
            await refresh();
        } catch (errorPeticion) {
            setErrorGuardar(
                errorPeticion.response?.data?.mensaje ||
                "No se pudo guardar el producto. Verificá los datos e intentá de nuevo."
            );
        } finally {
            setGuardando(false);
        }
    }

    async function borrar(producto) {
        if (!window.confirm(`¿Eliminar “${producto.nombre}”?`)) return;
        try {
            await eliminarProducto(producto.id);
            await refresh();
        } catch {
            // El error queda disponible en useDataTable -> usePeticion.
        }
    }

    const totalPaginas = Math.ceil((productosResponse?.total || 0) / porPagina);

    return (
        <section>
            <PageHeader
                etiqueta="Productos"
                titulo="Catálogo de productos"
                acciones={
                    esAdministrador && (
                        <Button
                            onClick={function () { abrirModal({}); }}
                            icon={Plus}
                        >
                            Nuevo producto
                        </Button>
                    )
                }
            />

            <FilterBar>
                <Input
                    value={busqueda}
                    onChange={function (e) {
                        setSearch(e.target.value);
                    }}
                    placeholder="Buscar por nombre..."
                    icon={Search}
                />
            </FilterBar>

            <DataTable
                isLoading={cargando}
                error={error}
                data={productos}
            >
                <TableHeader>
                    <tr className="border-b border-line bg-paper text-xs text-ink/60">
                        <TableHead className="w-16">Imagen</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Disponible</TableHead>
                        <TableHead>Categoría</TableHead>
                        {esAdministrador && <TableHead className="text-right">Acciones</TableHead>}
                    </tr>
                </TableHeader>
                <TableBody className="divide-y divide-line">
                    {productos.map(function (p) {
                        return (
                            <AdminProductoRow
                                key={p.id}
                                producto={p}
                                esAdministrador={esAdministrador}
                                onEdit={abrirModal}
                                onDelete={borrar}
                            />
                        );
                    })}
                    {!productos.length && (
                        <TableEmpty
                            colSpan={esAdministrador ? 6 : 5}
                            mensaje="No hay productos que coincidan con la búsqueda."
                        />
                    )}
                </TableBody>
            </DataTable>

            <Pagination pagina={pagina} total={totalPaginas} cambiar={setPage} />

            {esAdministrador && modal !== null && (
                <ProductoForm
                    producto={modal.id ? modal : null}
                    alCerrar={cerrarModal}
                    alGuardar={guardar}
                    guardando={guardando}
                    error={errorGuardar}
                    categorias={categorias}
                    tiposProducto={tiposProducto}
                    errorClasificacion={errorClasificacion}
                />
            )}
        </section>
    );
}

export default AdminProductos;
