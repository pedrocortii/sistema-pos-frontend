import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, LogIn, LogOut } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useCarritoStore } from "../store/carritoStore";

function EncabezadoCliente() {
    const usuario = useAuthStore(function (estado) { return estado.usuario; });
    const cerrarSesion = useAuthStore(function (estado) { return estado.cerrarSesion; });
    const items = useCarritoStore(function (estado) { return estado.items; });
    const cantidadCarrito = items.reduce(function (total, item) { return total + item.cantidad; }, 0);
    const navegar = useNavigate();

    function manejarCerrarSesion() {
        cerrarSesion();
        navegar("/");
    }

    return (
        <header className="bg-forest text-paper">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link to="/catalogo" className="font-display text-2xl no-underline hover:opacity-80 transition-opacity">
                    Sistema POS
                </Link>

                <div className="flex items-center gap-6 font-mono-ticket text-sm">
                    {usuario && (
                        <span className="text-paper/70">
                            Hola, {usuario.nombre}
                        </span>
                    )}

                    <Link to="/catalogo" className="uppercase tracking-wide no-underline hover:opacity-80 transition-opacity">
                        Catalogo
                    </Link>

                    <Link to="/carrito" className="relative flex items-center gap-2 uppercase tracking-wide no-underline hover:opacity-80 transition-opacity">
                        <ShoppingCart size={18} />
                        Carrito
                        {cantidadCarrito > 0 && (
                            <span className="bg-amber text-ink text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {cantidadCarrito}
                            </span>
                        )}
                    </Link>

                    {usuario ? (
                        <button onClick={manejarCerrarSesion} className="flex items-center gap-2 uppercase tracking-wide hover:opacity-80 transition-opacity">
                            <LogOut size={18} />
                            Salir
                        </button>
                    ) : (
                        <Link to="/" className="flex items-center gap-2 uppercase tracking-wide no-underline hover:opacity-80 transition-opacity">
                            <LogIn size={18} />
                            Iniciar sesion
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}

export default EncabezadoCliente;