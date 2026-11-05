import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import EncabezadoCliente from "../components/EncabezadoCliente";
import MensajeCarga from "../components/MensajeCarga";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Pagination } from "../components/ui/Pagination";
import { Alert } from "../components/ui/Alert";
import { EmptyState } from "../components/ui/EmptyState";
import { listarVentas } from "../api/ventas";
import { useDataTable } from "../hooks/useDataTable";
import { CompraCard } from "../components/CompraCard";

function HistorialCompras() {
    const {
        data: respuesta,
        isLoading: cargando,
        error,
        page: pagina,
        setPage
    } = useDataTable(listarVentas, {
        initialParams: { limit: 10 }
    });

    const compras = useMemo(function () {
        const lista = respuesta?.ventas || [];
        return [...lista].sort(function (a, b) {
            return new Date(b.fecha || b.creadoEn) - new Date(a.fecha || a.creadoEn);
        });
    }, [respuesta]);

    const paginacion = respuesta?.paginacion;

    return (
        <div className="min-h-screen bg-paper flex flex-col">
            <EncabezadoCliente />

            <main className="max-w-4xl w-full mx-auto px-6 py-10 flex-1">
                <PageHeader
                    volverA="/mi-perfil"
                    textoVolver="Volver a mi perfil"
                    etiqueta="Mi cuenta"
                    titulo="Historial de compras"
                    descripcion="Consultá tus pedidos anteriores y el detalle de cada compra."
                    className="mb-8"
                />

                {cargando && (
                    <div className="py-12">
                        <MensajeCarga texto="Cargando tu historial de compras..." />
                    </div>
                )}

                {error && <Alert tipo="error" texto={error} className="mb-6" />}

                {!cargando && !error && compras.length === 0 && (
                    <EmptyState
                        icono={ShoppingBag}
                        titulo="Todavía no realizaste ninguna compra"
                        descripcion="Cuando hagas un pedido, vas a poder revisar el comprobante y el detalle de tus productos desde acá."
                        accion={
                            <Link to="/catalogo">
                                <Button>Explorar catálogo</Button>
                            </Link>
                        }
                    />
                )}

                {!cargando && compras.length > 0 && (
                    <div className="space-y-4">
                        {compras.map(function (compra) {
                            return (
                                <CompraCard
                                    key={compra.id}
                                    compra={compra}
                                />
                            );
                        })}
                    </div>
                )}

                {paginacion && (
                    <Pagination
                        pagina={pagina}
                        total={paginacion.totalPaginas}
                        cambiar={setPage}
                        className="mt-8"
                    />
                )}
            </main>
        </div>
    );
}

export default HistorialCompras;
