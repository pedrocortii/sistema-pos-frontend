import { useMemo, useState } from "react";
import { ajustarStock, listarStock } from "../api/stock";
import AjustarStockModal from "../components/AjustarStockModal";
import { PageHeader } from "../components/ui/PageHeader";
import { TableBody, TableEmpty, TableHead, TableHeader } from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { DataTable } from "../components/ui/DataTable";
import { FilterBar } from "../components/ui/FilterBar";
import { AdminStockRow } from "../components/AdminStockRow";
import { useModal } from "../hooks/useModal";
import { useAuthStore } from "../store/authStore";
import { useDataTable } from "../hooks/useDataTable";

function AdminStock() {
    const usuario = useAuthStore(function (estado) { return estado.usuario; });
    const esAdministrador = usuario?.rol === "Administrador";
    const { open, close, modalData: modal } = useModal();

    const {
        data: stockResponse,
        isLoading: cargando,
        error,
        page: pagina,
        setPage,
        setFilter,
        filters,
        refresh
    } = useDataTable(listarStock, {
        initialParams: { limit: 10 }
    });

    const items = stockResponse?.data;
    const bajo = filters.bajo === "true" || filters.bajo === true;

    const datos = useMemo(function () {
        return (items || []).filter(function (p) {
            return !bajo || p.stockDisponible <= 5;
        });
    }, [items, bajo]);

    const total = Math.max(1, Math.ceil(datos.length / 10));
    const visibles = datos.slice((pagina - 1) * 10, pagina * 10);

    const [guardando, setGuardando] = useState(false);

    async function guardar(datos) {
        setGuardando(true);
        try {
            await ajustarStock(modal.id, datos);
            close();
            await refresh();
        } catch {
            // El error queda disponible en useDataTable -> usePeticion.
        } finally {
            setGuardando(false);
        }
    }

    return (
        <section>
            <PageHeader etiqueta="Stock" titulo="Inventario" />

            <FilterBar>
                <label className="flex w-fit cursor-pointer items-center gap-2 text-sm select-none">
                    <input
                        type="checkbox"
                        checked={bajo}
                        onChange={function (e) {
                            setFilter("bajo", e.target.checked);
                        }}
                        className="cursor-pointer accent-forest h-4 w-4"
                    />
                    Mostrar solo stock bajo
                </label>
            </FilterBar>

            <DataTable
                isLoading={cargando}
                error={error}
                data={visibles}
            >
                <TableHeader>
                    <tr className="border-b border-line bg-paper text-xs text-ink/60">
                        <TableHead className="w-16">Imagen</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Actual</TableHead>
                        <TableHead>Reservado</TableHead>
                        <TableHead>Disponible</TableHead>
                        {esAdministrador && <TableHead className="text-right">Acciones</TableHead>}
                    </tr>
                </TableHeader>
                <TableBody className="divide-y divide-line">
                    {visibles.map(function (p) {
                        return (
                            <AdminStockRow
                                key={p.id}
                                producto={p}
                                esAdministrador={esAdministrador}
                                onAdjust={() => open(p)}
                            />
                        );
                    })}
                    {!visibles.length && (
                        <TableEmpty
                            colSpan={esAdministrador ? 6 : 5}
                            mensaje="No se encontraron productos en el inventario."
                        />
                    )}
                </TableBody>
            </DataTable>

            <Pagination pagina={pagina} total={total} cambiar={setPage} />

            {esAdministrador && modal && (
                <AjustarStockModal
                    producto={modal}
                    alCerrar={close}
                    alGuardar={guardar}
                    guardando={guardando}
                />
            )}
        </section>
    );
}

export default AdminStock;
