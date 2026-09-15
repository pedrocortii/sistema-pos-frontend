import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { ajustarStock, listarStock } from "../api/stock";
import AjustarStockModal from "../components/AjustarStockModal";
import { Alerta, Cabecera, Carga, Paginacion } from "./AdminProductos";
import { usePeticion } from "../hooks/usePeticion";
import { useModal } from "../hooks/useModal";

function AdminStock() {
    const { data: stockResponse = {}, isLoading: cargando, error, execute: cargar } = usePeticion(listarStock);
    const { open, close, modalData: modal } = useModal();
    const [bajo, setBajo] = useState(false);
    const [pagina, setPagina] = useState(1);
    const [guardando, setGuardando] = useState(false);

    // Extraemos la lista de items del objeto de respuesta del servidor
    const items = stockResponse?.data;

    useEffect(function () {
        cargar().catch(function () {
            // El error queda disponible para que la pantalla lo muestre.
        });
    }, [cargar]);

    const datos = useMemo(function () {
        return (items || []).filter(function (p) {
            return !bajo || p.stockDisponible <= 5;
        });
    }, [items, bajo]);

    const total = Math.max(1, Math.ceil(datos.length / 10));
    const visibles = datos.slice((pagina - 1) * 10, pagina * 10);

    async function guardar(datos) {
        setGuardando(true);
        try {
            await ajustarStock(modal.id, datos);
            close();
            await cargar();
        } catch {
            // El error queda disponible en usePeticion.
        } finally {
            setGuardando(false);
        }
    }

    return (
        <section>
            <Cabecera etiqueta="Stock" titulo="Inventario" />
            <label className="mt-6 flex w-fit items-center gap-2 font-mono-ticket text-sm">
                <input
                    type="checkbox"
                    checked={bajo}
                    onChange={function (e) {
                        setBajo(e.target.checked);
                        setPagina(1);
                    }}
                />
                Mostrar solo stock bajo
            </label>
            {error && <Alerta texto={error} />}
            {cargando ? (
                <Carga />
            ) : (
                <div className="mt-5 overflow-x-auto border border-line bg-ticket">
                    <table className="w-full min-w-175 text-left">
                        <thead className="border-b border-line bg-paper font-mono-ticket text-xs uppercase text-ink/60">
                            <tr>
                                <th className="p-3">Producto</th>
                                <th>Actual</th>
                                <th>Reservado</th>
                                <th>Disponible</th>
                                <th className="p-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibles.map(function (p) {
                                const esBajo = p.stockDisponible <= 5;
                                return (
                                    <tr key={p.id} className="border-b border-line">
                                        <td className="p-3">{p.nombre}</td>
                                        <td>{p.stock}</td>
                                        <td>{p.stockReservado}</td>
                                        <td>
                                            {p.stockDisponible}{" "}
                                            {esBajo && (
                                                <span className="ml-2 rounded bg-red-100 px-2 py-1 font-mono-ticket text-xs text-red-700">
                                                    Stock bajo
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <button
                                                onClick={function () { open(p); }}
                                                className="flex cursor-pointer items-center gap-1 text-forest"
                                            >
                                                <SlidersHorizontal size={16} />Ajustar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            <Paginacion pagina={pagina} total={total} cambiar={setPagina} />
            {modal && (
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
