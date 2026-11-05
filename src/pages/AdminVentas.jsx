import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { listarVentas } from "../api/ventas";
import { PageHeader } from "../components/ui/PageHeader";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { TableBody, TableEmpty, TableHead, TableHeader } from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { DataTable } from "../components/ui/DataTable";
import { FilterBar } from "../components/ui/FilterBar";
import { AdminVentaRow } from "../components/AdminVentaRow";
import { useDataTable } from "../hooks/useDataTable";

function AdminVentas() {
    const nav = useNavigate();

    const {
        data: ventasResponse,
        isLoading: cargando,
        error,
        page: pagina,
        setPage,
        setSearch,
        setFilter,
        search: buscar,
        filters,
    } = useDataTable(listarVentas, {
        syncWithUrl: true,
        initialParams: { limit: 10 }
    });

    const ventas = ventasResponse?.ventas;
    const { estado = "" } = filters;

    const datos = useMemo(function () {
        return (ventas || []).filter(function (v) {
            return v.codigoComprobante.toLowerCase().includes(buscar.toLowerCase());
        });
    }, [ventas, buscar]);

    const totalPaginas = ventasResponse?.total ? Math.ceil(ventasResponse.total / 10) : 1;
    const visibles = datos;

    return (
        <section>
            <PageHeader etiqueta="Ventas" titulo="Ventas registradas" />

            <FilterBar>
                <Input
                    value={buscar}
                    onChange={function (e) { setSearch(e.target.value); }}
                    placeholder="Buscar código..."
                    icon={Search}
                />
                <Select
                    value={estado}
                    onChange={function (e) { setFilter("estado", e.target.value); }}
                    options={[
                        { value: "", label: "Todos los estados" },
                        { value: "PENDIENTE", label: "Pendiente" },
                        { value: "COBRADA", label: "Cobrada" },
                        { value: "EN_PREPARACION", label: "En preparación" },
                        { value: "LISTA_PARA_RETIRAR", label: "Lista para retirar" },
                        { value: "RETIRADA", label: "Retirada" },
                        { value: "CANCELADA", label: "Cancelada" }
                    ]}
                />
                <Input
                    type="date"
                    value={filters.fechaDesde || ""}
                    onChange={function (e) { setFilter("fechaDesde", e.target.value); }}
                    aria-label="Fecha desde"
                />
                <Input
                    type="date"
                    value={filters.fechaHasta || ""}
                    onChange={function (e) { setFilter("fechaHasta", e.target.value); }}
                    aria-label="Fecha hasta"
                />
            </FilterBar>

            <DataTable
                isLoading={cargando}
                error={error}
                data={visibles}
                minWidth="min-w-200"
            >
                <TableHeader>
                    <tr className="border-b border-line bg-paper text-xs text-ink/60">
                        <TableHead className="w-40">Código</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </tr>
                </TableHeader>
                <TableBody className="divide-y divide-line">
                    {visibles.map(function (v) {
                        return (
                            <AdminVentaRow
                                key={v.id}
                                venta={v}
                                onClick={() => nav("/admin/ventas/" + v.id)}
                            />
                        );
                    })}
                    {!visibles.length && (
                        <TableEmpty
                            colSpan={6}
                            mensaje="No se encontraron ventas con los filtros seleccionados."
                        />
                    )}
                </TableBody>
            </DataTable>

            <Pagination
                pagina={pagina}
                total={totalPaginas}
                cambiar={setPage}
            />
        </section>
    );
}

export default AdminVentas;
