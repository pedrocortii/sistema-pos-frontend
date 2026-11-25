import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileDown, FileSpreadsheet, Search } from "lucide-react";
import { listarVentas } from "../api/ventas";
import { exportarVentas } from "../api/reportes";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { TableBody, TableEmpty, TableHead, TableHeader } from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { DataTable } from "../components/ui/DataTable";
import { FilterBar } from "../components/ui/FilterBar";
import { AdminVentaRow } from "../components/AdminVentaRow";
import { useDataTable } from "../hooks/useDataTable";
import { useAuthStore } from "../store/authStore";

function AdminVentas() {
    const nav = useNavigate();
    const usuario = useAuthStore(function (estado) { return estado.usuario; });
    const esAdministrador = usuario?.rol === "Administrador";
    const [exportacion, setExportacion] = useState("");
    const [errorExportacion, setErrorExportacion] = useState("");
    const exportacionEnCurso = useRef(false);

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

    async function manejarExportacion(formato) {
        if (exportacionEnCurso.current) return;
        exportacionEnCurso.current = true;
        setExportacion(formato);
        setErrorExportacion("");
        try {
            await exportarVentas(formato, {
                ...filters,
                buscar
            });
        } catch (error) {
            setErrorExportacion(error.message || "No se pudo generar el reporte de ventas.");
        } finally {
            exportacionEnCurso.current = false;
            setExportacion("");
        }
    }

    return (
        <section>
            <PageHeader
                etiqueta="Ventas"
                titulo="Ventas registradas"
                acciones={esAdministrador && (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={FileDown}
                            loading={exportacion === "pdf"}
                            disabled={Boolean(exportacion)}
                            onClick={() => manejarExportacion("pdf")}
                        >
                            Exportar PDF
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={FileSpreadsheet}
                            loading={exportacion === "xlsx"}
                            disabled={Boolean(exportacion)}
                            onClick={() => manejarExportacion("xlsx")}
                        >
                            Exportar Excel
                        </Button>
                    </div>
                )}
            />
            {errorExportacion && (
                <Alert tipo="error" texto={errorExportacion} className="mb-4" />
            )}

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
                        { value: "CANCELADA", label: "Cancelada" },
                        { value: "REEMBOLSADA", label: "Reembolsada" }
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
