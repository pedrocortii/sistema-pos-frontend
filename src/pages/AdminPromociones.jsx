import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Info, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { listarProductos } from "../api/productos";
import { actualizarPromocion, crearPromocion, eliminarPromocion, listarPromociones, obtenerPrecioMinimoPromocional } from "../api/promociones";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { formatoMonedaARS } from "../utils/moneda";

function fechaInput(valor) { return valor ? new Date(valor).toISOString().slice(0, 10) : ""; }
function estado(promocion) { const ahora = new Date(); if (!promocion.activo) return "INACTIVO"; if (new Date(promocion.fechaInicio) > ahora) return "FUTURA"; if (new Date(promocion.fechaFin) < ahora) return "VENCIDA"; return "ACTIVA"; }
function alcanceInicial(promocion) { const productos = promocion?.productos?.length > 0; const categorias = promocion?.categorias?.length > 0; if (productos && categorias) return "AMBOS"; if (categorias) return "CATEGORIAS"; return "PRODUCTOS"; }
function formularioInicial(promocion) { return promocion ? { titulo: promocion.titulo, descripcion: promocion.descripcion || "", tipoDescuento: promocion.tipoDescuento, valorDescuento: String(promocion.valorDescuento), fechaInicio: fechaInput(promocion.fechaInicio), fechaFin: fechaInput(promocion.fechaFin), activo: promocion.activo, alcance: alcanceInicial(promocion), productoIds: (promocion.productos || []).map((item) => item.producto.id), categorias: (promocion.categorias || []).map((item) => item.categoria) } : { titulo: "", descripcion: "", tipoDescuento: "PORCENTAJE", valorDescuento: "", fechaInicio: "", fechaFin: "", activo: true, alcance: "PRODUCTOS", productoIds: [], categorias: [] }; }

