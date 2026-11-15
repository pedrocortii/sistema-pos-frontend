import { useEffect, useRef, useState } from "react";
import { FileDown, FileSpreadsheet, Pencil, Save } from "lucide-react";
import {
    ajustarStock,
    guardarConfiguracionStock,
    listarStock,
    obtenerConfiguracionStock,
    obtenerVistaPreviaStockBajo
} from "../api/stock";
import { exportarStock } from "../api/reportes";
import AjustarStockModal from "../components/AjustarStockModal";
import { PageHeader } from "../components/ui/PageHeader";
import { TableBody, TableEmpty, TableHead, TableHeader } from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { DataTable } from "../components/ui/DataTable";
import { FilterBar } from "../components/ui/FilterBar";
import { AdminStockRow } from "../components/AdminStockRow";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { useModal } from "../hooks/useModal";
import { useAuthStore } from "../store/authStore";
import { useDataTable } from "../hooks/useDataTable";
import { umbralStockBajoSchema } from "../validations/stockSchema";
import {
    NIVEL_ADVERTENCIA_STOCK_BAJO,
    obtenerAdvertenciaStockBajo
} from "../utils/stock";

const LIMITE_STOCK = 10;
const ESPERA_VISTA_PREVIA_MS = 350;

function leerUmbral(valor) {
    const texto = String(valor).trim();
    if (texto === "") return null;
    const numero = Number(texto);
    return Number.isInteger(numero) && numero >= 0 ? numero : null;
}

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
        syncWithUrl: true,
        initialParams: { limit: LIMITE_STOCK }
    });

    const items = stockResponse?.data || [];
    const bajo = filters.bajo === "true" || filters.bajo === true;
    const total = Math.max(1, Math.ceil((stockResponse?.total || 0) / LIMITE_STOCK));

    const [guardando, setGuardando] = useState(false);
    const [exportacion, setExportacion] = useState("");
    const [errorExportacion, setErrorExportacion] = useState("");
    const exportacionEnCurso = useRef(false);

    const [umbral, setUmbral] = useState("");
    const [umbralGuardado, setUmbralGuardado] = useState("");
    const [editandoUmbral, setEditandoUmbral] = useState(false);
    const [cargandoUmbral, setCargandoUmbral] = useState(true);
    const [guardandoUmbral, setGuardandoUmbral] = useState(false);
    const [mensajeUmbral, setMensajeUmbral] = useState(null);
    const [cacheVistaPrevia, setCacheVistaPrevia] = useState(function () { return new Map(); });
    const [errorVistaPrevia, setErrorVistaPrevia] = useState("");
    const [confirmandoUmbral, setConfirmandoUmbral] = useState(false);

    useEffect(function () {
        if (!esAdministrador) return undefined;

        let activo = true;
        obtenerConfiguracionStock().then(function (configuracion) {
            if (!activo) return;
            const valor = String(configuracion.umbralStockBajo);
            setUmbral(valor);
            setUmbralGuardado(valor);
        }).catch(function (errorPeticion) {
            if (activo) {
                setMensajeUmbral({
                    tipo: "error",
                    texto: errorPeticion.response?.data?.mensaje || "No se pudo cargar el umbral de stock bajo."
                });
            }
        }).finally(function () {
            if (activo) setCargandoUmbral(false);
        });

        return function () { activo = false; };
    }, [esAdministrador]);

    useEffect(function () {
        if (!editandoUmbral || !esAdministrador) return undefined;

        const umbralConsulta = leerUmbral(umbral);
        if (umbralConsulta === null) return undefined;
        if (cacheVistaPrevia.has(umbralConsulta)) return undefined;

        let activo = true;
        const temporizador = setTimeout(function () {
            obtenerVistaPreviaStockBajo(umbralConsulta).then(function (resultado) {
                if (!activo) return;
                setCacheVistaPrevia(function (anterior) {
                    const siguiente = new Map(anterior);
                    siguiente.set(umbralConsulta, resultado);
                    return siguiente;
                });
            }).catch(function (errorPeticion) {
                if (!activo) return;
                setErrorVistaPrevia(
                    errorPeticion.response?.data?.mensaje || "No se pudo calcular la vista previa."
                );
            });
        }, ESPERA_VISTA_PREVIA_MS);

        return function () {
            activo = false;
            clearTimeout(temporizador);
        };
    }, [editandoUmbral, esAdministrador, umbral, cacheVistaPrevia]);

    async function manejarExportacion(formato) {
        if (exportacionEnCurso.current) return;
        exportacionEnCurso.current = true;
        setExportacion(formato);
        setErrorExportacion("");
        try {
            await exportarStock(formato, { bajo });
        } catch (error) {
            setErrorExportacion(error.message || "No se pudo generar el reporte de stock.");
        } finally {
            exportacionEnCurso.current = false;
            setExportacion("");
        }
    }

    async function guardar(datos) {
        setGuardando(true);
        try {
            await ajustarStock(modal.id, datos);
            // El stock cambió: las vistas previas cacheadas dejan de ser válidas.
            setCacheVistaPrevia(new Map());
            close();
            await refresh();
        } catch {
            // El error queda disponible en useDataTable -> usePeticion.
        } finally {
            setGuardando(false);
        }
    }

    function validarUmbralActual() {
        try {
            const datos = umbralStockBajoSchema.validateSync({
                umbralStockBajo: String(umbral).trim() === "" ? undefined : Number(umbral)
            });
            return datos.umbralStockBajo;
        } catch (errorValidacion) {
            setMensajeUmbral({
                tipo: "error",
                texto: errorValidacion.errors?.[0] || errorValidacion.message
            });
            return null;
        }
    }

    async function obtenerVistaPreviaActual(umbralConsulta) {
        const cacheada = cacheVistaPrevia.get(umbralConsulta);
        if (cacheada) return cacheada;

        setErrorVistaPrevia("");
        try {
            const resultado = await obtenerVistaPreviaStockBajo(umbralConsulta);
            setCacheVistaPrevia(function (anterior) {
                const siguiente = new Map(anterior);
                siguiente.set(umbralConsulta, resultado);
                return siguiente;
            });
            return resultado;
        } catch (errorPeticion) {
            setErrorVistaPrevia(
                errorPeticion.response?.data?.mensaje || "No se pudo calcular la vista previa."
            );
            return null;
        }
    }

    async function guardarUmbral(evento) {
        evento.preventDefault();
        setMensajeUmbral(null);

        const valor = validarUmbralActual();
        if (valor === null) return;

        const vista = await obtenerVistaPreviaActual(valor);
        if (!vista) return;

        const advertencia = obtenerAdvertenciaStockBajo(vista.porcentajeAfectado);
        if (advertencia.requiereConfirmacion && !confirmandoUmbral) {
            setConfirmandoUmbral(true);
            return;
        }

        await guardarUmbralConfirmado(valor);
    }

    async function confirmarGuardadoUmbral() {
        setMensajeUmbral(null);
        const valor = validarUmbralActual();
        if (valor === null) {
            setConfirmandoUmbral(false);
            return;
        }
        await guardarUmbralConfirmado(valor);
    }

    async function guardarUmbralConfirmado(valor) {
        setGuardandoUmbral(true);
        try {
            const configuracion = await guardarConfiguracionStock(valor);
            const valorGuardado = String(configuracion.umbralStockBajo);
            setUmbral(valorGuardado);
            setUmbralGuardado(valorGuardado);
            setEditandoUmbral(false);
            setConfirmandoUmbral(false);
            setMensajeUmbral({
                tipo: "success",
                texto: "El umbral se actualizó. El dashboard, el inventario y los reportes usarán el mismo valor."
            });
            if (pagina === 1) {
                await refresh();
            } else {
                setPage(1);
            }
        } catch (errorPeticion) {
            setMensajeUmbral({
                tipo: "error",
                texto: errorPeticion.response?.data?.mensaje || "No se pudo guardar el umbral de stock bajo."
            });
        } finally {
            setGuardandoUmbral(false);
        }
    }

    function editarUmbral() {
        setCacheVistaPrevia(new Map());
        setUmbral(umbralGuardado);
        setMensajeUmbral(null);
        setErrorVistaPrevia("");
        setConfirmandoUmbral(false);
        setEditandoUmbral(true);
    }

    function cancelarEdicionUmbral() {
        setUmbral(umbralGuardado);
        setMensajeUmbral(null);
        setErrorVistaPrevia("");
        setConfirmandoUmbral(false);
        setEditandoUmbral(false);
    }

    const umbralActual = leerUmbral(umbral);
    const vistaPreviaVisible = umbralActual === null
        ? null
        : cacheVistaPrevia.get(umbralActual) || null;
    const advertenciaUmbral = obtenerAdvertenciaStockBajo(vistaPreviaVisible?.porcentajeAfectado);
    const mensajeAdvertencia = vistaPreviaVisible?.porcentajeAfectado == null
        ? ""
        : `El ${vistaPreviaVisible.porcentajeAfectado} % de tus productos quedaría marcado como stock bajo. Revisá si este umbral representa tus necesidades.`;
    const mostrarCalculoVistaPrevia = editandoUmbral
        && umbralActual !== null
        && !vistaPreviaVisible
        && !errorVistaPrevia;

    return (
        <section>
            <PageHeader
                etiqueta="Stock"
                titulo="Inventario"
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

            {esAdministrador && (
                <Card className="mb-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <CardTitle>Alerta de stock bajo</CardTitle>
                            <p className="mt-1 text-sm text-ink/60">
                                Definí el límite de unidades disponibles para considerar un producto con stock bajo.
                                Se usa en el dashboard, en este inventario y en los reportes exportados.
                            </p>
                        </div>
                        {editandoUmbral ? (
                            <form onSubmit={guardarUmbral} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                <Input
                                    label="Umbral (unidades)"
                                    name="umbralStockBajo"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={umbral}
                                    onChange={function (evento) {
                                        setUmbral(evento.target.value);
                                        setConfirmandoUmbral(false);
                                        setErrorVistaPrevia("");
                                    }}
                                    disabled={guardandoUmbral}
                                    containerClassName="w-44"
                                    autoFocus
                                    required
                                />
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        size="sm"
                                        icon={Save}
                                        loading={guardandoUmbral}
                                        loadingText="Guardando..."
                                        disabled={confirmandoUmbral}
                                    >
                                        Guardar
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={cancelarEdicionUmbral}
                                        disabled={guardandoUmbral}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex flex-wrap items-center gap-3">
                                <p className="text-sm text-ink/70">
                                    Umbral actual:{" "}
                                    <span className="font-mono-ticket font-semibold text-ink">
                                        {cargandoUmbral ? "…" : umbralGuardado === "" ? "sin configurar" : `${umbralGuardado} unidades`}
                                    </span>
                                    {!cargandoUmbral && umbralGuardado !== "" && " o menos"}
                                </p>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    icon={Pencil}
                                    onClick={editarUmbral}
                                    disabled={cargandoUmbral}
                                >
                                    Editar
                                </Button>
                            </div>
                        )}
                    </div>

                    {editandoUmbral && (
                        <div className="mt-4 border-t border-line pt-4">
                            {umbralActual === null && (
                                <p className="text-sm text-ink/60">
                                    Ingresá un número entero mayor o igual a cero para ver cuántos productos quedarían afectados.
                                </p>
                            )}

                            {mostrarCalculoVistaPrevia && (
                                <p className="text-sm text-ink/60" role="status">
                                    Calculando impacto en el inventario…
                                </p>
                            )}

                            {errorVistaPrevia && (
                                <Alert tipo="error" texto={errorVistaPrevia} />
                            )}

                            {vistaPreviaVisible && (
                                vistaPreviaVisible.totalProductosActivos === 0 ? (
                                    <Alert
                                        tipo="info"
                                        texto="No hay productos activos para calcular el impacto de este umbral."
                                    />
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                                            <div className="border border-line bg-paper/60 p-3">
                                                <p className="text-xs text-ink/50">Productos activos</p>
                                                <p className="font-mono-ticket text-lg font-semibold text-ink">
                                                    {vistaPreviaVisible.totalProductosActivos}
                                                </p>
                                            </div>
                                            <div className="border border-line bg-paper/60 p-3">
                                                <p className="text-xs text-ink/50">Con stock bajo</p>
                                                <p className="font-mono-ticket text-lg font-semibold text-ink">
                                                    {vistaPreviaVisible.totalProductosStockBajo}
                                                </p>
                                            </div>
                                            <div className="border border-line bg-paper/60 p-3">
                                                <p className="text-xs text-ink/50">Sin stock bajo</p>
                                                <p className="font-mono-ticket text-lg font-semibold text-ink">
                                                    {vistaPreviaVisible.totalProductosSinStockBajo}
                                                </p>
                                            </div>
                                            <div className="border border-line bg-paper/60 p-3">
                                                <p className="text-xs text-ink/50">Inventario afectado</p>
                                                <p className="font-mono-ticket text-lg font-semibold text-ink">
                                                    {vistaPreviaVisible.porcentajeAfectado} %
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3 h-2 w-full overflow-hidden border border-line bg-paper">
                                            <div
                                                className={`h-full transition-all ${
                                                    advertenciaUmbral.nivel === NIVEL_ADVERTENCIA_STOCK_BAJO.IMPORTANTE
                                                        ? "bg-red-500"
                                                        : advertenciaUmbral.nivel === NIVEL_ADVERTENCIA_STOCK_BAJO.MODERADA
                                                            ? "bg-amber"
                                                            : "bg-forest"
                                                }`}
                                                style={{ width: `${vistaPreviaVisible.porcentajeAfectado}%` }}
                                            />
                                        </div>

                                        {!confirmandoUmbral && advertenciaUmbral.requiereConfirmacion && (
                                            <Alert
                                                tipo="warning"
                                                titulo={advertenciaUmbral.nivel === NIVEL_ADVERTENCIA_STOCK_BAJO.IMPORTANTE
                                                    ? "Umbral muy elevado"
                                                    : "Umbral elevado"}
                                                texto={mensajeAdvertencia}
                                                className="mt-3"
                                            />
                                        )}
                                    </>
                                )
                            )}

                            {confirmandoUmbral && vistaPreviaVisible && vistaPreviaVisible.totalProductosActivos > 0 && (
                                <Alert
                                    tipo="warning"
                                    titulo="Confirmá el nuevo umbral"
                                    className="mt-3"
                                >
                                    <p>
                                        {mensajeAdvertencia} Si confirmás, el umbral se guardará con este impacto.
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            loading={guardandoUmbral}
                                            loadingText="Guardando..."
                                            onClick={confirmarGuardadoUmbral}
                                        >
                                            Sí, guardar umbral
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setConfirmandoUmbral(false)}
                                            disabled={guardandoUmbral}
                                        >
                                            Seguir editando
                                        </Button>
                                    </div>
                                </Alert>
                            )}
                        </div>
                    )}

                    {mensajeUmbral && (
                        <Alert tipo={mensajeUmbral.tipo} texto={mensajeUmbral.texto} className="mt-4" />
                    )}
                </Card>
            )}

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
                    Mostrar solo stock bajo{esAdministrador && umbralGuardado !== "" ? ` (≤ ${umbralGuardado})` : ""}
                </label>
            </FilterBar>

            <DataTable
                isLoading={cargando}
                error={error}
                data={items}
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
                    {items.map(function (p) {
                        return (
                            <AdminStockRow
                                key={p.id}
                                producto={p}
                                esAdministrador={esAdministrador}
                                onAdjust={() => open(p)}
                            />
                        );
                    })}
                    {!items.length && (
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
