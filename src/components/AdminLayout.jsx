import { NavLink, Outlet } from "react-router-dom";
import { Boxes, LogOut, Menu, Package, ReceiptText, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

const enlaces = [
    { to: "/admin/productos", texto: "Productos", icono: Package },
    { to: "/admin/stock", texto: "Stock", icono: Boxes },
    { to: "/admin/ventas", texto: "Ventas", icono: ReceiptText }
];

function AdminLayout() {
    const [menuAbierto, setMenuAbierto] = useState(false);
    const { usuario, logout } = useAuth();

    return (
        <div className="min-h-screen bg-paper text-ink">
            {menuAbierto && (
                <button
                    type="button"
                    aria-label="Cerrar menú de navegación"
                    className="fixed inset-0 z-30 bg-ink/35 lg:hidden"
                    onClick={function () { setMenuAbierto(false); }}
                />
            )}

            <aside
                className={"fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-ticket transition-transform duration-200 lg:translate-x-0 " + (menuAbierto ? "translate-x-0" : "-translate-x-full")}
            >
                <div className="flex h-18 items-center justify-between border-b border-line px-6">
                    <span className="font-display text-2xl text-forest">Sistema POS</span>
                    <button
                        type="button"
                        aria-label="Cerrar menú"
                        className="cursor-pointer rounded p-1 text-ink hover:bg-paper focus-visible:outline-2 focus-visible:outline-forest lg:hidden"
                        onClick={function () { setMenuAbierto(false); }}
                    >
                        <X size={22} aria-hidden="true" />
                    </button>
                </div>

                <nav aria-label="Administración" className="flex-1 px-3 py-5">
                    <p className="px-3 pb-3 font-mono-ticket text-xs uppercase tracking-[0.2em] text-ink/45">
                        Administración
                    </p>
                    <ul className="space-y-1">
                        {enlaces.map(function (enlace) {
                            const Icono = enlace.icono;
                            return (
                                <li key={enlace.to}>
                                    <NavLink
                                        to={enlace.to}
                                        onClick={function () { setMenuAbierto(false); }}
                                        className={function ({ isActive }) {
                                            return "flex items-center gap-3 rounded-md px-3 py-2.5 font-mono-ticket text-sm uppercase tracking-wide no-underline transition-colors focus-visible:outline-2 focus-visible:outline-forest " + (isActive ? "bg-forest text-paper" : "text-ink/70 hover:bg-paper hover:text-forest");
                                        }}
                                    >
                                        <Icono size={18} aria-hidden="true" />
                                        {enlace.texto}
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>

            <div className="min-h-screen lg:pl-64">
                <header className="sticky top-0 z-20 flex h-18 items-center justify-between border-b border-line bg-ticket/95 px-4 backdrop-blur sm:px-6">
                    <button
                        type="button"
                        aria-label="Abrir menú de navegación"
                        aria-expanded={menuAbierto}
                        className="cursor-pointer rounded p-2 text-ink hover:bg-paper focus-visible:outline-2 focus-visible:outline-forest lg:hidden"
                        onClick={function () { setMenuAbierto(true); }}
                    >
                        <Menu size={22} aria-hidden="true" />
                    </button>

                    <div className="ml-auto flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="font-mono-ticket text-xs uppercase tracking-wide text-ink/50">Sesión iniciada</p>
                            <p className="font-mono-ticket text-sm text-ink">{usuario ? usuario.nombre : "Usuario"}</p>
                        </div>
                        <button
                            type="button"
                            onClick={logout}
                            className="flex cursor-pointer items-center gap-2 rounded-md border border-forest px-3 py-2 font-mono-ticket text-xs uppercase tracking-wide text-forest transition-colors hover:bg-forest hover:text-paper focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-2"
                        >
                            <LogOut size={16} aria-hidden="true" />
                            <span className="hidden sm:inline">Salir</span>
                            <span className="sr-only sm:hidden">Cerrar sesión</span>
                        </button>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