function AdminPromociones() {
    const [promociones, setPromociones] = useState([]);
    const [productos, setProductos] = useState([]);
    const [modal, setModal] = useState(null);
    const [formulario, setFormulario] = useState(formularioInicial());
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");
    const [precioMinimo, setPrecioMinimo] = useState(null);
    const [busquedaProductos, setBusquedaProductos] = useState("");
    const [busquedaCategorias, setBusquedaCategorias] = useState("");
    const categorias = useMemo(() => [...new Set(productos.map((producto) => producto.categoria).filter(Boolean))].sort(), [productos]);
    const productosFiltrados = useMemo(function () {
        const termino = busquedaProductos.trim().toLocaleLowerCase("es");
        if (!termino) return productos;
        return productos.filter((producto) => producto.nombre.toLocaleLowerCase("es").includes(termino));
    }, [busquedaProductos, productos]);
    const categoriasFiltradas = useMemo(function () {
        const termino = busquedaCategorias.trim().toLocaleLowerCase("es");
        if (!termino) return categorias;
        return categorias.filter((categoria) => categoria.toLocaleLowerCase("es").includes(termino));
    }, [busquedaCategorias, categorias]);

    async function cargarProductos() {
        const primeraPagina = await listarProductos({ page: 1, limit: 100 });
        const resultado = primeraPagina.data || [];
        const paginas = Math.ceil(primeraPagina.total / primeraPagina.limit);

        for (let pagina = 2; pagina <= paginas; pagina += 1) {
            const respuesta = await listarProductos({ page: pagina, limit: 100 });
            resultado.push(...(respuesta.data || []));
        }

        return resultado;
    }

    const cargar = useCallback(async function () {
        setCargando(true);
        try {
            const [lista, productosCargados, minimo] = await Promise.all([
                listarPromociones(),
                cargarProductos(),
                obtenerPrecioMinimoPromocional()
            ]);
            setPromociones(lista);
            setProductos(productosCargados);
            setPrecioMinimo(minimo);
            setError("");
        } catch (errorPeticion) {
            setError(errorPeticion.response?.data?.mensaje || "No se pudieron cargar las promociones.");
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(function () { const temporizador = window.setTimeout(function () { void cargar(); }, 0); return function () { window.clearTimeout(temporizador); }; }, [cargar]);
    function abrir(promocion) {
        setFormulario(formularioInicial(promocion));
        setBusquedaProductos("");
        setBusquedaCategorias("");
        setModal(promocion || {});
        setError("");
    }
    function cambiar(campo, valor) { setFormulario((actual) => ({ ...actual, [campo]: valor })); }
    function cambiarAlcance(valor) { setFormulario((actual) => ({ ...actual, alcance: valor })); }
    function alternar(campo, valor) { setFormulario((actual) => ({ ...actual, [campo]: actual[campo].includes(valor) ? actual[campo].filter((item) => item !== valor) : [...actual[campo], valor] })); }
    async function guardar(evento) {
        evento.preventDefault();
        if (formulario.fechaFin < formulario.fechaInicio) {
            setError("La fecha Hasta no puede ser anterior a la fecha Desde.");
            return;
        }
        setGuardando(true);
        setError("");
        const datos = {
            ...formulario,
            valorDescuento: Number(formulario.valorDescuento),
            fechaInicio: new Date(formulario.fechaInicio + "T00:00:00").toISOString(),
            fechaFin: new Date(formulario.fechaFin + "T23:59:59.999").toISOString(),
            productoIds: formulario.alcance === "CATEGORIAS" ? [] : formulario.productoIds,
            categorias: formulario.alcance === "PRODUCTOS" ? [] : formulario.categorias
        };
        delete datos.alcance;
        try {
            if (modal.id) await actualizarPromocion(modal.id, datos);
            else await crearPromocion(datos);
            setModal(null);
            await cargar();
        } catch (errorPeticion) {
            setError(errorPeticion.response?.data?.errores?.join(". ") || errorPeticion.response?.data?.mensaje || "No se pudo guardar la promocion.");
        } finally {
            setGuardando(false);
        }
    }
    async function borrar(promocion) { if (!window.confirm(`¿Eliminar “${promocion.titulo}”?`)) return; try { await eliminarPromocion(promocion.id); await cargar(); } catch (errorPeticion) { setError(errorPeticion.response?.data?.mensaje || "No se pudo eliminar la promocion."); } }
    const opciones = [["PORCENTAJE", "Porcentaje", "Ej.: 20% de descuento"], ["IMPORTE", "Importe fijo", "Ej.: $1.000 de descuento"]];
    const alcances = [["PRODUCTOS", "Productos específicos"], ["CATEGORIAS", "Categorías completas"], ["AMBOS", "Productos y categorías"]];
    return (
        <section>
            <PageHeader
                etiqueta="Promociones"
                titulo="Promociones y descuentos"
                acciones={<Button icon={Plus} onClick={() => abrir()}>Nueva promoción</Button>}
            />
            {precioMinimo !== null && (
                <p className="mb-5 flex items-center gap-2 font-display text-sm text-ink/60">
                    <Info size={16} className="shrink-0 text-forest" aria-hidden="true" />
                    Precio mínimo por producto en promoción: <strong className="font-semibold text-ink">{formatoMonedaARS.format(precioMinimo)}</strong>
                </p>
            )}
            {cargando ? (
                <p className="text-sm text-ink/60">Cargando promociones...</p>
            ) : (
                <Table minWidth="min-w-225">
                    <TableHeader>
                        <tr>
                            <TableHead>Título</TableHead>
                            <TableHead>Descuento</TableHead>
                            <TableHead>Vigencia</TableHead>
                            <TableHead>Alcance</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Acciones</TableHead>
                        </tr>
                    </TableHeader>
                    <TableBody>
                        {promociones.map((promocion) => (
                            <TableRow key={promocion.id}>
                                <TableCell>
                                    <strong>{promocion.titulo}</strong>
                                    {promocion.descripcion && <p className="text-xs text-ink/60">{promocion.descripcion}</p>}
                                </TableCell>
                                <TableCell>{promocion.tipoDescuento === "PORCENTAJE" ? `${promocion.valorDescuento}%` : formatoMonedaARS.format(Number(promocion.valorDescuento))}</TableCell>
                                <TableCell className="text-xs">
                                    {new Date(promocion.fechaInicio).toLocaleString("es-AR")}
                                    <br />
                                    {new Date(promocion.fechaFin).toLocaleString("es-AR")}
                                </TableCell>
                                <TableCell className="text-xs">
                                    {promocion.productos?.length || 0} productos
                                    <br />
                                    {promocion.categorias?.length || 0} categorías
                                </TableCell>
                                <TableCell><Badge estado={estado(promocion)}>{estado(promocion)}</Badge></TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button size="icon-md" variant="outline" aria-label="Editar promoción" onClick={() => abrir(promocion)}><Pencil size={15} /></Button>
                                        <Button size="icon-md" variant="danger-outline" aria-label="Eliminar promoción" onClick={() => borrar(promocion)}><Trash2 size={15} /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!promociones.length && (
                            <tr><td colSpan="6" className="p-8 text-center text-sm text-ink/60">No hay promociones creadas.</td></tr>
                        )}
                    </TableBody>
                </Table>
            )}

            {modal && (
                <Modal
                    alCerrar={() => { setModal(null); setError(""); }}
                    etiqueta="Administración"
                    titulo={modal.id ? "Editar promoción" : "Nueva promoción"}
                    tamano="xl"
                >
                    <form onSubmit={guardar} className="space-y-5">
                        {error && (
                            <details className="group border border-red-200 bg-red-50 text-red-700">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3 font-display text-sm font-medium marker:hidden">
                                    <span>La acción no se puede realizar</span>
                                    <ChevronDown size={16} className="shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                                </summary>
                                <p className="border-t border-red-200 px-3 py-2 font-display text-sm">{error}</p>
                            </details>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input label="Nombre de la promoción" required value={formulario.titulo} onChange={(event) => cambiar("titulo", event.target.value)} />
                            <Input label="Descripción (opcional)" value={formulario.descripcion} onChange={(event) => cambiar("descripcion", event.target.value)} />
                        </div>

                        <fieldset>
                            <legend className="mb-2 text-xs text-ink/60">Tipo de beneficio</legend>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {opciones.map(([valor, titulo, ayuda]) => (
                                    <label key={valor} className={`cursor-pointer border p-3 ${formulario.tipoDescuento === valor ? "border-forest bg-forest/10" : "border-line"}`}>
                                        <input className="sr-only" type="radio" name="tipoDescuento" checked={formulario.tipoDescuento === valor} onChange={() => cambiar("tipoDescuento", valor)} />
                                        <span className="block font-medium">{titulo}</span>
                                        <span className="text-xs text-ink/60">{ayuda}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                containerClassName="sm:col-span-2"
                                label={formulario.tipoDescuento === "PORCENTAJE" ? "Porcentaje de descuento" : "Importe de descuento"}
                                type="number"
                                min="0.01"
                                max={formulario.tipoDescuento === "PORCENTAJE" ? "100" : undefined}
                                step="0.01"
                                required
                                value={formulario.valorDescuento}
                                onChange={(event) => cambiar("valorDescuento", event.target.value)}
                            />
                            <Input label="Desde" type="date" required value={formulario.fechaInicio} onChange={(event) => cambiar("fechaInicio", event.target.value)} />
                            <Input label="Hasta" type="date" min={formulario.fechaInicio || undefined} required value={formulario.fechaFin} onChange={(event) => cambiar("fechaFin", event.target.value)} />
                        </div>

                        <fieldset>
                            <legend className="mb-2 text-xs text-ink/60">¿Dónde se aplica?</legend>
                            <div className="grid gap-2 sm:grid-cols-3">
                                {alcances.map(([valor, titulo]) => (
                                    <label key={valor} className={`cursor-pointer border p-3 text-sm ${formulario.alcance === valor ? "border-forest bg-forest/10" : "border-line"}`}>
                                        <input className="sr-only" type="radio" name="alcance" checked={formulario.alcance === valor} onChange={() => cambiarAlcance(valor)} />
                                        {titulo}
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        {formulario.alcance !== "CATEGORIAS" && (
                            <fieldset>
                                <legend className="mb-2 text-xs text-ink/60">
                                    Seleccioná los productos ({formulario.productoIds.length} seleccionados)
                                </legend>
                                <Input
                                    type="search"
                                    aria-label="Buscar productos"
                                    placeholder="Buscar por nombre..."
                                    icon={Search}
                                    value={busquedaProductos}
                                    onChange={(event) => setBusquedaProductos(event.target.value)}
                                    containerClassName="mb-2"
                                />
                                <div className="grid max-h-36 gap-2 overflow-y-auto border border-line p-3 sm:grid-cols-2">
                                    {productosFiltrados.map((producto) => (
                                        <label key={producto.id} className="flex cursor-pointer items-center gap-2 text-sm">
                                            <input type="checkbox" checked={formulario.productoIds.includes(producto.id)} onChange={() => alternar("productoIds", producto.id)} />
                                            <span>{producto.nombre}</span>
                                        </label>
                                    ))}
                                    {!productosFiltrados.length && <p className="text-sm text-ink/60">No hay productos que coincidan con la búsqueda.</p>}
                                </div>
                            </fieldset>
                        )}

                        {formulario.alcance !== "PRODUCTOS" && (
                            <fieldset>
                                <legend className="mb-2 text-xs text-ink/60">
                                    Seleccioná las categorías ({formulario.categorias.length} seleccionadas)
                                </legend>
                                <Input
                                    type="search"
                                    aria-label="Buscar categorías"
                                    placeholder="Buscar por nombre..."
                                    icon={Search}
                                    value={busquedaCategorias}
                                    onChange={(event) => setBusquedaCategorias(event.target.value)}
                                    containerClassName="mb-2"
                                />
                                <div className="flex max-h-36 flex-wrap gap-3 overflow-y-auto border border-line p-3">
                                    {categoriasFiltradas.map((categoria) => (
                                        <label key={categoria} className="flex cursor-pointer items-center gap-2 text-sm">
                                            <input type="checkbox" checked={formulario.categorias.includes(categoria)} onChange={() => alternar("categorias", categoria)} />
                                            {categoria}
                                        </label>
                                    ))}
                                    {!categoriasFiltradas.length && (
                                        <p className="text-sm text-ink/60">
                                            {categorias.length ? "No hay categorías que coincidan con la búsqueda." : "Todavía no hay categorías disponibles. Primero agregá productos categorizados."}
                                        </p>
                                    )}
                                </div>
                            </fieldset>
                        )}

                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={formulario.activo} onChange={(event) => cambiar("activo", event.target.checked)} />
                            Promoción habilitada
                        </label>

                        {formulario.titulo && formulario.valorDescuento && (
                            <div className="border border-forest/25 bg-forest/10 p-3 text-sm">
                                <p className="font-medium">Vista previa</p>
                                <p className="mt-1">
                                    {formulario.titulo}: {formulario.tipoDescuento === "PORCENTAJE" ? `${formulario.valorDescuento}% de descuento` : formatoMonedaARS.format(Number(formulario.valorDescuento))}
                                </p>
                                <p className="text-xs text-ink/60">
                                    {formulario.activo ? "Se mostrará si está dentro del período de vigencia." : "Está pausada y no se mostrará."}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 border-t border-line pt-4">
                            <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
                            <Button type="submit" loading={guardando}>Guardar promoción</Button>
                        </div>
                    </form>
                </Modal>
            )}
        </section>
    );
}

export default AdminPromociones;
