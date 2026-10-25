import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, LogIn, LogOut, FileText, AlertCircle } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useCarritoStore } from "../store/carritoStore";

function EncabezadoCliente() {
    const usuario = useAuthStore(function (estado) { return estado.usuario; });
    const cerrarSesion = useAuthStore(function (estado) { return estado.cerrarSesion; });
    const items = useCarritoStore(function (estado) { return estado.items; });
    const esClienteRegistrado = usuario && usuario.rol === "Cliente";
    const ultimoComprobante = useCarritoStore(function (estado) { return estado.ultimoComprobante; });
    const cantidadCarrito = items.reduce(function (total, item) { return total + item.cantidad; }, 0);
    const navegar = useNavigate();

    function manejarCerrarSesion() {
        cerrarSesion();
        navegar("/");
    }

    return (
        <header className="border-b border-forest-dark bg-forest text-paper">
            {ultimoComprobante && ultimoComprobante.estado === "PENDIENTE" && (
                <div role="status" className="bg-amber/25 px-4 py-2.5 text-sm text-ink font-medium">
                    <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={15} aria-hidden="true" />
                            <span>Tenés un pago pendiente de tu compra ({ultimoComprobante.codigo})</span>
                        </div>
                        <Link to={"/comprobante/" + ultimoComprobante.codigo} className="font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity sm:ml-4 sm:whitespace-nowrap focus-visible:outline-2 focus-visible:outline-ink">
                            Pagar o ver comprobante →
                        </Link>
                    </div>
                </div>
            )}

            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <Link to="/catalogo" className="font-display text-xl font-semibold text-paper no-underline hover:opacity-80 transition-opacity focus-visible:outline-2 focus-visible:outline-paper focus-visible:outline-offset-2 sm:text-2xl">
                    Sistema POS
                </Link>

                <nav aria-label="Navegación principal" className="flex max-w-full items-center gap-1 overflow-x-auto text-sm">
                    {usuario && <span className="hidden whitespace-nowrap px-3 py-2 text-paper/70 lg:inline">Hola, {usuario.nombre}</span>}

                    <Link to="/catalogo" className="whitespace-nowrap rounded px-3 py-2 text-paper/85 no-underline transition-colors hover:bg-paper/10 hover:text-paper focus-visible:outline-2 focus-visible:outline-paper focus-visible:outline-offset-2">
                        Catálogo
                    </Link>

                    {ultimoComprobante && ultimoComprobante.estado === "PENDIENTE" && (
                        <Link to={"/comprobante/" + ultimoComprobante.codigo} className="flex items-center gap-1.5 whitespace-nowrap rounded bg-amber px-3 py-2 text-xs font-semibold text-ink no-underline transition-colors hover:bg-amber/80 focus-visible:outline-2 focus-visible:outline-forest">
                            <FileText size={14} aria-hidden="true" />
                            <span>Pago pendiente</span>
                        </Link>
                    )}

                    {esClienteRegistrado && (
                        <Link to="/mi-perfil" className="whitespace-nowrap rounded px-3 py-2 text-paper/85 no-underline transition-colors hover:bg-paper/10 hover:text-paper focus-visible:outline-2 focus-visible:outline-paper focus-visible:outline-offset-2">
                            Mi perfil
                        </Link>
                    )}

                    <Link to="/carrito" aria-label={`Carrito de compras, ${cantidadCarrito} ${cantidadCarrito === 1 ? "producto" : "productos"}`} className="relative flex items-center gap-2 whitespace-nowrap rounded px-3 py-2 text-paper/85 no-underline transition-colors hover:bg-paper/10 hover:text-paper focus-visible:outline-2 focus-visible:outline-paper focus-visible:outline-offset-2">
                        <ShoppingCart size={18} aria-hidden="true" />
                        <span>Carrito</span>
                        {cantidadCarrito > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber text-xs font-bold text-ink" aria-hidden="true">{cantidadCarrito}</span>}
                    </Link>

                    {usuario ? (
                        <button type="button" onClick={manejarCerrarSesion} className="flex items-center gap-2 whitespace-nowrap rounded px-3 py-2 text-paper/85 transition-colors hover:bg-paper/10 hover:text-paper focus-visible:outline-2 focus-visible:outline-paper focus-visible:outline-offset-2 cursor-pointer">
                            <LogOut size={18} aria-hidden="true" />
                            Salir
                        </button>
                    ) : (
                        <div className="flex items-center gap-1">
                            <Link to="/login-cliente" className="flex items-center gap-2 whitespace-nowrap rounded px-3 py-2 text-paper/85 no-underline transition-colors hover:bg-paper/10 hover:text-paper focus-visible:outline-2 focus-visible:outline-paper focus-visible:outline-offset-2">
                                <LogIn size={18} aria-hidden="true" />
                                Iniciar sesión
                            </Link>
                            <Link to="/registro" className="flex items-center gap-2 whitespace-nowrap rounded bg-amber px-3 py-2 text-ink no-underline transition-colors hover:bg-amber/80 focus-visible:outline-2 focus-visible:outline-paper focus-visible:outline-offset-2">
                                <LogIn size={18} aria-hidden="true" />
                                Crear cuenta
                            </Link>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
}

export default EncabezadoCliente;
