import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, LogIn, LogOut, FileText, AlertCircle } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useCarritoStore } from "../store/carritoStore";

function EncabezadoCliente() {
    const usuario = useAuthStore(function (estado) { return estado.usuario; });
    const cerrarSesion = useAuthStore(function (estado) { return estado.cerrarSesion; });
    const items = useCarritoStore(function (estado) { return estado.items; });
    const ultimoComprobante = useCarritoStore(function (estado) { return estado.ultimoComprobante; });
    const cantidadCarrito = items.reduce(function (total, item) { return total + item.cantidad; }, 0);
    const navegar = useNavigate();

    function manejarCerrarSesion() {
        cerrarSesion();
        navegar("/");
    }

    return (
        <header className="bg-forest text-paper">
            {ultimoComprobante && ultimoComprobante.estado === "PENDIENTE" && (
                <div
                    role="status"
                    className="px-6 py-2 text-xs font-mono-ticket uppercase tracking-wide bg-amber text-ink font-semibold flex items-center justify-between transition-colors"
                >
                    <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={15} aria-hidden="true" />
                            <span>
                                Tenés un pago PENDIENTE de tu compra ({ultimoComprobante.codigo})
                            </span>
                        </div>
                        <Link
                            to={"/comprobante/" + ultimoComprobante.codigo}
                            className="underline font-bold hover:opacity-80 transition-opacity ml-4 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-ink"
                        >
                            Pagar o Ver Comprobante →
                        </Link>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link to="/catalogo" className="font-display text-2xl no-underline hover:opacity-80 transition-opacity focus-visible:outline-2 focus-visible:outline-paper focus-visible:outline-offset-2">
                    Sistema POS
                </Link>

                <nav aria-label="Navegación principal" className="flex items-center gap-6 font-mono-ticket text-sm">
                    {usuario && (
                        <span className="text-paper/90">
                            Hola, {usuario.nombre}
                        </span>
                    )}

                    <Link to="/catalogo" className="uppercase tracking-wide no-underline hover:opacity-80 transition-opacity focus-visible:outline-2 focus-visible:outline-paper focus-visible:outline-offset-2">
                        Catálogo
                    </Link>

                    {ultimoComprobante && ultimoComprobante.estado === "PENDIENTE" && (
                        <Link
                            to={"/comprobante/" + ultimoComprobante.codigo}
                            className="flex items-center gap-1.5 uppercase tracking-wide no-underline px-2.5 py-1 rounded text-xs transition-colors bg-amber text-ink font-bold animate-pulse focus-visible:outline-2 focus-visible:outline-paper"
                        >
                            <FileText size={14} aria-hidden="true" />
                            <span>Pago Pendiente</span>
                        </Link>
                    )}

                    <Link
                        to="/carrito"
                        aria-label={`Carrito de compras, ${cantidadCarrito} ${cantidadCarrito === 1 ? "producto" : "productos"}`}
                        className="relative flex items-center gap-2 uppercase tracking-wide no-underline hover:opacity-80 transition-opacity focus-visible:outline-2 focus-visible:outline-paper focus-visible:outline-offset-2"
                    >
                        <ShoppingCart size={18} aria-hidden="true" />
                        <span>Carrito</span>
                        {cantidadCarrito > 0 && (
                            <span className="bg-amber text-ink text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" aria-hidden="true">
                                {cantidadCarrito}
                            </span>
                        )}
                    </Link>

                    {usuario ? (
                        <button
                            type="button"
                            onClick={manejarCerrarSesion}
                            className="flex items-center gap-2 uppercase tracking-wide hover:opacity-80 transition-opacity focus-visible:outline-2 focus-visible:outline-paper focus-visible:outline-offset-2 cursor-pointer"
                        >
                            <LogOut size={18} aria-hidden="true" />
                            Salir
                        </button>
                    ) : (
                        <Link to="/" className="flex items-center gap-2 uppercase tracking-wide no-underline hover:opacity-80 transition-opacity focus-visible:outline-2 focus-visible:outline-paper focus-visible:outline-offset-2">
                            <LogIn size={18} aria-hidden="true" />
                            Iniciar sesión
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}

export default EncabezadoCliente;