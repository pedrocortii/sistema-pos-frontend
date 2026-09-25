import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listarVentas } from "../api/ventas";
import { Alerta, Cabecera, Carga, Paginacion } from "./AdminProductos";
import { usePeticion } from "../hooks/usePeticion";

function AdminVentas() {
    const nav = useNavigate();
    const [params, setParams] = useSearchParams();

    const { data: ventasResponse, isLoading: cargando, error, execute: cargar } = usePeticion(listarVentas);

    // Usamos optional chaining ?. para evitar que la app colapse cuando ventasResponse es null
    const ventas = ventasResponse?.ventas;

    const pagina = Number(params.get("pagina") || 1);
    const estado = params.get("estado") || "";
    const desde = params.get("fechaDesde") || "";
    const hasta = params.get("fechaHasta") || "";
    const buscar = params.get("buscar") || "";

    function cambiar(campo, valor) {
        const n = new URLSearchParams(params);
        if (valor) n.set(campo, valor);
        else n.delete(campo);
        if (campo !== "pagina") n.set("pagina", "1");
        setParams(n);
    }

    useEffect(function () {
        cargar({
            page: pagina,
            limit: 10,
            estado: estado || undefined,
            fechaDesde: desde || undefined,
            fechaHasta: hasta || undefined
        }).catch(function () {
            // El error queda disponible para que la pantalla lo muestre.
        });
    }, [estado, desde, hasta, pagina, cargar]);

    const datos = useMemo(function () {
        return (ventas || []).filter(function (v) {
            return v.codigoComprobante.toLowerCase().includes(buscar.toLowerCase());
        });
    }, [ventas, buscar]);

    const totalPaginas = ventasResponse?.total ? Math.ceil(ventasResponse.total / 10) : 1;
    const visibles = datos;

    return (
        <section>
            <Cabecera etiqueta="Ventas" titulo="Ventas registradas" />
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <input
                    value={buscar}
                    onChange={function (e) { cambiar("buscar", e.target.value); }}
                    placeholder="Buscar código"
                    className="border border-line bg-ticket p-2 font-mono-ticket text-sm"
                />
                <select
                    value={estado}
                    onChange={function (e) { cambiar("estado", e.target.value); }}
                    className="border border-line bg-ticket p-2 font-mono-ticket text-sm"
                >
                    <option value="">Todos los estados</option>
                    <option>PENDIENTE</option>
                    <option>COBRADA</option>
                    <option>CANCELADA</option>
                </select>
                <input
                    type="date"
                    value={desde}
                    onChange={function (e) { cambiar("fechaDesde", e.target.value); }}
                    className="border border-line bg-ticket p-2 font-mono-ticket text-sm"
                />
                <input
                    type="date"
                    value={hasta}
                    onChange={function (e) { cambiar("fechaHasta", e.target.value); }}
                    className="border border-line bg-ticket p-2 font-mono-ticket text-sm"
                />
            </div>

            {error && <Alerta texto={error} />}
            {cargando ? (
                <Carga />
            ) : (
                <div className="mt-5 overflow-x-auto border border-line bg-ticket">
                    <table className="w-full min-w-200 text-left">
                        <thead className="border-b border-line bg-paper font-mono-ticket text-xs uppercase text-ink/60">
                            <tr>
                                <th className="p-3">Código</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th className="p-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibles.map(function (v) {
                                return (
                                    <tr
                                        key={v.id}
                                        onClick={function () { nav("/admin/ventas/" + v.id); }}
                                        className="cursor-pointer border-b border-line hover:bg-paper"
                                    >
                                        <td className="p-3">{v.codigoComprobante}</td>
                                        <td>{new Date(v.fecha).toLocaleDateString("es-AR")}</td>
                                        <td>
                                            {v.clienteNombre
                                                ? [v.clienteNombre, v.clienteApellido].filter(Boolean).join(" ")
                                                : "Anónima"}
                                        </td>
                                        <td>${Number(v.total).toFixed(2)}</td>
                                        <td>
                                            <Estado estado={v.estado} />
                                        </td>
                                        <td className="p-3 text-forest">Ver detalle</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            <Paginacion
                pagina={pagina}
                total={totalPaginas}
                cambiar={function (p) { cambiar("pagina", String(p)); }}
            />
        </section>
    );
}

export function Estado({ estado }) {
    const color =
        estado === "COBRADA"
            ? "bg-green-100 text-green-700"
            : estado === "CANCELADA"
            ? "bg-red-100 text-red-700"
            : "bg-amber/30 text-ink";
    return <span className={"rounded px-2 py-1 font-mono-ticket text-xs " + color}>{estado}</span>;
}

export default AdminVentas;
