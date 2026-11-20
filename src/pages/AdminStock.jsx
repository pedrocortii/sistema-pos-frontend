import { useCallback, useEffect, useRef, useState } from "react";
import {
    ChevronDown,
    FileDown,
    FileSpreadsheet,
    Filter,
    Pencil,
    Save,
    Search,
    Tag
} from "lucide-react";
import {
    ajustarStock,
    guardarConfiguracionStock,
    listarStock,
    obtenerConfiguracionStock,
    obtenerResumenInventario,
    obtenerVistaPreviaStockBajo
} from "../api/stock";
import { exportarStock } from "../api/reportes";
import { categoriasApi } from "../api/clasificacion";
import AjustarStockModal from "../components/AjustarStockModal";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { AdminStockRow } from "../components/AdminStockRow";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { CargaAdmin } from "../components/AdminUI";
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

function calcularResumenDesdePagina(items, total, totalCategorias) {
    const sinStock = items.filter(function (producto) {
        return Number(producto.stockDisponible) <= 0;
    }).length;
    const stockBajo = items.filter(function (producto) {
        const disponible = Number(producto.stockDisponible);
        return disponible > 0 && producto.stockBajo === true;
    }).length;

    return {
        totalProductos: total,
        stockBajo,
        sinStock,
        categorias: totalCategorias
    };
}

function TarjetaResumen({ titulo, valor, color = "text-slate-800" }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {titulo}
            </p>
            <p className={`mt-2 text-3xl font-bold ${color}`}>{valor}</p>
        </div>
    );
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
        search: busqueda,
        setSearch,
        setPage,
        setFilter,
        filters,
        refresh
    } = useDataTable(listarStock, {
        syncWithUrl: true,
        initialParams: { limit: LIMITE_STOCK }
    });

    const items = stockResponse?.data || [];
    const total = Math.max(1, Math.ceil((stockResponse?.total || 0) / LIMITE_STOCK));
    const estadoFiltro = filters.estado || "todos";
    const categoriaFiltro = filters.categoria || "";
    const soloStockBajo = estadoFiltro === "stock-bajo"
        || estadoFiltro === "sin-stock"
        || filters.bajo === "true";

    const [resumen, setResumen] = useState(null);
    const [categorias, setCategorias] = useState([]);

    const cargarResumen = useCallback(function () {
        return obtenerResumenInventario()
            .then(function (datos) { setResumen(datos); })
            .catch(function () {
                // Si el resumen falla se usa el calculo de la pagina visible.
            });
    }, []);

    useEffect(function () {
        cargarResumen();
    }, [cargarResumen]);

    useEffect(function () {
        let activo = true;

        function cargarCategorias() {
            categoriasApi.listar().then(function (lista) {
                if (activo) setCategorias(lista || []);
            }).catch(function () {
                // El filtro por categoria queda vacio si no se pudo cargar.
            });
        }

        cargarCategorias();
        window.addEventListener("focus", cargarCategorias);

        return function () {
            activo = false;
            window.removeEventListener("focus", cargarCategorias);
        };
    }, []);

    // Al volver a la ventana se refrescan los indicadores y la tabla para que
    // reflejen productos o categorias creados en otra pantalla o pestaña.
    useEffect(function () {
        function actualizar() {
            refresh();
            cargarResumen();
        }

        function alCambiarVisibilidad() {
            if (document.visibilityState === "visible") actualizar();
        }

        window.addEventListener("focus", actualizar);
        document.addEventListener("visibilitychange", alCambiarVisibilidad);

        return function () {
            window.removeEventListener("focus", actualizar);
            document.removeEventListener("visibilitychange", alCambiarVisibilidad);
        };
    }, [refresh, cargarResumen]);

    const resumenVisible = resumen || calcularResumenDesdePagina(
        items,
        stockResponse?.total || items.length,
        categorias.length
    );

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
            await exportarStock(formato, { bajo: soloStockBajo });
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
            await Promise.all([refresh(), cargarResumen()]);
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
            await cargarResumen();
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
                descripcion="Controlá existencias, detectá faltantes y registrá ajustes de stock."
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <TarjetaResumen
                    titulo="Total Productos"
                    valor={resumenVisible.totalProductos ?? 0}
                />
                <TarjetaResumen
                    titulo="Stock Bajo"
                    valor={resumenVisible.stockBajo ?? 0}
                    color="text-orange-500"
                />
                <TarjetaResumen
                    titulo="Sin Stock"
                    valor={resumenVisible.sinStock ?? 0}
                    color="text-red-500"
                />
                <TarjetaResumen
                    titulo="Categorías"
                    valor={resumenVisible.categorias ?? 0}
                    color="text-blue-600"
                />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-72">
                    <Search
                        size={18}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                    />
                    <input
                        type="search"
                        value={busqueda}
                        onChange={function (evento) { setSearch(evento.target.value); }}
                        placeholder="Buscar producto en stock..."
                        aria-label="Buscar producto en stock"
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                </div>

                <div className="relative">
                    <Tag
                        size={17}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                    />
                    <select
                        value={categoriaFiltro}
                        onChange={function (evento) { setFilter("categoria", evento.target.value); }}
                        aria-label="Filtrar por categoría"
                        className="h-11 appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-600 shadow-sm outline-none transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    >
                        <option value="">Todas las categorías</option>
                        {categorias.map(function (categoria) {
                            return (
                                <option key={categoria.id} value={categoria.nombre}>
                                    {categoria.nombre}
                                </option>
                            );
                        })}
                    </select>
                    <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                    />
                </div>

                <div className="relative">
                    <Filter
                        size={17}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                    />
                    <select
                        value={estadoFiltro}
                        onChange={function (evento) {
                            setFilter("estado", evento.target.value === "todos" ? "" : evento.target.value);
                        }}
                        aria-label="Filtrar por estado de stock"
                        className="h-11 appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-600 shadow-sm outline-none transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    >
                        <option value="todos">Todos</option>
                        <option value="en-stock">En Stock</option>
                        <option value="stock-bajo">Stock Bajo</option>
                        <option value="sin-stock">Sin Stock</option>
                    </select>
                    <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                    />
                </div>
            </div>

            {error ? (
                <Alert tipo="error" texto={error} className="mt-6" />
            ) : (
                <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    {cargando ? (
                        <div className="p-6">
                            <CargaAdmin />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[780px] text-left">
                                <thead className="border-b border-slate-100 bg-slate-50/60">
                                    <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        <th className="px-4 py-3">Producto</th>
                                        <th className="px-4 py-3">Categoría</th>
                                        <th className="px-4 py-3">Stock</th>
                                        <th className="px-4 py-3">Precio</th>
                                        <th className="px-4 py-3">Estado</th>
                                        {esAdministrador && (
                                            <th className="px-4 py-3 text-right">Acciones</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(function (producto) {
                                        return (
                                            <AdminStockRow
                                                key={producto.id}
                                                producto={producto}
                                                esAdministrador={esAdministrador}
                                                onAdjust={() => open(producto)}
                                            />
                                        );
                                    })}
                                    {!items.length && (
                                        <tr>
                                            <td
                                                colSpan={esAdministrador ? 6 : 5}
                                                className="px-4 py-10 text-center text-sm text-slate-500"
                                            >
                                                No se encontraron productos en el inventario.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <Pagination pagina={pagina} total={total} cambiar={setPage} />

            {esAdministrador && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <CardTitle>Alerta de stock bajo</CardTitle>
                            <p className="mt-1 text-sm text-slate-500">
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
                                <p className="text-sm text-slate-500">
                                    Umbral actual:{" "}
                                    <span className="font-mono-ticket font-semibold text-slate-800">
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
                        <div className="mt-4 border-t border-slate-100 pt-4">
                            {umbralActual === null && (
                                <p className="text-sm text-slate-500">
                                    Ingresá un número entero mayor o igual a cero para ver cuántos productos quedarían afectados.
                                </p>
                            )}

                            {mostrarCalculoVistaPrevia && (
                                <p className="text-sm text-slate-500" role="status">
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
                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                <p className="text-xs text-slate-500">Productos activos</p>
                                                <p className="font-mono-ticket text-lg font-semibold text-slate-800">
                                                    {vistaPreviaVisible.totalProductosActivos}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                <p className="text-xs text-slate-500">Con stock bajo</p>
                                                <p className="font-mono-ticket text-lg font-semibold text-slate-800">
                                                    {vistaPreviaVisible.totalProductosStockBajo}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                <p className="text-xs text-slate-500">Sin stock bajo</p>
                                                <p className="font-mono-ticket text-lg font-semibold text-slate-800">
                                                    {vistaPreviaVisible.totalProductosSinStockBajo}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                <p className="text-xs text-slate-500">Inventario afectado</p>
                                                <p className="font-mono-ticket text-lg font-semibold text-slate-800">
                                                    {vistaPreviaVisible.porcentajeAfectado} %
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className={`h-full transition-all ${
                                                    advertenciaUmbral.nivel === NIVEL_ADVERTENCIA_STOCK_BAJO.IMPORTANTE
                                                        ? "bg-red-500"
                                                        : advertenciaUmbral.nivel === NIVEL_ADVERTENCIA_STOCK_BAJO.MODERADA
                                                            ? "bg-amber-500"
                                                            : "bg-emerald-500"
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
                </div>
            )}

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
